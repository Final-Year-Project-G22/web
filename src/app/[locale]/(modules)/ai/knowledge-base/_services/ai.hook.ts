"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ask } from "@/lib/api/services/ai-ask";
import {
  archiveConversation,
  getConversation,
  listConversations,
} from "@/lib/api/services/ai-conversations";
import { listDeadEvents, redriveEvent } from "@/lib/api/services/ai-dlq";
import {
  createIngestionUploadIntent,
  deleteIngestionDocument,
  finalizeIngestionUpload,
  getIngestionToggle,
  setIngestionToggle,
} from "@/lib/api/services/ai-ingestion";
import { listIngestionStatusByAccountID } from "@/lib/api/services/ai-ingestion-status";
import type {
  AskRequest,
  AskResponseBody,
  CitationDTO,
  ConversationDTO,
  DeadEventDTO,
  ErrorModel,
  GetConversationOutputBody,
  IngestionStatusProjectionResponse,
  IngestToggleStateResponse,
  UsageDTO,
} from "@/lib/api/types";
import { env } from "@/lib/env";
import { useAuthStore } from "@/store/auth.store";

/** SSE must hit the API origin when configured; Next rewrites can buffer streaming responses. */
function getIngestionSseStreamUrl(): URL {
  const path = "/api/v1/ai/ingestion/status/stream";
  if (env.NEXT_PUBLIC_API_URL) {
    return new URL(path, env.NEXT_PUBLIC_API_URL);
  }
  return new URL(path, window.location.origin);
}

/** Ask-stream SSE must hit the API origin when configured; Next rewrites can buffer. */
function getAskStreamSseUrl(): URL {
  const path = "/api/v1/ai/ask/stream";
  if (env.NEXT_PUBLIC_API_URL) {
    return new URL(path, env.NEXT_PUBLIC_API_URL);
  }
  return new URL(path, window.location.origin);
}

const QUERY_KEYS = {
  ai: ["ai"],
  toggle: ["ai", "toggle"],
  status: (accountId: string) => ["ai", "status", accountId],
  dlq: ["ai", "dlq"],
  conversations: ["ai", "conversations"],
  conversation: (id: string) => ["ai", "conversations", id],
};

/** Backoff before reconnecting SSE after a failed connect or dropped stream. */
function sseReconnectDelayMs(attempt: number): number {
  return Math.min(30_000, 1000 * 2 ** Math.min(Math.max(0, attempt - 1), 5));
}

function waitForReconnect(ms: number, signal: AbortSignal): Promise<void> {
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

/** Merge one SSE JSON row into a cached projection (handles snake_case + partial patches). */
function applySseIngestionPatch(
  previous: IngestionStatusProjectionResponse | undefined,
  raw: unknown
): IngestionStatusProjectionResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const documentIdRaw = r.documentId ?? r.document_id;
  if (documentIdRaw == null || String(documentIdRaw) === "") return null;
  const documentId = String(documentIdRaw);

  const base: IngestionStatusProjectionResponse =
    previous ??
    ({
      accountId: "",
      userId: "",
      documentId,
      currentStage: "",
      chunksFailedCount: 0,
      chunksProcessedCount: 0,
      eventSequence: 0,
      isTerminal: false,
      startedAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    } satisfies IngestionStatusProjectionResponse);

  const next: IngestionStatusProjectionResponse = { ...base, documentId };

  const takeStr = (camel: keyof IngestionStatusProjectionResponse, snake: string) => {
    if (camel in r && r[camel] != null) {
      (next as Record<string, unknown>)[camel as string] = String(r[camel]);
    } else if (snake in r && r[snake] != null) {
      (next as Record<string, unknown>)[camel as string] = String(r[snake]);
    }
  };
  const takeNum = (camel: keyof IngestionStatusProjectionResponse, snake: string) => {
    if (!(camel in r) && !(snake in r)) return;
    const v = camel in r ? r[camel] : r[snake];
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isNaN(n)) (next as Record<string, unknown>)[camel as string] = n;
  };
  const takeBool = (camel: keyof IngestionStatusProjectionResponse, snake: string) => {
    if (!(camel in r) && !(snake in r)) return;
    const v = camel in r ? r[camel] : r[snake];
    if (typeof v === "boolean") (next as Record<string, unknown>)[camel as string] = v;
  };
  const takeOptStr = (camel: keyof IngestionStatusProjectionResponse, snake: string) => {
    if (!(camel in r) && !(snake in r)) return;
    const v = camel in r ? r[camel] : r[snake];
    if (v == null || v === "") delete (next as Record<string, unknown>)[camel as string];
    else (next as Record<string, unknown>)[camel as string] = String(v);
  };

  takeStr("accountId", "account_id");
  takeStr("userId", "user_id");
  takeStr("currentStage", "current_stage");
  takeStr("startedAt", "started_at");
  takeStr("updatedAt", "updated_at");
  takeNum("chunksProcessedCount", "chunks_processed_count");
  takeNum("chunksFailedCount", "chunks_failed_count");
  takeNum("eventSequence", "event_sequence");
  takeBool("isTerminal", "is_terminal");
  takeOptStr("completedAt", "completed_at");
  takeOptStr("lastError", "last_error");

  return next;
}

