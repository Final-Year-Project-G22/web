"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  useDeleteLibraryCategory,
  useLibraryCategories,
  useUpdateLibraryCategory,
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
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/utils";

export default function LibraryCategoriesPage() {
  const [includeInactive, setIncludeInactive] = useState(true);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const categoriesQuery = useLibraryCategories({ includeInactive });
  const updateCategory = useUpdateLibraryCategory();
  const deleteCategory = useDeleteLibraryCategory();

  const filtered = useMemo(() => {
    const items = categoriesQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [categoriesQuery.data, search]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Library Categories</CardTitle>
          <CardDescription>Manage template library categories</CardDescription>
          <CardAction>
            <Button asChild>
              <Link href="/library/categories/create">Create Category</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={includeInactive}
                onCheckedChange={(v) => setIncludeInactive(Boolean(v))}
                aria-label="Include inactive categories"
              />
              <span className="text-sm text-muted-foreground">Include inactive</span>
            </div>

            <div className="w-full sm:w-80">
              <Input
                placeholder="Search by name or slug"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

          {categoriesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading categories&hellip;</p>
          ) : categoriesQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(categoriesQuery.error)}
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm">{c.slug}</TableCell>
                        <TableCell className="text-sm">{c.icon ?? "—"}</TableCell>
                        <TableCell>{c.sortOrder}</TableCell>
                        <TableCell>
                          <Badge variant={c.isActive ? "default" : "secondary"}>
                            {c.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updateCategory.isPending}
                              onClick={() =>
                                updateCategory.mutate(
                                  {
                                    id: c.id,
                                    payload: { isActive: !c.isActive },
                                  },
                                  {
                                    onError: (err) => setNotice(getErrorMessage(err)),
                                  }
                                )
                              }
                            >
                              {c.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/library/categories/${c.id}/edit`}>Edit</Link>
                            </Button>
                            <ConfirmDialog
                              title="Delete Category"
                              description={`Delete category "${c.name}"? This cannot be undone.`}
                              confirmLabel="Delete"
                              variant="destructive"
                              onConfirm={() =>
                                deleteCategory.mutate(c.id, {
                                  onSuccess: () => setNotice("Category deleted"),
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
