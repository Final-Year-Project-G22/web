"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminBlockCommunityUser,
  adminGetUserReport,
  adminListUserReports,
  adminUpdateUserReportStatus,
} from "@/lib/api/services/admin-community";
import type {
  AdminListUserReportsParams,
  BlockUserRequest,
  BlockUserResponseBody,
  ErrorModel,
  GetUserReportResponseBody,
  ListUserReportsResponseBody,
  UpdateUserReportStatusRequest,
  UpdateUserReportStatusResponseBody,
} from "@/lib/api/types";
import { REPORTS_QUERY_KEY } from "./query-keys";

export function useAdminListUserReports(params?: AdminListUserReportsParams) {
  return useQuery<ListUserReportsResponseBody, ErrorModel>({
    queryKey: [...REPORTS_QUERY_KEY, "users", params],
    queryFn: async () => {
      const res = await adminListUserReports(params);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useAdminGetUserReport(id: string) {
  return useQuery<GetUserReportResponseBody, ErrorModel>({
    queryKey: [...REPORTS_QUERY_KEY, "users", id],
    queryFn: async () => {
      const res = await adminGetUserReport(id);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useAdminBlockUserInThread() {
  const queryClient = useQueryClient();
  return useMutation<
    BlockUserResponseBody,
    ErrorModel,
    { threadId: string; blockedId: string; reason?: string; reportId: string }
  >({
    mutationFn: async ({ threadId, blockedId, reason }) => {
      const res = await adminBlockCommunityUser(threadId, {
        blockedId,
        reason,
      } as BlockUserRequest);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    },
  });
}

export function useAdminUpdateUserReportStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateUserReportStatusResponseBody,
    ErrorModel,
    { id: string; status: string; adminNote?: string }
  >({
    mutationFn: async ({ id, status, adminNote }) => {
      const res = await adminUpdateUserReportStatus(id, {
        status,
        adminNote,
      } as UpdateUserReportStatusRequest);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    },
  });
}
