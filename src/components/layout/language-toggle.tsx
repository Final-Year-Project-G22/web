"use client";

import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const language = useAdminLanguageStore((s) => s.language);
  const setLanguage = useAdminLanguageStore((s) => s.setLanguage);
  const t = useTranslations("sidebar");

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
          onClick={() => setLanguage("en")}
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
          onClick={() => setLanguage("am")}
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
