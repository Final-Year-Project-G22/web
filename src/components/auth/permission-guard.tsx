"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { hasPermission } from "@/lib/permissions";
import { routePermissionMap } from "@/lib/route-permissions";
import { useAuthStore } from "@/store/auth.store";

export function PermissionGuard({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const sortedPrefixes = useMemo(
    () => Object.keys(routePermissionMap).sort((a, b) => b.length - a.length),
    []
  );

  useEffect(() => {
    if (!hasHydrated) return;

    const pathname = window.location.pathname;

    const match = sortedPrefixes.find((prefix) => pathname.startsWith(prefix));
    const required = match ? routePermissionMap[match] : undefined;

    if (required && !hasPermission(required)) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, router, sortedPrefixes]);

  if (!hasHydrated) return null;

  return <>{children}</>;
}
