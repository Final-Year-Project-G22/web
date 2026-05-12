"use client";

import { useState } from "react";
import {
  useCreateTag,
  useDeleteTag,
  useTagList,
  useUpdateTag,
} from "@/app/[locale]/(modules)/admin/_services/taxonomy.hook";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TagResponse } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";

const CREATE_SENTINEL = "__create__";

export default function TagsPage() {
  const tagsQuery = useTagList({ pageSize: 200 });
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nameEn: "",
    nameAm: "",
    slug: "",
    group: "",
    descEn: "",
    descAm: "",
    icon: "",
    sortOrder: 1,
    isActive: true,
    isMultiSelect: false,
  });

  const tags = tagsQuery.data?.data ?? [];

  function openCreate() {
    setEditingId(CREATE_SENTINEL);
    setForm({
      nameEn: "",
      nameAm: "",
      slug: "",
      group: "",
      descEn: "",
      descAm: "",
      icon: "",
      sortOrder: 1,
      isActive: true,
      isMultiSelect: false,
    });
  }

  function openEdit(t: TagResponse) {
    setEditingId(t.id);
    setForm({
      nameEn: t.nameEn,
      nameAm: t.nameAm,
      slug: t.slug,
      group: t.group,
      descEn: t.descEn ?? "",
      descAm: t.descAm ?? "",
      icon: t.icon ?? "",
      sortOrder: t.sortOrder,
      isActive: t.isActive,
      isMultiSelect: t.isMultiSelect,
    });
  }

  function closeForm() {
    setEditingId(null);
    setForm({
      nameEn: "",
      nameAm: "",
      slug: "",
      group: "",
      descEn: "",
      descAm: "",
      icon: "",
      sortOrder: 1,
      isActive: true,
      isMultiSelect: false,
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (editingId === CREATE_SENTINEL) {
      createTag.mutate(
        {
          nameEn: form.nameEn,
          nameAm: form.nameAm,
          slug: form.slug,
          group: form.group,
          descEn: form.descEn || undefined,
          descAm: form.descAm || undefined,
          icon: form.icon || undefined,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
          isMultiSelect: form.isMultiSelect,
        },
        { onSuccess: () => closeForm() }
      );
    } else if (editingId) {
      updateTag.mutate(
        {
          id: editingId,
          patch: {
            nameEn: form.nameEn,
            nameAm: form.nameAm,
            slug: form.slug,
            group: form.group,
            descEn: form.descEn || undefined,
            descAm: form.descAm || undefined,
            icon: form.icon || undefined,
            sortOrder: form.sortOrder,
            isActive: form.isActive,
            isMultiSelect: form.isMultiSelect,
          },
        },
        { onSuccess: () => closeForm() }
      );
    }
  }

  const isMutating = createTag.isPending || updateTag.isPending;
  const mutationError = createTag.error ?? updateTag.error;
  const isCreating = editingId === CREATE_SENTINEL;

  const groups = Array.from(new Set(tags.map((t) => t.group).filter(Boolean))).sort();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Tags</CardTitle>
          <CardDescription>Manage cross-cutting tags used across the application</CardDescription>
          <CardAction>
            {editingId ? (
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
            ) : (
              <Button onClick={openCreate}>Create Tag</Button>
            )}
          </CardAction>
        </CardHeader>

        {editingId ? (
          <CardContent key={editingId} className="border-b pt-4">
            <p className="mb-1 text-sm font-medium text-muted-foreground">
              {isCreating ? "Create Tag" : "Edit Tag"}
            </p>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="tag-nameEn">Name (EN)</Label>
                  <Input
                    id="tag-nameEn"
                    placeholder="Startup"
                    value={form.nameEn}
                    onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-nameAm">Name (AM)</Label>
                  <Input
                    id="tag-nameAm"
                    placeholder="ጀማሪ"
                    value={form.nameAm}
                    onChange={(e) => setForm((p) => ({ ...p, nameAm: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-slug">Slug</Label>
                  <Input
                    id="tag-slug"
                    placeholder="startup"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tag-descEn">Description (EN)</Label>
                  <textarea
                    id="tag-descEn"
                    value={form.descEn}
                    onChange={(e) => setForm((p) => ({ ...p, descEn: e.target.value }))}
                    placeholder="Brief description in English"
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-descAm">Description (AM)</Label>
                  <textarea
                    id="tag-descAm"
                    value={form.descAm}
                    onChange={(e) => setForm((p) => ({ ...p, descAm: e.target.value }))}
                    placeholder="Brief description in Amharic"
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-5">
                <div className="space-y-2">
                  <Label htmlFor="tag-group">Group</Label>
                  <Input
                    id="tag-group"
                    placeholder="business_stage"
                    value={form.group}
                    onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-icon">Icon</Label>
                  <Input
                    id="tag-icon"
                    placeholder="rocket"
                    value={form.icon}
                    onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-sort">Sort Order</Label>
                  <Input
                    id="tag-sort"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Active</Label>
                  <div className="pt-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Multi-Select</Label>
                  <div className="pt-2">
                    <Switch
                      checked={form.isMultiSelect}
                      onCheckedChange={(v) => setForm((p) => ({ ...p, isMultiSelect: v }))}
                    />
                  </div>
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
          {tagsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading tags&hellip;</p>
          ) : tagsQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(tagsQuery.error)}
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Name (AM)</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Multi</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground">
                        No tags found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tags.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.nameEn}</TableCell>
                        <TableCell>{t.nameAm}</TableCell>
                        <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                        <TableCell>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.group}</span>
                        </TableCell>
                        <TableCell>
                          {t.isMultiSelect ? (
                            <span className="text-xs text-green-600">Yes</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {t.isActive ? (
                            <span className="text-xs text-green-600">Active</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                              Edit
                            </Button>
                            <ConfirmDialog
                              title="Delete Tag"
                              description={`Are you sure you want to delete "${t.nameEn}"?`}
                              confirmLabel="Delete"
                              variant="destructive"
                              onConfirm={() => deleteTag.mutate(t.id)}
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
