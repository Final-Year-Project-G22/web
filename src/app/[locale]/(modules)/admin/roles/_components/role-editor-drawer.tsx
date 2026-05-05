"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PermissionDTO, RoleDTO } from "@/lib/api/types";
import { useListPermissions } from "../../_services/permissions.hook";
import { useCreateRole, useGetRole, useUpdateRole } from "../../_services/roles.hook";

type RoleEditorDrawerProps = {
  role: RoleDTO | null;
  onClose: () => void;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function RoleEditorDrawer({ role, onClose }: RoleEditorDrawerProps) {
  const isEditing = !!role;

  const [name, setName] = useState(role?.name ?? "");
  const [code, setCode] = useState(role?.code ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [codeEdited, setCodeEdited] = useState(false);

  const roleDetailQuery = useGetRole(role?.id);
  const permissionsQuery = useListPermissions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  useEffect(() => {
    if (roleDetailQuery.data?.permissions) {
      setSelectedPermissionIds(roleDetailQuery.data.permissions.map((p) => p.id));
    }
  }, [roleDetailQuery.data]);

  useEffect(() => {
    if (!codeEdited && !isEditing) {
      setCode(slugify(name));
    }
  }, [name, codeEdited, isEditing]);

  const groupedPermissions = useMemo(() => {
    const perms = permissionsQuery.data ?? [];
    const filtered = permissionSearch
      ? perms.filter(
          (p) =>
            p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
            p.code.toLowerCase().includes(permissionSearch.toLowerCase()) ||
            p.module.toLowerCase().includes(permissionSearch.toLowerCase())
        )
      : perms;
    const groups: Record<string, PermissionDTO[]> = {};
    for (const p of filtered) {
      if (!groups[p.module]) groups[p.module] = [];
      groups[p.module].push(p);
    }
    return groups;
  }, [permissionsQuery.data, permissionSearch]);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = () => {
    if (!name || !code) return;
    if (isEditing && role) {
      updateMutation.mutate(
        {
          roleId: role.id,
          data: {
            name: name || undefined,
            description: description || undefined,
            permissionIds: selectedPermissionIds.length > 0 ? selectedPermissionIds : null,
          },
        },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(
        {
          name,
          code,
          description: description || undefined,
          permissionIds: selectedPermissionIds.length > 0 ? selectedPermissionIds : null,
        },
        { onSuccess: onClose }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 bg-black/40 z-40 cursor-default"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{isEditing ? "Edit Role" : "Create Role"}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Content Moderator"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role-code">Code</Label>
              <Input
                id="role-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeEdited(true);
                }}
                placeholder="e.g. content_moderator"
                disabled={isEditing}
              />
              {!isEditing && (
                <p className="text-xs text-muted-foreground">
                  Auto-generated from name. You can edit it.
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <span className="text-xs text-muted-foreground">
                {selectedPermissionIds.length} selected
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions…"
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {permissionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading permissions…</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto border rounded-lg p-3">
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <div key={module} className="space-y-2">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {module}
                    </h5>
                    <div className="space-y-1">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-start gap-2 cursor-pointer text-sm p-1.5 rounded hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissionIds.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <span className="font-medium">{perm.name}</span>
                            {perm.description && (
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(groupedPermissions).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No permissions match your search.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name || !code || isPending}>
            {isPending ? "Saving…" : isEditing ? "Update Role" : "Create Role"}
          </Button>
        </div>
      </div>
    </>
  );
}