// --- Ingestion Status ---
export function useAIStatusList(page = 1, pageSize = 50) {
  const accountId = useAuthStore((s) => s.account?.id);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const query = useQuery<IngestionStatusProjectionResponse[], ErrorModel>({
    queryKey: [...QUERY_KEYS.status(accountId || ""), { page, pageSize }],
    queryFn: async () => {
      if (!accountId) return [];
      const qs = new URLSearchParams();
      qs.set("limit", String(pageSize));
      qs.set("offset", String((page - 1) * pageSize));
      const res = await listIngestionStatusByAccountID(accountId + "?" + qs.toString());
      if (res.status !== 200) throw res.data;
      return res.data.projections ?? [];
    },
    enabled: !!accountId,
    staleTime: Infinity,
  });

  // SSE stream for real-time updates
  useEffect(() => {
    if (!accountId || !token) return;

    const controller = new AbortController();
    let disposed = false;

    const run = async () => {
      let failCount = 0;
      while (!disposed) {
        let connected = false;
        const url = getIngestionSseStreamUrl();
        try {
          console.log("[SSE] Connecting to", url.toString());
          const response = await fetch(url.toString(), {
            headers: {
              Accept: "text/event-stream",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            console.warn("[SSE] Connection failed", response.status);
            failCount++;
            try {
              await waitForReconnect(sseReconnectDelayMs(failCount), controller.signal);
            } catch {
              break;
            }
            continue;
          }

          connected = true;
          failCount = 0;
          console.log("[SSE] Connected");

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.warn("[SSE] Stream closed by server");
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            console.log(
              "[SSE] Raw chunk received",
              chunk.length,
              "bytes:",
              chunk.substring(0, 200)
            );
            buffer += chunk.replace(/\r\n/g, "\n");
            const events = buffer.split("\n\n");
            buffer = events.pop() ?? "";

            for (const eventChunk of events) {
              const trimmed = eventChunk.trim();
              if (!trimmed || trimmed.startsWith(":")) {
                continue;
              }
              const event = parseSSEChunk(eventChunk);
              if (!event?.data) {
                continue;
              }
              try {
                const parsed = JSON.parse(event.data) as
                  | {
                      projections?: IngestionStatusProjectionResponse[];
                      projection?: IngestionStatusProjectionResponse;
                    }
                  | IngestionStatusProjectionResponse;
                console.log("[SSE] Received event", event.event, parsed);

                const singleProjection = "documentId" in parsed ? parsed : parsed.projection;

                const statusKey = [...QUERY_KEYS.status(accountId), { page, pageSize }] as const;

                if ("projections" in parsed && parsed.projections) {
                  queryClient.setQueryData<IngestionStatusProjectionResponse[]>(
                    statusKey,
                    (old = []) => {
                      const byId = new Map(old.map((d) => [d.documentId, d]));
                      for (const p of parsed.projections!) {
                        const pr = p as unknown as Record<string, unknown>;
                        const rid = pr?.documentId ?? pr?.document_id;
                        const prev = rid != null ? byId.get(String(rid)) : undefined;
                        const merged = applySseIngestionPatch(prev, p);
                        if (merged) byId.set(merged.documentId, merged);
                      }
                      const merged = Array.from(byId.values()).sort(
                        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                      );
                      return merged;
                    }
                  );
                } else if (singleProjection) {
                  queryClient.setQueryData<IngestionStatusProjectionResponse[]>(
                    [...QUERY_KEYS.status(accountId), { page, pageSize }],
                    (old = []) => {
                      const sr = singleProjection as unknown as Record<string, unknown>;
                      const sid = sr?.documentId ?? sr?.document_id;
                      const sidStr = sid != null ? String(sid) : "";
                      const existingIndex = old.findIndex((doc) => doc.documentId === sidStr);
                      const prev = existingIndex >= 0 ? old[existingIndex] : undefined;
                      const merged = applySseIngestionPatch(prev, singleProjection);
                      if (!merged) return old;
                      if (existingIndex === -1) {
                        return [merged, ...old].sort(
                          (a, b) =>
                            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                        );
                      }
                      const copy = [...old];
                      copy[existingIndex] = merged;
                      return copy.sort(
                        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                      );
                    }
                  );
                }
              } catch (err) {
                console.warn("[SSE] Failed to parse event data", err);
              }
            }
          }
        } catch (err) {
          if ((err instanceof DOMException && err.name === "AbortError") || disposed) {
            break;
          }
          if (!connected) {
            console.warn("[SSE] Connection error, falling back to polling", err);
          }
          failCount++;
          try {
            await waitForReconnect(sseReconnectDelayMs(failCount), controller.signal);
          } catch {
            break;
          }
        }
      }
    };

    void run();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [accountId, token, page, pageSize, queryClient]);

  return query;
}

function parseSSEChunk(chunk: string): { event?: string; data?: string } | null {
  const lines = chunk.replace(/\r\n/g, "\n").split("\n");
  let event: string | undefined;
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith(":")) {
      continue;
    }
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  const data = dataLines.join("\n");
  return data ? { event, data } : null;
}

// --- Global Toggle ---
export function useAIIngestionToggle() {
  return useQuery<IngestToggleStateResponse, ErrorModel>({
    queryKey: QUERY_KEYS.toggle,
    queryFn: async () => {
      const res = await getIngestionToggle();
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useSetAIIngestionToggle() {
  const queryClient = useQueryClient();
  return useMutation<IngestToggleStateResponse, ErrorModel, boolean>({
    mutationFn: async (enabled) => {
      const res = await setIngestionToggle({ enabled });
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.toggle });
    },
  });
}

// --- Dead Letter Queue (DLQ) ---
export function useAIDeadEvents(page = 1, pageSize = 50) {
  return useQuery<DeadEventDTO[], ErrorModel>({
    queryKey: [...QUERY_KEYS.dlq, { page, pageSize }],
    queryFn: async () => {
      const res = await listDeadEvents();
      if (res.status !== 200) throw res.data;
      return res.data.events ?? [];
    },
  });
}

export function useRedriveEvent() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, string>({
    mutationFn: async (eventId) => {
      const res = await redriveEvent(eventId, {});
      if (res.status !== 200) throw res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dlq });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ai });
    },
  });
}

