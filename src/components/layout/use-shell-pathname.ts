"use client";

import { usePathname } from "next/navigation";

/* The proxy serves AM routes under /am, EN under / (as-needed prefix).
   Strip the locale segment so routing lookups are locale-agnostic. */
export function useShellPathname(): string {
  const pathname = usePathname();
  return pathname.replace(/^\/(en|am)(?=\/|$)/, "") || "/";
}
