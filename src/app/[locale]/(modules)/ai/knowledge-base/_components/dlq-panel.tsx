"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    return (
      <div className="border rounded-xl bg-card p-4">
        <p className="text-sm text-muted-foreground">Loading DLQ...</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="border rounded-xl bg-card p-4">
        <h3 className="font-semibold text-sm tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          DEAD LETTER QUEUE
        </h3>
        <p className="text-sm text-muted-foreground">No failed events. All healthy.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl bg-card p-4 flex flex-col gap-3">
      <h3 className="font-semibold text-sm tracking-wide text-muted-foreground flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        DEAD LETTER QUEUE
        <Badge variant="destructive">{events.length}</Badge>
      </h3>

      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
        {events.map((evt) => (
          <div
            key={evt.eventId}
            className="flex items-center justify-between p-2 rounded-lg border bg-background"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-medium truncate" title={evt.eventId}>
                {evt.eventId}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {evt.errorMessage || "Unknown error"}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => handleRedrive(evt.eventId)}
              disabled={redrive.isPending}
            >
              <RefreshCw className="w-3 h-3" />
              Re-drive
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