// --- Conversations / Chat ---
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

// --- Ask AI ---
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

type AskStreamState = {
  answer: string;
  citations: CitationDTO[] | null;
};

type AskStreamHandlers = {
  onChunk?: (text: string, state: AskStreamState) => void;
  onCitations?: (citations: CitationDTO[]) => void;
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
    if (!token) {
      const err = { code: "auth_missing", message: "Missing auth token" };
      setError(err);
      handlers.onError?.(err);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsStreaming(true);
    setError(null);

    let answer = "";
    let citations: CitationDTO[] | null = null;

    try {
      const response = await fetch(getAskStreamSseUrl().toString(), {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          const event = parseSSEChunk(eventChunk);
          if (!event?.data) continue;

          try {
            if (event.event === "chunk") {
              const parsed = JSON.parse(event.data) as AskStreamChunkEventBody;
              if (parsed?.text) {
                answer += parsed.text;
                handlers.onChunk?.(parsed.text, { answer, citations });
              }
            } else if (event.event === "citations") {
              const parsed = JSON.parse(event.data) as AskStreamCitationEventBody;
              citations = parsed.citations ?? [];
              handlers.onCitations?.(citations);
            } else if (event.event === "done") {
              const parsed = JSON.parse(event.data) as AskStreamDoneEventBody;
              handlers.onDone?.({ ...parsed, answer, citations });

              const sessionId = parsed.sessionId || req.sessionId;
              if (sessionId) {
                queryClient.invalidateQueries({
                  queryKey: QUERY_KEYS.conversation(sessionId),
                });
              }
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });

              setIsStreaming(false);
              controllerRef.current = null;
              return;
            } else if (event.event === "error") {
              const parsed = JSON.parse(event.data) as AskStreamErrorEventBody;
              setError(parsed);
              handlers.onError?.(parsed);
              setIsStreaming(false);
              controllerRef.current = null;
              return;
            }
          } catch (err) {
            console.warn("[SSE] Failed to parse ask stream event", err);
          }
        }
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

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, ErrorModel, File>({
    mutationFn: async (file) => {
      // 1. Compute SHA-256 checksum
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksumSha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // 2. Create upload intent
      const intentRes = await createIngestionUploadIntent({
        contentType: file.type || "application/octet-stream",
      });
      if (intentRes.status !== 200) throw intentRes.data;
      const intent = intentRes.data;

      // 3. Upload to SeaweedFS / Storage provider
      const uploadRes = await fetch(intent.uploadUrl, {
        method: intent.method,
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          // Merge custom headers from the intent if any
          ...((intent.headers as Record<string, string>) || {}),
        },
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload to storage provider");
      }

      // 4. Finalize upload
      const idempotencyKey = crypto.randomUUID();
      const finalizeRes = await finalizeIngestionUpload({
        checksumSha256,
        contentType: file.type || "application/octet-stream",
        idempotencyKey,
        sizeBytes: file.size,
        sourceFilename: file.name,
        storageKey: intent.key,
      });
      if (finalizeRes.status !== 200) throw finalizeRes.data;
    },
    onSuccess: () => {
      // Invalidate all AI status queries regardless of accountId to ensure
      // the sidebar refreshes even if accountId wasn't hydrated yet.
      queryClient.invalidateQueries({ queryKey: ["ai", "status"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, string>({
    mutationFn: async (documentId) => {
      const res = await deleteIngestionDocument(documentId);
      if (res.status !== 200) throw res.data;
    },
    onSuccess: async (_, documentId) => {
      // Remove the deleted document from all cached status lists immediately
      queryClient.setQueriesData<IngestionStatusProjectionResponse[]>(
        { queryKey: ["ai", "status"] },
        (old) => old?.filter((d) => d.documentId !== documentId) ?? []
      );
      // Then invalidate to force a background re-sync with the server
      await queryClient.invalidateQueries({ queryKey: ["ai", "status"] });
    },
  });
}
