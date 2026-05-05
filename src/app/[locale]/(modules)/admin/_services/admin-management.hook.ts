import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listAdmins,
  resetAdminPassword,
  updateAdminStatus,
} from "@/lib/api/services/admin-management";
import { updateAdminRoles } from "@/lib/api/services/authentication";
import type { ListAdminsParams, UpdateAdminStatusRequest } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { ADMIN_QUERY_KEY } from "./query-keys";

export function useListAdmins(params: ListAdminsParams) {
  return useQuery({
    queryKey: [ADMIN_QUERY_KEY, params],
    queryFn: async () => {
      const res = await listAdmins(params);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useUpdateAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, status }: { accountId: string; status: string }) => {
      const res = await updateAdminStatus(accountId, {
        status,
      } as UpdateAdminStatusRequest);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useResetAdminPassword() {
  return useMutation({
    mutationFn: async (accountId: string) => {
      const res = await resetAdminPassword(accountId);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Password reset email sent");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateAdminRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, roleIds }: { accountId: string; roleIds: string[] }) => {
      const res = await updateAdminRoles(accountId, { roleIds });
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Roles updated");
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
