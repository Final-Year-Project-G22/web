import {
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

    useAuthStore.getState().setSession(data.accessToken, data.user, data.account);
    document.cookie = `access_token=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

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
};
