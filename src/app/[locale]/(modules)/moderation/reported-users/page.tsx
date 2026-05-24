"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAdminListUserReports } from "@/app/[locale]/(modules)/moderation/_services/user-reports.hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/utils";

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

export default function ReportedUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatus = (searchParams.get("status") as Status) ?? "all";
  const initialPage = Number(searchParams.get("page") ?? "1");
  const initialSearch = searchParams.get("search") ?? "";

  const [status, setStatus] = useState<Status>(initialStatus);
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);

  const pageSize = 20;
  const baseParams = { page, pageSize };
  const statusParam = status !== "all" ? { status } : {};
  const searchParam = search.trim() ? { search: search.trim() } : {};

  const reportsQuery = useAdminListUserReports({
    ...baseParams,
    ...statusParam,
    ...searchParam,
  });

  const items = reportsQuery.data?.reports ?? [];
  const total = reportsQuery.data?.total ?? 0;
  const totalPages = reportsQuery.data?.totalPages ?? 1;

  function navigate(newStatus: Status, newPage: number, newSearch: string) {
    const sp = new URLSearchParams();
    if (newStatus !== "all") sp.set("status", newStatus);
    if (newSearch.trim()) sp.set("search", newSearch.trim());
    if (newPage > 1) sp.set("page", String(newPage));
    router.replace(`/moderation/reported-users${sp.toString() ? `?${sp}` : ""}`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Reported Users</CardTitle>
          <CardDescription>Users reported for policy violations</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                <Button
                  key={s}
                  variant={status === s ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                    navigate(s, 1, search);
                  }}
                >
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>

            <div className="w-full sm:w-72">
              <Input
                placeholder="Search reporter name or email..."
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
          </div>

          {total > 0 && (
            <div className="text-sm text-muted-foreground">
              {total} report{total !== 1 ? "s" : ""} found
            </div>
          )}

          {reportsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading&hellip;</p>
          ) : reportsQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(reportsQuery.error)}
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No reports found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const r = item.report;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {item.content?.user
                              ? `${item.content.user.firstName} ${item.content.user.lastName}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px]">
                            <div className="truncate">{r.reason}</div>
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
                              onClick={() => router.push(`/moderation/reported-users/${r.id}`)}
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
              isLoading={reportsQuery.isLoading}
              onPageChange={(p) => {
                setPage(p);
                navigate(status, p, search);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
