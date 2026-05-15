"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/lib/api/mutator/custom-fetch";
import {
  getLibraryCreateTemplateUrl,
  getLibraryUpdateTemplateUrl,
  libraryAddCategoryTranslation,
  libraryAdminGetTemplateGroup,
  libraryCreateCategory,
  libraryCreateTemplate,
  libraryCreateTemplateGroup,
  type libraryCreateTemplateResponse,
  libraryCreateTemplateUploadIntent,
  libraryDeleteCategory,
  libraryDeleteCategoryTranslation,
  libraryDeleteTemplate,
  libraryDeleteTemplateGroup,
  libraryGetCategory,
  libraryGetDownloadLogs,
  libraryGetTemplate,
  libraryListAllCategories,
  libraryListAllTemplateGroups,
  libraryListTemplatesByGroup,
  libraryUpdateCategory,
  libraryUpdateCategoryTranslation,
  libraryUpdateTemplateGroup,
  type libraryUpdateTemplateResponse,
} from "@/lib/api/services/admin-library";
import type {
  AddCategoryTranslationRequest,
  CategoryDetailResponse,
  CategorySummaryResponse,
  CreateLibraryCategoryRequest,
  CreateTemplateGroupRequest,
  DownloadLogListResponse,
  ErrorModel,
  LibraryGetDownloadLogsParams,
  LibraryListAllCategoriesParams,
  LibraryListAllTemplateGroupsParams,
  LibraryTemplateDetailResponse,
  LibraryUpdateTemplateBody,
  ListAllTemplateGroupsResponseBody,
  TemplateGroupDetailResponse,
  TemplateGroupSummaryResponse,
  TemplateItem,
  UpdateCategoryTranslationRequest,
  UpdateLibraryCategoryRequest,
  UpdateTemplateGroupRequest,
} from "@/lib/api/types";

const KEYS = {
  categories: ["admin", "library", "categories"] as const,
  templateGroups: ["admin", "library", "template-groups"] as const,
  templates: (groupId: string) =>
    ["admin", "library", "template-groups", groupId, "templates"] as const,
  template: (id: string) => ["admin", "library", "templates", id] as const,
  downloads: ["admin", "library", "downloads"] as const,
};

export function useLibraryCategories(params?: LibraryListAllCategoriesParams) {
  return useQuery<CategorySummaryResponse[], ErrorModel>({
    queryKey: [...KEYS.categories, params],
    queryFn: async () => {
      const res = await libraryListAllCategories(params);
      if (res.status !== 200) throw res.data;
      return res.data ?? [];
    },
  });
}

export function useLibraryCategory(id: string) {
  return useQuery<CategoryDetailResponse, ErrorModel>({
    queryKey: [...KEYS.categories, id],
    queryFn: async () => {
      const res = await libraryGetCategory(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateLibraryCategory() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, ErrorModel, CreateLibraryCategoryRequest>({
    mutationFn: async (payload) => {
      const res = await libraryCreateCategory(payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.categories }),
  });
}

export function useUpdateLibraryCategory() {
  const queryClient = useQueryClient();
  return useMutation<
    CategoryDetailResponse,
    ErrorModel,
    { id: string; payload: UpdateLibraryCategoryRequest }
  >({
    mutationFn: async ({ id, payload }) => {
      const res = await libraryUpdateCategory(id, payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.categories }),
  });
}

export function useDeleteLibraryCategory() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ErrorModel, string>({
    mutationFn: async (id) => {
      const res = await libraryDeleteCategory(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.categories }),
  });
}

export function useAddCategoryTranslation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ErrorModel, { id: string; payload: AddCategoryTranslationRequest }>({
    mutationFn: async ({ id, payload }) => {
      const res = await libraryAddCategoryTranslation(id, payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.categories }),
  });
}

export function useUpdateCategoryTranslation() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    ErrorModel,
    { id: string; lang: string; payload: UpdateCategoryTranslationRequest }
  >({
    mutationFn: async ({ id, lang, payload }) => {
      const res = await libraryUpdateCategoryTranslation(id, lang, payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.categories }),
  });
}

export function useDeleteCategoryTranslation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ErrorModel, { id: string; lang: string }>({
    mutationFn: async ({ id, lang }) => {
      const res = await libraryDeleteCategoryTranslation(id, lang);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.categories }),
  });
}

