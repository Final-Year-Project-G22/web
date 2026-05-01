"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
  useAdminBlockUserInThread,
  useAdminGetUserReport,
  useAdminUpdateUserReportStatus,
} from "@/app/[locale]/(modules)/moderation/_services/user-reports.hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getErrorMessage } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "secondary" | "default" | "outline"> = {
  pending: "secondary",
  under_review: "outline",
  resolved: "default",
  dismissed: "outline",
};

export default function UserReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const reportQuery = useAdminGetUserReport(id);
  const blockUser = useAdminBlockUserInThread();
  const updateStatus = useAdminUpdateUserReportStatus();

  const report = reportQuery.data?.report;
  const content = reportQuery.data?.content;

  const isPending = report?.status === "pending" || report?.status === "under_review";
  const isLoading = blockUser.isPending || updateStatus.isPending;

  async function handleBlockUser() {
    if (!report?.threadId || !report?.reportedAccountId) return;
    try {
      await blockUser.mutateAsync({
        threadId: report.threadId,
        blockedId: report.reportedAccountId,
      });
      router.push("/dashboard/moderation/reported-users");
    } catch {
      // error handled by hook
    }
  }

  async function handleDismiss() {
    try {
      await updateStatus.mutateAsync({ id, status: "dismissed" });
      reportQuery.refetch();
    } catch {
      // error handled by hook
    }
  }

  async function handleResolve() {
    try {
      await updateStatus.mutateAsync({ id, status: "resolved" });
      reportQuery.refetch();
    } catch {
      // error handled by hook
    }
  }

  const errorMessage =
    updateStatus.error?.detail ||
    updateStatus.error?.title ||
    blockUser.error?.detail ||
    blockUser.error?.title ||
    "";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>User Report Details</CardTitle>
            </div>
            {report && (
              <Badge variant={STATUS_VARIANTS[report.status] ?? "outline"}>
                {report.status.replace("_", " ")}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {reportQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading&hellip;</p>
          ) : reportQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(reportQuery.error)}
            </p>
          ) : report ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Reporter</span>
                  <p className="font-medium">
                    {report.reporterFirstName} {report.reporterLastName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reported On</span>
                  <p className="font-medium">{new Date(report.createdAt).toLocaleString()}</p>
                </div>
                {report.adminNote && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Admin Note</span>
                    <p className="font-medium">{report.adminNote}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-muted-foreground">Reason</span>
                  <p className="font-medium">{report.reason}</p>
                </div>
              </div>

              {content?.user ? (
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Reported User</h4>
                  <div className="space-y-1">
                    <p className="font-medium text-base">
                      {content.user.firstName} {content.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{content.user.email}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {isPending && (
                    <ConfirmDialog
                      title="Block User"
                      description="Block this user from the platform and resolve the report? This action cannot be undone."
                      confirmLabel="Block"
                      variant="destructive"
                      onConfirm={handleBlockUser}
                    >
                      <Button variant="destructive" size="sm" disabled={isLoading}>
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Block User
                      </Button>
                    </ConfirmDialog>
                  )}
                  {isPending && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={handleDismiss}
                      >
                        Dismiss Report
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={handleResolve}
                      >
                        Mark Resolved
                      </Button>
                    </>
                  )}
                </div>

                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
