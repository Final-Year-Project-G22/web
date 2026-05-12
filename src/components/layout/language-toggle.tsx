"use client";

import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

export function LanguageToggle() {
  const language = useAdminLanguageStore((s) => s.language);
  const setLanguage = useAdminLanguageStore((s) => s.setLanguage);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Languages className="w-4 h-4" />
        <span>Language</span>
      </div>
      <div className="flex items-center rounded-md border">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={cn(
            "px-2 py-0.5 text-xs rounded-l-md transition-colors",
            language === "en"
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage("am")}
          className={cn(
            "px-2 py-0.5 text-xs rounded-r-md transition-colors",
            language === "am"
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:bg-accent"
          )}
        >
          AM
        </button>
      </div>
    </div>
  );
}
