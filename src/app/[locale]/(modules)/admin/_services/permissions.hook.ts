import { useQuery } from "@tanstack/react-query";
import { listPermissions } from "@/lib/api/services/permissions";
import { PERMISSION_QUERY_KEY } from "./query-keys";

export function useListPermissions() {
  return useQuery({
    queryKey: [PERMISSION_QUERY_KEY],
    queryFn: async () => {
      const res = await listPermissions();
      if (res.status !== 200) throw res.data;
      return res.data.permissions ?? [];
    },
  });
}
