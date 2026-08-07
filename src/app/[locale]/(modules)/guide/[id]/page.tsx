"use client";

import { ListChecks } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("surfaces.guide.detail");
  const listT = useTranslations("surfaces.guide.list");
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
      const translation = guide.translations?.find((tr) => tr.language === language);
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

  const guideTitle =
    guide?.translations?.find((tr) => tr.language === language)?.name ?? "Untitled";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/guide">{listT("title")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-foreground">{guideTitle}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
            {guideTitle}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("manageDesc")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveGuide} disabled={updateGuide.isPending || !dirty}>
            {updateGuide.isPending ? t("saving") : t("save")}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/guide/${id}/edit`}>{t("editSteps")}</Link>
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[13.5px] font-semibold text-ink">{guideTitle}</h2>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guide-name">{t("name", { lang: language.toUpperCase() })}</Label>
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
              <Label htmlFor="guide-slug">{t("slug")}</Label>
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
              <Label>{t("coverImage")}</Label>
              <div className="flex items-start gap-4">
                {editImageUrl ? (
                  <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-line bg-canvas-2">
                    {/* biome-ignore lint/performance/noImgElement: external guide cover image */}
                    <img
                      src={editImageUrl}
                      alt="Guide cover"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-line bg-canvas-2 text-xs text-muted-foreground">
                    {t("noImage")}
                  </div>
                )}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? "…" : editImageUrl ? t("replace") : t("upload")}
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
                      {t("remove")}
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
              <Label htmlFor="guide-description">
                {t("description", { lang: language.toUpperCase() })}
              </Label>
              <textarea
                id="guide-description"
                value={editDescription}
                onChange={(e) => {
                  setEditDescription(e.target.value);
                  setDirty(true);
                }}
                placeholder="Short guide description"
                rows={2}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("sectors")}</Label>
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
              <Label>{t("tags")}</Label>
              {tagsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading tags&hellip;</p>
              ) : (
                <TagSelect
                  options={tags.map((tg) => ({ id: tg.id, label: tg.nameEn, group: tg.group }))}
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
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-[13.5px] font-semibold text-ink">{t("steps")}</h2>
            <span className="text-[11.5px] text-muted-foreground">
              {t("stepsCount", { count: steps.length })}
            </span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/guide/${id}/edit?step=new`}>{t("addStep")}</Link>
          </Button>
        </div>

        <div>
          {stepsQuery.isError ? (
            <p className="px-5 py-4 text-sm text-destructive">
              Failed to load steps: {getErrorMessage(stepsQuery.error)}
            </p>
          ) : steps.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title={t("noStepsTitle")}
              description={t("noStepsDesc")}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">{t("number")}</TableHead>
                    <TableHead>{t("steps")}</TableHead>
                    <TableHead className="w-40 text-right">{listT("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {steps.map((step, idx) => {
                    const stepTitle =
                      step.translations?.find((tr) => tr.language === language)?.title ??
                      `Step ${idx + 1}`;
                    return (
                      <TableRow key={step.id}>
                        <TableCell>
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">
                            {String(step.sortOrder).padStart(2, "0")}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-ink">{stepTitle}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/guide/${id}/edit?step=${step.id}`}>
                                {listT("edit")}
                              </Link>
                            </Button>
                            <ConfirmDialog
                              title={t("deleteStep")}
                              description="Are you sure you want to delete this step? This may trigger reordering of remaining steps."
                              confirmLabel={t("deleteStep")}
                              variant="destructive"
                              onConfirm={() =>
                                deleteStepMutation.mutate({ id: step.id, guideId: id })
                              }
                            >
                              <Button size="sm" variant="outline">
                                {t("deleteStep")}
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
        </div>
      </section>
    </div>
  );
}
