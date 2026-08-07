"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const tabKeys = ["knowledgeBase", "ask", "debug"] as const;

const tabHrefs: Record<(typeof tabKeys)[number], string> = {
  knowledgeBase: "/ai/knowledge-base",
  ask: "/ai/ask",
  debug: "/ai/ask/debug",
};

export default function AILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("surfaces.ai.tabs");

  const isActive = (key: (typeof tabKeys)[number]) => {
    const href = tabHrefs[key];
    if (key === "ask") {
      return (
        pathname === href ||
        (pathname.startsWith("/ai/ask") && !pathname.startsWith("/ai/ask/debug"))
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <nav
        aria-label="AI module"
        className="inline-flex h-8 w-fit items-center rounded-md border border-input bg-panel p-0.5"
      >
        {tabKeys.map((key) => (
          <Link
            key={key}
            href={tabHrefs[key]}
            className={cn(
              "inline-flex h-full items-center rounded-[5px] px-3 text-[13px] font-medium transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              isActive(key)
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(key)}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