export function useTemplateGroups(params?: LibraryListAllTemplateGroupsParams) {
  return useQuery<ListAllTemplateGroupsResponseBody, ErrorModel>({
    queryKey: [...KEYS.templateGroups, params],
    queryFn: async () => {
      const res = await libraryListAllTemplateGroups(params);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useTemplateGroup(groupId: string) {
  return useQuery<TemplateGroupDetailResponse, ErrorModel>({
    queryKey: [...KEYS.templateGroups, groupId],
    queryFn: async () => {
      const res = await libraryAdminGetTemplateGroup(groupId);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    enabled: !!groupId,
  });
}

export function useCreateTemplateGroup() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, ErrorModel, CreateTemplateGroupRequest>({
    mutationFn: async (payload) => {
      const res = await libraryCreateTemplateGroup(payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.templateGroups }),
  });
}

export function useUpdateTemplateGroup() {
  const queryClient = useQueryClient();
  return useMutation<
    TemplateGroupDetailResponse,
    ErrorModel,
    { id: string; payload: UpdateTemplateGroupRequest }
  >({
    mutationFn: async ({ id, payload }) => {
      const res = await libraryUpdateTemplateGroup(id, payload);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.templateGroups }),
  });
}

export function useDeleteTemplateGroup() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ErrorModel, string>({
    mutationFn: async (id) => {
      const res = await libraryDeleteTemplateGroup(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.templateGroups }),
  });
}

export function useTemplatesByGroup(groupId: string) {
  return useQuery<TemplateItem[], ErrorModel>({
    queryKey: KEYS.templates(groupId),
    queryFn: async () => {
      const res = await libraryListTemplatesByGroup(groupId);
      if (res.status !== 200) throw res.data;
      return res.data ?? [];
    },
    enabled: !!groupId,
  });
}

export function useTemplate(templateId: string) {
  return useQuery<LibraryTemplateDetailResponse, ErrorModel>({
    queryKey: KEYS.template(templateId),
    queryFn: async () => {
      const res = await libraryGetTemplate(templateId);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    enabled: !!templateId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation<
    { id: string },
    ErrorModel,
    { groupId: string; body: { file: File; title: string; language: string; description?: string } }
  >({
    mutationFn: async ({ groupId, body }) => {
      // 1. Get upload intent
      const intentRes = await libraryCreateTemplateUploadIntent(groupId, {
        language: body.language,
        title: body.title,
        description: body.description || "",
        fileName: body.file.name,
        contentType: body.file.type || "application/octet-stream",
        fileSize: body.file.size,
      });
      if (intentRes.status !== 200) throw intentRes.data;
      const intent = intentRes.data;

      // 2. Upload file directly to SeaweedFS
      const uploadRes = await fetch(intent.uploadUrl, {
        method: intent.method,
        body: body.file,
        headers: {
          "Content-Type": body.file.type || "application/octet-stream",
          ...((intent.headers as Record<string, string>) || {}),
        },
      });
      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to storage provider");
      }

      // 3. Create template record
      const res = await libraryCreateTemplate(groupId, {
        fileKey: intent.fileKey,
        language: body.language,
        title: body.title,
        description: body.description || "",
        fileSize: body.file.size,
        contentType: body.file.type || "application/octet-stream",
      });
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: KEYS.templates(variables.groupId),
      });
      queryClient.invalidateQueries({ queryKey: KEYS.templateGroups });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation<
    LibraryTemplateDetailResponse,
    ErrorModel,
    { templateId: string; body: LibraryUpdateTemplateBody }
  >({
    mutationFn: async ({ templateId, body }) => {
      const formData = new FormData();
      if ((body.file as Blob).size > 0) {
        formData.append("file", body.file);
      }
      formData.append("title", body.title as string);
      if (body.description) {
        formData.append("description", body.description as string);
      }
      formData.append("isActive", body.isActive as string);

      const res = await customFetch<libraryUpdateTemplateResponse>(
        getLibraryUpdateTemplateUrl(templateId),
        { method: "PATCH", body: formData }
      );
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: KEYS.templates(data.groupId),
      });
      queryClient.invalidateQueries({ queryKey: KEYS.template(data.id) });
      queryClient.invalidateQueries({ queryKey: KEYS.templateGroups });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ErrorModel, { templateId: string; groupId: string }>({
    mutationFn: async ({ templateId }) => {
      const res = await libraryDeleteTemplate(templateId);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: KEYS.templates(variables.groupId),
      });
    },
  });
}

export function useDownloadLogs(params?: LibraryGetDownloadLogsParams) {
  return useQuery<DownloadLogListResponse, ErrorModel>({
    queryKey: [...KEYS.downloads, params],
    queryFn: async () => {
      const res = await libraryGetDownloadLogs(params);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}
