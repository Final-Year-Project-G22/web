import { useAuthStore } from "@/store/auth.store";

/**
 * Check if the current user has a specific permission by code.
 * Also returns true if the user has the "super_admin" role.
 */
export function hasPermission(permissionCode: string): boolean {
  const state = useAuthStore.getState();
  const roles = state.roles;
  const permissions = state.permissions;

  // Super admin bypass
  if (roles?.some((r) => r.code === "super_admin")) return true;

  return permissions?.some((p) => p.code === permissionCode) ?? false;
}

/**
 * Check if the current user has any of the given permission codes.
 */
export function hasAnyPermission(...codes: string[]): boolean {
  return codes.some((c) => hasPermission(c));
}

/**
 * Check if the current user has all of the given permission codes.
 */
export function hasAllPermissions(...codes: string[]): boolean {
  return codes.every((c) => hasPermission(c));
}
