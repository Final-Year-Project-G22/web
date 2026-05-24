"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  ensureFreshSession,
  logoutAndRedirect,
  refreshToken,
} from "@/lib/api/mutator/custom-fetch";
import { ask } from "@/lib/api/services/ai-ask";
import {
  archiveConversation,
  getConversation,
  listConversations,
} from "@/lib/api/services/ai-conversations";
import type {
  AskRequest,
  AskResponseBody,
  CitationDTO,
  ConversationDTO,
  ErrorModel,
  GetConversationOutputBody,
  UsageDTO,
} from "@/lib/api/types";
import { env } from "@/lib/env";
import { useAuthStore } from "@/store/auth.store";

/** Ask-stream SSE must hit the API origin when configured. */
function getAskStreamSseUrl(): URL {
  const path = "/api/v1/ai/ask/stream";
  if (env.NEXT_PUBLIC_API_URL) {
    return new URL(path, env.NEXT_PUBLIC_API_URL);
  }
  return new URL(path, window.location.origin);
}

/** Backoff before reconnecting SSE. */
function _sseReconnectDelayMs(attempt: number): number {
  return Math.min(30_000, 1000 * 2 ** Math.min(Math.max(0, attempt - 1), 5));
}

function _waitForReconnect(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(t);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort);
  });
}

async function fetchSseWithAuth(url: string, init: RequestInit): Promise<Response> {
  const fresh = await ensureFreshSession();
  if (!fresh) {
    return new Response(null, { status: 401 });
  }
  const buildInit = (): RequestInit => {
    const headers = new Headers(init.headers);
    const latestToken = useAuthStore.getState().token;
    if (latestToken) {
      headers.set("Authorization", `Bearer ${latestToken}`);
    } else {
      headers.delete("Authorization");
    }
    return { ...init, headers };
  };
  let response = await fetch(url, buildInit());
  if (response.status !== 401) return response;
  const refreshed = await refreshToken();
  if (refreshed) {
    response = await fetch(url, buildInit());
    if (response.status !== 401) return response;
  }
  logoutAndRedirect();
  return response;
}

function parseSSEChunk(chunk: string): { event?: string; data?: string } | null {
  const lines = chunk.replace(/\r\n/g, "\n").split("\n");
  let event: string | undefined;
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  const data = dataLines.join("\n");
  return data ? { event, data } : null;
}

const QUERY_KEYS = {
  conversations: ["ai", "conversations"],
  conversation: (id: string) => ["ai", "conversations", id],
};

// ─── Conversations ────────────────────────────────────────

export function useAIConversationsList(page = 1, pageSize = 20) {
  return useQuery<ConversationDTO[], ErrorModel>({
    queryKey: [...QUERY_KEYS.conversations, { page, pageSize }],
    queryFn: async () => {
      const res = await listConversations();
      if (res.status !== 200) throw res.data;
      return res.data.sessions ?? [];
    },
  });
}

