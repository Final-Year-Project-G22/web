"use client";

import { HeaderTools } from "./_components/header-tools";
import { SidebarDocuments } from "./_components/sidebar-documents";

export default function AIKnowledgeBasePage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <HeaderTools />
      <SidebarDocuments />
    </div>
  );
}
