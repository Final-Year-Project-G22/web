import { useMutation } from "@tanstack/react-query";
import type {
  AdminRegisterRequest,
  AdminRegisterResponseBody,
  ErrorModel,
  LoginRequest,
  LoginResponseBody,
} from "@/lib/api/types";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "./auth.api";

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<LoginResponseBody, ErrorModel, LoginRequest>({
    mutationFn: async (data: LoginRequest): Promise<LoginResponseBody> => {
      return authApi.login(data);
    },
    onSuccess: (data) => {
      setSession(data.accessToken, data.user, data.account);
      document.cookie = `access_token=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    },
  });
}

export function useAdminRegister(options?: { headers?: Record<string, string> }) {
  return useMutation<AdminRegisterResponseBody, ErrorModel, AdminRegisterRequest>({
    mutationFn: async (data: AdminRegisterRequest) => {
      return authApi.registerAdmin(data, options?.headers);
    },
  });
}

export function useLogout(onLogout?: () => void) {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      return authApi.logout();
    },
    onSuccess: () => {
      logout();
      document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
      onLogout?.();
    },
  });
}
