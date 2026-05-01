"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListAllBlockedUsers,
  adminUnblockCommunityUser,
} from "@/lib/api/services/admin-community";
import type {
  AdminListAllBlockedUsersParams,
  ErrorModel,
  ListAllBlockedUsersResponseBody,
} from "@/lib/api/types";
import { BLOCKED_QUERY_KEY, REPORTS_QUERY_KEY } from "./query-keys";

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
