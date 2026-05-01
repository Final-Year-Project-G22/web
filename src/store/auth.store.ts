import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccountDTO, UserDTO } from "@/lib/api/types";

interface AuthState {
  token: string | null;
  user: UserDTO | null;
  account: AccountDTO | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setSession: (token: string, user: UserDTO, account: AccountDTO, expiresAt: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      account: null,
      expiresAt: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setSession: (token, user, account, expiresAt) =>
        set({ token, user, account, expiresAt, isAuthenticated: true }),
      logout: () =>
        set({ token: null, user: null, account: null, expiresAt: null, isAuthenticated: false }),
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
