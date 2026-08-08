"use client";

import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAIConversationsList, useArchiveConversation } from "../_services/ask.hook";

type ConversationSidebarProps = {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
};

export function ConversationSidebar({ activeId, onSelect, onNewChat }: ConversationSidebarProps) {
  const t = useTranslations("surfaces.ai.ask");
  const { data: conversations, isLoading } = useAIConversationsList();
  const archiveConv = useArchiveConversation();

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    archiveConv.mutate(id);
    if (activeId === id) {
      onNewChat();
    }
  };

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-card lg:w-72 lg:self-stretch">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3.5">
        <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          {t("conversations")}
        </h2>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {String(conversations?.length ?? 0).padStart(2, "0")}
        </span>
      </div>

      <div className="shrink-0 px-3 pt-3">
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={onNewChat}>
          <Plus className="h-3.5 w-3.5" />
          {t("newChat")}
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {isLoading && <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (!conversations || conversations.length === 0) && (
          <p className="py-4 text-center text-sm text-muted-foreground">{t("noConversations")}</p>
        )}
        {conversations?.map((conv) => {
          const isActive = conv.id === activeId;
          return (
            <div
              key={conv.id}
              className={`group flex items-start gap-2 rounded-lg border px-2.5 py-2 transition-colors duration-base ${
                isActive
                  ? "border-transparent bg-navy text-primary-foreground"
                  : "border-transparent hover:bg-panel-2"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(conv.id)}
                className="flex min-w-0 flex-1 items-start gap-2 border-none bg-transparent p-0 text-left"
              >
                <MessageSquare
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{conv.title}</p>
                  <div
                    className={`mt-0.5 flex items-center gap-2 text-[11px] ${
                      isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    <span>{conv.language === "am" ? "አማርኛ" : "English"}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
              <Button
                size="icon"
                variant="ghost"
                className={`h-6 w-6 shrink-0 ${
                  isActive
                    ? "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    : "text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-destructive-strong"
                }`}
                onClick={(e) => handleArchive(e, conv.id)}
                aria-label={t("archive")}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
