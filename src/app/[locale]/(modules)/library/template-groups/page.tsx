"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useDeleteTemplateGroup,
  useLibraryCategories,
  useTemplateGroups,
  useUpdateTemplateGroup,
} from "@/app/[locale]/(modules)/library/_services/library.hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

const PAGE_SIZE = 10;

export default function LibraryTemplateGroupsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const groupsQuery = useTemplateGroups({
    page,
    pageSize,
    categoryId: categoryFilter || undefined,
  });
  const categoriesQuery = useLibraryCategories({ includeInactive: false });
  const updateGroup = useUpdateTemplateGroup();
  const deleteGroup = useDeleteTemplateGroup();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Template Groups</CardTitle>
          <CardDescription>Manage template groups in the library</CardDescription>
          <CardAction>
            <Button asChild>
              <Link href="/library/template-groups/create">Create Group</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter by category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All Categories</option>
                {categoriesQuery.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

          {groupsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading groups&hellip;</p>
          ) : groupsQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(groupsQuery.error)}
            </p>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!groupsQuery.data?.data?.length ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-muted-foreground">
                          No template groups found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupsQuery.data.data.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.name}</TableCell>
                          <TableCell className="text-sm">{g.slug}</TableCell>
                          <TableCell>{g.format}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{g.tierAccess}</Badge>
                          </TableCell>
                          <TableCell>{g.sortOrder}</TableCell>
                          <TableCell>{g.downloadCount}</TableCell>
                          <TableCell>
                            <Badge variant={g.isActive ? "default" : "secondary"}>
                              {g.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updateGroup.isPending}
                                onClick={() =>
                                  updateGroup.mutate(
                                    {
                                      id: g.id,
                                      payload: { isActive: !g.isActive },
                                    },
                                    {
                                      onError: (err) => setNotice(getErrorMessage(err)),
                                    }
                                  )
                                }
                              >
                                {g.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/library/template-groups/${g.id}/templates`}>
                                  Templates
                                </Link>
                              </Button>
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/library/template-groups/${g.id}/edit`}>Edit</Link>
                              </Button>
                              <ConfirmDialog
                                title="Delete Group"
                                description={`Delete group "${g.name}"? This cannot be undone.`}
                                confirmLabel="Delete"
                                variant="destructive"
                                onConfirm={() =>
                                  deleteGroup.mutate(g.id, {
                                    onSuccess: () => setNotice("Group deleted"),
                                    onError: (err) => setNotice(getErrorMessage(err)),
                                  })
                                }
                              >
                                <Button variant="destructive" size="sm" type="button">
                                  Delete
                                </Button>
                              </ConfirmDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                page={page}
                totalPages={groupsQuery.data?.totalPages ?? 1}
                pageSize={pageSize}
                isLoading={groupsQuery.isFetching}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
