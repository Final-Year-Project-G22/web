"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  useLibraryCategories,
  useTemplateGroup,
  useUpdateTemplateGroup,
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

const groupEditSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(200),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  format: z.string().min(1, "Format is required"),
  tierAccess: z.string().min(1, "Tier is required"),
  requiresAuth: z.boolean(),
  sortOrder: z.number().int().min(0),
  defaultLanguage: z.string().min(1, "Language is required"),
  isActive: z.boolean().optional(),
});

type GroupEditFormData = z.infer<typeof groupEditSchema>;

export default function LibraryTemplateGroupEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [notice, setNotice] = useState<string | null>(null);

  const groupQuery = useTemplateGroup(id);
  const categoriesQuery = useLibraryCategories({ includeInactive: false });
  const updateMutation = useUpdateTemplateGroup();

  const form = useForm<GroupEditFormData>({
    resolver: zodResolver(groupEditSchema),
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
      isActive: true,
    },
  });

  useEffect(() => {
    if (groupQuery.data) {
      const d = groupQuery.data;
      form.reset({
        name: d.name,
        slug: d.slug,
        description: d.description ?? "",
        categoryId: d.categoryId,
        format: d.format,
        tierAccess: d.tierAccess,
        requiresAuth: d.requiresAuth,
        sortOrder: d.sortOrder,
        defaultLanguage: d.defaultLanguage,
        isActive: d.isActive,
      });
    }
  }, [groupQuery.data, form]);

  const onSubmit = (data: GroupEditFormData) => {
    setNotice(null);
    updateMutation.mutate(
      {
        id,
        payload: {
          name: data.name.trim(),
          slug: data.slug.trim(),
          description: data.description?.trim() || undefined,
          categoryId: data.categoryId,
          format: data.format,
          tierAccess: data.tierAccess,
          requiresAuth: data.requiresAuth,
          sortOrder: data.sortOrder,
          defaultLanguage: data.defaultLanguage,
          isActive: data.isActive,
        },
      },
      {
        onSuccess: () => router.push("/library/template-groups"),
        onError: (err) => setNotice(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Edit Template Group</CardTitle>
          <CardDescription>Update template group metadata</CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link href="/library/template-groups">Back to Groups</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          {groupQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading group&hellip;</p>
          ) : groupQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(groupQuery.error)}
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
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input id="description" {...form.register("description")} />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.description.message}
                    </p>
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
                    {categoriesQuery.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.categoryId && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.categoryId.message}
                    </p>
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
                      <p className="text-sm text-red-500">
                        {form.formState.errors.tierAccess.message}
                      </p>
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
                      <p className="text-sm text-red-500">
                        {form.formState.errors.sortOrder.message}
                      </p>
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

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Active</span>
                    <span className="text-xs text-muted-foreground">
                      Inactive groups won&apos;t appear in the public library.
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
                    <Link href="/library/template-groups">Cancel</Link>
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
