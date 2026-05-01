"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminBlockCommunityUser,
  adminDeleteReportedPost,
  adminDeleteReportedThread,
  adminGetPostReport,
  adminGetThreadReport,
  adminGetUserReport,
  adminListAllBlockedUsers,
  adminListPostReports,
  adminListThreadReports,
  adminListUserReports,
  adminUnblockCommunityUser,
  adminUpdatePostReportStatus,
  adminUpdateThreadReportStatus,
  adminUpdateUserReportStatus,
} from "@/lib/api/services/admin-community";
import type {
  AdminListAllBlockedUsersParams,
  AdminListPostReportsParams,
  AdminListThreadReportsParams,
  AdminListUserReportsParams,
  BlockUserRequest,
  BlockUserResponseBody,
  DeleteReportedContentResponseBody,
  ErrorModel,
  GetPostReportResponseBody,
  GetThreadReportResponseBody,
  GetUserReportResponseBody,
  ListAllBlockedUsersResponseBody,
  ListPostReportsResponseBody,
  ListThreadReportsResponseBody,
  ListUserReportsResponseBody,
  UpdatePostReportStatusRequest,
  UpdatePostReportStatusResponseBody,
  UpdateThreadReportStatusRequest,
  UpdateThreadReportStatusResponseBody,
  UpdateUserReportStatusRequest,
  UpdateUserReportStatusResponseBody,
} from "@/lib/api/types";

export function getErrorMessage(err: unknown) {
  if (err == null) return "";
  const maybe = err as { title?: string; detail?: string } | undefined;
  if (maybe?.title) return maybe.title;
  if (maybe?.detail) return maybe.detail;
  try {
    return JSON.stringify(err);
  } catch {
    return "Request failed";
  }
}

const BLOCKED_QUERY_KEY = ["admin", "moderation", "blocked-users"];
const REPORTS_QUERY_KEY = ["admin", "moderation", "reports"];

export function useAdminListAllBlockedUsers(params?: AdminListAllBlockedUsersParams) {
  return useQuery<ListAllBlockedUsersResponseBody, ErrorModel>({
    queryKey: [...BLOCKED_QUERY_KEY, params],
    queryFn: async () => {
      const res = await adminListAllBlockedUsers(params);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useAdminUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ErrorModel, { threadId: string; accountId: string }>({
    mutationFn: async ({ threadId, accountId }) => {
      const res = await adminUnblockCommunityUser(threadId, accountId);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BLOCKED_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
    },
  });
}

// Thread Reports
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

// Post Reports
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

// User Reports
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
