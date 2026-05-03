"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  getCategoryTreeAdmin,
  updateCategory,
} from "@/lib/api/services/admin-categories";
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
import type {
  AdminCategoryDTO,
  AdminGuideCardDTO,
  AdminGuideDetailDTO,
  AdminGuideStepDTO,
  CreateGuideRequest,
  CreateGuideResponseBody,
  CreateStepRequest,
  CreateStepResponseBody,
  ErrorModel,
  GetCategoryTreeAdminParams,
  GetGuideAdminParams,
  ListGuideStepsAdminParams,
  ListGuidesAdminParams,
  UpdateCategoryRequest,
  UpdateGuideRequest,
  UpdateStepRequest,
} from "@/lib/api/types";
import type { CreateCategoryRequest } from "@/lib/api/types/createCategoryRequest";

// ─── Query Keys ───────────────────────────────────────────────

const KEYS = {
  all: ["admin", "guides"] as const,
  list: (params?: ListGuidesAdminParams) => [...KEYS.all, "list", params] as const,
  detail: (id: string, params?: GetGuideAdminParams) =>
    [...KEYS.all, "detail", id, params] as const,
  steps: (id: string, params?: ListGuideStepsAdminParams) =>
    [...KEYS.all, "steps", id, params] as const,
  categories: (params?: GetCategoryTreeAdminParams) => [...KEYS.all, "categories", params] as const,
};

// ─── Read Hooks ───────────────────────────────────────────────

export function useAdminGuideList(params?: ListGuidesAdminParams) {
  return useQuery<AdminGuideCardDTO[], ErrorModel>({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const res = await listGuidesAdmin(params);
      if (res.status !== 200) throw res.data;
      return res.data.guides ?? [];
    },
  });
}

export function useAdminGuidePaginationMeta(params?: ListGuidesAdminParams) {
  return useQuery<
    { page: number; pageSize: number; totalItems: number; totalPages: number },
    ErrorModel
  >({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const res = await listGuidesAdmin(params);
      if (res.status !== 200) throw res.data;
      return {
        page: res.data.page,
        pageSize: res.data.pageSize,
        totalItems: res.data.totalItems,
        totalPages: res.data.totalPages,
      };
    },
    staleTime: 0,
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

export function useAdminGuideSteps(id: string | undefined, params?: ListGuideStepsAdminParams) {
  return useQuery<AdminGuideStepDTO[], ErrorModel>({
    queryKey: KEYS.steps(id ?? "", params),
    queryFn: async () => {
      if (!id) throw new Error("Guide ID is required");
      const res = await listGuideStepsAdmin(id, params);
      if (res.status !== 200) throw res.data;
      return res.data.steps ?? [];
    },
    enabled: Boolean(id),
  });
}

export function useAdminGuideStepsPaginationMeta(
  id: string | undefined,
  params?: ListGuideStepsAdminParams
) {
  return useQuery<
    { page: number; pageSize: number; totalItems: number; totalPages: number },
    ErrorModel
  >({
    queryKey: KEYS.steps(id ?? "", params),
    queryFn: async () => {
      if (!id) throw new Error("Guide ID is required");
      const res = await listGuideStepsAdmin(id, params);
      if (res.status !== 200) throw res.data;
      return {
        page: res.data.page,
        pageSize: res.data.pageSize,
        totalItems: res.data.totalItems,
        totalPages: res.data.totalPages,
      };
    },
    enabled: Boolean(id),
    staleTime: 0,
  });
}

export function useAdminGuideCategoryTree(params?: GetCategoryTreeAdminParams) {
  return useQuery<AdminCategoryDTO[], ErrorModel>({
    queryKey: KEYS.categories(params),
    queryFn: async () => {
      const res = await getCategoryTreeAdmin(params);
      if (res.status !== 200) throw res.data;
      return res.data.categories ?? [];
    },
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
      await queryClient.invalidateQueries({ queryKey: KEYS.steps(vars.guideId) });
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
      await queryClient.invalidateQueries({ queryKey: KEYS.steps(vars.guideId) });
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
      await queryClient.invalidateQueries({ queryKey: KEYS.steps(vars.guideId) });
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
      await queryClient.invalidateQueries({ queryKey: KEYS.steps(vars.guideId) });
    },
  });
}

// ─── Category Mutations ───────────────────────────────────────

export function useCreateGuideCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, CreateCategoryRequest>({
    mutationFn: async (payload) => {
      const res = await createCategory(payload);
      if (res.status !== 200) throw res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEYS.categories() });
    },
  });
}

export function useUpdateGuideCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, { id: string; patch: UpdateCategoryRequest }>({
    mutationFn: async ({ id, patch }) => {
      const res = await updateCategory(id, patch);
      if (res.status !== 200) throw res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEYS.categories() });
    },
  });
}

export function useDeleteGuideCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, ErrorModel, string>({
    mutationFn: async (id) => {
      const res = await deleteCategory(id);
      if (res.status !== 200) throw res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEYS.categories() });
    },
  });
}
