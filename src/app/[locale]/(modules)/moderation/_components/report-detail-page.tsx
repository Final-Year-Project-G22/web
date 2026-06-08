"use client";

import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardSkeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";
import {
  useAdminDeleteReportedPost,
  useAdminGetPostReport,
  useAdminUpdatePostReportStatus,
} from "../_services/post-reports.hook";
import {
  useAdminDeleteReportedThread,
  useAdminGetThreadReport,
  useAdminUpdateThreadReportStatus,
} from "../_services/thread-reports.hook";
import {
  useAdminBlockUserInThread,
  useAdminGetUserReport,
  useAdminUpdateUserReportStatus,
} from "../_services/user-reports.hook";

const STATUS_VARIANTS: Record<string, "secondary" | "default" | "outline"> = {
  pending: "secondary",
  under_review: "outline",
  resolved: "default",
  dismissed: "outline",
};

type ReportType = "post" | "thread" | "user";

const CONFIG: Record<
  ReportType,
  {
    title: string;
    destructiveLabel: string;
    confirmTitle: string;
    confirmDescription: string;
    confirmLabel: string;
    destructiveIcon: typeof Trash2;
    mutationFn: "deletePost" | "deleteThread" | "blockUser";
  }
> = {
  post: {
    title: "Post Report Details",
    destructiveLabel: "Delete Post",
    confirmTitle: "Delete Post",
    confirmDescription: "Delete this post and resolve the report? This action cannot be undone.",
    confirmLabel: "Delete",
    destructiveIcon: Trash2,
    mutationFn: "deletePost",
  },
  thread: {
    title: "Thread Report Details",
    destructiveLabel: "Delete Thread",
    confirmTitle: "Delete Thread",
    confirmDescription: "Delete this thread and resolve the report? This action cannot be undone.",
    confirmLabel: "Delete",
    destructiveIcon: Trash2,
    mutationFn: "deleteThread",
  },
  user: {
    title: "User Report Details",
    destructiveLabel: "Block User",
    confirmTitle: "Block User",
    confirmDescription:
      "Block this user from the platform and resolve the report? This action cannot be undone.",
    confirmLabel: "Block",
    destructiveIcon: AlertTriangle,
    mutationFn: "blockUser",
  },
};

interface ReportContent {
  post?: {
    threadTitle?: string;
    authorFirstName: string;
    authorLastName: string;
    content: string;
  };
  thread?: {
    title: string;
    authorFirstName: string;
    authorLastName: string;
    description?: string;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

function ContentPreview({
  type,
  content,
}: {
  type: ReportType;
  content: ReportContent | undefined;
}) {
  if (type === "post" && content?.post) {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Reported Content Preview</h4>
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
    );
  }

  if (type === "thread" && content?.thread) {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Reported Content Preview</h4>
        <div className="space-y-1">
          <p className="font-medium text-base">{content.thread.title}</p>
          <p className="text-sm text-muted-foreground">
            by {content.thread.authorFirstName} {content.thread.authorLastName}
          </p>
          {content.thread.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {content.thread.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (type === "user" && content?.user) {
    return (
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Reported User</h4>
        <div className="space-y-1">
          <p className="font-medium text-base">
            {content.user.firstName} {content.user.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{content.user.email}</p>
        </div>
      </div>
    );
  }

  return null;
}

export function ReportDetailPage({
  params,
  type,
}: {
  params: Promise<{ id: string }>;
  type: ReportType;
}) {
  const { id } = use(params);
  const router = useRouter();
  const config = CONFIG[type];

  const postHooks = {
    report: useAdminGetPostReport(id),
    destructive: useAdminDeleteReportedPost(),
    status: useAdminUpdatePostReportStatus(),
  };
  const threadHooks = {
    report: useAdminGetThreadReport(id),
    destructive: useAdminDeleteReportedThread(),
    status: useAdminUpdateThreadReportStatus(),
  };
  const userHooks = {
    report: useAdminGetUserReport(id),
    destructive: useAdminBlockUserInThread(),
    status: useAdminUpdateUserReportStatus(),
  };

  const hooks = type === "post" ? postHooks : type === "thread" ? threadHooks : userHooks;

  const reportQuery = hooks.report;
  const updateStatus = hooks.status;

  const report = reportQuery.data?.report;
  const content = reportQuery.data?.content;

  const isPending = report?.status === "pending" || report?.status === "under_review";
  const isLoading = hooks.destructive.isPending || updateStatus.isPending;

  async function handleDestructive() {
    try {
      if (type === "user") {
        if (!report?.threadId || !report?.reportedAccountId) return;
        await userHooks.destructive.mutateAsync({
          threadId: report.threadId,
          blockedId: report.reportedAccountId,
        });
        router.push("/moderation/reported-users");
        return;
      }
      if (type === "post") {
        await postHooks.destructive.mutateAsync(id);
      } else {
        await threadHooks.destructive.mutateAsync(id);
      }
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
    hooks.destructive.error?.detail ||
    hooks.destructive.error?.title ||
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
              <CardTitle>{config.title}</CardTitle>
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
            <CardSkeleton lines={5} />
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

              <ContentPreview type={type} content={content} />

              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {isPending && (
                    <ConfirmDialog
                      title={config.confirmTitle}
                      description={config.confirmDescription}
                      confirmLabel={config.confirmLabel}
                      variant="destructive"
                      onConfirm={handleDestructive}
                    >
                      <Button variant="destructive" size="sm" disabled={isLoading}>
                        <config.destructiveIcon className="w-4 h-4 mr-1" />
                        {config.destructiveLabel}
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
