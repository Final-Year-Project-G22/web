"use client";

import { useState } from "react";
import {
  useDownloadLogs,
  useTemplateGroups,
} from "@/app/[locale]/(modules)/library/_services/library.hook";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function LibraryDownloadLogsPage() {
  const [page, setPage] = useState(1);
  const [groupFilter, setGroupFilter] = useState("");

  const logsQuery = useDownloadLogs({
    page,
    pageSize: PAGE_SIZE,
    groupId: groupFilter || undefined,
  });
  const groupsQuery = useTemplateGroups({ page: 1, pageSize: 20 });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Download Logs</CardTitle>
          <CardDescription>View template download history</CardDescription>
          <CardAction>
            {groupFilter && (
              <Button
                variant="outline"
                onClick={() => {
                  setGroupFilter("");
                  setPage(1);
                }}
              >
                Clear Filter
              </Button>
            )}
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by group:</span>
              <select
                value={groupFilter}
                onChange={(e) => {
                  setGroupFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Groups</option>
                {groupsQuery.data?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {logsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading logs&hellip;</p>
          ) : logsQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(logsQuery.error)}
            </p>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Download ID</TableHead>
                      <TableHead>Template ID</TableHead>
                      <TableHead>Group ID</TableHead>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Downloaded At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(logsQuery.data?.data ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          No download logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (logsQuery.data?.data ?? []).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">{log.id}</TableCell>
                          <TableCell className="font-mono text-xs">{log.templateId}</TableCell>
                          <TableCell className="font-mono text-xs">{log.groupId}</TableCell>
                          <TableCell className="font-mono text-xs">{log.accountId}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(log.downloadedAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                page={logsQuery.data?.page ?? page}
                totalPages={logsQuery.data?.totalPages ?? 1}
                pageSize={logsQuery.data?.pageSize ?? PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
