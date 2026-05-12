"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreateGuide } from "@/app/[locale]/(modules)/guide/_services/guide.hook";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/utils";

export default function CreateGuidePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const createGuide = useCreateGuide();

  function onCreateGuide(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    createGuide.mutate(
      {
        slug,
        sectorIds: null,
        tagIds: null,
        sortOrder: 1,
        translations: [
          { language: "en", name: title, description: "" },
          { language: "am", name: title, description: "" },
        ],
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
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
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
