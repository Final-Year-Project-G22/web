import Link from "next/link";

export default function AILayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-6 mb-6 border-b pb-3">
        <Link
          href="/ai/knowledge-base"
          className="text-sm font-medium text-foreground border-b-2 border-primary pb-3"
        >
          Knowledge Base
        </Link>
        <Link href="/ai/ask" className="text-sm font-medium text-muted-foreground">
          Ask AI
        </Link>
        <Link href="/ai/ask/debug" className="text-sm font-medium text-muted-foreground">
          Debug
        </Link>
      </div>
      {children}
    </div>
  );
}
