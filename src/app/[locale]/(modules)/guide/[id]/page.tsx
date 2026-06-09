"use client";

import { ListChecks } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSectorList, useTagList } from "@/app/[locale]/(modules)/admin/_services/taxonomy.hook";
import {
  useAdminGuideDetail,
  useAdminGuideSteps,
  useDeleteStep,
  useUpdateGuide,
} from "@/app/[locale]/(modules)/guide/_services/guide.hook";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagSelect } from "@/components/ui/multi-select";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { uploadGuideImage } from "@/lib/api/services/admin-guides";
import { getErrorMessage } from "@/lib/utils";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

export default function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const language = useAdminLanguageStore((s) => s.language);

  const guideQuery = useAdminGuideDetail(id, { locale: language });
  const stepsQuery = useAdminGuideSteps(id, { locale: language, pageSize: 100 });
  const sectorsQuery = useSectorList({ pageSize: 200 });
  const tagsQuery = useTagList({ pageSize: 200 });

  const updateGuide = useUpdateGuide();
  const deleteStepMutation = useDeleteStep();

  const sectors = sectorsQuery.data?.data ?? [];
  const tags = tagsQuery.data?.data ?? [];
  const guide = guideQuery.data;
  const steps = stepsQuery.data?.steps ?? [];

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSectorIds, setEditSectorIds] = useState<string[]>([]);
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (guide) {
      const translation = guide.translations?.find((t) => t.language === language);
      setEditName(translation?.name ?? "");
      setEditDescription(translation?.description ?? "");
      setEditSlug(guide.slug);
      setEditImageUrl(guide.imageUrl ?? "");
      setEditSectorIds(guide.sectorIds ?? []);
      setEditTagIds(guide.tagIds ?? []);
    }
  }, [guide, language]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    uploadGuideImage(id, { file })
      .then((res) => {
        if (res.status !== 200) throw res.data;
        setEditImageUrl(res.data.imageUrl);
        setDirty(true);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setUploading(false));
  }

  async function handleSaveGuide() {
    try {
      await updateGuide.mutateAsync({
        id,
        patch: {
          slug: editSlug,
          sectorIds: editSectorIds.length > 0 ? editSectorIds : null,
          tagIds: editTagIds.length > 0 ? editTagIds : null,
          translations: [{ language, name: editName, description: editDescription }],
          translationMode: "merge" as const,
        },
      });
      setDirty(false);
      toast.success("Guide saved");
    } catch (err) {
      toast.error(`Failed to save: ${getErrorMessage(err)}`);
    }
  }

  if (guideQuery.isLoading || stepsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl py-8">
        <CardSkeleton lines={6} />
      </div>
    );
  }

  if (guideQuery.isError) {
    return (
      <div className="mx-auto max-w-7xl py-8">
        <InlineError error={guideQuery.error} onRetry={() => guideQuery.refetch()} />
      </div>
    );
  }

  const guideTitle = guide?.translations?.find((t) => t.language === language)?.name ?? "Untitled";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/guide">Guides</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-foreground">{guideTitle}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{guideTitle}</CardTitle>
          <CardDescription>Manage guide details and steps</CardDescription>
          <CardAction className="flex gap-2">
            <Button onClick={handleSaveGuide} disabled={updateGuide.isPending}>
              {updateGuide.isPending ? "Saving..." : "Save"}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/guide/${id}/edit`}>Edit Steps</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guide-name">Name ({language.toUpperCase()})</Label>
              <Input
                id="guide-name"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setDirty(true);
                }}
                placeholder="Guide name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guide-slug">Slug</Label>
              <Input
                id="guide-slug"
                value={editSlug}
                onChange={(e) => {
                  setEditSlug(e.target.value);
                  setDirty(true);
                }}
                placeholder="guide-slug"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Cover Image</Label>
              <div className="flex items-start gap-4">
                {editImageUrl ? (
                  <div className="relative h-24 w-40 overflow-hidden rounded-lg border bg-slate-50">
                    <img
                      src={editImageUrl}
                      alt="Guide cover"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {editImageUrl ? "Replace" : "Upload"}
                  </Button>
                  {editImageUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditImageUrl("");
                        setDirty(true);
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="guide-description">Description ({language.toUpperCase()})</Label>
              <textarea
                id="guide-description"
                value={editDescription}
                onChange={(e) => {
                  setEditDescription(e.target.value);
                  setDirty(true);
                }}
                placeholder="Short guide description"
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Sectors</Label>
              {sectorsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading sectors&hellip;</p>
              ) : (
                <TagSelect
                  options={sectors.map((s) => ({ id: s.id, label: s.nameEn }))}
                  selected={editSectorIds}
                  onChange={(ids) => {
                    setEditSectorIds(ids);
                    setDirty(true);
                  }}
                  placeholder="Search sectors..."
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              {tagsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading tags&hellip;</p>
              ) : (
                <TagSelect
                  options={tags.map((t) => ({ id: t.id, label: t.nameEn, group: t.group }))}
                  selected={editTagIds}
                  onChange={(ids) => {
                    setEditTagIds(ids);
                    setDirty(true);
                  }}
                  placeholder="Search tags..."
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Steps</CardTitle>
          <CardDescription>
            {steps.length} step{steps.length !== 1 ? "s" : ""}
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href={`/guide/${id}/edit?step=new`}>Add Step</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {stepsQuery.isError ? (
            <p className="py-4 text-sm text-destructive">
              Failed to load steps: {getErrorMessage(stepsQuery.error)}
            </p>
          ) : steps.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No steps yet"
              description="Add the first step to this guide."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {steps.map((step, idx) => {
                    const stepTitle =
                      step.translations?.find((t) => t.language === language)?.title ??
                      `Step ${idx + 1}`;
                    return (
                      <TableRow key={step.id}>
                        <TableCell className="text-muted-foreground">{step.sortOrder}</TableCell>
                        <TableCell className="font-medium">{stepTitle}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/guide/${id}/edit?step=${step.id}`}>Edit</Link>
                            </Button>
                            <ConfirmDialog
                              title="Delete Step"
                              description="Are you sure you want to delete this step? This may trigger reordering of remaining steps."
                              confirmLabel="Delete"
                              variant="destructive"
                              onConfirm={() =>
                                deleteStepMutation.mutate({ id: step.id, guideId: id })
                              }
                            >
                              <Button size="sm" variant="outline">
                                Delete
                              </Button>
                            </ConfirmDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
