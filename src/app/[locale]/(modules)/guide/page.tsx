"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useMemo, useState } from "react";
import { useSectorList } from "@/app/[locale]/(modules)/admin/_services/taxonomy.hook";
import {
  useAdminGuideList,
  useDeleteGuide,
} from "@/app/[locale]/(modules)/guide/_services/guide.hook";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineError } from "@/components/ui/inline-error";
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
import { useAdminLanguageStore } from "@/stores/admin-language.store";

function GuideListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("surfaces.guide.list");
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
  const sectorsQuery = useSectorList({ pageSize: 200 });

  const deleteMutation = useDeleteGuide();

  const sectorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (sectorsQuery.data?.data) {
      for (const s of sectorsQuery.data.data) map.set(s.id, s.nameEn);
    }
    return map;
  }, [sectorsQuery.data]);

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
  const totalItems = guidesQuery.data?.totalItems ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      {/* pagehead */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
            {t("title")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("subtitle", { count: totalItems })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/guide/create">
              <Plus className="h-3.5 w-3.5" />
              {t("create")}
            </Link>
          </Button>
        </div>
      </div>

      {/* library panel */}
      <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[13.5px] font-semibold text-ink">{t("allGuides")}</h2>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {String(totalItems).padStart(2, "0")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 py-4">
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(1, searchInput);
            }}
            className="max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={() => navigate(1, searchInput)}>
            {t("search")}
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
              {t("clear")}
            </Button>
          ) : null}
        </div>

        {guidesQuery.isLoading ? (
          <div className="px-5 pb-5">
            <TableSkeleton rows={10} columns={3} />
          </div>
        ) : guidesQuery.isError ? (
          <div className="px-5 pb-5">
            <InlineError error={guidesQuery.error} onRetry={() => guidesQuery.refetch()} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("guide")}</TableHead>
                    <TableHead>{t("sector")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
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
                    guides.map((guide) => {
                      const sectorName =
                        guide.sectorIds
                          ?.map((id) => sectorMap.get(id))
                          .filter(Boolean)
                          .join(", ") || undefined;
                      return (
                        <TableRow key={guide.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-ink">{guide.name}</span>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {guide.slug}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {sectorName ? (
                              <Badge variant="secondary" className="font-mono text-[11px]">
                                {sectorName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/guide/${guide.id}`}>{t("edit")}</Link>
                              </Button>
                              <ConfirmDialog
                                title={t("delete")}
                                description="Are you sure you want to delete this guide? This action cannot be undone."
                                confirmLabel={t("delete")}
                                variant="destructive"
                                onConfirm={() => handleDelete(guide.id)}
                              >
                                <Button size="sm" variant="outline">
                                  {t("delete")}
                                </Button>
                              </ConfirmDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="border-t border-line px-5 py-3">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                isLoading={guidesQuery.isLoading}
                onPageChange={(p) => navigate(p, search)}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default function GuideListPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={10} columns={3} />}>
      <GuideListContent />
    </Suspense>
  );
}
