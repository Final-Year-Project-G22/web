import { useMutation } from "@tanstack/react-query";
import type {
  AdminRegisterRequest,
  AdminRegisterResponseBody,
  ErrorModel,
  LoginRequest,
  LoginResponseBody,
} from "@/lib/api/types";
import { AuthService } from "./auth.service";

export function useLogin() {
  return useMutation<LoginResponseBody, ErrorModel, LoginRequest>({
    mutationFn: AuthService.login,
  });
}

export function useAdminRegister(options?: { headers?: Record<string, string> }) {
  return useMutation<AdminRegisterResponseBody, ErrorModel, AdminRegisterRequest>({
    mutationFn: (data) => AuthService.registerAdmin(data, options?.headers),
  });
}

export function useLogout(onLogout?: () => void) {
  return useMutation({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      onLogout?.();
    },
  });
}
