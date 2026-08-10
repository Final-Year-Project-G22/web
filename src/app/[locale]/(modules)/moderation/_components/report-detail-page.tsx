"use client";

import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineError } from "@/components/ui/inline-error";
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
import { ReportStatusBadge, reportStatusLabelKey } from "./report-status";

type ReportType = "post" | "thread" | "user";

const CONFIG: Record<
  ReportType,
  {
    titleKey: "detailPost" | "detailThread" | "detailUser";
    destructiveLabelKey: "deletePost" | "deleteThread" | "blockUser";
    confirmTitleKey: "confirmDeletePost" | "confirmDeleteThread" | "confirmBlockUser";
    confirmDescKey: "confirmDeletePostDesc" | "confirmDeleteThreadDesc" | "confirmBlockUserDesc";
    destructiveIcon: typeof Trash2;
  }
> = {
  post: {
    titleKey: "detailPost",
    destructiveLabelKey: "deletePost",
    confirmTitleKey: "confirmDeletePost",
    confirmDescKey: "confirmDeletePostDesc",
    destructiveIcon: Trash2,
  },
  thread: {
    titleKey: "detailThread",
    destructiveLabelKey: "deleteThread",
    confirmTitleKey: "confirmDeleteThread",
    confirmDescKey: "confirmDeleteThreadDesc",
    destructiveIcon: Trash2,
  },
  user: {
    titleKey: "detailUser",
    destructiveLabelKey: "blockUser",
    confirmTitleKey: "confirmBlockUser",
    confirmDescKey: "confirmBlockUserDesc",
    destructiveIcon: AlertTriangle,
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
  const t = useTranslations("moderation");

  if (type === "post" && content?.post) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-panel-2/50 p-4">
        <h2 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t("contentPreview")}
        </h2>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">{t("inThread")} </span>
            <span>{content.post.threadTitle ?? t("unknownThread")}</span>
          </div>
          <div className="rounded-md border border-border bg-panel p-3 text-sm">
            <p className="mb-1 text-xs text-muted-foreground">
              {t("byAuthor", {
                author: `${content.post.authorFirstName} ${content.post.authorLastName}`,
              })}
            </p>
            <p className="whitespace-pre-wrap text-sm">{content.post.content}</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === "thread" && content?.thread) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-panel-2/50 p-4">
        <h2 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t("contentPreview")}
        </h2>
        <div className="space-y-1">
          <p className="font-medium text-base">{content.thread.title}</p>
          <p className="text-sm text-muted-foreground">
            {t("byAuthor", {
              author: `${content.thread.authorFirstName} ${content.thread.authorLastName}`,
            })}
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
      <div className="space-y-3 rounded-lg border border-border bg-panel-2/50 p-4">
        <h2 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t("reportedUser")}
        </h2>
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
  const t = useTranslations("moderation");
  const locale = useLocale();
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

  async function handleReturnToPending() {
    try {
      await updateStatus.mutateAsync({ id, status: "pending" });
      reportQuery.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const errorMessage =
    updateStatus.error?.detail ||
    updateStatus.error?.title ||
    hooks.destructive.error?.detail ||
    hooks.destructive.error?.title ||
    "";

  const statusLabel = report ? t(reportStatusLabelKey(report.status)) : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="size-4" />
        {t("back")}
      </Button>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight">
              {t(config.titleKey)}
            </h1>
            {report && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("reportedOn")} · {new Date(report.createdAt).toLocaleString(locale)}
              </p>
            )}
          </div>
          {report && <ReportStatusBadge status={report.status} label={statusLabel} />}
        </div>

        <div className="space-y-6 px-5 py-5">
          {reportQuery.isLoading ? (
            <CardSkeleton lines={5} />
          ) : reportQuery.isError ? (
            <InlineError error={reportQuery.error} onRetry={() => reportQuery.refetch()} />
          ) : report ? (
            <>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">{t("reporter")}</dt>
                  <dd className="mt-0.5 font-medium">
                    {report.reporterFirstName} {report.reporterLastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">{t("reason")}</dt>
                  <dd className="mt-0.5 font-medium">{report.reason}</dd>
                </div>
                {report.adminNote && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-muted-foreground">{t("adminNote")}</dt>
                    <dd className="mt-0.5 font-medium">{report.adminNote}</dd>
                  </div>
                )}
              </dl>

              <ContentPreview type={type} content={content} />

              {isPending && (
                <div className="space-y-3">
                  <h2 className="text-sm font-medium">{t("actions")}</h2>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <ConfirmDialog
                      title={t(config.confirmTitleKey)}
                      description={t(config.confirmDescKey)}
                      confirmLabel={t(config.destructiveLabelKey)}
                      cancelLabel={t("cancel")}
                      variant="destructive"
                      onConfirm={handleDestructive}
                    >
                      <Button variant="destructive" size="sm" disabled={isLoading}>
                        <config.destructiveIcon className="size-4" />
                        {t(config.destructiveLabelKey)}
                      </Button>
                    </ConfirmDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      onClick={handleDismiss}
                    >
                      {t("dismissReport")}
                    </Button>
                    {report?.status === "under_review" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={handleReturnToPending}
                      >
                        {t("returnToPending")}
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      disabled={isLoading}
                      onClick={handleResolve}
                    >
                      {t("markResolved")}
                    </Button>
                  </div>
                </div>
              )}

              {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
