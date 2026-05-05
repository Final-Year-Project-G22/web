import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccountDTO, PermissionDTO, RoleDTO, UserDTO } from "@/lib/api/types";

interface AuthState {
  token: string | null;
  user: UserDTO | null;
  account: AccountDTO | null;
  roles: RoleDTO[] | null;
  permissions: PermissionDTO[] | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setSession: (
    token: string,
    user: UserDTO,
    account: AccountDTO,
    expiresAt: string,
    roles?: RoleDTO[] | null,
    permissions?: PermissionDTO[] | null
  ) => void;
  setRolesAndPermissions: (roles: RoleDTO[] | null, permissions: PermissionDTO[] | null) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      account: null,
      roles: null,
      permissions: null,
      expiresAt: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setSession: (token, user, account, expiresAt, roles, permissions) =>
        set({ token, user, account, expiresAt, roles, permissions, isAuthenticated: true }),
      setRolesAndPermissions: (roles, permissions) => set({ roles, permissions }),
      logout: () =>
        set({
          token: null,
          user: null,
          account: null,
          roles: null,
          permissions: null,
          expiresAt: null,
          isAuthenticated: false,
        }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
