"use client";

import { Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const language = useAdminLanguageStore((s) => s.language);
  const setLanguage = useAdminLanguageStore((s) => s.setLanguage);
  const t = useTranslations("sidebar");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  /** Switch the real UI locale by navigating to the same page in the target
   *  locale. The proxy serves AM under /am (as-needed prefix); EN is the
   *  default and carries no prefix. The content-language store follows along
   *  so API requests (lang header) and the guide editor stay in the same
   *  language as the UI. */
  const switchLocale = (next: "en" | "am") => {
    setLanguage(next);
    if (next === locale) return;

    const segments = pathname.split("/");
    if (segments[1] === "am" || segments[1] === "en") {
      segments[1] = next; // swap the existing prefix
    } else if (next === "am") {
      segments.splice(1, 0, "am"); // EN has no prefix — add one
    }
    const nextPath = segments.join("/") || "/";
    if (nextPath !== pathname) router.replace(nextPath);
  };

  return (
    <div className={cn("flex items-center gap-2", compact && "justify-center")}>
      {!compact && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Languages className="size-4" />
          <span>{t("footer.language")}</span>
        </div>
      )}
      <fieldset className="flex items-center rounded-md border border-line">
        <legend className="sr-only">{t("footer.language")}</legend>
        <button
          type="button"
          onClick={() => switchLocale("en")}
          className={cn(
            "rounded-l-md px-2.5 py-0.5 text-xs transition-colors duration-fast",
            compact && "px-1.5 text-[10px]",
            language === "en"
              ? "bg-primary font-semibold text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => switchLocale("am")}
          className={cn(
            "rounded-r-md px-2.5 py-0.5 text-xs transition-colors duration-fast",
            compact && "px-1.5 text-[10px]",
            language === "am"
              ? "bg-primary font-semibold text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          አማ
        </button>
      </fieldset>
    </div>
  );
}
