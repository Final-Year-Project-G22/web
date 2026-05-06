"use client";

import {
  useQueueStatus,
  useRetryFailed,
} from "@/app/[locale]/(modules)/notifications/_services/notification.hook";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getErrorMessage } from "@/lib/utils";

export default function QueuePage() {
  const queueQuery = useQueueStatus();
  const retryMutation = useRetryFailed();

  const status = queueQuery.data;

  const cards = [
    { label: "Pending", value: status?.pending ?? 0, color: "text-blue-600" },
    { label: "Processing", value: status?.processing ?? 0, color: "text-yellow-600" },
    { label: "Delivered", value: status?.delivered ?? 0, color: "text-green-600" },
    { label: "Failed", value: status?.failed ?? 0, color: "text-red-600" },
    { label: "Cancelled", value: status?.cancelled ?? 0, color: "text-gray-500" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Queue Status</CardTitle>
          <CardDescription>Monitor notification queue health</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {queueQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading queue status&hellip;</p>
          ) : queueQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(queueQuery.error)}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {cards.map((card) => (
                  <Card key={card.label} className="border">
                    <CardContent className="p-4 text-center">
                      <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Retry Failed</p>
                  <p className="text-xs text-muted-foreground">
                    Retry up to 50 failed notifications at a time
                  </p>
                </div>
                <ConfirmDialog
                  title="Retry Failed Notifications"
                  description={`Retry ${status?.failed ?? 0} failed notifications?`}
                  confirmLabel="Retry"
                  onConfirm={() => retryMutation.mutate({ batchSize: 50 })}
                >
                  <Button disabled={!status?.failed || retryMutation.isPending}>
                    {retryMutation.isPending ? "Retrying..." : "Retry Failed"}
                  </Button>
                </ConfirmDialog>
              </div>

              {retryMutation.isError && (
                <p className="text-sm text-destructive">
                  Failed to retry: {getErrorMessage(retryMutation.error)}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
