"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSectorList, useTagList } from "@/app/[locale]/(modules)/admin/_services/taxonomy.hook";
import { useCreateGuide } from "@/app/[locale]/(modules)/guide/_services/guide.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagSelect } from "@/components/ui/multi-select";
import { getErrorMessage } from "@/lib/utils";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

export default function CreateGuidePage() {
  const router = useRouter();
  const t = useTranslations("surfaces.guide.create");
  const language = useAdminLanguageStore((s) => s.language);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [sectorIds, setSectorIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);

  const createGuide = useCreateGuide();
  const sectorsQuery = useSectorList({ pageSize: 200 });
  const tagsQuery = useTagList({ pageSize: 200 });

  const sectors = sectorsQuery.data?.data ?? [];
  const tags = tagsQuery.data?.data ?? [];

  function onCreateGuide(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createGuide.mutate(
      {
        slug,
        sectorIds: sectorIds.length > 0 ? sectorIds : null,
        tagIds: tagIds.length > 0 ? tagIds : null,
        sortOrder: 1,
        translations: [{ language, name: title, description: "" }],
      },
      {
        onSuccess: (data) => {
          router.push(`/guide/${data.id}`);
        },
      }
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
            {t("title")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[13.5px] font-semibold text-ink">{t("title")}</h2>
        </div>

        <form className="space-y-5 p-5" onSubmit={onCreateGuide}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">{t("name", { lang: language.toUpperCase() })}</Label>
              <Input
                id="title"
                placeholder="How to Register a Sole Proprietorship"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t("slug")}</Label>
              <Input
                id="slug"
                placeholder="register-sole-proprietorship"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("sectors")}</Label>
              {sectorsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading sectors&hellip;</p>
              ) : (
                <TagSelect
                  options={sectors.map((s) => ({ id: s.id, label: s.nameEn }))}
                  selected={sectorIds}
                  onChange={setSectorIds}
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
                  selected={tagIds}
                  onChange={setTagIds}
                  placeholder="Search tags..."
                />
              )}
            </div>
          </div>

          {createGuide.isError ? (
            <p className="text-sm text-destructive">
              Failed to create: {getErrorMessage(createGuide.error)}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="outline" onClick={() => router.push("/guide")}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createGuide.isPending}>
              {createGuide.isPending ? "Creating…" : t("createAndContinue")}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
