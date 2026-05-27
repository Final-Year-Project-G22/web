"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useUserGrowth } from "../_services/dashboard.hook";

const chartConfig = {
  free: {
    label: "Free Tier",
    color: "var(--color-chart-1)",
  },
  premium: {
    label: "Premium Tier",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

const periodBtn = (active?: boolean) =>
  cn(
    "px-3 py-1 text-xs font-medium rounded transition-colors",
    active
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground"
  );

export function UserGrowthChart({ loading }: { loading?: boolean }) {
  const { data: growthData } = useUserGrowth({ period: "monthly" });
  const chartData = growthData?.data ?? [];

  if (loading) {
    return <div className="h-[324px] animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <Card className="col-span-1 md:col-span-2 shadow-sm rounded-xl">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base font-bold">User Growth by Tier</CardTitle>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-chart-1" />
              <span className="text-xs font-medium text-muted-foreground">Free Tier</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-chart-2" />
              <span className="text-xs font-medium text-muted-foreground">Premium Tier</span>
            </div>
          </div>
        </div>
        <div className="flex bg-accent/50 p-1 rounded-lg">
          <button type="button" className={periodBtn(true)}>
            Monthly
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="free" fill="var(--color-free)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="premium" fill="var(--color-premium)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
        {chartData.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No growth data available</p>
        )}
      </CardContent>
    </Card>
  );
}
