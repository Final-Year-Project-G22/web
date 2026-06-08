"use client";

import { KeyRound, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RoleDTO } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import { useDeleteRole } from "../../_services/roles.hook";

type RoleListProps = {
  roles: RoleDTO[];
  onEdit: (role: RoleDTO) => void;
};

export function RoleList({ roles, onEdit }: RoleListProps) {
  const canUpdate = hasPermission("iam.role.update");
  const canDelete = hasPermission("iam.role.delete");
  const deleteMutation = useDeleteRole();

  if (roles.length === 0) {
    return (
      <EmptyState icon={KeyRound} title="No roles" description="No roles have been created yet." />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Permissions</TableHead>
          <TableHead className="w-[120px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => {
          const isSystem = role.isSystem || !role.isMutable;
          return (
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{role.code}</TableCell>
              <TableCell>
                <Badge variant={isSystem ? "secondary" : "outline"} className="text-xs capitalize">
                  {isSystem ? "System" : "Custom"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">—</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {!isSystem && canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(role)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {!isSystem && canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete role "${role.name}"? This cannot be undone.`)) {
                          deleteMutation.mutate(role.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {isSystem && <span className="text-xs text-muted-foreground">Read-only</span>}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
