"use client";

import { FileText, Search, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/utils";
import { useAIStatusList, useUploadDocument } from "../_services/ai.hook";

export function SidebarDocuments() {
  const [searchDoc, setSearchDoc] = useState("");
  const { data: documents, isLoading, isError } = useAIStatusList(1, 100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDoc = useUploadDocument();

  const filteredDocs =
    documents?.filter((doc) => doc.documentId.toLowerCase().includes(searchDoc.toLowerCase())) ||
    [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.promise(uploadDoc.mutateAsync(file), {
        loading: "Uploading document...",
        success: "Document uploaded successfully!",
        error: (err) => `Failed to upload: ${getErrorMessage(err)}`,
      });
      e.target.value = "";
    }
  };

  return (
    <div className="w-80 flex flex-col gap-4 border rounded-xl bg-card p-4 overflow-y-auto hidden md:flex">
      <div className="flex items-center justify-between mb-2">
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
        className="w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Drop new PDF/DOCX here</p>
      </button>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
      />

      {/* Document List */}
      <div className="flex flex-col gap-2 mt-2">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>}
        {isError && (
          <p className="text-sm text-destructive text-center py-4">Failed to load documents</p>
        )}
        {!isLoading && !isError && filteredDocs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No documents found.</p>
        )}
        {filteredDocs.map((doc) => {
          // Parse status visually based on currentStage and isTerminal
          let displayStatus = "Processing";
          let badgeVariant: "default" | "destructive" | "secondary" = "secondary";
          let extraClassName = "";

          if (doc.isTerminal) {
            if (doc.currentStage === "FAILED") {
              displayStatus = "Failed";
              badgeVariant = "destructive";
            } else {
              displayStatus = "Live";
              badgeVariant = "default";
              extraClassName =
                "bg-green-100 text-green-800 hover:bg-green-100/80 border-transparent shadow-none";
            }
          } else {
            // Usually Extraction, Chunking, Vectorization stages mappings
            if (doc.currentStage === "CHUNKING") {
              displayStatus = "Chunking";
              badgeVariant = "destructive";
              extraClassName =
                "bg-orange-100 text-orange-800 hover:bg-orange-100/80 border-transparent shadow-none";
            } else {
              displayStatus = doc.currentStage || "Uploaded";
            }
          }

          return (
            <div
              key={doc.documentId}
              className={`flex items-center justify-between p-3 rounded-lg border bg-card transition-colors ${badgeVariant === "destructive" ? "border-red-200" : "hover:bg-muted/50"} cursor-pointer`}
            >
              <div className="flex items-start gap-3 overflow-hidden">
                <div className="mt-0.5 bg-red-100 p-1.5 rounded text-red-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col overflow-hidden max-w-[140px]">
                  <span className="text-sm font-medium truncate" title={doc.documentId}>
                    {doc.documentId}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.startedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={badgeVariant} className={extraClassName}>
                  {displayStatus}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
