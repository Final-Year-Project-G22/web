"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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
import { CategoryEditModal, EditCategoryButton } from "@/components/ui/category-edit-modal";
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
import type { CategoryDTO } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import {
  useAdminDeleteCategory,
  useAdminListCategories,
  useAdminUpdateCategory,
} from "../_services/community.hook";

type FlatItem = { category: CategoryDTO; depth: number; parentId: string | null };

function buildHierarchy(categories: CategoryDTO[]) {
  const map = new Map<string | null, CategoryDTO[]>();
  for (const c of categories) {
    const key = c.parentCategoryId ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  const sorted = (list: CategoryDTO[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));

  const result: FlatItem[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = sorted(map.get(parentId) ?? []);
    for (const c of children) {
      result.push({ category: c, depth, parentId });
      walk(c.id, depth + 1);
    }
  }
  walk(null, 0);
  return result;
}

export default function AdminCommunityCategoriesPage() {
  const [includeInactive, setIncludeInactive] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const categoriesQuery = useAdminListCategories(includeInactive);
  const updateCategory = useAdminUpdateCategory();
  const deleteCategory = useAdminDeleteCategory();

  const flatItems = useMemo(() => {
    const items = categoriesQuery.data ?? [];
    const q = search.trim().toLowerCase();
    const hierarchy = buildHierarchy(items);
    if (!q) return hierarchy;
    const matchedIds = new Set<string>();
    const lowerItems = hierarchy.filter((item) => {
      const c = item.category;
      const match = c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
      if (match) matchedIds.add(c.id);
      return match;
    });
    const matchedParents: FlatItem[] = [];
    for (const item of lowerItems) {
      let pid: string | null = item.category.parentCategoryId ?? null;
      while (pid) {
        if (matchedIds.has(pid)) break;
        matchedIds.add(pid);
        const parent = items.find((c) => c.id === pid);
        if (!parent) break;
        if (!matchedParents.find((m) => m.category.id === parent.id)) {
          matchedParents.push({
            category: parent,
            depth: 0,
            parentId: parent.parentCategoryId ?? null,
          });
        }
        pid = parent.parentCategoryId ?? null;
      }
    }
    const combined = [...matchedParents, ...lowerItems].sort((a, b) =>
      a.category.name.localeCompare(b.category.name)
    );
    return combined;
  }, [categoriesQuery.data, search]);

  const visibleItems = useMemo(() => {
    const q = search.trim();
    if (q) return flatItems;

    const parentById = new Map<string, string | null>();
    for (const { category, parentId } of flatItems) {
      parentById.set(category.id, parentId);
    }

    return flatItems.filter(({ category }) => {
      let currentParentId = parentById.get(category.id) ?? null;
      while (currentParentId) {
        if (!expandedIds.has(currentParentId)) return false;
        currentParentId = parentById.get(currentParentId) ?? null;
      }
      return true;
    });
  }, [expandedIds, flatItems, search]);

  const hasChildren = (id: string) =>
    (categoriesQuery.data ?? []).some((c) => c.parentCategoryId === id);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Community Categories</CardTitle>
          <CardDescription>Manage community categories and subcategories</CardDescription>
          <CardAction>
            <Button asChild>
              <Link href="/dashboard/community/categories/create">Create Category</Link>
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
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        No categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleItems.map(({ category: c, depth }) => {
                      const canExpand = hasChildren(c.id);
                      const isExpanded = expandedIds.has(c.id);
                      return (
                        <TableRow key={c.id} className={depth > 0 ? "bg-muted/30" : undefined}>
                          <TableCell className="w-8">
                            {canExpand ? (
                              <button
                                type="button"
                                onClick={() => toggleExpand(c.id)}
                                className="p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                              >
                                <ChevronRight
                                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                />
                              </button>
                            ) : (
                              <span className="block w-6" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col" style={{ paddingLeft: depth * 24 }}>
                              <span className="font-medium">{c.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{c.slug}</TableCell>
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
                                    { id: c.id, patch: { isActive: !c.isActive } },
                                    {
                                      onError: (err) => setNotice(getErrorMessage(err)),
                                    }
                                  )
                                }
                              >
                                {c.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <EditCategoryButton category={c} onEdit={setEditingCategory} />
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingCategory && (
        <CategoryEditModal category={editingCategory} onClose={() => setEditingCategory(null)} />
      )}
    </div>
  );
}
