"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CategoryTranslationDrawer } from "@/app/[locale]/(modules)/library/_components/category-translation-drawer";
import {
  useLibraryCategory,
  useUpdateLibraryCategory,
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
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/utils";

const categoryEditSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  icon: z.string().optional(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean().optional(),
});

type CategoryEditFormData = z.infer<typeof categoryEditSchema>;

export default function LibraryCategoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [notice, setNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const categoryQuery = useLibraryCategory(id);
  const updateMutation = useUpdateLibraryCategory();

  const form = useForm<CategoryEditFormData>({
    resolver: zodResolver(categoryEditSchema),
    defaultValues: {
      name: "",
      slug: "",
      icon: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (categoryQuery.data) {
      const d = categoryQuery.data;
      form.reset({
        name: d.name,
        slug: d.slug,
        icon: d.icon ?? "",
        sortOrder: d.sortOrder,
        isActive: d.isActive,
      });
    }
  }, [categoryQuery.data, form]);

  const onSubmit = (data: CategoryEditFormData) => {
    setNotice(null);
    updateMutation.mutate(
      {
        id,
        payload: {
          name: data.name.trim(),
          slug: data.slug.trim(),
          icon: data.icon?.trim() || undefined,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        },
      },
      {
        onSuccess: () => router.push("/library/categories"),
        onError: (err) => setNotice(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Edit Category</CardTitle>
          <CardDescription>Update category metadata and translations</CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setDrawerOpen(true)}
                disabled={updateMutation.isPending}
              >
                Manage Translations
              </Button>
              <Button asChild variant="outline">
                <Link href="/library/categories">Back to Categories</Link>
              </Button>
            </div>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          {categoryQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading category&hellip;</p>
          ) : categoryQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(categoryQuery.error)}
            </p>
          ) : (
            <>
              {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" {...form.register("slug")} />
                  {form.formState.errors.slug && (
                    <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (optional)</Label>
                  <Input id="icon" {...form.register("icon")} />
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
                    <p className="text-sm text-red-500">
                      {form.formState.errors.sortOrder.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Active</span>
                    <span className="text-xs text-muted-foreground">
                      Inactive categories won&apos;t appear in the public library.
                    </span>
                  </div>
                  <Switch
                    checked={form.watch("isActive")}
                    onCheckedChange={(v) =>
                      form.setValue("isActive", v, {
                        shouldValidate: true,
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button asChild type="button" variant="outline">
                    <Link href="/library/categories">Cancel</Link>
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {drawerOpen && (
        <CategoryTranslationDrawer categoryId={id} onClose={() => setDrawerOpen(false)} />
      )}
    </div>
  );
}
