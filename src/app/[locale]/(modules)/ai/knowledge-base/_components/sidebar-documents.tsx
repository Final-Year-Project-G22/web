"use client";

import { useQueryClient } from "@tanstack/react-query";
import { FileText, Globe, Search, Trash2, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSectorList, useTagList } from "@/app/[locale]/(modules)/admin/_services/taxonomy.hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { CardSkeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";
import { useAIStatusList, useDeleteDocument, useUploadDocument } from "../_services/ai.hook";
import { PIPELINE_BADGE_VARIANT, PIPELINE_STAGE_LABEL_KEY } from "../_services/pipeline-stages";

export function SidebarDocuments() {
  const t = useTranslations("surfaces.ai.kb");
  const queryClient = useQueryClient();
  const [searchDoc, setSearchDoc] = useState("");
  const { data: documents, isLoading, isError } = useAIStatusList(1, 100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  const { data: sectorsData } = useSectorList();
  const { data: tagsData } = useTagList();

  const sectorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (sectorsData?.data) {
      for (const s of sectorsData.data) map.set(s.id, s.nameEn);
    }
    return map;
  }, [sectorsData]);

  const tagMap = useMemo(() => {
    const map = new Map<string, string>();
    if (tagsData?.data) {
      for (const tg of tagsData.data) map.set(tg.id, tg.nameEn);
    }
    return map;
  }, [tagsData]);

  const filteredDocs =
    documents?.filter((doc) => {
      const name = doc.sourceFilename || doc.documentId;
      return name.toLowerCase().includes(searchDoc.toLowerCase());
    }) || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.promise(uploadDoc.mutateAsync({ file }), {
        loading: t("uploading"),
        success: t("uploadSuccess"),
        error: (err) => t("uploadFailed", { error: getErrorMessage(err) }),
      });
      e.target.value = "";
    }
  };

  const handleDelete = (documentId: string) => {
    toast.promise(deleteDoc.mutateAsync(documentId), {
      loading: t("deleting"),
      success: t("deleteSuccess"),
      error: (err) => t("deleteFailed", { error: getErrorMessage(err) }),
    });
  };

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <h2 className="font-display text-[13.5px] font-semibold text-ink">{t("documents")}</h2>
        <span className="text-[11.5px] text-muted-foreground">
          {t("filesCount", { count: documents?.length ?? 0 })}
        </span>
      </div>

      <div className="shrink-0 space-y-3 px-5 py-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            className="bg-canvas-2 pl-8"
            value={searchDoc}
            onChange={(e) => setSearchDoc(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-line bg-canvas-2 p-4 text-center transition-colors duration-base hover:bg-panel-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="mb-1 h-5 w-5 text-muted-foreground" />
          <p className="text-[13px] font-medium text-ink-2">{t("dropzone")}</p>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />
      </div>

      {/* Queue */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {isLoading && (
          <div className="space-y-2">
            <CardSkeleton lines={2} />
            <CardSkeleton lines={2} />
            <CardSkeleton lines={2} />
          </div>
        )}
        {isError && (
          <InlineError
            error="Failed to load documents"
            onRetry={() => queryClient.invalidateQueries({ queryKey: ["ai", "status"] })}
          />
        )}
        {!isLoading && !isError && filteredDocs.length === 0 && (
          <EmptyState variant="ai" className="py-8" />
        )}
        <div className="grid gap-2">
          {filteredDocs.map((doc) => {
            const stage = doc.currentStage.toLowerCase();
            const variant = PIPELINE_BADGE_VARIANT[stage] ?? "secondary";
            const stageLabelKey = PIPELINE_STAGE_LABEL_KEY[stage];
            const stageLabel = stageLabelKey ? t(stageLabelKey) : doc.currentStage || "Processing";

            const displayName = doc.sourceFilename || `Document ${doc.documentId.slice(0, 8)}`;
            const sectorNames = (doc.sectorIds || [])
              .map((id) => sectorMap.get(id))
              .filter(Boolean) as string[];
            const tagNames = (doc.tagIds || [])
              .map((id) => tagMap.get(id))
              .filter(Boolean) as string[];

            return (
              <div
                key={doc.documentId}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel p-3 transition-colors duration-base hover:bg-panel-2"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="mt-0.5 shrink-0 rounded-md bg-navy-tint p-1.5 text-navy-strong">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-medium text-ink" title={displayName}>
                      {displayName}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {doc.declaredLanguage && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {doc.declaredLanguage === "am" ? "Amharic" : "English"}
                        </span>
                      )}
                      <span className="font-mono tabular-nums">
                        {new Date(doc.startedAt).toLocaleDateString()}
                      </span>
                      {sectorNames.length > 0 && (
                        <span>
                          {sectorNames.length} sector{sectorNames.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {tagNames.length > 0 && (
                        <span>
                          {tagNames.length} tag{tagNames.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={variant} className="font-mono text-[11px]">
                    {stageLabel}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive-strong"
                    onClick={() => handleDelete(doc.documentId)}
                    disabled={deleteDoc.isPending}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
