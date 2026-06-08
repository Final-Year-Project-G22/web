"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAdminListPostReports } from "@/app/[locale]/(modules)/moderation/_services/post-reports.hook";
import { useAdminListThreadReports } from "@/app/[locale]/(modules)/moderation/_services/thread-reports.hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/utils";

type Tab = "thread" | "post";
type Status = "all" | "pending" | "under_review" | "resolved" | "dismissed";

const STATUS_LABELS: Record<Status, string> = {
  all: "All",
  pending: "Pending",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const STATUS_VARIANTS: Record<string, "secondary" | "default" | "outline"> = {
  pending: "secondary",
  under_review: "outline",
  resolved: "default",
  dismissed: "outline",
};

export default function ReportedContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get("tab") as Tab) ?? "thread";
  const initialStatus = (searchParams.get("status") as Status) ?? "all";
  const initialPage = Number(searchParams.get("page") ?? "1");
  const initialSearch = searchParams.get("search") ?? "";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);

  const pageSize = 20;
  const baseParams = { page, pageSize };
  const statusParam = status !== "all" ? { status } : {};
  const searchParam = search.trim() ? { search: search.trim() } : {};

  const threadParams = { ...baseParams, ...statusParam, ...searchParam };
  const postParams = { ...baseParams, ...statusParam, ...searchParam };

  const threadQuery = useAdminListThreadReports(tab === "thread" ? threadParams : undefined);
  const postQuery = useAdminListPostReports(tab === "post" ? postParams : undefined);

  const activeQuery = tab === "thread" ? threadQuery : postQuery;
  const activeData = activeQuery.data;
  const items = activeData?.reports ?? [];
  const total = activeData?.total ?? 0;
  const totalPages = activeData?.totalPages ?? 1;

  function navigate(newTab: Tab, newStatus: Status, newPage: number, newSearch: string) {
    const sp = new URLSearchParams();
    if (newTab !== "thread") sp.set("tab", newTab);
    if (newStatus !== "all") sp.set("status", newStatus);
    if (newSearch.trim()) sp.set("search", newSearch.trim());
    if (newPage > 1) sp.set("page", String(newPage));
    router.replace(`/moderation/reported-content${sp.toString() ? `?${sp}` : ""}`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Reported Content</CardTitle>
          <CardDescription>Review and take action on reported threads and posts</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1">
              {(["thread", "post"] as Tab[]).map((t) => (
                <Button
                  key={t}
                  variant={tab === t ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setTab(t);
                    setPage(1);
                    navigate(t, status, 1, search);
                  }}
                >
                  {t === "thread" ? "Threads" : "Posts"}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <Button
                  key={s}
                  variant={status === s ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                    navigate(tab, s, 1, search);
                  }}
                >
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder={
                tab === "thread" ? "Search title, slug, description..." : "Search post content..."
              }
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

          {total > 0 && (
            <div className="text-sm text-muted-foreground">
              {total} report{total !== 1 ? "s" : ""} found
            </div>
          )}

          {activeQuery.isLoading ? (
            <TableSkeleton rows={10} columns={7} />
          ) : activeQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(activeQuery.error)}
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tab === "thread" ? "Thread Title" : "Thread"}</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground">
                        No reports found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const r = item.report;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium max-w-[200px]">
                            <div className="truncate">
                              {tab === "thread"
                                ? item.content?.thread?.title
                                : item.content?.post?.threadTitle}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px]">
                            <div className="truncate">
                              {tab === "thread"
                                ? item.content?.thread?.description
                                : item.content?.post?.content}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {tab === "thread"
                              ? `${item.content?.thread?.authorFirstName ?? ""} ${item.content?.thread?.authorLastName ?? ""}`.trim()
                              : `${item.content?.post?.authorFirstName ?? ""} ${item.content?.post?.authorLastName ?? ""}`.trim()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.reporterFirstName} {r.reporterLastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_VARIANTS[r.status] ?? "outline"}>
                              {r.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/moderation/reported-content/${tab}/${r.id}`)
                              }
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}

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
        </CardContent>
      </Card>
    </div>
  );
}
