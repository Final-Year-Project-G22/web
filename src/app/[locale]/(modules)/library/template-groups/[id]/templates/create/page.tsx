"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreateTemplate,
  useTemplateGroup,
} from "@/app/[locale]/(modules)/library/_services/library.hook";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/utils";

const LANG_OPTIONS = ["en", "am", "fr", "om", "ti", "so"];

const templateCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  language: z.string().min(1, "Language is required").max(10),
  description: z.string().optional(),
  file: z.instanceof(File, { message: "File is required" }),
});

type TemplateCreateFormData = z.infer<typeof templateCreateSchema>;

export default function LibraryTemplateCreatePage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [notice, setNotice] = useState<string | null>(null);

  const groupQuery = useTemplateGroup(groupId);
  const createMutation = useCreateTemplate();

  const form = useForm<TemplateCreateFormData>({
    resolver: zodResolver(templateCreateSchema),
    defaultValues: {
      title: "",
      language: "",
      description: "",
    },
  });

  const onSubmit = (data: TemplateCreateFormData) => {
    setNotice(null);
    createMutation.mutate(
      {
        groupId,
        body: {
          file: data.file,
          title: data.title.trim(),
          language: data.language.trim(),
          description: data.description?.trim() || "",
        },
      },
      {
        onSuccess: () => router.push(`/library/template-groups/${groupId}/templates`),
        onError: (err) => setNotice(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/library">Library</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/library/template-groups">Template Groups</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/library/template-groups/${groupId}/templates`}>
                {groupQuery.data?.name ?? groupId}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Template</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Create Template</CardTitle>
          <CardDescription>Upload a new template file for this group</CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link href={`/library/template-groups/${groupId}/templates`}>Back to Templates</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="e.g. Business Registration Form"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                {...form.register("language")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select language</option>
                {LANG_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              {form.formState.errors.language && (
                <p className="text-sm text-red-500">{form.formState.errors.language.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                {...form.register("description")}
                placeholder="Short description of this template"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File (PDF, DOCX, XLSX)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? undefined;
                  form.setValue("file", file as File, {
                    shouldValidate: true,
                  });
                }}
              />
              {form.formState.errors.file && (
                <p className="text-sm text-red-500">{form.formState.errors.file.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Uploading…" : "Create"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href={`/library/template-groups/${groupId}/templates`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
