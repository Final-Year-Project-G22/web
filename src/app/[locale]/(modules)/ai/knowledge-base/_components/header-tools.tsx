"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAIIngestionToggle, useSetAIIngestionToggle } from "../_services/ai.hook";
import { UploadDialog } from "./upload-dialog";

export function HeaderTools() {
  const { data: toggleData, isLoading } = useAIIngestionToggle();
  const { mutate: setToggle, isPending } = useSetAIIngestionToggle();

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
        <UploadDialog />
      </div>
    </div>
  );
}
