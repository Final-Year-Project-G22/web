"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import type { RoleDTO } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useListRoles } from "../_services/roles.hook";
import { RoleEditorDrawer } from "./_components/role-editor-drawer";
import { RoleList } from "./_components/role-list";

export default function RolesPage() {
  const [editingRole, setEditingRole] = useState<RoleDTO | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const rolesQuery = useListRoles();
  const canCreate = hasPermission("iam.role.create");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Roles</h2>
        {canCreate && (
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Role
          </Button>
        )}
      </div>

      {rolesQuery.isLoading ? (
        <TableSkeleton rows={10} columns={4} />
      ) : rolesQuery.isError ? (
        <div className="text-center py-12 text-destructive">Failed to load roles.</div>
      ) : (
        <RoleList roles={rolesQuery.data ?? []} onEdit={setEditingRole} />
      )}

      {(isCreating || editingRole) && (
        <RoleEditorDrawer
          role={editingRole}
          onClose={() => {
            setIsCreating(false);
            setEditingRole(null);
          }}
        />
      )}
    </div>
  );
}
