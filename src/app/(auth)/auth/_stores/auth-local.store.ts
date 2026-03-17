import { create } from "zustand";

interface AuthLocalState {
  isLoginMode: boolean;
  toggleMode: () => void;
  setLoginMode: (isLogin: boolean) => void;
}

export const useAuthLocalStore = create<AuthLocalState>((set) => ({
  isLoginMode: true,
  toggleMode: () => set((state) => ({ isLoginMode: !state.isLoginMode })),
  setLoginMode: (isLogin: boolean) => set({ isLoginMode: isLogin }),
}));
