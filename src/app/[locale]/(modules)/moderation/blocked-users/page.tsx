"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  useAdminListAllBlockedUsers,
  useAdminUnblockUser,
} from "@/app/[locale]/(modules)/moderation/_services/blocked-users.hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { reasonVariant } from "../_components/report-status";

export default function BlockedUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const t = useTranslations("moderation");
  const locale = useLocale();

  const pageSize = 20;
  const blockedQuery = useAdminListAllBlockedUsers({ page, pageSize });
  const unblockMutation = useAdminUnblockUser();

  const blockedUsers = blockedQuery.data?.blockedUsers ?? [];
  const total = blockedQuery.data?.total ?? 0;
  const totalPages = blockedQuery.data?.totalPages ?? 1;

  const query = search.trim().toLowerCase();
  const filtered = query
    ? blockedUsers.filter((u) =>
        [`${u.blockedUserFirstName} ${u.blockedUserLastName}`, u.blockedUserId]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    : blockedUsers;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">{t("blockedUsers")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("blockedUsersDesc")}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <Input
            className="w-full sm:w-64"
            placeholder={t("searchName")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {total > 0 && (
            <span className="text-xs text-muted-foreground">{t("total", { count: total })}</span>
          )}
        </div>

        {notice ? (
          <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">{notice}</p>
        ) : null}

        {blockedQuery.isLoading ? (
          <TableSkeleton rows={10} columns={5} />
        ) : blockedQuery.isError ? (
          <div className="p-4">
            <InlineError error={blockedQuery.error} onRetry={() => blockedQuery.refetch()} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="moderation"
            title={t("noBlockedUsers")}
            description={t("noBlockedUsersDesc")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("user")}</TableHead>
                <TableHead>{t("thread")}</TableHead>
                <TableHead>{t("reason")}</TableHead>
                <TableHead>{t("blockedAt")}</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">{t("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const name = `${u.blockedUserFirstName} ${u.blockedUserLastName}`;
                return (
                  <TableRow key={`${u.threadId}-${u.blockedUserId}`}>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate text-sm font-medium">{name}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {u.blockedUserId}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[220px] text-xs">
                      <div className="truncate">{u.threadTitle}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {u.reason ? <Badge variant={reasonVariant(u.reason)}>{u.reason}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleString(locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ConfirmDialog
                        title={t("unblockDialogTitle")}
                        description={t("unblockDialogDesc", { name })}
                        confirmLabel={t("unblock")}
                        cancelLabel={t("cancel")}
                        onConfirm={() =>
                          unblockMutation.mutate(
                            { threadId: u.threadId, accountId: u.blockedUserId },
                            {
                              onSuccess: () => setNotice(t("unblocked")),
                              onError: (err) => setNotice(getErrorMessage(err)),
                            }
                          )
                        }
                      >
                        <Button variant="outline" size="sm" disabled={unblockMutation.isPending}>
                          {t("unblock")}
                        </Button>
                      </ConfirmDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              isLoading={blockedQuery.isLoading}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
