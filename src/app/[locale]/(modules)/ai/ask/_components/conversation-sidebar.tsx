"use client";

import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIConversationsList, useArchiveConversation } from "../_services/ask.hook";

type ConversationSidebarProps = {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
};

export function ConversationSidebar({ activeId, onSelect, onNewChat }: ConversationSidebarProps) {
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
    <div className="w-80 flex flex-col gap-2 border rounded-xl bg-card p-4 overflow-hidden shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm tracking-wide text-muted-foreground">CONVERSATIONS</h2>
        <span className="text-xs text-muted-foreground">{conversations?.length || 0}</span>
      </div>

      <Button variant="outline" size="sm" className="w-full gap-2" onClick={onNewChat}>
        <Plus className="w-4 h-4" />
        New Chat
      </Button>

      <div className="flex-1 flex flex-col gap-1 overflow-y-auto min-h-0">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>}
        {!isLoading && (!conversations || conversations.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">No conversations yet.</p>
        )}
        {conversations?.map((conv) => (
          <div
            key={conv.id}
            className={`flex items-start gap-2 p-3 rounded-lg border transition-colors ${
              conv.id === activeId
                ? "bg-muted border-primary/30"
                : "bg-card hover:bg-muted/50 border-transparent"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(conv.id)}
              className="flex items-start gap-2 min-w-0 flex-1 text-left bg-transparent border-none p-0 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{conv.language === "am" ? "Amharic" : "English"}</span>
                  <span>·</span>
                  <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => handleArchive(e, conv.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
