import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { HtmlLang } from "@/components/providers/html-lang";

/**
 * The auth route lives outside the `[locale]` tree (the intl middleware
 * deliberately excludes `/auth`), so it needs its own provider. Requests
 * under `/am/auth` carry the middleware locale header; plain `/auth`
 * resolves to the default locale (en).
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <HtmlLang />
      <ProtectedRoute target="/auth">{children}</ProtectedRoute>
    </NextIntlClientProvider>
  );
}
