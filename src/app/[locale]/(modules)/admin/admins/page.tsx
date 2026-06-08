"use client";

import { useCallback, useState } from "react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TableSkeleton } from "@/components/ui/skeleton";
import type { AdminAccountDTO } from "@/lib/api/types";
import { useListAdmins } from "../_services/admin-management.hook";
import { useListRoles } from "../_services/roles.hook";
import { AdminDetailDrawer } from "./_components/admin-detail-drawer";
import { AdminFilters } from "./_components/admin-filters";
import { AdminList } from "./_components/admin-list";

export default function AdminListPage() {
  const [filters, setFilters] = useState({ search: "", status: "all", roleId: "all" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAccountDTO | null>(null);

  const adminsQuery = useListAdmins({
    search: filters.search || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    roleId: filters.roleId === "all" ? undefined : filters.roleId,
    page,
    pageSize,
  });

  const rolesQuery = useListRoles();

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const totalPages = adminsQuery.data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Admin Accounts</h2>

      <AdminFilters filters={filters} onChange={handleFilterChange} roles={rolesQuery.data} />

      {adminsQuery.isLoading ? (
        <TableSkeleton rows={10} columns={6} />
      ) : adminsQuery.isError ? (
        <div className="text-center py-12 text-destructive">Failed to load admins.</div>
      ) : (
        <>
          <AdminList admins={adminsQuery.data?.admins ?? []} onSelect={setSelectedAdmin} />
          <PaginationControls
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            isLoading={adminsQuery.isFetching}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </>
      )}

      {selectedAdmin && (
        <AdminDetailDrawer
          admin={selectedAdmin}
          roles={rolesQuery.data ?? []}
          onClose={() => setSelectedAdmin(null)}
        />
      )}
    </div>
  );
}
