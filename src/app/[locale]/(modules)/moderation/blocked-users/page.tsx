"use client";

import { useState } from "react";
import {
  useAdminListAllBlockedUsers,
  useAdminUnblockUser,
} from "@/app/[locale]/(modules)/moderation/_services/blocked-users.hook";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/ui/inline-error";
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

export default function BlockedUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const pageSize = 20;
  const blockedQuery = useAdminListAllBlockedUsers({ page, pageSize });
  const unblockMutation = useAdminUnblockUser();

  const blockedUsers = blockedQuery.data?.blockedUsers ?? [];
  const total = blockedQuery.data?.total ?? 0;
  const totalPages = blockedQuery.data?.totalPages ?? 1;

  const filtered = search.trim()
    ? blockedUsers.filter((u) => u.blockedUserId.toLowerCase().includes(search.toLowerCase()))
    : blockedUsers;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Blocked Users</CardTitle>
          <CardDescription>Users blocked from threads across the community</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search by name "
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {total > 0 && (
              <span className="text-sm text-muted-foreground shrink-0">{total} total</span>
            )}
          </div>

          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

          {blockedQuery.isLoading ? (
            <TableSkeleton rows={10} columns={5} />
          ) : blockedQuery.isError ? (
            <InlineError error={blockedQuery.error} onRetry={() => blockedQuery.refetch()} />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User FullName</TableHead>
                    <TableHead>Thread Title</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Blocked At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState
                          variant="moderation"
                          title="No blocked users"
                          description="No users are currently blocked."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((u) => (
                      <TableRow key={`${u.threadId}-${u.blockedUserId}`}>
                        <TableCell className="font-medium text-xs">
                          {`${u.blockedUserFirstName} ${u.blockedUserLastName}`}
                        </TableCell>
                        <TableCell className="text-xs">{u.threadTitle}</TableCell>
                        <TableCell className="text-xs">{u.reason ?? "—"}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(u.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <ConfirmDialog
                            title="Unblock User"
                            description={`Unblock user "${`${u.blockedUserFirstName} ${u.blockedUserLastName}`}" from this thread?`}
                            confirmLabel="Unblock"
                            onConfirm={() =>
                              unblockMutation.mutate(
                                { threadId: u.threadId, accountId: u.blockedUserId },
                                {
                                  onSuccess: () => setNotice("User unblocked"),
                                  onError: (err) => setNotice(getErrorMessage(err)),
                                }
                              )
                            }
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={unblockMutation.isPending}
                            >
                              Unblock
                            </Button>
                          </ConfirmDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <PaginationBar
              page={page}
              totalPages={totalPages}
              isLoading={blockedQuery.isLoading}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
