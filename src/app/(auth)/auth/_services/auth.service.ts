import {
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  registerAdmin as registerAdminApi,
} from "@/lib/api/services/authentication";
import type { AdminRegisterRequest, LoginRequest, LoginResponseBody } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth.store";

export const AuthService = {
  login: async (credentials: LoginRequest) => {
    const res = await loginApi(credentials);
    if (res.status !== 200) throw res.data;

    const data: LoginResponseBody = res.data;

    // Fetch full profile to get roles and permissions
    const meRes = await getCurrentUser();
    let roles = null;
    let permissions = null;
    if (meRes.status === 200) {
      roles = meRes.data.roles ?? null;
      permissions = meRes.data.permissions ?? null;
    }

    useAuthStore
      .getState()
      .setSession(data.accessToken, data.user, data.account, data.expiresAt, roles, permissions);
    const maxAgeSec = Math.max(
      0,
      Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)
    );
    document.cookie = `access_token=${data.accessToken}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;

    return data;
  },

  logout: async () => {
    const res = await logoutApi();
    const data = res.data;

    useAuthStore.getState().logout();
    document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";

    return data;
  },

  registerAdmin: async (data: AdminRegisterRequest, headers?: Record<string, string>) => {
    const res = await registerAdminApi(data, { headers });
    if (res.status !== 200) throw res.data;

    return res.data;
  },

  /** Fetch current user and update roles/permissions in store */
  hydrate: async () => {
    const res = await getCurrentUser();
    if (res.status === 200) {
      useAuthStore
        .getState()
        .setRolesAndPermissions(res.data.roles ?? null, res.data.permissions ?? null);
      return res.data;
    }
    return null;
  },
};
