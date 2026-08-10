"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDocumentStages } from "../_services/dashboard.hook";

/* registry bar grammar: emerald → amber → muted for the tail stages */
const barColors = ["bg-chart-2", "bg-chart-3", "bg-line-2", "bg-chart-4"];

export function AIUsageChart({ loading }: { loading?: boolean }) {
  const t = useTranslations("dashboard");
  const { data: stagesData } = useDocumentStages();
  const stages = stagesData?.data ?? [];
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  if (loading) {
    return <div className="h-[260px] animate-pulse rounded-lg border border-line bg-panel-2" />;
  }

  return (
    <Card className="gap-0 py-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-line px-5 py-3">
        <CardTitle>{t("stages.title")}</CardTitle>
        <span className="font-mono text-[11.5px] whitespace-nowrap text-muted-foreground tabular-nums">
          {t("stages.total")}: {total.toLocaleString("en-US")}
        </span>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {stages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("stages.empty")}</p>
        ) : (
          stages.map((item, i) => (
            <div key={item.stage}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate font-medium text-ink-2 capitalize">{item.stage}</span>
                <span className="font-mono whitespace-nowrap text-muted-foreground tabular-nums">
                  {item.count.toLocaleString("en-US")} · {item.percentage}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded border border-line bg-panel-2">
                <div
                  className={cn(
                    "h-full rounded-[1px] transition-[width] duration-base",
                    barColors[i % barColors.length]
                  )}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
