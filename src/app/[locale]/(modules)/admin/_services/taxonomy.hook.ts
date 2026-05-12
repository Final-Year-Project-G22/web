import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createSector,
  createTag,
  deleteSector,
  deleteTag,
  listSectors,
  listTags,
  updateSector,
  updateTag,
} from "@/lib/api/services/admin-taxonomy";
import type {
  CreateSectorRequest,
  CreateTagRequest,
  ListSectorsParams,
  ListSectorsResponseBody,
  ListTagsParams,
  ListTagsResponseBody,
  UpdateSectorRequest,
  UpdateTagRequest,
} from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";

export const SECTOR_QUERY_KEY = "admin-sectors";
export const TAG_QUERY_KEY = "admin-tags";

// ─── Sectors ───────────────────────────────────────────────────

export function useSectorList(params?: ListSectorsParams) {
  return useQuery({
    queryKey: [SECTOR_QUERY_KEY, params],
    queryFn: async () => {
      const res = await listSectors(params);
      if (res.status !== 200) throw res.data;
      return res.data as ListSectorsResponseBody;
    },
  });
}

export function useCreateSector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateSectorRequest) => {
      const res = await createSector(body);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Sector created");
      queryClient.invalidateQueries({ queryKey: [SECTOR_QUERY_KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateSector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdateSectorRequest }) => {
      const res = await updateSector(id, patch);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Sector updated");
      queryClient.invalidateQueries({ queryKey: [SECTOR_QUERY_KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteSector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteSector(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Sector deleted");
      queryClient.invalidateQueries({ queryKey: [SECTOR_QUERY_KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ─── Tags ──────────────────────────────────────────────────────

export function useTagList(params?: ListTagsParams) {
  return useQuery({
    queryKey: [TAG_QUERY_KEY, params],
    queryFn: async () => {
      const res = await listTags(params);
      if (res.status !== 200) throw res.data;
      return res.data as ListTagsResponseBody;
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateTagRequest) => {
      const res = await createTag(body);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Tag created");
      queryClient.invalidateQueries({ queryKey: [TAG_QUERY_KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdateTagRequest }) => {
      const res = await updateTag(id, patch);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Tag updated");
      queryClient.invalidateQueries({ queryKey: [TAG_QUERY_KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteTag(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Tag deleted");
      queryClient.invalidateQueries({ queryKey: [TAG_QUERY_KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
