"use client";

import { useAuthStore } from "@/store/auth.store";
import { DebugPanel } from "./_components/debug-panel";

export default function AIAskDebugPage() {
  const permissions = useAuthStore((s) => s.permissions);
  const isAdmin =
    permissions?.some((p) => p.name === "ai.admin.stream" || p.name === "super_admin") ?? false;

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          You do not have permission to access the debug panel.
        </p>
      </div>
    );
  }

  return <DebugPanel />;
}
