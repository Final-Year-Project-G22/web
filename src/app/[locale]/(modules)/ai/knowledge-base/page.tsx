"use client";

import { DlqPanel } from "./_components/dlq-panel";
import { HeaderTools } from "./_components/header-tools";
import { PipelineProgress } from "./_components/pipeline-progress";
import { SidebarDocuments } from "./_components/sidebar-documents";
import { TestRetrievalChat } from "./_components/test-retrieval-chat";

export default function AIKnowledgeBasePage() {
  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
      {/* Header with Global Toggles and Upload Button */}
      <HeaderTools />

      {/* Main Layout */}
      <div className="flex gap-6 flex-1 overflow-hidden pb-4">
        {/* Left Panel: Documents */}
        <SidebarDocuments />

        {/* Right Content */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
          {/* Processing Pipeline */}
          <PipelineProgress />

          {/* Test Retrieval Chat */}
          <TestRetrievalChat />

          {/* Dead Letter Queue */}
          <DlqPanel />
        </div>
      </div>
    </div>
  );
}
