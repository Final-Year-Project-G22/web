"use client";

import { DlqPanel } from "./_components/dlq-panel";
import { HeaderTools } from "./_components/header-tools";
import { PipelineProgress } from "./_components/pipeline-progress";
import { SidebarDocuments } from "./_components/sidebar-documents";

export default function AIKnowledgeBasePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <HeaderTools />

      <PipelineProgress />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <SidebarDocuments />
        <DlqPanel />
      </div>
    </div>
  );
}
