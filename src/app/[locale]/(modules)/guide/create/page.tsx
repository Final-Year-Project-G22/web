"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSectorList, useTagList } from "@/app/[locale]/(modules)/admin/_services/taxonomy.hook";
import { useCreateGuide } from "@/app/[locale]/(modules)/guide/_services/guide.hook";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagSelect } from "@/components/ui/multi-select";
import { getErrorMessage } from "@/lib/utils";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

export default function CreateGuidePage() {
  const router = useRouter();
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
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Guide</CardTitle>
          <CardDescription>Initialize a new guide before editing steps and content</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={onCreateGuide}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title ({language.toUpperCase()})</Label>
                <Input
                  id="title"
                  placeholder="How to Register a Sole Proprietorship"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="register-sole-proprietorship"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sectors</Label>
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
                <Label>Tags</Label>
                {tagsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading tags&hellip;</p>
                ) : (
                  <TagSelect
                    options={tags.map((t) => ({ id: t.id, label: t.nameEn, group: t.group }))}
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

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/guide")}>
                Cancel
              </Button>
              <Button type="submit" disabled={createGuide.isPending}>
                {createGuide.isPending ? "Creating..." : "Create & Continue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
