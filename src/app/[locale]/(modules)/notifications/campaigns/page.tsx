"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useCampaignSSE } from "@/app/[locale]/(modules)/notifications/_services/campaign-sse.hook";
import {
  useCancelCampaign,
  useListCampaigns,
  useScheduleCampaign,
} from "@/app/[locale]/(modules)/notifications/_services/notification.hook";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ListCampaignsParams } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";

function statusBadgeVariant(status: string) {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-700 border border-gray-200";

    case "scheduled":
      return "bg-blue-50 text-blue-700 border border-blue-200";

    case "sending":
      return "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse";

    case "completed":
      return "bg-green-50 text-green-700 border border-green-200";

    case "cancelled":
      return "bg-red-50 text-red-700 border border-red-200";

    default:
      return "bg-muted text-muted-foreground border";
  }
}
export default function CampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const statusParam = searchParams.get("status") ?? "";
  const pageSize = Number(searchParams.get("pageSize") ?? "10");

  const [statusFilter, setStatusFilter] = useState(statusParam);

  const apiStatus = statusFilter === "all" ? undefined : statusFilter;

  const params: ListCampaignsParams = {
    page,
    pageSize,
    status: apiStatus,
  };

  const campaignsQuery = useListCampaigns(params);
  const scheduleMutation = useScheduleCampaign();
  const cancelMutation = useCancelCampaign();

  useCampaignSSE();

  function navigate(newPage: number, newStatus: string, newPageSize: number) {
    const p = new URLSearchParams();
    if (newPage > 1) p.set("page", String(newPage));
    if (newStatus && newStatus !== "all") p.set("status", newStatus);
    if (newPageSize !== 10) p.set("pageSize", String(newPageSize));
    const qs = p.toString();
    router.replace(`/notifications/campaigns${qs ? `?${qs}` : ""}`);
  }

  const campaigns = campaignsQuery.data?.data ?? [];
  const totalPages = campaignsQuery.data?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>Manage notification campaigns</CardDescription>
          <CardAction>
            <Button asChild>
              <Link href="/notifications/campaigns/create">Create Campaign</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => {
                setStatusFilter(v === "all" ? "" : v);
                navigate(1, v, pageSize);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {campaignsQuery.isLoading ? (
            <TableSkeleton rows={10} columns={5} />
          ) : campaignsQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(campaignsQuery.error)}
            </p>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      {/* <TableHead>Created By</TableHead> */}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          No campaigns found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      campaigns.map((c) => (
                        <TableRow key={c.id} className="cursor-pointer">
                          <TableCell className="font-medium">
                            <Link
                              href={`/notifications/campaigns/${c.id}`}
                              className="hover:underline"
                            >
                              {c.name}
                            </Link>
                          </TableCell>
                          <TableCell className="capitalize">{c.campaignType}</TableCell>
                          <TableCell>
                            <Badge
                              className={`capitalize text-xs px-2.5 py-1 ${statusBadgeVariant(
                                c.status
                              )}`}
                            >
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {c.scheduledFor
                              ? new Intl.DateTimeFormat("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date(c.scheduledFor))
                              : "—"}
                          </TableCell>
                          {/* <TableCell>{c.createdBy}</TableCell> */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {c.status === "draft" && (
                                <ConfirmDialog
                                  title="Schedule Campaign"
                                  description={`Schedule "${c.name}" for delivery?`}
                                  confirmLabel="Schedule"
                                  onConfirm={() => scheduleMutation.mutate(c.id)}
                                >
                                  <Button size="sm" variant="outline">
                                    Schedule
                                  </Button>
                                </ConfirmDialog>
                              )}
                              {(c.status === "scheduled" || c.status === "sending") && (
                                <ConfirmDialog
                                  title="Cancel Campaign"
                                  description={`Cancel "${c.name}"? This cannot be undone.`}
                                  confirmLabel="Cancel Campaign"
                                  variant="destructive"
                                  onConfirm={() => cancelMutation.mutate(c.id)}
                                >
                                  <Button size="sm" variant="outline">
                                    Cancel
                                  </Button>
                                </ConfirmDialog>
                              )}
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/notifications/campaigns/${c.id}`}>View</Link>
                              </Button>
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
                isLoading={campaignsQuery.isLoading}
                onPageChange={(p) => navigate(p, statusFilter, pageSize)}
                onPageSizeChange={(size) => navigate(1, statusFilter, size)}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
