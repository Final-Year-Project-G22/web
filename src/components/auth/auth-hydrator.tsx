"use client";

import { useEffect } from "react";
import { AuthService } from "@/app/(auth)/auth/_services/auth.service";
import { useAuthStore } from "@/store/auth.store";

export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    // Refresh roles and permissions on mount / hydration
    AuthService.hydrate().catch(() => {
      // Silently fail — the user is still authenticated, guards may just be stale
    });
  }, [hasHydrated, isAuthenticated]);

  return <>{children}</>;
}
