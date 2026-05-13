"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  ensureFreshSession,
  logoutAndRedirect,
  refreshToken,
} from "@/lib/api/mutator/custom-fetch";
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
  DeadEventDTO,
  ErrorModel,
  IngestionStatusProjectionResponse,
  IngestToggleStateResponse,
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

const QUERY_KEYS = {
  ai: ["ai"],
  toggle: ["ai", "toggle"],
  status: (accountId: string) => ["ai", "status", accountId],
  dlq: ["ai", "dlq"],
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
  const nextRecord = next as unknown as Record<string, unknown>;

  const takeStr = (camel: keyof IngestionStatusProjectionResponse, snake: string) => {
    if (camel in r && r[camel] != null) {
      nextRecord[camel as string] = String(r[camel]);
    } else if (snake in r && r[snake] != null) {
      nextRecord[camel as string] = String(r[snake]);
    }
  };
  const takeNum = (camel: keyof IngestionStatusProjectionResponse, snake: string) => {
    if (!(camel in r) && !(snake in r)) return;
    const v = camel in r ? r[camel] : r[snake];
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isNaN(n)) nextRecord[camel as string] = n;
  };
  const takeBool = (camel: keyof IngestionStatusProjectionResponse, snake: string) => {
    if (!(camel in r) && !(snake in r)) return;
    const v = camel in r ? r[camel] : r[snake];
    if (typeof v === "boolean") nextRecord[camel as string] = v;
  };
  const takeOptStr = (camel: keyof IngestionStatusProjectionResponse, snake: string) => {
    if (!(camel in r) && !(snake in r)) return;
    const v = camel in r ? r[camel] : r[snake];
    if (v == null || v === "") delete nextRecord[camel as string];
    else nextRecord[camel as string] = String(v);
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
      const res = await listIngestionStatusByAccountID(`${accountId}?${qs.toString()}`);
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
          const response = await fetchSseWithAuth(url.toString(), {
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
                  const projections = parsed.projections;
                  queryClient.setQueryData<IngestionStatusProjectionResponse[]>(
                    statusKey,
                    (old = []) => {
                      const byId = new Map(old.map((d) => [d.documentId, d]));
                      for (const p of projections) {
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

export type UploadDocumentInput = {
  file: File;
  title?: string;
  language?: string;
  sectorIds?: string[];
  tagIds?: string[];
};

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, ErrorModel, UploadDocumentInput>({
    mutationFn: async (input) => {
      const { file, title, language, sectorIds, tagIds } = input;

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
          ...((intent.headers as Record<string, string>) || {}),
        },
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload to storage provider");
      }

      // 4. Finalize upload with metadata
      const idempotencyKey = crypto.randomUUID();
      const finalizeRes = await finalizeIngestionUpload({
        checksumSha256,
        contentType: file.type || "application/octet-stream",
        idempotencyKey,
        sizeBytes: file.size,
        sourceFilename: title || file.name,
        declaredLanguage: language,
        storageKey: intent.key,
        sectorIds: sectorIds && sectorIds.length > 0 ? sectorIds : null,
        tagIds: tagIds && tagIds.length > 0 ? tagIds : null,
      });
      if (finalizeRes.status !== 200) throw finalizeRes.data;
    },
    onSuccess: () => {
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
