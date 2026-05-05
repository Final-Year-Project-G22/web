"use client";

import { Lock, RotateCcw, ShieldAlert, Unlock, UserX, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminAccountDTO, RoleDTO } from "@/lib/api/types";
import { hasPermission } from "@/lib/permissions";
import {
  useResetAdminPassword,
  useUpdateAdminRoles,
  useUpdateAdminStatus,
} from "../../_services/admin-management.hook";

type AdminDetailDrawerProps = {
  admin: AdminAccountDTO;
  roles: RoleDTO[];
  onClose: () => void;
};

export function AdminDetailDrawer({ admin, roles, onClose }: AdminDetailDrawerProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    admin.roles?.map((r) => r.id) ?? []
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const statusMutation = useUpdateAdminStatus();
  const resetMutation = useResetAdminPassword();
  const rolesMutation = useUpdateAdminRoles();

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId];
      rolesMutation.mutate({ accountId: admin.id, roleIds: next });
      return next;
    });
  };

  const canUpdateStatus = hasPermission("iam.admin.status.update");
  const canResetPassword = hasPermission("iam.admin.reset_password");
  const canUpdateRoles = hasPermission("iam.admin.roles.update");

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 bg-black/40 z-40 cursor-default"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Admin Details</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Account Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Account
            </h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span> {admin.firstName}{" "}
                {admin.lastName}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {admin.email}
              </p>
              <p>
                <span className="text-muted-foreground">Username:</span> {admin.username ?? "—"}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    admin.status === "active"
                      ? "default"
                      : admin.status === "locked"
                        ? "destructive"
                        : "secondary"
                  }
                  className="capitalize"
                >
                  {admin.status}
                </Badge>
              </p>
              <p>
                <span className="text-muted-foreground">Last login:</span>{" "}
                {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "Never"}
              </p>
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Roles
            </h4>
            {canUpdateRoles ? (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      disabled={rolesMutation.isPending}
                    />
                    <span className="flex-1">{role.name}</span>
                    {role.isSystem && (
                      <Badge variant="outline" className="text-[10px]">
                        System
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {admin.roles?.map((role) => (
                  <Badge key={role.id} variant="outline">
                    {role.name}
                  </Badge>
                )) ?? "—"}
              </div>
            )}
          </div>

          {/* Status Actions */}
          {canUpdateStatus && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Status Actions
              </h4>
              <div className="flex flex-wrap gap-2">
                {admin.status !== "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      statusMutation.mutate({
                        accountId: admin.id,
                        status: "active",
                      })
                    }
                    disabled={statusMutation.isPending}
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                )}
                {admin.status !== "locked" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      statusMutation.mutate({
                        accountId: admin.id,
                        status: "locked",
                      })
                    }
                    disabled={statusMutation.isPending}
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Lock
                  </Button>
                )}
                {admin.status !== "suspended" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      statusMutation.mutate({
                        accountId: admin.id,
                        status: "suspended",
                      })
                    }
                    disabled={statusMutation.isPending}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Suspend
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Password Reset */}
          {canResetPassword && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Security
              </h4>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowResetConfirm(true)}
                disabled={resetMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Trigger Password Reset
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reset Password Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg border shadow-lg max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              <h4 className="text-lg font-semibold">Confirm Password Reset</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              This will send a password reset link to{" "}
              <span className="font-medium text-foreground">{admin.email}</span>. The link expires
              in 5 minutes.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  resetMutation.mutate(admin.id);
                  setShowResetConfirm(false);
                }}
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? "Sending…" : "Send Reset"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
