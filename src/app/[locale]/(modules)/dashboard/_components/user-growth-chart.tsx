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

const chartData = [
  { month: "Jan", free: 12000, premium: 25000 },
  { month: "Feb", free: 15000, premium: 28000 },
  { month: "Mar", free: 14000, premium: 35000 },
  { month: "Apr", free: 22000, premium: 42000 },
  { month: "May", free: 25000, premium: 38000 },
  { month: "Jun", free: 24000, premium: 45000 },
  { month: "Jul", free: 31000, premium: 52000 },
  { month: "Aug", free: 29000, premium: 48000 },
];

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

const periodBtn = (label: string, active?: boolean) =>
  cn(
    "px-3 py-1 text-xs font-medium rounded transition-colors",
    active
      ? "bg-background text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground"
  );

export function UserGrowthChart({ loading }: { loading?: boolean }) {
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
          <button type="button" className={periodBtn("Monthly", true)}>
            Monthly
          </button>
          <button type="button" className={periodBtn("Quarterly")}>
            Quarterly
          </button>
          <button type="button" className={periodBtn("Yearly")}>
            Yearly
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
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
      </CardContent>
    </Card>
  );
}
