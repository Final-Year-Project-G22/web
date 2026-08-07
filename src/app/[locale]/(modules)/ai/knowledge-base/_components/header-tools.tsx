"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useAIIngestionToggle,
  useAIStatusList,
  useSetAIIngestionToggle,
} from "../_services/ai.hook";
import { UploadDialog } from "./upload-dialog";

export function HeaderTools() {
  const t = useTranslations("surfaces.ai.kb");
  const { data: toggleData, isLoading } = useAIIngestionToggle();
  const { data: documents } = useAIStatusList(1, 100);
  const { mutate: setToggle, isPending } = useSetAIIngestionToggle();

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
          {t("title")}
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {t("subtitle", { count: documents?.length ?? 0 })}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="ingestion-toggle"
            checked={toggleData?.enabled || false}
            disabled={isLoading || isPending}
            onCheckedChange={(v) => setToggle(v)}
          />
          <Label htmlFor="ingestion-toggle" className="mr-2 text-[13px] text-muted-foreground">
            {t("ingestion")}
          </Label>
        </div>
        <UploadDialog />
      </div>
    </div>
  );
}
