"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import {
  useAdminDeleteReportedPost,
  useAdminGetPostReport,
  useAdminUpdatePostReportStatus,
} from "@/app/[locale]/(modules)/dashboard/moderation/_services/post-reports.hook";
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

export default function PostReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const reportQuery = useAdminGetPostReport(id);
  const deletePost = useAdminDeleteReportedPost();
  const updateStatus = useAdminUpdatePostReportStatus();

  const report = reportQuery.data?.report;
  const content = reportQuery.data?.content;

  const isPending = report?.status === "pending" || report?.status === "under_review";
  const isLoading = deletePost.isPending || updateStatus.isPending;

  async function handleDelete() {
    try {
      await deletePost.mutateAsync(id);
      router.back();
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
    deletePost.error?.detail ||
    deletePost.error?.title ||
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
              <CardTitle>Post Report Details</CardTitle>
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

              {content?.post ? (
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Reported Content Preview
                  </h4>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">In thread: </span>
                      <span>{content.post.threadTitle ?? "Unknown Thread"}</span>
                    </div>
                    <div className="rounded-md bg-muted/50 p-3 text-sm">
                      <p className="text-muted-foreground mb-1">
                        by {content.post.authorFirstName} {content.post.authorLastName}
                      </p>
                      <p className="whitespace-pre-wrap">{content.post.content}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {isPending && (
                    <ConfirmDialog
                      title="Delete Post"
                      description="Delete this post and resolve the report? This action cannot be undone."
                      confirmLabel="Delete"
                      variant="destructive"
                      onConfirm={handleDelete}
                    >
                      <Button variant="destructive" size="sm" disabled={isLoading}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Post
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
