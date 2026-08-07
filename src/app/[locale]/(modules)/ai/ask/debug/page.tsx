"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth.store";
import { DebugPanel } from "./_components/debug-panel";

export default function AIAskDebugPage() {
  const t = useTranslations("surfaces.ai.debug");
  const permissions = useAuthStore((s) => s.permissions);
  const isAdmin =
    permissions?.some((p) => p.name === "ai.admin.stream" || p.name === "super_admin") ?? false;

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">{t("noPermission")}</p>
      </div>
    );
  }

  return <DebugPanel />;
}
