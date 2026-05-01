"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useAdminCreateCategory,
  useAdminParentCategories,
} from "@/app/(admin)/dashboard/community/_services/community.hook";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/utils";

export default function CreateCommunityCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const parentQuery = useAdminParentCategories();
  const createMutation = useAdminCreateCategory();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    createMutation.mutate(
      {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        parentCategoryId: parentCategoryId || undefined,
        isActive,
      },
      {
        onSuccess: (data) => {
          setNotice(`Created: ${data.id}`);
          router.push("/dashboard/community/categories");
        },
        onError: (err) => setNotice(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Create Category</CardTitle>
          <CardDescription>Create a community category via admin API</CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link href="/dashboard/community/categories">Back to Categories</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Announcements"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. announcements"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentCategory">Parent Category (optional)</Label>
              <select
                id="parentCategory"
                value={parentCategoryId}
                onChange={(e) => setParentCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">— None —</option>
                {parentQuery.isLoading ? (
                  <option value="" disabled>
                    Loading categories&hellip;
                  </option>
                ) : null}
                {parentQuery.isError ? (
                  <option value="" disabled>
                    Failed to load categories
                  </option>
                ) : null}
                {parentQuery.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Active</span>
                <span className="text-xs text-muted-foreground">
                  Inactive categories won&apos;t show up in the public list.
                </span>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating&hellip;" : "Create"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/dashboard/community/categories">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