export function useAIGetConversation(sessionId: string | null) {
  return useQuery<GetConversationOutputBody, ErrorModel>({
    queryKey: QUERY_KEYS.conversation(sessionId || ""),
    queryFn: async () => {
      if (!sessionId) throw new Error("No session ID");
      const res = await getConversation(sessionId, {});
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    enabled: !!sessionId,
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, string>({
    mutationFn: async (sessionId) => {
      const res = await archiveConversation(sessionId, {});
      if (res.status !== 200) throw res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
    },
  });
}

// ─── Ask AI ────────────────────────────────────────────────

export function useAskAI() {
  const queryClient = useQueryClient();
  return useMutation<AskResponseBody, ErrorModel, AskRequest>({
    mutationFn: async (req) => {
      const res = await ask(req);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: (_, req) => {
      if (req.sessionId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.conversation(req.sessionId),
        });
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
    },
  });
}

// ─── Ask AI Streaming ──────────────────────────────────────

export type ToolUseEvent = {
  tool: string;
  argumentsJson?: string;
};

export type ToolResultEvent = {
  tool: string;
  resultSummary?: string;
};

type AskStreamChunkEventBody = {
  text: string;
};

type AskStreamCitationEventBody = {
  citations: CitationDTO[];
};

type AskStreamDoneEventBody = {
  model: string;
  latencyMs: number;
  usage: UsageDTO;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
};

type AskStreamErrorEventBody = {
  code: string;
  message: string;
};

export type AskStreamState = {
  answer: string;
  citations: CitationDTO[] | null;
  toolUses: ToolUseEvent[];
};

type AskStreamHandlers = {
  onChunk?: (text: string, state: AskStreamState) => void;
  onCitations?: (citations: CitationDTO[]) => void;
  onToolUse?: (toolUse: ToolUseEvent) => void;
  onToolResult?: (toolResult: ToolResultEvent) => void;
  onDone?: (payload: AskStreamDoneEventBody & AskStreamState) => void;
  onError?: (error: AskStreamErrorEventBody) => void;
};

export function useAskAIStream() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<AskStreamErrorEventBody | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsStreaming(false);
  };

  const start = async (req: AskRequest, handlers: AskStreamHandlers = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsStreaming(true);
    setError(null);

    let answer = "";
    let citations: CitationDTO[] | null = null;
    const toolUses: ToolUseEvent[] = [];
    let completed = false;
    let receivedEvent = false;

    try {
      const headers: Record<string, string> = {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetchSseWithAuth(getAskStreamSseUrl().toString(), {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(req),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const err = {
          code: "stream_failed",
          message: `Stream failed (${response.status})`,
        };
        setError(err);
        handlers.onError?.(err);
        setIsStreaming(false);
        controllerRef.current = null;
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk.replace(/\r\n/g, "\n");
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          const event = parseSSEChunk(eventChunk);
          if (!event?.data) continue;
          receivedEvent = true;

          try {
            if (event.event === "chunk") {
              const parsed = JSON.parse(event.data) as AskStreamChunkEventBody;
              if (parsed?.text) {
                answer += parsed.text;
                handlers.onChunk?.(parsed.text, { answer, citations, toolUses });
              }
            } else if (event.event === "citations") {
              const parsed = JSON.parse(event.data) as AskStreamCitationEventBody;
              citations = parsed.citations ?? [];
              handlers.onCitations?.(citations);
            } else if (event.event === "tool_use") {
              const parsed = JSON.parse(event.data) as ToolUseEvent;
              toolUses.push(parsed);
              handlers.onToolUse?.(parsed);
            } else if (event.event === "tool_result") {
              const parsed = JSON.parse(event.data) as ToolResultEvent;
              handlers.onToolResult?.(parsed);
            } else if (event.event === "done") {
              const parsed = JSON.parse(event.data) as AskStreamDoneEventBody;
              completed = true;
              handlers.onDone?.({ ...parsed, answer, citations, toolUses });

              const sessionId = parsed.sessionId || req.sessionId;
              if (sessionId) {
                queryClient.invalidateQueries({
                  queryKey: QUERY_KEYS.conversation(sessionId),
                });
              }
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.conversations,
              });

              setIsStreaming(false);
              controllerRef.current = null;
              return;
            } else if (event.event === "error") {
              const parsed = JSON.parse(event.data) as AskStreamErrorEventBody;
              completed = true;
              setError(parsed);
              handlers.onError?.(parsed);
              setIsStreaming(false);
              controllerRef.current = null;
              return;
            }
          } catch (err) {
            if (process.env.NODE_ENV !== "production") {
              console.warn("[SSE] Failed to parse ask stream event", err);
            }
          }
        }
      }
      if (!completed) {
        const parsed = {
          code: "stream_closed",
          message: receivedEvent
            ? "Stream closed before completion"
            : "No events received from stream",
        };
        setError(parsed);
        handlers.onError?.(parsed);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        const parsed = {
          code: "stream_error",
          message: "Stream connection failed",
        };
        setError(parsed);
        handlers.onError?.(parsed);
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
      setIsStreaming(false);
    }
  };

  return { start, cancel, isStreaming, error };
}
