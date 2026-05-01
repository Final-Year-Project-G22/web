"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/store/auth.store";

type Props = { children: React.ReactNode; target: "/auth" | "/dashboard" };

export function ProtectedRoute({ children, target }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (target === "/dashboard" && !isAuthenticated) {
      router.replace("/auth");
    } else if (target === "/auth" && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, hasHydrated, router, target]);

  if (!hasHydrated) return null;

  if ((target === "/dashboard" && !isAuthenticated) || (target === "/auth" && isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
}
