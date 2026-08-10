"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useTemplate,
  useTemplateGroup,
  useUpdateTemplate,
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
import { Switch } from "@/components/ui/switch";
import { getErrorMessage } from "@/lib/utils";

const templateEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

type TemplateEditFormData = z.infer<typeof templateEditSchema>;

export default function LibraryTemplateEditPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const templateId = params.templateId as string;

  const [notice, setNotice] = useState<string | null>(null);
  const [file, setFile] = useState<File | undefined>(undefined);

  const groupQuery = useTemplateGroup(groupId);
  const templateQuery = useTemplate(templateId);
  const updateMutation = useUpdateTemplate();

  const form = useForm<TemplateEditFormData>({
    resolver: zodResolver(templateEditSchema),
    defaultValues: {
      title: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (templateQuery.data) {
      const d = templateQuery.data;
      form.reset({
        title: d.title,
        description: d.description ?? "",
        isActive: d.isActive,
      });
    }
  }, [templateQuery.data, form]);

  const onSubmit = (data: TemplateEditFormData) => {
    setNotice(null);
    updateMutation.mutate(
      {
        templateId,
        body: {
          file: file ?? new Blob([]),
          title: data.title.trim(),
          description: data.description?.trim() || "",
          isActive: String(data.isActive),
        },
      },
      {
        onSuccess: () => router.push(`/library/template-groups/${groupId}/templates`),
        onError: (err) => setNotice(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
            <BreadcrumbPage>{templateQuery.data?.title ?? templateId}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Edit Template</CardTitle>
          <CardDescription>Update template metadata or replace the file</CardDescription>
          <CardAction>
            <Button asChild variant="outline">
              <Link href={`/library/template-groups/${groupId}/templates`}>Back to Templates</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          {templateQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading template&hellip;</p>
          ) : templateQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(templateQuery.error)}
            </p>
          ) : (
            <>
              {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}

              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" {...form.register("title")} />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
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
                  <Label htmlFor="file">Replace File (optional, PDF/DOCX/XLSX)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.docx,.xlsx"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] ?? undefined);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to keep the current file.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Active</span>
                    <span className="text-xs text-muted-foreground">
                      Inactive templates won&apos;t be downloadable.
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
                    <Link href={`/library/template-groups/${groupId}/templates`}>Cancel</Link>
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
