"use client";

import {
  Activity,
  AlertCircle,
  FileText,
  type LucideIcon,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  useDocumentStats,
  useReportStats,
  useSessionStats,
  useUserStats,
} from "../_services/dashboard.hook";

type ChipTone = "good" | "amber" | "ink" | "red" | "blue";

const chipClass: Record<ChipTone, string> = {
  good: "bg-success-tint text-success-strong border-success/25",
  amber: "bg-warning-tint text-warning-strong border-warning/30",
  ink: "bg-panel-2 text-ink-2 border-line",
  red: "bg-destructive-tint text-destructive-strong border-destructive/25",
  blue: "bg-info-tint text-info-strong border-info/25",
};

interface StatCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: LucideIcon;
  chip?: ChipTone;
  subtitle?: string;
  sub?: string;
  loading?: boolean;
}

function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-panel-2", className)} />;
}

function TrendPill({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        up
          ? "border-success/25 bg-success-tint text-success-strong"
          : "border-destructive/25 bg-destructive-tint text-destructive-strong"
      )}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

/** One ledger cell — a row entry in the hairline-divided strip, never a card. */
export function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  chip = "ink",
  subtitle,
  sub,
  loading,
}: StatCardProps) {
  return (
    <div className="flex min-w-0 flex-col bg-panel p-5 transition-colors duration-fast hover:bg-panel-2">
      <div className="flex items-start justify-between gap-3">
        {loading ? (
          <Skeleton className="size-[34px] rounded-md" />
        ) : (
          <span
            className={cn(
              "flex size-[34px] flex-none items-center justify-center rounded-md border",
              chipClass[chip]
            )}
          >
            <Icon className="size-4" strokeWidth={1.5} />
          </span>
        )}
        {loading ? (
          <Skeleton className="h-5 w-14" />
        ) : trend !== undefined ? (
          <TrendPill value={trend} />
        ) : subtitle ? (
          <span className="rounded-full border border-line bg-panel-2 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-muted">
            {subtitle}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-4 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      ) : (
        <>
          <p className="mt-4 text-[10.5px] font-semibold tracking-[0.09em] uppercase text-muted">
            {title}
          </p>
          <p className="mt-0.5 font-display text-[25px] leading-tight font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {sub ? <p className="mt-0.5 text-[11.5px] text-muted">{sub}</p> : null}
        </>
      )}
    </div>
  );
}

/** Ledger stat strip — hairline-divided cells on one ground (§6 dashboard grammar). */
export function StatStrip() {
  const t = useTranslations("dashboard");
  const { data: userStats } = useUserStats();
  const { data: docStats } = useDocumentStats();
  const { data: sessionStats } = useSessionStats();
  const { data: reportStats } = useReportStats();

  return (
    <section
      aria-label={t("stats.users")}
      className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line shadow-card sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        title={t("stats.users")}
        value={userStats ? formatStat(userStats.total) : "—"}
        trend={userStats?.trendPercent}
        icon={Users}
        chip="good"
      />
      <StatCard
        title={t("stats.documents")}
        value={docStats ? formatStat(docStats.total) : "—"}
        trend={docStats ? docStats.trend : undefined}
        icon={FileText}
        chip="amber"
      />
      <StatCard
        title={t("stats.sessions")}
        value={sessionStats ? formatStat(sessionStats.total) : "—"}
        icon={Activity}
        chip="ink"
        subtitle={t("stats.dailyAvg")}
      />
      <StatCard
        title={t("stats.flagged")}
        value={reportStats ? formatStat(reportStats.pending) : "—"}
        trend={reportStats?.trendPercent ? -Math.abs(reportStats.trendPercent) : undefined}
        icon={AlertCircle}
        chip="red"
        sub={t("stats.fewer")}
      />
    </section>
  );
}
