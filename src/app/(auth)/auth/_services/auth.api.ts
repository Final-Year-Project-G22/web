import {
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
} from "@/lib/api/services/authentication";
import type { LoginRequest, RegisterRequest } from "@/lib/api/types";

export const authApi = {
  login: async (data: LoginRequest) => {
    const response = await loginApi(data);
    if (response.status !== 200) {
      throw response.data;
    }
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await registerApi(data);
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
