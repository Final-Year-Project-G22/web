"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/**
 * The root layout renders a static `<html lang="en">` (Next.js requires
 * <html> in the root layout only). This syncs the document lang to the
 * active next-intl locale so the Amharic metrics rule
 * (`html[lang="am"] body` in globals.css, locked §10.2) takes effect:
 * fidel body text renders +1px size, +0.1 line-height.
 */
export function HtmlLang() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
