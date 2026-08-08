"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import {
  useAdminListPostReports,
  useAdminUpdatePostReportStatus,
} from "@/app/[locale]/(modules)/moderation/_services/post-reports.hook";
import {
  useAdminListThreadReports,
  useAdminUpdateThreadReportStatus,
} from "@/app/[locale]/(modules)/moderation/_services/thread-reports.hook";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReportWithContentDTO } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import {
  REPORT_STATUS_KEYS,
  REPORT_STATUS_TRANSLATION_KEYS,
  type ReportStatusKey,
} from "../_components/report-status";
import { TriageQueueSkeleton, TriageRow } from "../_components/triage-row";

type Tab = "thread" | "post";

export default function ReportedContentPage() {
  return (
    <Suspense fallback={<TriageQueueSkeleton />}>
      <ReportedContentContent />
    </Suspense>
  );
}

function ReportedContentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("moderation");

  const initialTab = (searchParams.get("tab") as Tab) ?? "thread";
  const initialStatus = (searchParams.get("status") as ReportStatusKey) ?? "all";
  const initialPage = Number(searchParams.get("page") ?? "1");
  const initialSearch = searchParams.get("search") ?? "";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [status, setStatus] = useState<ReportStatusKey>(initialStatus);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [pendingSkipId, setPendingSkipId] = useState<string | null>(null);

  const pageSize = 20;
  const baseParams = { page, pageSize };
  const statusParam = status !== "all" ? { status } : {};
  const searchParam = search.trim() ? { search: search.trim() } : {};

  const threadParams = { ...baseParams, ...statusParam, ...searchParam };
  const postParams = { ...baseParams, ...statusParam, ...searchParam };

  const threadQuery = useAdminListThreadReports(tab === "thread" ? threadParams : undefined);
  const postQuery = useAdminListPostReports(tab === "post" ? postParams : undefined);
  const threadStatus = useAdminUpdateThreadReportStatus();
  const postStatus = useAdminUpdatePostReportStatus();

  const activeQuery = tab === "thread" ? threadQuery : postQuery;
  const activeData = activeQuery.data;
  const items = activeData?.reports ?? [];
  const total = activeData?.total ?? 0;
  const totalPages = activeData?.totalPages ?? 1;

  const statusMutation = tab === "thread" ? threadStatus : postStatus;

  function navigate(newTab: Tab, newStatus: ReportStatusKey, newPage: number, newSearch: string) {
    const sp = new URLSearchParams();
    if (newTab !== "thread") sp.set("tab", newTab);
    if (newStatus !== "all") sp.set("status", newStatus);
    if (newSearch.trim()) sp.set("search", newSearch.trim());
    if (newPage > 1) sp.set("page", String(newPage));
    router.replace(`/moderation/reported-content${sp.toString() ? `?${sp}` : ""}`);
  }

  function decideOn(item: ReportWithContentDTO) {
    router.push(`/moderation/reported-content/${tab}/${item.report.id}`);
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
    const authorName =
      tab === "thread"
        ? [item.content?.thread?.authorFirstName, item.content?.thread?.authorLastName]
            .filter(Boolean)
            .join(" ")
        : [item.content?.post?.authorFirstName, item.content?.post?.authorLastName]
            .filter(Boolean)
            .join(" ");
    return {
      title:
        tab === "thread"
          ? (item.content?.thread?.title ?? "—")
          : (item.content?.post?.threadTitle ?? "—"),
      snippet: tab === "thread" ? item.content?.thread?.description : item.content?.post?.content,
      author: authorName || "—",
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
            {t("reportedContent")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("reportedContentDesc", { count: total })}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={tab}
            onValueChange={(value) => {
              const next = value as Tab;
              setTab(next);
              setPage(1);
              navigate(next, status, 1, search);
            }}
          >
            <TabsList>
              <TabsTrigger value="thread">{t("threads")}</TabsTrigger>
              <TabsTrigger value="post">{t("posts")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-1">
            {REPORT_STATUS_KEYS.map((key) => (
              <Button
                key={key}
                size="sm"
                variant={status === key ? "default" : "ghost"}
                onClick={() => {
                  setStatus(key);
                  setPage(1);
                  navigate(tab, key, 1, search);
                }}
              >
                {t(REPORT_STATUS_TRANSLATION_KEYS[key])}
              </Button>
            ))}
          </div>
        </div>

        <Input
          className="w-full sm:w-72"
          placeholder={tab === "thread" ? t("searchThreads") : t("searchPosts")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate(tab, status, 1, search);
            }
          }}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="border-b border-border px-4 py-2.5">
          <h2 className="text-sm font-medium">{t("reportQueue")}</h2>
        </div>

        {activeQuery.isLoading ? (
          <TriageQueueSkeleton />
        ) : activeQuery.isError ? (
          <div className="p-4">
            <InlineError error={activeQuery.error} onRetry={() => activeQuery.refetch()} />
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
          isLoading={activeQuery.isLoading}
          onPageChange={(p) => {
            setPage(p);
            navigate(tab, status, p, search);
          }}
        />
      )}
    </div>
  );
}
