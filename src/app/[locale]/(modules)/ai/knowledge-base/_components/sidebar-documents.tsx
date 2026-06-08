"use client";

import { FileText, Globe, Search, Trash2, UploadCloud } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSectorList, useTagList } from "@/app/[locale]/(modules)/admin/_services/taxonomy.hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CardSkeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";
import { useAIStatusList, useDeleteDocument, useUploadDocument } from "../_services/ai.hook";
import { DlqPanel } from "./dlq-panel";

const STAGE_META: Record<
  string,
  {
    label: string;
    variant: "default" | "destructive" | "secondary";
    className: string;
  }
> = {
  queued: {
    label: "Queued",
    variant: "secondary",
    className: "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent shadow-none",
  },
  validating: {
    label: "Validating",
    variant: "secondary",
    className: "bg-info/10 text-info hover:bg-info/10 border-transparent shadow-none",
  },
  fetching: {
    label: "Fetching",
    variant: "secondary",
    className: "bg-info/10 text-info hover:bg-info/10 border-transparent shadow-none",
  },
  chunking: {
    label: "Chunking",
    variant: "secondary",
    className: "bg-warning/10 text-warning hover:bg-warning/10 border-transparent shadow-none",
  },
  embedding: {
    label: "Embedding",
    variant: "secondary",
    className: "bg-warning/10 text-warning hover:bg-warning/10 border-transparent shadow-none",
  },
  indexing: {
    label: "Indexing",
    variant: "secondary",
    className: "bg-warning/10 text-warning hover:bg-warning/10 border-transparent shadow-none",
  },
  completed: {
    label: "Live",
    variant: "default",
    className: "bg-success/10 text-success hover:bg-success/10 border-transparent shadow-none",
  },
  failed: { label: "Failed", variant: "destructive", className: "" },
};

export function SidebarDocuments() {
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
      for (const t of tagsData.data) map.set(t.id, t.nameEn);
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
        loading: "Uploading document...",
        success: "Document uploaded successfully!",
        error: (err) => `Failed to upload: ${getErrorMessage(err)}`,
      });
      e.target.value = "";
    }
  };

  const handleDelete = (documentId: string) => {
    toast.promise(deleteDoc.mutateAsync(documentId), {
      loading: "Deleting document...",
      success: "Document deleted",
      error: (err) => `Failed to delete: ${getErrorMessage(err)}`,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm tracking-wide text-muted-foreground">DOCUMENTS</h2>
        <span className="text-xs text-muted-foreground">{documents?.length || 0} Files</span>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search files..."
          className="pl-8 bg-muted/50"
          value={searchDoc}
          onChange={(e) => setSearchDoc(e.target.value)}
        />
      </div>

      {/* Dropzone */}
      <button
        type="button"
        className="w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="h-6 w-6 text-muted-foreground mb-1" />
        <p className="text-sm font-medium">Drop new PDF/DOCX here</p>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
      />

      {/* Document list */}
      <div className="grid gap-2">
        {isLoading && (
          <div className="space-y-2">
            <CardSkeleton lines={2} />
            <CardSkeleton lines={2} />
            <CardSkeleton lines={2} />
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive text-center py-4">Failed to load documents</p>
        )}
        {!isLoading && !isError && filteredDocs.length === 0 && (
          <EmptyState variant="ai" className="py-8" />
        )}
        {filteredDocs.map((doc) => {
          const stage = doc.currentStage.toLowerCase();
          const meta = STAGE_META[stage] ?? {
            label: doc.currentStage || "Processing",
            variant: "secondary" as const,
            className: "",
          };

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
              className={`flex items-center justify-between p-3 rounded-lg border bg-card transition-colors ${meta.variant === "destructive" ? "border-red-200" : "hover:bg-muted/50"}`}
            >
              <div className="flex items-start gap-3 overflow-hidden flex-1 min-w-0">
                <div className="mt-0.5 bg-red-100 p-1.5 rounded text-red-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col overflow-hidden min-w-0 gap-1">
                  <span className="text-sm font-medium truncate" title={displayName}>
                    {displayName}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.declaredLanguage && (
                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        {doc.declaredLanguage === "am" ? "Amharic" : "English"}
                      </span>
                    )}
                    {sectorNames.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {sectorNames.length} sector
                        {sectorNames.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {tagNames.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {tagNames.length} tag{tagNames.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(doc.startedAt).toLocaleDateString()}</span>
                    {sectorNames.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {sectorNames.map((name) => (
                          <span
                            key={name}
                            className="inline-block px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <Badge variant={meta.variant} className={meta.className}>
                  {meta.label}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.documentId);
                  }}
                  disabled={deleteDoc.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* DLQ */}
      <DlqPanel />
    </div>
  );
}
