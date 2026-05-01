"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminDeleteReportedThread,
  adminGetThreadReport,
  adminListThreadReports,
  adminUpdateThreadReportStatus,
} from "@/lib/api/services/admin-community";
import type {
  AdminListThreadReportsParams,
  DeleteReportedContentResponseBody,
  ErrorModel,
  GetThreadReportResponseBody,
  ListThreadReportsResponseBody,
  UpdateThreadReportStatusRequest,
  UpdateThreadReportStatusResponseBody,
} from "@/lib/api/types";
import { REPORTS_QUERY_KEY } from "./query-keys";

export function useAdminListThreadReports(params?: AdminListThreadReportsParams) {
  return useQuery<ListThreadReportsResponseBody, ErrorModel>({
    queryKey: [...REPORTS_QUERY_KEY, "threads", params],
    queryFn: async () => {
      const res = await adminListThreadReports(params);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useAdminGetThreadReport(id: string) {
  return useQuery<GetThreadReportResponseBody, ErrorModel>({
    queryKey: [...REPORTS_QUERY_KEY, "threads", id],
    queryFn: async () => {
      const res = await adminGetThreadReport(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useAdminDeleteReportedThread() {
  const queryClient = useQueryClient();
  return useMutation<DeleteReportedContentResponseBody, ErrorModel, string>({
    mutationFn: async (id) => {
      const res = await adminDeleteReportedThread(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    },
  });
}

export function useAdminUpdateThreadReportStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateThreadReportStatusResponseBody,
    ErrorModel,
    { id: string; status: string; adminNote?: string }
  >({
    mutationFn: async ({ id, status, adminNote }) => {
      const res = await adminUpdateThreadReportStatus(id, {
        status,
        adminNote,
      } as UpdateThreadReportStatusRequest);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    },
  });
}
