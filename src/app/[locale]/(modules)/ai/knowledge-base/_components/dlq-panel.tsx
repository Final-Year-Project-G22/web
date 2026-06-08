"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";
import { useAIDeadEvents, useRedriveEvent } from "../_services/ai.hook";

export function DlqPanel() {
  const { data: events, isLoading } = useAIDeadEvents(1, 50);
  const redrive = useRedriveEvent();

  const handleRedrive = (eventId: string) => {
    toast.promise(redrive.mutateAsync(eventId), {
      loading: "Re-driving event...",
      success: "Event re-driven successfully",
      error: (err) => `Failed: ${getErrorMessage(err)}`,
    });
  };

  if (isLoading) {
    return <CardSkeleton lines={2} />;
  }

  if (!events || events.length === 0) {
    return (
      <>
        <h3 className="font-semibold text-sm tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          DEAD LETTER QUEUE
        </h3>
        <p className="text-sm text-muted-foreground">No failed events. All healthy.</p>
      </>
    );
  }

  return (
    <>
      <h3 className="font-semibold text-sm tracking-wide text-muted-foreground mb-2 flex items-center gap-2 shrink-0">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        DEAD LETTER QUEUE
        <Badge variant="destructive">{events.length}</Badge>
      </h3>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {events.map((evt) => (
          <div
            key={evt.eventId}
            className="flex items-center justify-between p-2 rounded-lg border bg-background"
          >
            <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
              <span className="text-xs font-medium truncate" title={evt.eventId}>
                {evt.eventId}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {evt.errorMessage || "Unknown error"}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 shrink-0"
              onClick={() => handleRedrive(evt.eventId)}
              disabled={redrive.isPending}
            >
              <RefreshCw className="w-3 h-3" />
              Re-drive
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
