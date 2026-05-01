"use client";

import { createContext, useContext, useRef } from "react";
import { createStore, useStore } from "zustand";

interface AuthModeProps {
  mode: "login" | "register" | "forgot";
}

interface AuthModeState extends AuthModeProps {
  setMode: (mode: "login" | "register" | "forgot") => void;
}

type AuthModeStore = ReturnType<typeof createAuthModeStore>;

const createAuthModeStore = (initProps?: Partial<AuthModeProps>) => {
  const DEFAULT_PROPS: AuthModeProps = { mode: "login" };
  return createStore<AuthModeState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setMode: (mode) => set({ mode }),
  }));
};

export const AuthModeContext = createContext<AuthModeStore | null>(null);

export function AuthModeProvider({
  children,
  ...props
}: React.PropsWithChildren<Partial<AuthModeProps>>) {
  const storeRef = useRef<AuthModeStore>(null);
  if (!storeRef.current) {
    storeRef.current = createAuthModeStore(props);
  }
  return <AuthModeContext.Provider value={storeRef.current}>{children}</AuthModeContext.Provider>;
}

export function useAuthMode<T>(selector: (state: AuthModeState) => T): T {
  const store = useContext(AuthModeContext);
  if (!store) throw new Error("Missing AuthModeProvider in tree");
  return useStore(store, selector);
}
