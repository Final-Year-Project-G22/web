"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { CitationDTO } from "@/lib/api/types";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

type ChunkInspectorProps = {
  citation: CitationDTO;
  onClose: () => void;
};

export function ChunkInspector({ citation, onClose }: ChunkInspectorProps) {
  const t = useTranslations("surfaces.ai.ask");
  const language = useAdminLanguageStore((s) => s.language);
  const isAmharic = language === "am";

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          {t("source")}
        </h3>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <span className="text-xs text-muted-foreground">{t("document")}</span>
          <p className="mt-0.5 truncate text-sm font-medium text-ink">
            {citation.title || `Document ${citation.documentId?.slice(0, 8)}...`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {citation.sourceType && (
            <div>
              <span className="text-xs text-muted-foreground">{t("type")}</span>
              <p className="mt-0.5 text-sm text-ink">{citation.sourceType}</p>
            </div>
          )}
          {citation.score !== undefined && (
            <div>
              <span className="text-xs text-muted-foreground">{t("relevance")}</span>
              <p className="mt-0.5 font-mono text-sm tabular-nums text-ink">
                {(citation.score * 100).toFixed(0)}%
              </p>
            </div>
          )}
        </div>

        {citation.excerpt && !isAmharic ? (
          <div>
            <span className="text-xs text-muted-foreground">{t("excerpt")}</span>
            <p className="mt-0.5 line-clamp-6 text-sm leading-relaxed text-muted-foreground">
              {citation.excerpt}
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line pt-3 font-mono text-[11px] text-muted-foreground">
        {t("chunkId")}: {citation.chunkId?.slice(0, 8)}…
      </div>
    </div>
  );
}
