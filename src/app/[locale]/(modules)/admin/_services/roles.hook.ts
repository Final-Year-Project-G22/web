import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createRole, deleteRole, getRole, listRoles, updateRole } from "@/lib/api/services/roles";
import type { CreateRoleRequest, UpdateRoleRequest } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { ROLE_QUERY_KEY } from "./query-keys";

export function useListRoles() {
  return useQuery({
    queryKey: [ROLE_QUERY_KEY],
    queryFn: async () => {
      const res = await listRoles();
      if (res.status !== 200) throw res.data;
      return res.data.roles ?? [];
    },
  });
}

export function useGetRole(roleId: string | undefined) {
  return useQuery({
    queryKey: [ROLE_QUERY_KEY, roleId],
    queryFn: async () => {
      if (!roleId) return null;
      const res = await getRole(roleId);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    enabled: !!roleId,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoleRequest) => {
      const res = await createRole(data);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Role created");
      queryClient.invalidateQueries({ queryKey: [ROLE_QUERY_KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, data }: { roleId: string; data: UpdateRoleRequest }) => {
      const res = await updateRole(roleId, data);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: [ROLE_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ROLE_QUERY_KEY, variables.roleId],
      });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const res = await deleteRole(roleId);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Role deleted");
      queryClient.invalidateQueries({ queryKey: [ROLE_QUERY_KEY] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
