"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCreateCommunityCategory,
  adminDeleteCommunityCategory,
  adminListCommunityCategories,
  adminUpdateCommunityCategory,
} from "@/lib/api/services/admin-community";
import type {
  CategoryDTO,
  CreateCommunityCategoryRequest,
  CreateCommunityCategoryResponseBody,
  ErrorModel,
  UpdateCommunityCategoryRequest,
  UpdateCommunityCategoryResponseBody,
} from "@/lib/api/types";

const QUERY_KEY = ["admin", "community", "categories"];

export function useAdminListCategories(includeInactive = true) {
  return useQuery<CategoryDTO[], ErrorModel>({
    queryKey: [...QUERY_KEY, { includeInactive }],
    queryFn: async () => {
      const res = await adminListCommunityCategories({
        page: 1,
        pageSize: 200,
        includeInactive,
      });
      if (res.status !== 200) throw res.data;
      return Array.isArray(res.data.categories) ? res.data.categories : [];
    },
  });
}

export function useAdminParentCategories() {
  return useQuery<CategoryDTO[], ErrorModel>({
    queryKey: [...QUERY_KEY, "parents"],
    queryFn: async () => {
      const res = await adminListCommunityCategories({
        page: 1,
        pageSize: 200,
        includeInactive: false,
      });
      if (res.status !== 200) throw res.data;
      return Array.isArray(res.data.categories) ? res.data.categories : [];
    },
  });
}

export function useAdminCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<
    CreateCommunityCategoryResponseBody,
    ErrorModel,
    CreateCommunityCategoryRequest
  >({
    mutationFn: async (payload) => {
      const res = await adminCreateCommunityCategory(payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useAdminUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateCommunityCategoryResponseBody,
    ErrorModel,
    { id: string; patch: UpdateCommunityCategoryRequest }
  >({
    mutationFn: async ({ id, patch }) => {
      const res = await adminUpdateCommunityCategory(id, patch);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useAdminDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ErrorModel, string>({
    mutationFn: async (id) => {
      const res = await adminDeleteCommunityCategory(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
