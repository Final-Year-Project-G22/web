"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AIUsageChart } from "./_components/ai-usage-chart";
import { PagumeBanner } from "./_components/pagume-banner";
import { RecentLogs } from "./_components/recent-logs";
import { StatStrip } from "./_components/stat-card";
import { SystemHealth } from "./_components/system-health";
import { UserGrowthChart } from "./_components/user-growth-chart";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  /* "Today" resolves after mount so server HTML and client hydration agree. */
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const dateLabel = useMemo(() => {
    if (!today) return null;
    const intlLocale = locale === "am" ? "am-ET" : "en";
    return new Intl.DateTimeFormat(intlLocale, {
      calendar: locale === "am" ? "ethiopic" : "gregory",
      numberingSystem: "latn",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(today);
  }, [today, locale]);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] leading-tight font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {dateLabel ? t("subtitle", { date: dateLabel }) : t("subtitle", { date: "" })}
          </p>
        </div>
      </div>

      <PagumeBanner />

      <StatStrip />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <UserGrowthChart />
        <AIUsageChart />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SystemHealth />
        <RecentLogs />
      </div>
    </div>
  );
}
