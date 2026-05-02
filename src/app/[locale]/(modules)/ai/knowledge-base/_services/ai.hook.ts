"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ask } from "@/lib/api/services/ai-ask";
import {
  archiveConversation,
  getConversation,
  listConversations,
} from "@/lib/api/services/ai-conversations";
import { listDeadEvents, redriveEvent } from "@/lib/api/services/ai-dlq";
import {
  createIngestionUploadIntent,
  finalizeIngestionUpload,
  getIngestionToggle,
  setIngestionToggle,
} from "@/lib/api/services/ai-ingestion";
import { listIngestionStatusByAccountID } from "@/lib/api/services/ai-ingestion-status";
import type {
  AskRequest,
  AskResponseBody,
  ConversationDTO,
  DeadEventDTO,
  ErrorModel,
  GetConversationOutputBody,
  IngestionStatusProjectionResponse,
  IngestToggleStateResponse,
} from "@/lib/api/types";
import { useAuthStore } from "@/store/auth.store";

const QUERY_KEYS = {
  ai: ["ai"],
  toggle: ["ai", "toggle"],
  status: (accountId: string) => ["ai", "status", accountId],
  dlq: ["ai", "dlq"],
  conversations: ["ai", "conversations"],
  conversation: (id: string) => ["ai", "conversations", id],
};

// --- Ingestion Status ---
export function useAIStatusList(page = 1, pageSize = 50) {
  const accountId = useAuthStore((s) => s.account?.id);

  return useQuery<IngestionStatusProjectionResponse[], ErrorModel>({
    queryKey: [...QUERY_KEYS.status(accountId || ""), { page, pageSize }],
    queryFn: async () => {
      if (!accountId) return [];
      const res = await listIngestionStatusByAccountID(accountId, { page, pageSize });
      if (res.status !== 200) throw res.data;
      return res.data.projections ?? [];
    },
    enabled: !!accountId,
    refetchInterval: 10000, // Poll every 10s in case SSE is dropped
  });
}

// --- Global Toggle ---
export function useAIIngestionToggle() {
  return useQuery<IngestToggleStateResponse, ErrorModel>({
    queryKey: QUERY_KEYS.toggle,
    queryFn: async () => {
      const res = await getIngestionToggle({ accountId: "" }); // Global fallback if needed, or omit if backend ignores
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
      const res = await listDeadEvents({ page, pageSize });
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
      const res = await listConversations({ page, pageSize });
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
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversation(req.sessionId) });
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const accountId = useAuthStore((s) => s.account?.id);

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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.status(accountId || "") });
    },
  });
}
