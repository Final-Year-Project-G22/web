import { useMutation } from "@tanstack/react-query";
import type {
  ErrorModel,
  LoginRequest,
  LoginResponseBody,
  RegisterRequest,
  RegisterResponseBody,
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
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (data: RegisterRequest): Promise<RegisterResponseBody> => {
      return authApi.register(data);
    },
    onSuccess: (data) => {
      setSession(data.accessToken, data.user, data.account);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      return authApi.logout();
    },
    onSuccess: () => {
      logout();
    },
  });
}
