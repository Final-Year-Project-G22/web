"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import type { CampaignSummaryResponse } from "@/lib/api/types";
import { env } from "@/lib/env";
import { connectSse, type SseEvent } from "@/lib/sse-client";
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

    const url = getCampaignSseUrl().toString();

    const handleSseEvent = (event: SseEvent) => {
      if (!event.data) return;

      if (event.event === "campaign_status") {
        try {
          const data = JSON.parse(event.data) as CampaignStatusEvent;
          const { campaignId, status } = data;

          const name = findCampaignName(queryClient, campaignId);
          updateCampaignStatusInCache(queryClient, campaignId, status);

          toast.info(name ? `Campaign "${name}" is now ${status}` : `Campaign is now ${status}`);
        } catch {
          // silently ignore malformed events
        }
      }
    };

    const client = connectSse({
      url,
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      onEvent: handleSseEvent,
      onError: () => {
        // errors handled by SseClient's built-in reconnect
      },
      reconnect: true,
      maxReconnectAttempts: 10,
    });

    return () => {
      client.close();
    };
  }, [queryClient, token]);
}
