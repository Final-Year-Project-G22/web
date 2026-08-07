import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { APP_NAME, APP_VERSION } from "@/lib/constants";
import { AuthCard } from "./_components/auth-card";

/**
 * Auth — the brand moment (§6): centered panel on the plain canvas, the tibeb
 * band above, no gradient, no orbs. The only ornament is the woven rule.
 */
export default async function AuthPage() {
  const t = await getTranslations("auth");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <div className="tibeb absolute inset-x-0 top-0" aria-hidden="true" />

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="rounded-lg border border-border bg-panel p-2 shadow-card">
            <Image src="/logo.svg" alt={APP_NAME} width={40} height={40} className="rounded-md" />
          </div>
          <div className="space-y-0.5">
            <h1 className="font-display text-lg font-semibold tracking-tight">{APP_NAME}</h1>
            <p className="text-xs text-muted-foreground">{t("tagline")}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-panel p-6 shadow-card">
          <AuthCard />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("footer", { app: APP_NAME, version: APP_VERSION })}
        </p>
      </div>
    </div>
  );
}
