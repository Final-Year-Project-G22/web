"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";
import { useAIDeadEvents, useRedriveEvent } from "../_services/ai.hook";

export function DlqPanel() {
  const t = useTranslations("surfaces.ai.kb");
  const { data: events, isLoading } = useAIDeadEvents(1, 50);
  const redrive = useRedriveEvent();

  const handleRedrive = (eventId: string) => {
    toast.promise(redrive.mutateAsync(eventId), {
      loading: t("redriving"),
      success: t("redriveSuccess"),
      error: (err) => t("redriveFailed", { error: getErrorMessage(err) }),
    });
  };

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive-strong" />
          <h2 className="font-display text-[13.5px] font-semibold text-ink">{t("dlqTitle")}</h2>
        </div>
        {events && events.length > 0 ? (
          <Badge variant="destructive" className="font-mono text-[11px]">
            {events.length}
          </Badge>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <CardSkeleton lines={2} />
        ) : !events || events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-tint">
              <AlertTriangle className="h-4 w-4 text-success-strong" />
            </span>
            <p className="text-[13px] text-muted-foreground">{t("dlqHealthy")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((evt) => (
              <div
                key={evt.eventId}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel p-2.5 transition-colors duration-base hover:bg-panel-2"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className="truncate font-mono text-xs font-medium text-ink"
                    title={evt.eventId}
                  >
                    {evt.eventId}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {evt.errorMessage || "Unknown error"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 gap-1 px-2 text-xs"
                  onClick={() => handleRedrive(evt.eventId)}
                  disabled={redrive.isPending}
                >
                  <RefreshCw className="h-3 w-3" />
                  {t("redrive")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
