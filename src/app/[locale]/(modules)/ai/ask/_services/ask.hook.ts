"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
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
import { connectSse, type SseEvent } from "@/lib/sse-client";
import { useAuthStore } from "@/store/auth.store";

/** Ask-stream SSE must hit the API origin when configured. */
function getAskStreamSseUrl(): URL {
  const path = "/api/v1/ai/ask/stream";
  if (env.NEXT_PUBLIC_API_URL) {
    return new URL(path, env.NEXT_PUBLIC_API_URL);
  }
  return new URL(path, window.location.origin);
}

const QUERY_KEYS = {
  conversations: (page: number, pageSize: number) => [
    "ai",
    "conversations",
    "list",
    { page, pageSize },
  ],
  conversation: (id: string) => ["ai", "conversations", id],
  conversationsList: ["ai", "conversations", "list"],
};

// ─── Conversations ────────────────────────────────────────

export function useAIConversationsList(page = 1, pageSize = 20) {
  return useQuery<ConversationDTO[], ErrorModel>({
    queryKey: QUERY_KEYS.conversations(page, pageSize),
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversationsList });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversationsList });
    },
  });
}

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

type AskStreamThinkingEventBody = {
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

export type ThinkingChunk = {
  text: string;
  timestamp: number;
};

export type AskStreamState = {
  answer: string;
  citations: CitationDTO[] | null;
  toolUses: ToolUseEvent[];
  thinkingChunks: ThinkingChunk[];
};

type AskStreamHandlers = {
  onChunk?: (text: string, state: AskStreamState) => void;
  onCitations?: (citations: CitationDTO[]) => void;
  onToolUse?: (toolUse: ToolUseEvent) => void;
  onToolResult?: (toolResult: ToolResultEvent) => void;
  onThinking?: (thinking: AskStreamThinkingEventBody, state: AskStreamState) => void;
  onDone?: (payload: AskStreamDoneEventBody & AskStreamState) => void;
  onError?: (error: AskStreamErrorEventBody) => void;
};

export function useAskAIStream() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<AskStreamErrorEventBody | null>(null);
  const clientRef = useRef<{ close: () => void } | null>(null);

  const cancel = () => {
    clientRef.current?.close();
    clientRef.current = null;
    setIsStreaming(false);
  };

  const start = async (
    req: AskRequest,
    handlers: AskStreamHandlers = {},
    useDebugEndpoint = false
  ) => {
    clientRef.current?.close();

    setIsStreaming(true);
    setError(null);

    let answer = "";
    let citations: CitationDTO[] | null = null;
    const toolUses: ToolUseEvent[] = [];
    const thinkingChunks: ThinkingChunk[] = [];
    let completed = false;
    let receivedEvent = false;

    const url = useDebugEndpoint
      ? getAskStreamSseUrl().toString().replace("/stream", "/stream/debug")
      : getAskStreamSseUrl().toString();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const handleSseEvent = (event: SseEvent) => {
      if (!event.data) return;
      receivedEvent = true;

      try {
        if (event.event === "chunk") {
          const parsed = JSON.parse(event.data) as AskStreamChunkEventBody;
          if (parsed?.text) {
            answer += parsed.text;
            handlers.onChunk?.(parsed.text, { answer, citations, toolUses, thinkingChunks });
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
        } else if (event.event === "thinking") {
          const parsed = JSON.parse(event.data) as AskStreamThinkingEventBody;
          if (parsed?.text) {
            thinkingChunks.push({ text: parsed.text, timestamp: Date.now() });
            handlers.onThinking?.(parsed, { answer, citations, toolUses, thinkingChunks });
          }
        } else if (event.event === "done") {
          const parsed = JSON.parse(event.data) as AskStreamDoneEventBody;
          completed = true;
          handlers.onDone?.({ ...parsed, answer, citations, toolUses, thinkingChunks });

          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.conversationsList,
          });

          clientRef.current?.close();
          clientRef.current = null;
          setIsStreaming(false);
        } else if (event.event === "error") {
          const parsed = JSON.parse(event.data) as AskStreamErrorEventBody;
          completed = true;
          setError(parsed);
          handlers.onError?.(parsed);
          clientRef.current?.close();
          clientRef.current = null;
          setIsStreaming(false);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[SSE] Failed to parse ask stream event", err);
        }
      }
    };

    const handleSseError = (_err: Error) => {
      if (completed) return;
      const parsed = {
        code: "stream_error",
        message: "Stream connection failed",
      };
      setError(parsed);
      handlers.onError?.(parsed);
      setIsStreaming(false);
    };

    const handleSseClose = () => {
      if (clientRef.current && !completed) {
        const parsed = {
          code: "stream_closed",
          message: receivedEvent
            ? "Stream closed before completion"
            : "No events received from stream",
        };
        setError(parsed);
        handlers.onError?.(parsed);
      }
      clientRef.current = null;
      setIsStreaming(false);
    };

    const client = connectSse({
      url,
      method: "POST",
      headers,
      body: JSON.stringify(req),
      onEventAction: handleSseEvent,
      onErrorAction: handleSseError,
      onCloseAction: handleSseClose,
      reconnect: false,
    });
    clientRef.current = client;
  };

  return { start, cancel, isStreaming, error };
}
