"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  useAdminGuideList,
  useDeleteGuide,
} from "@/app/[locale]/(modules)/guide/_services/guide.hook";

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
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
import type { ListGuidesAdminParams } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

export default function GuideListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useAdminLanguageStore((s) => s.language);

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";

  const [searchInput, setSearchInput] = useState(search);

  const queryParams: ListGuidesAdminParams = {
    page,
    search: search || undefined,
    locale: language,
  };
  const guidesQuery = useAdminGuideList(queryParams);

  const deleteMutation = useDeleteGuide();

  function navigate(newPage: number, newSearch: string) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (newSearch) params.set("search", newSearch);
    const qs = params.toString();
    router.replace(`/guide${qs ? `?${qs}` : ""}`);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
  }

  const guides = guidesQuery.data?.guides ?? [];
  const totalPages = guidesQuery.data?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Guides</CardTitle>
          <CardDescription>Manage admin guides and their publishing state</CardDescription>
          <CardAction className="flex gap-2">
            <Button asChild>
              <Link href="/guide/create">Create Guide</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by title or slug"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(1, searchInput);
              }}
              className="max-w-xs"
            />
            <Button variant="outline" size="sm" onClick={() => navigate(1, searchInput)}>
              Search
            </Button>
            {search ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  navigate(1, "");
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>

          {guidesQuery.isLoading ? (
            <TableSkeleton rows={10} columns={3} />
          ) : guidesQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(guidesQuery.error)}
            </p>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guides.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <EmptyState variant="guide" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      guides.map((guide, i) => (
                        <motion.tr
                          key={guide.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <TableCell className="font-medium">{guide.name}</TableCell>
                          <TableCell>{guide.slug}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/guide/${guide.id}`}>Edit</Link>
                              </Button>
                              <ConfirmDialog
                                title="Delete Guide"
                                description="Are you sure you want to delete this guide? This action cannot be undone."
                                confirmLabel="Delete"
                                variant="destructive"
                                onConfirm={() => handleDelete(guide.id)}
                              >
                                <Button size="sm" variant="outline">
                                  Delete
                                </Button>
                              </ConfirmDialog>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                page={page}
                totalPages={totalPages}
                isLoading={guidesQuery.isLoading}
                onPageChange={(p) => navigate(p, search)}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
