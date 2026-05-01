"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminDeleteReportedPost,
  adminGetPostReport,
  adminListPostReports,
  adminUpdatePostReportStatus,
} from "@/lib/api/services/admin-community";
import type {
  AdminListPostReportsParams,
  DeleteReportedContentResponseBody,
  ErrorModel,
  GetPostReportResponseBody,
  ListPostReportsResponseBody,
  UpdatePostReportStatusRequest,
  UpdatePostReportStatusResponseBody,
} from "@/lib/api/types";
import { REPORTS_QUERY_KEY } from "./query-keys";

export function useAdminListPostReports(params?: AdminListPostReportsParams) {
  return useQuery<ListPostReportsResponseBody, ErrorModel>({
    queryKey: [...REPORTS_QUERY_KEY, "posts", params],
    queryFn: async () => {
      const res = await adminListPostReports(params);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useAdminGetPostReport(id: string) {
  return useQuery<GetPostReportResponseBody, ErrorModel>({
    queryKey: [...REPORTS_QUERY_KEY, "posts", id],
    queryFn: async () => {
      const res = await adminGetPostReport(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useAdminDeleteReportedPost() {
  const queryClient = useQueryClient();
  return useMutation<DeleteReportedContentResponseBody, ErrorModel, string>({
    mutationFn: async (id) => {
      const res = await adminDeleteReportedPost(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    },
  });
}

export function useAdminUpdatePostReportStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    UpdatePostReportStatusResponseBody,
    ErrorModel,
    { id: string; status: string; adminNote?: string }
  >({
    mutationFn: async ({ id, status, adminNote }) => {
      const res = await adminUpdatePostReportStatus(id, {
        status,
        adminNote,
      } as UpdatePostReportStatusRequest);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    },
  });
}
