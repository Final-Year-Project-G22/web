"use client";

import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useUserGrowth } from "../_services/dashboard.hook";

export function UserGrowthChart({ loading }: { loading?: boolean }) {
  const t = useTranslations("dashboard");
  const { data: growthData } = useUserGrowth({ period: "monthly" });
  const chartData = growthData?.data ?? [];

  const chartConfig = {
    free: { label: t("growth.free"), color: "var(--color-chart-1)" },
    premium: { label: t("growth.premium"), color: "var(--color-chart-2)" },
  } satisfies ChartConfig;

  if (loading) {
    return <div className="h-[260px] animate-pulse rounded-lg border border-line bg-panel-2" />;
  }

  return (
    <Card className="gap-0 py-0 shadow-card">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3">
        <div>
          <CardTitle>{t("growth.title")}</CardTitle>
          <div className="mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-chart-1" />
              {t("growth.free")}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-chart-2" />
              {t("growth.premium")}
            </span>
          </div>
        </div>
        <span className="text-[11.5px] text-muted">{t("growth.period")}</span>
      </CardHeader>
      <CardContent className="p-5">
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("growth.empty")}</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {/* flat tint fills — no gradients (§10 anti-slop) */}
              <Area
                dataKey="free"
                type="monotone"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="var(--color-chart-1)"
                fillOpacity={0.1}
              />
              <Area
                dataKey="premium"
                type="monotone"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                fill="var(--color-chart-2)"
                fillOpacity={0.14}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
