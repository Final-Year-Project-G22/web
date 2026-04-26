import {
  login as loginApi,
  logout as logoutApi,
  registerAdmin as registerAdminApi,
} from "@/lib/api/services/authentication";
import type {
  AdminRegisterRequest,
  AdminRegisterResponseBody,
  LoginRequest,
} from "@/lib/api/types";

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await loginApi(data);
    if (response.status !== 200) {
      throw response.data;
    }
    return response.data;
  },

  registerAdmin: async (
    data: AdminRegisterRequest,
    headers?: Record<string, string>
  ): Promise<AdminRegisterResponseBody> => {
    const response = await registerAdminApi(data, { headers });
    if (response.status !== 200) {
      throw response.data;
    }
    return response.data;
  },

  logout: async () => {
    const response = await logoutApi();
    return response;
  },
};
