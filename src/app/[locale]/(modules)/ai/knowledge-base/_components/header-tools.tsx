"use client";

import { UploadCloud } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/utils";
import {
  useAIIngestionToggle,
  useSetAIIngestionToggle,
  useUploadDocument,
} from "../_services/ai.hook";

export function HeaderTools() {
  const { data: toggleData, isLoading } = useAIIngestionToggle();
  const { mutate: setToggle, isPending } = useSetAIIngestionToggle();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDoc = useUploadDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.promise(uploadDoc.mutateAsync(file), {
        loading: "Uploading document...",
        success: "Document uploaded successfully!",
        error: (err) => `Failed to upload: ${getErrorMessage(err)}`,
      });
      // Reset input so the same file can be selected again
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center justify-between px-1 mb-6">
      <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="ingestion-toggle"
            checked={toggleData?.enabled || false}
            disabled={isLoading || isPending}
            onCheckedChange={(v) => setToggle(v)}
          />
          <Label htmlFor="ingestion-toggle" className="text-sm text-muted-foreground mr-2">
            System Ingestion
          </Label>
        </div>
        <Button className="flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
