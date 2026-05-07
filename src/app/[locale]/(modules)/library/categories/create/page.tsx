"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateLibraryCategory,
  useLibraryCategories,
} from "@/app/[locale]/(modules)/library/_services/library.hook";
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
import { getErrorMessage } from "@/lib/utils";

const categoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0),
  parentCategoryId: z.string().optional(),
});

type CategoryCreateFormData = z.infer<typeof categoryCreateSchema>;

export default function LibraryCategoryCreatePage() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<CategoryCreateFormData>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: {
      name: "",
      slug: "",
      icon: "",
      sortOrder: 0,
      parentCategoryId: "",
    },
  });

  const categoriesQuery = useLibraryCategories({ includeInactive: false });
  const createMutation = useCreateLibraryCategory();

  const onSubmit = (data: CategoryCreateFormData) => {
    setNotice(null);
    createMutation.mutate(
      {
        name: data.name.trim(),
        slug: data.slug.trim(),
        icon: data.icon?.trim() || undefined,
        sortOrder: data.sortOrder,
        parentCategoryId: data.parentCategoryId || undefined,
      },
      {
        onSuccess: () => router.push("/library/categories"),
        onError: (err) => setNotice(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Create Category</CardTitle>
          <CardDescription>Create a new library category</CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link href="/library/categories">Back to Categories</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g. Business Registration"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...form.register("slug")}
                placeholder="e.g. business-registration"
              />
              {form.formState.errors.slug && (
                <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (optional)</Label>
              <Input id="icon" {...form.register("icon")} placeholder="e.g. briefcase" />
              {form.formState.errors.icon && (
                <p className="text-sm text-red-500">{form.formState.errors.icon.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
              {form.formState.errors.sortOrder && (
                <p className="text-sm text-red-500">{form.formState.errors.sortOrder.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentCategoryId">Parent Category (optional)</Label>
              <select
                id="parentCategoryId"
                {...form.register("parentCategoryId")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">— None —</option>
                {categoriesQuery.isLoading ? (
                  <option value="" disabled>
                    Loading categories&hellip;
                  </option>
                ) : null}
                {categoriesQuery.isError ? (
                  <option value="" disabled>
                    Failed to load categories
                  </option>
                ) : null}
                {categoriesQuery.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/library/categories">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
