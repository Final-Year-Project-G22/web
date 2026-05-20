"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createGuide,
  deleteGuide,
  getGuideAdmin,
  listGuidesAdmin,
  updateGuide,
} from "@/lib/api/services/admin-guides";
import {
  createStep,
  deleteStep,
  listGuideStepsAdmin,
  reorderSteps,
  updateStep,
} from "@/lib/api/services/admin-steps";
import { listComplianceTypes } from "@/lib/api/services/compliance";
import type {
  AdminGuideCardDTO,
  AdminGuideDetailDTO,
  AdminGuideStepDTO,
  CreateGuideRequest,
  CreateGuideResponseBody,
  CreateStepRequest,
  CreateStepResponseBody,
  ErrorModel,
  GetGuideAdminParams,
  ListComplianceTypesResponseBody,
  ListGuideStepsAdminParams,
  ListGuidesAdminParams,
  UpdateGuideRequest,
  UpdateStepRequest,
} from "@/lib/api/types";

// ─── Query Keys ───────────────────────────────────────────────

const KEYS = {
  all: ["admin", "guides"] as const,
  list: (params?: ListGuidesAdminParams) => [...KEYS.all, "list", params] as const,
  detail: (id: string, params?: GetGuideAdminParams) =>
    [...KEYS.all, "detail", id, params] as const,
  steps: (id: string, params?: ListGuideStepsAdminParams) =>
    [...KEYS.all, "steps", id, params] as const,
};

// ─── Read Hooks ───────────────────────────────────────────────

type PaginatedGuides = {
  guides: AdminGuideCardDTO[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export function useAdminGuideList(params?: ListGuidesAdminParams) {
  return useQuery<PaginatedGuides, ErrorModel>({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const res = await listGuidesAdmin(params);
      if (res.status !== 200) throw res.data;
      return {
        guides: res.data.guides ?? [],
        page: res.data.page,
        pageSize: res.data.pageSize,
        totalItems: res.data.totalItems,
        totalPages: res.data.totalPages,
      };
    },
  });
}

export function useAdminGuideDetail(id: string | undefined, params?: GetGuideAdminParams) {
  return useQuery<AdminGuideDetailDTO, ErrorModel>({
    queryKey: KEYS.detail(id ?? "", params),
    queryFn: async () => {
      if (!id) throw new Error("Guide ID is required");
      const res = await getGuideAdmin(id, params);
      if (res.status !== 200) throw res.data;
      return res.data.guide;
    },
    enabled: Boolean(id),
  });
}

type PaginatedSteps = {
  steps: AdminGuideStepDTO[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export function useAdminGuideSteps(id: string | undefined, params?: ListGuideStepsAdminParams) {
  return useQuery<PaginatedSteps, ErrorModel>({
    queryKey: KEYS.steps(id ?? "", params),
    queryFn: async () => {
      if (!id) throw new Error("Guide ID is required");
      const res = await listGuideStepsAdmin(id, params);
      if (res.status !== 200) throw res.data;
      return {
        steps: res.data.steps ?? [],
        page: res.data.page,
        pageSize: res.data.pageSize,
        totalItems: res.data.totalItems,
        totalPages: res.data.totalPages,
      };
    },
    enabled: Boolean(id),
  });
}

// ─── Guide Mutations ──────────────────────────────────────────

export function useCreateGuide() {
  const queryClient = useQueryClient();
  return useMutation<CreateGuideResponseBody, ErrorModel, CreateGuideRequest>({
    mutationFn: async (payload) => {
      const res = await createGuide(payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateGuide() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, { id: string; patch: UpdateGuideRequest }>({
    mutationFn: async ({ id, patch }) => {
      const res = await updateGuide(id, patch);
      if (res.status !== 200) throw res.data;
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
      await queryClient.invalidateQueries({ queryKey: KEYS.list() });
    },
  });
}

export function useDeleteGuide() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, string>({
    mutationFn: async (id) => {
      const res = await deleteGuide(id);
      if (res.status !== 200) throw res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

// ─── Step Mutations ───────────────────────────────────────────

export function useCreateStep() {
  const queryClient = useQueryClient();
  return useMutation<CreateStepResponseBody, ErrorModel, CreateStepRequest>({
    mutationFn: async (payload) => {
      const res = await createStep(payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: [...KEYS.all, "steps", vars.guideId],
      });
      await queryClient.invalidateQueries({
        queryKey: [...KEYS.all, "detail", vars.guideId],
      });
    },
  });
}

export function useUpdateStep() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, { id: string; guideId: string; patch: UpdateStepRequest }>({
    mutationFn: async ({ id, patch }) => {
      const res = await updateStep(id, patch);
      if (res.status !== 200) throw res.data;
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: [...KEYS.all, "steps", vars.guideId],
      });
      await queryClient.invalidateQueries({
        queryKey: [...KEYS.all, "detail", vars.guideId],
      });
    },
  });
}

export function useDeleteStep() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, { id: string; guideId: string }>({
    mutationFn: async ({ id }) => {
      const res = await deleteStep(id);
      if (res.status !== 200) throw res.data;
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: [...KEYS.all, "steps", vars.guideId],
      });
      await queryClient.invalidateQueries({
        queryKey: [...KEYS.all, "detail", vars.guideId],
      });
    },
  });
}

export function useReorderSteps() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, { guideId: string; stepIds: string[] }>({
    mutationFn: async ({ guideId, stepIds }) => {
      const res = await reorderSteps({ guideId, stepIds });
      if (res.status !== 200) throw res.data;
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: [...KEYS.all, "steps", vars.guideId],
      });
      await queryClient.invalidateQueries({
        queryKey: [...KEYS.all, "detail", vars.guideId],
      });
    },
  });
}

const COMPLIANCE_TYPES_KEY = ["compliance", "types"];

export function useComplianceTypes() {
  return useQuery<ListComplianceTypesResponseBody, ErrorModel>({
    queryKey: COMPLIANCE_TYPES_KEY,
    queryFn: async () => {
      const res = await listComplianceTypes();
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}
