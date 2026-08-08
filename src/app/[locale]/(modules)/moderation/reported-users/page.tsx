"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import {
  useAdminListUserReports,
  useAdminUpdateUserReportStatus,
} from "@/app/[locale]/(modules)/moderation/_services/user-reports.hook";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import type { ReportWithContentDTO } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import {
  REPORT_STATUS_KEYS,
  REPORT_STATUS_TRANSLATION_KEYS,
  type ReportStatusKey,
} from "../_components/report-status";
import { TriageQueueSkeleton, TriageRow } from "../_components/triage-row";

export default function ReportedUsersPage() {
  return (
    <Suspense fallback={<TriageQueueSkeleton />}>
      <ReportedUsersContent />
    </Suspense>
  );
}

function ReportedUsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("moderation");

  const initialStatus = (searchParams.get("status") as ReportStatusKey) ?? "all";
  const initialPage = Number(searchParams.get("page") ?? "1");
  const initialSearch = searchParams.get("search") ?? "";

  const [status, setStatus] = useState<ReportStatusKey>(initialStatus);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [pendingSkipId, setPendingSkipId] = useState<string | null>(null);

  const pageSize = 20;
  const baseParams = { page, pageSize };
  const statusParam = status !== "all" ? { status } : {};
  const searchParam = search.trim() ? { search: search.trim() } : {};

  const reportsQuery = useAdminListUserReports({
    ...baseParams,
    ...statusParam,
    ...searchParam,
  });
  const statusMutation = useAdminUpdateUserReportStatus();

  const items = reportsQuery.data?.reports ?? [];
  const total = reportsQuery.data?.total ?? 0;
  const totalPages = reportsQuery.data?.totalPages ?? 1;

  function navigate(newStatus: ReportStatusKey, newPage: number, newSearch: string) {
    const sp = new URLSearchParams();
    if (newStatus !== "all") sp.set("status", newStatus);
    if (newSearch.trim()) sp.set("search", newSearch.trim());
    if (newPage > 1) sp.set("page", String(newPage));
    router.replace(`/moderation/reported-users${sp.toString() ? `?${sp}` : ""}`);
  }

  function decideOn(item: ReportWithContentDTO) {
    router.push(`/moderation/reported-users/${item.report.id}`);
  }

  function skip(item: ReportWithContentDTO) {
    const id = item.report.id;
    setPendingSkipId(id);
    statusMutation.mutate(
      { id, status: "under_review" },
      {
        onSettled: () => setPendingSkipId((current) => (current === id ? null : current)),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  }

  function rowProps(item: ReportWithContentDTO) {
    const r = item.report;
    const user = item.content?.user;
    const userName =
      user && (user.firstName || user.lastName) ? `${user.firstName} ${user.lastName}`.trim() : "—";
    return {
      title: userName,
      snippet: user?.email,
      reporter: `${r.reporterFirstName} ${r.reporterLastName}`,
      reason: r.reason,
      createdAt: r.createdAt,
      status: r.status,
      onDecide: () => decideOn(item),
      onSkip: () => skip(item),
      skipDisabled: pendingSkipId === item.report.id,
    };
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">
            {t("reportedUsers")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("reportedUsersDesc", { count: total })}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1">
          {REPORT_STATUS_KEYS.map((key) => (
            <Button
              key={key}
              size="sm"
              variant={status === key ? "default" : "ghost"}
              onClick={() => {
                setStatus(key);
                setPage(1);
                navigate(key, 1, search);
              }}
            >
              {t(REPORT_STATUS_TRANSLATION_KEYS[key])}
            </Button>
          ))}
        </div>

        <Input
          className="w-full sm:w-72"
          placeholder={t("searchReporter")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate(status, 1, search);
            }
          }}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-medium">{t("reportQueue")}</h2>
        </div>

        {reportsQuery.isLoading ? (
          <TriageQueueSkeleton />
        ) : reportsQuery.isError ? (
          <div className="p-4">
            <InlineError error={reportsQuery.error} onRetry={() => reportsQuery.refetch()} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            variant="moderation"
            title={t("noReports")}
            description={t("noReportsDesc")}
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <TriageRow key={item.report.id} {...rowProps(item)} />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          isLoading={reportsQuery.isLoading}
          onPageChange={(p) => {
            setPage(p);
            navigate(status, p, search);
          }}
        />
      )}
    </div>
  );
}
