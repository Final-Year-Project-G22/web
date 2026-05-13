"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CitationDTO } from "@/lib/api/types";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

type ChunkInspectorProps = {
  citation: CitationDTO;
  onClose: () => void;
};

export function ChunkInspector({ citation, onClose }: ChunkInspectorProps) {
  const language = useAdminLanguageStore((s) => s.language);
  const isAmharic = language === "am";

  return (
    <div className="border rounded-xl bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">SOURCE</h3>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-xs text-muted-foreground">Document</span>
          <p className="text-sm font-medium truncate">
            {citation.title || (isAmharic ? "ምንጭ" : `Chunk ${citation.chunkId?.slice(0, 8)}`)}
          </p>
        </div>

        {citation.sourceType && (
          <div>
            <span className="text-xs text-muted-foreground">Type</span>
            <p className="text-sm">{citation.sourceType}</p>
          </div>
        )}

        {citation.score !== undefined && (
          <div>
            <span className="text-xs text-muted-foreground">Relevance</span>
            <p className="text-sm">{(citation.score * 100).toFixed(0)}%</p>
          </div>
        )}

        {citation.excerpt && !isAmharic && (
          <div>
            <span className="text-xs text-muted-foreground">Excerpt</span>
            <p className="text-sm text-muted-foreground line-clamp-6 leading-relaxed">
              {citation.excerpt}
            </p>
          </div>
        )}
      </div>

      <div className="text-[10px] text-muted-foreground pt-2 border-t">
        Chunk ID: {citation.chunkId?.slice(0, 8)}...
      </div>
    </div>
  );
}
