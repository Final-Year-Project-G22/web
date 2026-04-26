import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccountDTO, UserDTO } from "@/lib/api/types";

interface AuthState {
  token: string | null;
  user: UserDTO | null;
  account: AccountDTO | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setSession: (token: string, user: UserDTO, account: AccountDTO) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      account: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setSession: (token, user, account) => set({ token, user, account, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, account: null, isAuthenticated: false }),
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
