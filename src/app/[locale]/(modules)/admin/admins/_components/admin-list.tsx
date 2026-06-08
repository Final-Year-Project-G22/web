"use client";

import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminAccountDTO } from "@/lib/api/types";

type AdminListProps = {
  admins: AdminAccountDTO[];
  onSelect: (admin: AdminAccountDTO) => void;
};

function statusVariant(status: string): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "active":
      return "default";
    case "locked":
      return "destructive";
    case "suspended":
      return "secondary";
    default:
      return "outline";
  }
}

export function AdminList({ admins, onSelect }: AdminListProps) {
  if (admins.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No admin accounts"
        description="No admin accounts match your filters."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Login</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {admins.map((admin) => (
          <TableRow
            key={admin.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onSelect(admin)}
          >
            <TableCell className="font-medium">
              {admin.firstName} {admin.lastName}
            </TableCell>
            <TableCell>{admin.email}</TableCell>
            <TableCell className="text-muted-foreground">{admin.username ?? "—"}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {admin.roles?.map((role) => (
                  <Badge key={role.id} variant="outline" className="text-xs">
                    {role.name}
                  </Badge>
                )) ?? "—"}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(admin.status)} className="capitalize">
                {admin.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : "Never"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
