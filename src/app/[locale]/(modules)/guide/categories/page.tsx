"use client";

import { useState } from "react";
import {
  useAdminGuideCategoryTree,
  useCreateGuideCategory,
  useDeleteGuideCategory,
  useUpdateGuideCategory,
} from "@/app/[locale]/(modules)/guide/_services/guide.hook";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminCategoryDTO } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";

const CREATE_SENTINEL = "__create__";

function flattenTree(
  nodes: AdminCategoryDTO[],
  depth = 0
): { node: AdminCategoryDTO; depth: number }[] {
  const result: { node: AdminCategoryDTO; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    if (node.children) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

export default function GuideCategoriesPage() {
  const categoriesQuery = useAdminGuideCategoryTree({ includeInactive: true });
  const createCategory = useCreateGuideCategory();
  const updateCategory = useUpdateGuideCategory();
  const deleteCategory = useDeleteGuideCategory();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", parentId: "" });

  const categories = categoriesQuery.data ?? [];
  const flatItems = flattenTree(categories);

  function openCreate() {
    setEditingId(CREATE_SENTINEL);
    setForm({ name: "", slug: "", parentId: "" });
  }

  function openEdit(node: AdminCategoryDTO) {
    setEditingId(node.id);
    setForm({ name: node.name, slug: node.slug, parentId: node.parentId ?? "" });
  }

  function closeForm() {
    setEditingId(null);
    setForm({ name: "", slug: "", parentId: "" });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (editingId === CREATE_SENTINEL) {
      createCategory.mutate(
        {
          slug: form.slug,
          sortOrder: 1,
          parentId: form.parentId || undefined,
          translations: [
            { language: "en", name: form.name },
            { language: "am", name: form.name },
          ],
        },
        { onSuccess: () => closeForm(), onError: () => {} }
      );
    } else if (editingId) {
      updateCategory.mutate(
        {
          id: editingId,
          patch: {
            slug: form.slug,
            parentId: form.parentId || undefined,
            translations: [
              { language: "en", name: form.name, description: "" },
              { language: "am", name: form.name, description: "" },
            ],
          },
        },
        { onSuccess: () => closeForm(), onError: () => {} }
      );
    }
  }

  const isMutating = createCategory.isPending || updateCategory.isPending;
  const mutationError = createCategory.error ?? updateCategory.error;
  const isCreating = editingId === CREATE_SENTINEL;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Guide Categories</CardTitle>
          <CardDescription>Manage categories used by the guide module</CardDescription>
          <CardAction>
            {editingId ? (
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
            ) : (
              <Button onClick={openCreate}>Create Category</Button>
            )}
          </CardAction>
        </CardHeader>

        {editingId ? (
          <CardContent key={editingId} className="border-b pt-4">
            <p className="mb-1 text-sm font-medium text-muted-foreground">
              {isCreating ? "Create Category" : "Edit Category"}
            </p>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input
                    id="cat-name"
                    placeholder="Legal & Compliance"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-slug">Slug</Label>
                  <Input
                    id="cat-slug"
                    placeholder="legal-compliance"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <Select
                    value={form.parentId}
                    onValueChange={(v) =>
                      setForm((prev) => ({ ...prev, parentId: v === "__none__" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None (top-level)</SelectItem>
                      {categories
                        .filter((c) => c.id !== editingId)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {mutationError ? (
                <p className="text-sm text-destructive">{getErrorMessage(mutationError)}</p>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit" disabled={isMutating}>
                  {isMutating ? "Saving..." : isCreating ? "Create" : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        ) : null}

        <CardContent className="pt-4">
          {categoriesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading categories&hellip;</p>
          ) : categoriesQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(categoriesQuery.error)}
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flatItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        No categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    flatItems.map(({ node, depth }) => (
                      <TableRow key={node.id}>
                        <TableCell className="font-medium">
                          <span style={{ paddingLeft: `${depth * 1.5}rem` }}>{node.name}</span>
                        </TableCell>
                        <TableCell>{node.slug}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(node)}>
                              Edit
                            </Button>
                            <ConfirmDialog
                              title="Delete Category"
                              description={`Are you sure you want to delete "${node.name}"?`}
                              confirmLabel="Delete"
                              variant="destructive"
                              onConfirm={() => deleteCategory.mutate(node.id)}
                            >
                              <Button size="sm" variant="outline">
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
