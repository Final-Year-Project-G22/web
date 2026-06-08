"use client";

import { Languages, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  useDeleteCampaignTemplate,
  useListCampaignTemplates,
} from "@/app/[locale]/(modules)/notifications/_services/notification.hook";
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
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ListCampaignTemplatesParams } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { CampaignTemplateTranslationDrawer } from "../_components/campaign-template-translation-drawer";

export default function CampaignTemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");

  const params: ListCampaignTemplatesParams = { page, pageSize };
  const templatesQuery = useListCampaignTemplates(params);
  const deleteMutation = useDeleteCampaignTemplate();

  const [drawerTemplateId, setDrawerTemplateId] = useState<string | null>(null);

  function navigate(newPage: number, newPageSize: number) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (newPageSize !== 10) params.set("pageSize", String(newPageSize));
    const qs = params.toString();
    router.replace(`/notifications/campaign-templates${qs ? `?${qs}` : ""}`);
  }

  function openDrawer(templateId: string) {
    setDrawerTemplateId(templateId);
  }

  function closeDrawer() {
    setDrawerTemplateId(null);
  }

  const templates = templatesQuery.data?.data ?? [];
  const totalPages = templatesQuery.data?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Campaign Templates</CardTitle>
          <CardDescription>Manage reusable notification campaign templates</CardDescription>
          <CardAction>
            <Button asChild>
              <Link href="/notifications/campaign-templates/create">Create Template</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {templatesQuery.isLoading ? (
            <TableSkeleton rows={10} columns={4} />
          ) : templatesQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(templatesQuery.error)}
            </p>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No templates found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      templates.map((t) => (
                        <TableRow key={t.id} className="cursor-pointer">
                          <TableCell className="font-medium">
                            <Link
                              href={`/notifications/campaign-templates/${t.id}/edit`}
                              className="hover:underline"
                            >
                              {t.name}
                            </Link>
                          </TableCell>
                          <TableCell>{t.description || "—"}</TableCell>
                          <TableCell>
                            {t.createdAt
                              ? new Intl.DateTimeFormat("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }).format(new Date(t.createdAt))
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => openDrawer(t.id)}>
                                <Languages className="w-4 h-4 mr-1" />
                                Translation
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/notifications/campaign-templates/${t.id}/edit`}>
                                  Edit
                                </Link>
                              </Button>
                              <ConfirmDialog
                                title="Delete Template"
                                description={`Are you sure you want to delete "${t.name}"? This action cannot be undone.`}
                                confirmLabel="Delete"
                                variant="destructive"
                                onConfirm={() => deleteMutation.mutate(t.id)}
                              >
                                <Button size="sm" variant="outline">
                                  <Trash2 className="w-4 h-4" />
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

              <PaginationControls
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                pageSizeOptions={[10, 15, 25, 50]}
                isLoading={templatesQuery.isLoading}
                onPageChange={(p) => navigate(p, pageSize)}
                onPageSizeChange={(size) => navigate(1, size)}
              />
            </>
          )}
        </CardContent>
      </Card>

      {drawerTemplateId && (
        <CampaignTemplateTranslationDrawer templateId={drawerTemplateId} onClose={closeDrawer} />
      )}
    </div>
  );
}
