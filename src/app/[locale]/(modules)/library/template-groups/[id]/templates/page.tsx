"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  useDeleteTemplate,
  useTemplateGroup,
  useTemplatesByGroup,
  useUpdateTemplate,
} from "@/app/[locale]/(modules)/library/_services/library.hook";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryTemplatesListPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [notice, setNotice] = useState<string | null>(null);

  const groupQuery = useTemplateGroup(groupId);
  const templatesQuery = useTemplatesByGroup(groupId);
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

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
            <BreadcrumbPage>{groupQuery.data?.name ?? groupId}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            {groupQuery.data ? `Templates — ${groupQuery.data.name}` : "Templates"}
          </CardTitle>
          <CardDescription>Manage templates in this group</CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/library/template-groups">Back to Groups</Link>
              </Button>
              <Button asChild>
                <Link href={`/library/template-groups/${groupId}/templates/create`}>
                  Add Template
                </Link>
              </Button>
            </div>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

          {templatesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading templates&hellip;</p>
          ) : templatesQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(templatesQuery.error)}
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(templatesQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground">
                        No templates found in this group.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (templatesQuery.data ?? []).map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell>{t.language}</TableCell>
                        <TableCell>{t.contentType}</TableCell>
                        <TableCell>{formatFileSize(t.fileSize)}</TableCell>
                        <TableCell>v{t.version}</TableCell>
                        <TableCell>
                          <Badge variant={t.isActive ? "default" : "secondary"}>
                            {t.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updateTemplate.isPending}
                              onClick={() =>
                                updateTemplate.mutate(
                                  {
                                    templateId: t.id,
                                    body: {
                                      file: new Blob([]),
                                      isActive: String(!t.isActive),
                                      title: t.title,
                                      description: t.description ?? "",
                                    },
                                  },
                                  {
                                    onError: (err) => setNotice(getErrorMessage(err)),
                                  }
                                )
                              }
                            >
                              {t.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button asChild variant="outline" size="sm">
                              <Link
                                href={`/library/template-groups/${groupId}/templates/${t.id}/edit`}
                              >
                                Edit
                              </Link>
                            </Button>
                            <ConfirmDialog
                              title="Delete Template"
                              description={`Delete template "${t.title}"? This cannot be undone.`}
                              confirmLabel="Delete"
                              variant="destructive"
                              onConfirm={() =>
                                deleteTemplate.mutate(
                                  {
                                    templateId: t.id,
                                    groupId,
                                  },
                                  {
                                    onSuccess: () => setNotice("Template deleted"),
                                    onError: (err) => setNotice(getErrorMessage(err)),
                                  }
                                )
                              }
                            >
                              <Button variant="destructive" size="sm" type="button">
                                Delete
                              </Button>
                            </ConfirmDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
