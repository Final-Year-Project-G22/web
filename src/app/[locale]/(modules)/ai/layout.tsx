"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAsk = pathname.includes("/ask");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-6 mb-6 border-b pb-3">
        <Link
          href="/ai/knowledge-base"
          className={`text-sm font-medium transition-colors ${
            isAsk
              ? "text-muted-foreground hover:text-foreground"
              : "text-foreground border-b-2 border-primary pb-3 mb-[-13px]"
          }`}
        >
          Knowledge Base
        </Link>
        <Link
          href="/ai/ask"
          className={`text-sm font-medium transition-colors ${
            isAsk
              ? "text-foreground border-b-2 border-primary pb-3 mb-[-13px]"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Ask AI
        </Link>
      </div>
      {children}
    </div>
  );
}
