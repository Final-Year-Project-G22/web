"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/ai/knowledge-base", label: "Knowledge Base" },
  { href: "/ai/ask", label: "Ask AI" },
  { href: "/ai/ask/debug", label: "Debug" },
];

export default function AILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-6 mb-6 border-b pb-0">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/ai/ask"
              ? pathname === tab.href ||
                (pathname.startsWith("/ai/ask") && !pathname.startsWith("/ai/ask/debug"))
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "text-sm font-medium border-b-2 pb-3 transition-colors",
                isActive
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
