"use client";

import { Clock, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Stamp } from "@/components/ui/stamp";

/**
 * Moderation status grammar (§6 triage queue) — single source of truth for the
 * report status keys, their translation keys, and the stamp/pill variants.
 *
 * DECISION states render as the ማህተም rubber stamp (resolved = approved /
 * dismissed = rejected); open states stay pills — pending = amber (the product
 * trio's "warms / pending"), in review = blue informs. Color + icon + text
 * (primitives contract §5).
 */

/** Ordered report-status keys — "all" is the queue-wide filter, the rest are row states. */
export const REPORT_STATUS_KEYS = [
  "all",
  "pending",
  "under_review",
  "resolved",
  "dismissed",
] as const;

export type ReportStatusKey = (typeof REPORT_STATUS_KEYS)[number];

/** Status key → moderation translation key (EN/AM catalogs via next-intl). */
export const REPORT_STATUS_TRANSLATION_KEYS: Record<ReportStatusKey, string> = {
  all: "statusAll",
  pending: "statusPending",
  under_review: "statusUnderReview",
  resolved: "statusResolved",
  dismissed: "statusDismissed",
};

/** Stamp variant per decided status (ማህተም verdicts). */
export const REPORT_STATUS_STAMP_VARIANTS = {
  resolved: "good",
  dismissed: "bad",
} as const;

/** Pill variant per open status. */
export const REPORT_STATUS_PILL_VARIANTS = {
  pending: "warning",
  under_review: "info",
} as const;

/**
 * Translation key for a report status value; unknown statuses fall back to the
 * dismissed label, matching the queue's default verdict.
 */
export function reportStatusLabelKey(status: string): string {
  return REPORT_STATUS_TRANSLATION_KEYS[status as ReportStatusKey] ?? "statusDismissed";
}

export function ReportStatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  const stampVariant: "good" | "bad" | undefined =
    REPORT_STATUS_STAMP_VARIANTS[status as keyof typeof REPORT_STATUS_STAMP_VARIANTS];
  if (stampVariant) {
    return (
      <Stamp variant={stampVariant} className={className}>
        {label}
      </Stamp>
    );
  }
  const variant: "warning" | "info" =
    REPORT_STATUS_PILL_VARIANTS[status as keyof typeof REPORT_STATUS_PILL_VARIANTS] ?? "info";
  const Icon = status === "pending" ? Clock : Eye;
  return (
    <Badge variant={variant} className={className}>
      <Icon />
      {label}
    </Badge>
  );
}

/**
 * Best-effort reason → semantic pill. Report reasons are free-text data (may
 * be EN or AM), so this is a keyword map, not an enum.
 */
export function reasonVariant(reason: string): "destructive" | "warning" | "info" {
  const r = reason.toLowerCase();
  if (/(scam|fraud|impersonat|abuse|harass|በደል|ማጭበርበር|ማስመሰል)/.test(r)) return "destructive";
  if (/(spam|misinfo|inappropriate|አይፈለጌ|የተሳሳተ|ተገቢ ያልሆነ)/.test(r)) return "warning";
  return "info";
}
