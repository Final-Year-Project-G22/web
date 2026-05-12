"use client";

import { useState } from "react";
import {
  useCreateSector,
  useDeleteSector,
  useSectorList,
  useUpdateSector,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SectorResponse } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";

const CREATE_SENTINEL = "__create__";

export default function SectorsPage() {
  const sectorsQuery = useSectorList({ pageSize: 200 });
  const createSector = useCreateSector();
  const updateSector = useUpdateSector();
  const deleteSector = useDeleteSector();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nameEn: "",
    nameAm: "",
    slug: "",
    descEn: "",
    descAm: "",
    icon: "",
    parentId: "",
    sortOrder: 1,
    isActive: true,
  });

  const sectors = sectorsQuery.data?.data ?? [];

  function openCreate() {
    setEditingId(CREATE_SENTINEL);
    setForm({
      nameEn: "",
      nameAm: "",
      slug: "",
      descEn: "",
      descAm: "",
      icon: "",
      parentId: "",
      sortOrder: 1,
      isActive: true,
    });
  }

  function openEdit(s: SectorResponse) {
    setEditingId(s.id);
    setForm({
      nameEn: s.nameEn,
      nameAm: s.nameAm,
      slug: s.slug,
      descEn: s.descEn ?? "",
      descAm: s.descAm ?? "",
      icon: s.icon ?? "",
      parentId: s.parentId ?? "",
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    });
  }

  function closeForm() {
    setEditingId(null);
    setForm({
      nameEn: "",
      nameAm: "",
      slug: "",
      descEn: "",
      descAm: "",
      icon: "",
      parentId: "",
      sortOrder: 1,
      isActive: true,
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (editingId === CREATE_SENTINEL) {
      createSector.mutate(
        {
          nameEn: form.nameEn,
          nameAm: form.nameAm,
          slug: form.slug,
          descEn: form.descEn || undefined,
          descAm: form.descAm || undefined,
          icon: form.icon || undefined,
          parentId: form.parentId || undefined,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
        },
        { onSuccess: () => closeForm() }
      );
    } else if (editingId) {
      updateSector.mutate(
        {
          id: editingId,
          patch: {
            nameEn: form.nameEn,
            nameAm: form.nameAm,
            slug: form.slug,
            descEn: form.descEn || undefined,
            descAm: form.descAm || undefined,
            icon: form.icon || undefined,
            parentId: form.parentId || undefined,
            sortOrder: form.sortOrder,
            isActive: form.isActive,
          },
        },
        { onSuccess: () => closeForm() }
      );
    }
  }

  const isMutating = createSector.isPending || updateSector.isPending;
  const mutationError = createSector.error ?? updateSector.error;
  const isCreating = editingId === CREATE_SENTINEL;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Sectors</CardTitle>
          <CardDescription>Manage industry sectors used across the application</CardDescription>
          <CardAction>
            {editingId ? (
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
            ) : (
              <Button onClick={openCreate}>Create Sector</Button>
            )}
          </CardAction>
        </CardHeader>

        {editingId ? (
          <CardContent key={editingId} className="border-b pt-4">
            <p className="mb-1 text-sm font-medium text-muted-foreground">
              {isCreating ? "Create Sector" : "Edit Sector"}
            </p>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sec-nameEn">Name (EN)</Label>
                  <Input
                    id="sec-nameEn"
                    placeholder="Information Technology"
                    value={form.nameEn}
                    onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sec-nameAm">Name (AM)</Label>
                  <Input
                    id="sec-nameAm"
                    placeholder="ኢንፎርሜሽን ቴክኖሎጂ"
                    value={form.nameAm}
                    onChange={(e) => setForm((p) => ({ ...p, nameAm: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sec-slug">Slug</Label>
                  <Input
                    id="sec-slug"
                    placeholder="information-technology"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sec-descEn">Description (EN)</Label>
                  <textarea
                    id="sec-descEn"
                    value={form.descEn}
                    onChange={(e) => setForm((p) => ({ ...p, descEn: e.target.value }))}
                    placeholder="Brief description in English"
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sec-descAm">Description (AM)</Label>
                  <textarea
                    id="sec-descAm"
                    value={form.descAm}
                    onChange={(e) => setForm((p) => ({ ...p, descAm: e.target.value }))}
                    placeholder="Brief description in Amharic"
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="sec-icon">Icon</Label>
                  <Input
                    id="sec-icon"
                    placeholder="building2"
                    value={form.icon}
                    onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parent Sector</Label>
                  <Select
                    value={form.parentId}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, parentId: v === "__none__" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None (top-level)</SelectItem>
                      {sectors
                        .filter((s) => s.id !== editingId)
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nameEn}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sec-sort">Sort Order</Label>
                  <Input
                    id="sec-sort"
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
          {sectorsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading sectors&hellip;</p>
          ) : sectorsQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(sectorsQuery.error)}
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Name (AM)</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No sectors found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sectors.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.nameEn}</TableCell>
                        <TableCell>{s.nameAm}</TableCell>
                        <TableCell className="text-muted-foreground">{s.slug}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.parentId
                            ? (sectors.find((p) => p.id === s.parentId)?.nameEn ?? s.parentId)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {s.isActive ? (
                            <span className="text-xs text-green-600">Active</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                              Edit
                            </Button>
                            <ConfirmDialog
                              title="Delete Sector"
                              description={`Are you sure you want to delete "${s.nameEn}"?`}
                              confirmLabel="Delete"
                              variant="destructive"
                              onConfirm={() => deleteSector.mutate(s.id)}
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
