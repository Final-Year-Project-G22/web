"use client";

import { useState } from "react";
import { ChatPanel } from "./_components/chat-panel";
import { ConversationSidebar } from "./_components/conversation-sidebar";

export default function AIAskPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      <ConversationSidebar
        activeId={activeSessionId}
        onSelect={setActiveSessionId}
        onNewChat={() => setActiveSessionId(null)}
      />
      <ChatPanel sessionId={activeSessionId} onSessionChange={setActiveSessionId} />
    </div>
  );
}
