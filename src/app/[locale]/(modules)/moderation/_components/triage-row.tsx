"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ReportStatusBadge,
  reasonVariant,
  reportStatusLabelKey,
  triageNextAction,
} from "./report-status";

/** Relative time ("2h ago" / "ከ2 ሰዓት በፊት") — the triage urgency cue. */
function timeAgo(iso: string, locale: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return rtf.format(0, "minute");
}

interface TriageRowProps {
  title: string;
  snippet?: string;
  /** Reported content author — omitted for user reports. */
  author?: string;
  reporter: string;
  reason: string;
  createdAt: string;
  status: string;
  onDecide: () => void;
  onSkip: () => void;
  skipDisabled?: boolean;
  /** Reverse of skip — returns an in-review report to pending. Shown instead of Skip on in-review rows. */
  onReturnToPending: () => void;
  returnDisabled?: boolean;
}

/**
 * Triage queue row (§6): row = report, left dock of decide/skip actions,
 * stamp-style resolution. Urgency (mono relative time) and the next action
 * lead; the row reads as a queue, not a table.
 */
export function TriageRow({
  title,
  snippet,
  author,
  reporter,
  reason,
  createdAt,
  status,
  onDecide,
  onSkip,
  skipDisabled,
  onReturnToPending,
  returnDisabled,
}: TriageRowProps) {
  const t = useTranslations("moderation");
  const locale = useLocale();

  const statusLabel = t(reportStatusLabelKey(status));

  // decided rows have no next action — the stamp on the right is the verdict
  const nextAction = triageNextAction(status);

  return (
    <div
      data-slot="triage-row"
      className="grid grid-cols-1 transition-colors duration-fast hover:bg-panel-2/60 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
    >
      {/* left dock — the next action, always visible on open rows */}
      <div className="flex items-center justify-center gap-1.5 border-b border-border bg-panel-2/50 p-2 sm:flex-col sm:border-b-0 sm:border-r">
        {nextAction === "decided" ? (
          <Check className="size-4 text-muted-foreground/40" aria-hidden="true" />
        ) : (
          <>
            <Button size="xs" variant="default" className="flex-1 sm:w-full" onClick={onDecide}>
              {t("decide")}
            </Button>
            {nextAction === "returnToPending" ? (
              <Button
                size="xs"
                variant="ghost"
                className="flex-1 sm:w-full"
                onClick={onReturnToPending}
                disabled={returnDisabled}
              >
                {t("returnToPending")}
              </Button>
            ) : (
              <Button
                size="xs"
                variant="ghost"
                className="flex-1 sm:w-full"
                onClick={onSkip}
                disabled={skipDisabled}
              >
                {t("skip")}
              </Button>
            )}
          </>
        )}
      </div>

      {/* content */}
      <div className="min-w-0 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-sm font-medium" title={title}>
            {title}
          </h3>
          <Badge variant={reasonVariant(reason)} className="shrink-0">
            {reason}
          </Badge>
        </div>
        {snippet ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{snippet}</p>
        ) : null}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <time dateTime={createdAt} className="font-mono">
            {timeAgo(createdAt, locale)}
          </time>
          {author ? (
            <>
              <span>{t("byAuthor", { author })}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <span>{t("reportedBy", { reporter })}</span>
        </p>
      </div>

      {/* resolution state */}
      <div className="flex items-center justify-start border-t border-border px-4 py-2 sm:justify-end sm:border-l sm:border-t-0 sm:px-3">
        <ReportStatusBadge status={status} label={statusLabel} />
      </div>
    </div>
  );
}

export function TriageQueueSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div data-slot="triage-skeleton" className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders, never reorder
        <div key={i} className="flex gap-3 px-4 py-3.5">
          <div className="h-6 w-16 shrink-0 animate-pulse rounded-md bg-panel-2" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-1/2 animate-pulse rounded bg-panel-2" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-panel-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
