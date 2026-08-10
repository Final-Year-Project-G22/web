"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateTemplateGroup,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/utils";

const FORMAT_OPTIONS = ["PDF", "DOCX", "XLSX"];
const TIER_OPTIONS = ["basic", "pro"];
const LANG_OPTIONS = ["en", "am", "fr", "om", "ti", "so"];

const groupCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  format: z.string().min(1, "Format is required"),
  tierAccess: z.string().min(1, "Tier is required"),
  requiresAuth: z.boolean(),
  sortOrder: z.number().int().min(0),
  defaultLanguage: z.string().min(1, "Language is required"),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type GroupCreateFormData = z.infer<typeof groupCreateSchema>;

export default function LibraryTemplateGroupCreatePage() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<GroupCreateFormData>({
    resolver: zodResolver(groupCreateSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      categoryId: "",
      format: "",
      tierAccess: "",
      requiresAuth: false,
      sortOrder: 0,
      defaultLanguage: "",
      thumbnailUrl: "",
    },
  });

  const categoriesQuery = useLibraryCategories({ includeInactive: false });
  const createMutation = useCreateTemplateGroup();

  const onSubmit = (data: GroupCreateFormData) => {
    setNotice(null);
    createMutation.mutate(
      {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description?.trim() || undefined,
        categoryId: data.categoryId,
        format: data.format,
        tierAccess: data.tierAccess,
        requiresAuth: data.requiresAuth,
        sortOrder: data.sortOrder,
        defaultLanguage: data.defaultLanguage,
        thumbnailUrl: data.thumbnailUrl?.trim() || undefined,
      },
      {
        onSuccess: () => router.push("/library/template-groups"),
        onError: (err) => setNotice(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Create Template Group</CardTitle>
          <CardDescription>Create a new template group in the library</CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link href="/library/template-groups">Back to Groups</Link>
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
                placeholder="e.g. Business Registration Forms"
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
                placeholder="e.g. business-registration-forms"
              />
              {form.formState.errors.slug && (
                <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                {...form.register("description")}
                placeholder="Short description of this group"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                {...form.register("categoryId")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category</option>
                {categoriesQuery.isLoading ? (
                  <option value="" disabled>
                    Loading categories&hellip;
                  </option>
                ) : null}
                {categoriesQuery.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Controller
                  name="format"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMAT_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.format && (
                  <p className="text-sm text-red-500">{form.formState.errors.format.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tierAccess">Tier Access</Label>
                <Controller
                  name="tierAccess"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tierAccess">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIER_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.tierAccess && (
                  <p className="text-sm text-red-500">{form.formState.errors.tierAccess.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Controller
                  name="defaultLanguage"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="defaultLanguage">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANG_OPTIONS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.defaultLanguage && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.defaultLanguage.message}
                  </p>
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
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Require Authentication</span>
                <span className="text-xs text-muted-foreground">
                  Only authenticated users can download templates.
                </span>
              </div>
              <Switch
                checked={form.watch("requiresAuth")}
                onCheckedChange={(v) =>
                  form.setValue("requiresAuth", v, {
                    shouldValidate: true,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
              <Input
                id="thumbnailUrl"
                {...form.register("thumbnailUrl")}
                placeholder="https://example.com/thumbnail.jpg"
              />
              {form.formState.errors.thumbnailUrl && (
                <p className="text-sm text-red-500">{form.formState.errors.thumbnailUrl.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/library/template-groups">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
