"use client";

import { HeaderTools } from "./_components/header-tools";
import { SidebarDocuments } from "./_components/sidebar-documents";
import { TestRetrievalChat } from "./_components/test-retrieval-chat";

export default function AIKnowledgeBasePage() {
  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
      <HeaderTools />

      <div className="flex gap-6 flex-1 overflow-hidden pb-4">
        <SidebarDocuments />

        <div className="flex-1 flex flex-col overflow-y-auto pr-2">
          <TestRetrievalChat />
        </div>
      </div>
    </div>
  );
}
