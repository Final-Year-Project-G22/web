"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCampaignTemplateTranslation,
  createCampaignTemplate,
  deleteCampaignTemplate,
  deleteCampaignTemplateTranslation,
  getCampaignTemplate,
  listCampaignTemplates,
  updateCampaignTemplate,
  updateCampaignTemplateTranslation,
} from "@/lib/api/services/admin-campaign-templates";
import {
  cancelCampaign,
  createCampaign,
  getCampaign,
  getQueueStatus,
  listCampaigns,
  retryFailed,
  scheduleCampaign,
  updateCampaign,
} from "@/lib/api/services/admin-notifications";
import type {
  AddCampaignTemplateTranslationRequest,
  AddCampaignTemplateTranslationResponseBody,
  CampaignDetailResponse,
  CampaignSummaryResponse,
  CampaignTemplateDetailResponse,
  CampaignTemplateSummaryResponse,
  CancelCampaignResponseBody,
  CreateCampaignRequest,
  CreateCampaignResponseBody,
  CreateCampaignTemplateRequest,
  CreateCampaignTemplateResponseBody,
  DeleteCampaignTemplateTranslationResponseBody,
  ErrorModel,
  ListCampaignsParams,
  ListCampaignTemplatesParams,
  QueueStatusResponse,
  RetryFailedParams,
  RetryFailedResponseBody,
  ScheduleCampaignResponseBody,
  UpdateCampaignRequest,
  UpdateCampaignResponseBody,
  UpdateCampaignTemplateRequest,
  UpdateCampaignTemplateResponseBody,
  UpdateCampaignTemplateTranslationRequest,
  UpdateCampaignTemplateTranslationResponseBody,
} from "@/lib/api/types";

const CAMPAIGN_TEMPLATES_KEY = ["admin", "notifications", "campaign-templates"];
const CAMPAIGNS_KEY = ["admin", "notifications", "campaigns"];
const QUEUE_KEY = ["admin", "notifications", "queue"];

// ── Campaign Templates ──

export function useListCampaignTemplates(params?: ListCampaignTemplatesParams) {
  return useQuery<
    {
      data: CampaignTemplateSummaryResponse[];
      total: number;
      totalPages: number;
      page: number;
      pageSize: number;
    },
    ErrorModel
  >({
    queryKey: [...CAMPAIGN_TEMPLATES_KEY, "list", params ?? {}],
    queryFn: async () => {
      const res = await listCampaignTemplates(params);
      if (res.status !== 200) throw res.data;
      return {
        data: res.data.data ?? [],
        total: res.data.total,
        totalPages: res.data.totalPages,
        page: res.data.page,
        pageSize: res.data.pageSize,
      };
    },
  });
}

export function useGetCampaignTemplate(id: string) {
  return useQuery<CampaignTemplateDetailResponse, ErrorModel>({
    queryKey: [...CAMPAIGN_TEMPLATES_KEY, "detail", id],
    queryFn: async () => {
      const res = await getCampaignTemplate(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCampaignTemplate() {
  const queryClient = useQueryClient();
  return useMutation<CreateCampaignTemplateResponseBody, ErrorModel, CreateCampaignTemplateRequest>(
    {
      mutationFn: async (payload) => {
        const res = await createCampaignTemplate(payload);
        if (res.status !== 200) throw res.data;
        return res.data;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: CAMPAIGN_TEMPLATES_KEY });
      },
    }
  );
}

export function useUpdateCampaignTemplate() {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateCampaignTemplateResponseBody,
    ErrorModel,
    { id: string; patch: UpdateCampaignTemplateRequest }
  >({
    mutationFn: async ({ id, patch }) => {
      const res = await updateCampaignTemplate(id, patch);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: CAMPAIGN_TEMPLATES_KEY });
      await queryClient.invalidateQueries({
        queryKey: [...CAMPAIGN_TEMPLATES_KEY, "detail", variables.id],
      });
    },
  });
}

export function useDeleteCampaignTemplate() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ErrorModel, string>({
    mutationFn: async (id) => {
      const res = await deleteCampaignTemplate(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CAMPAIGN_TEMPLATES_KEY });
    },
  });
}

