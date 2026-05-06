"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import type { CampaignSummaryResponse } from "@/lib/api/types";
import { env } from "@/lib/env";
import { useAuthStore } from "@/store/auth.store";

const CAMPAIGNS_KEY = ["admin", "notifications", "campaigns"];

interface CampaignStatusEvent {
  campaignId: string;
  status: string;
  timestamp?: string;
}

function getCampaignSseUrl(): URL {
  const path = "/api/v1/admin/notifications/campaigns/events";
  if (env.NEXT_PUBLIC_API_URL) {
    return new URL(path, env.NEXT_PUBLIC_API_URL);
  }
  return new URL(path, window.location.origin);
}

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

function findCampaignName(
  queryClient: ReturnType<typeof useQueryClient>,
  campaignId: string
): string | undefined {
  const cache = queryClient.getQueryCache();
  const queries = cache.findAll({ queryKey: CAMPAIGNS_KEY });
  for (const query of queries) {
    const data = query.state.data as { data: CampaignSummaryResponse[] } | undefined;
    if (data?.data) {
      const found = data.data.find((c) => c.id === campaignId);
      if (found) return found.name;
    }
  }
  return undefined;
}

function updateCampaignStatusInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  campaignId: string,
  status: string
) {
  const cache = queryClient.getQueryCache();
  const queries = cache.findAll({ queryKey: CAMPAIGNS_KEY });

  for (const query of queries) {
    queryClient.setQueryData(query.queryKey, (old: unknown) => {
      if (!old || typeof old !== "object") return old;
      const typed = old as { data: CampaignSummaryResponse[] };
      if (!Array.isArray(typed.data)) return old;

      const updated = typed.data.map((c) => (c.id === campaignId ? { ...c, status } : c));

      return { ...typed, data: updated };
    });
  }

  // Also update detail cache if present
  queryClient.setQueryData([...CAMPAIGNS_KEY, "detail", campaignId], (detailOld: unknown) => {
    if (!detailOld || typeof detailOld !== "object") return detailOld;
    return { ...(detailOld as object), status };
  });
}

export function useCampaignSSE() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    let disposed = false;

    const run = async () => {
      let failCount = 0;
      while (!disposed) {
        const url = getCampaignSseUrl();
        try {
          const response = await fetch(url.toString(), {
            headers: {
              Accept: "text/event-stream",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            failCount++;
            try {
              await waitForReconnect(sseReconnectDelayMs(failCount), controller.signal);
            } catch {
              break;
            }
            continue;
          }

          failCount = 0;

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
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

              if (event.event === "campaign_status") {
                try {
                  const data = JSON.parse(event.data) as CampaignStatusEvent;
                  const { campaignId, status } = data;

                  const name = findCampaignName(queryClient, campaignId);
                  updateCampaignStatusInCache(queryClient, campaignId, status);

                  toast.info(
                    name ? `Campaign "${name}" is now ${status}` : `Campaign is now ${status}`
                  );
                } catch {
                  // silently ignore malformed events
                }
              }
            }
          }
        } catch {
          // fetch error or stream error
        }

        if (!disposed) {
          failCount++;
          try {
            await waitForReconnect(sseReconnectDelayMs(failCount), controller.signal);
          } catch {
            break;
          }
        }
      }
    };

    run();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [queryClient, token]);
}