export function useAddCampaignTemplateTranslation() {
  const queryClient = useQueryClient();
  return useMutation<
    AddCampaignTemplateTranslationResponseBody,
    ErrorModel,
    { id: string; payload: AddCampaignTemplateTranslationRequest }
  >({
    mutationFn: async ({ id, payload }) => {
      const res = await addCampaignTemplateTranslation(id, payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [...CAMPAIGN_TEMPLATES_KEY, "detail", variables.id],
      });
    },
  });
}

export function useUpdateCampaignTemplateTranslation() {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateCampaignTemplateTranslationResponseBody,
    ErrorModel,
    { id: string; lang: string; payload: UpdateCampaignTemplateTranslationRequest }
  >({
    mutationFn: async ({ id, lang, payload }) => {
      const res = await updateCampaignTemplateTranslation(id, lang, payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [...CAMPAIGN_TEMPLATES_KEY, "detail", variables.id],
      });
    },
  });
}

export function useDeleteCampaignTemplateTranslation() {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteCampaignTemplateTranslationResponseBody,
    ErrorModel,
    { id: string; lang: string }
  >({
    mutationFn: async ({ id, lang }) => {
      const res = await deleteCampaignTemplateTranslation(id, lang);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [...CAMPAIGN_TEMPLATES_KEY, "detail", variables.id],
      });
    },
  });
}

// ── Campaigns ──

export function useListCampaigns(params?: ListCampaignsParams) {
  return useQuery<
    {
      data: CampaignSummaryResponse[];
      total: number;
      totalPages: number;
      page: number;
      pageSize: number;
    },
    ErrorModel
  >({
    queryKey: [...CAMPAIGNS_KEY, "list", params ?? {}],
    queryFn: async () => {
      const res = await listCampaigns(params);
      if (res.status !== 200) throw res.data;
      return {
        data: res.data.data ?? [],
        total: res.data.total,
        totalPages: res.data.totalPages,
        page: res.data.page,
        pageSize: res.data.pageSize,
      };
    },
  });
}

export function useGetCampaign(id: string) {
  return useQuery<CampaignDetailResponse, ErrorModel>({
    queryKey: [...CAMPAIGNS_KEY, "detail", id],
    queryFn: async () => {
      const res = await getCampaign(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation<CreateCampaignResponseBody, ErrorModel, CreateCampaignRequest>({
    mutationFn: async (payload) => {
      const res = await createCampaign(payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateCampaignResponseBody,
    ErrorModel,
    { id: string; patch: UpdateCampaignRequest }
  >({
    mutationFn: async ({ id, patch }) => {
      const res = await updateCampaign(id, patch);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
      await queryClient.invalidateQueries({ queryKey: [...CAMPAIGNS_KEY, "detail", variables.id] });
    },
  });
}

export function useScheduleCampaign() {
  const queryClient = useQueryClient();
  return useMutation<ScheduleCampaignResponseBody, ErrorModel, string>({
    mutationFn: async (id) => {
      const res = await scheduleCampaign(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}

export function useCancelCampaign() {
  const queryClient = useQueryClient();
  return useMutation<CancelCampaignResponseBody, ErrorModel, string>({
    mutationFn: async (id) => {
      const res = await cancelCampaign(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}

// ── Queue ──

export function useQueueStatus() {
  return useQuery<QueueStatusResponse, ErrorModel>({
    queryKey: QUEUE_KEY,
    queryFn: async () => {
      const res = await getQueueStatus();
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useRetryFailed() {
  const queryClient = useQueryClient();
  return useMutation<RetryFailedResponseBody, ErrorModel, RetryFailedParams | undefined>({
    mutationFn: async (params) => {
      const res = await retryFailed(params);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUEUE_KEY });
    },
  });
}
