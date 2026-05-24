"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const chartData = [
  { name: "Content Generator", value: 45, key: "content" },
  { name: "Chat Assistant", value: 30, key: "chat" },
  { name: "Market Analysis", value: 15, key: "market" },
  { name: "Other", value: 10, key: "other" },
];

const chartConfig = {
  content: { label: "Content Generator", color: "var(--color-chart-1)" },
  chat: { label: "Chat Assistant", color: "var(--color-chart-2)" },
  market: { label: "Market Analysis", color: "var(--color-chart-3)" },
  other: { label: "Other", color: "var(--color-chart-4)" },
} satisfies ChartConfig;

export function AIUsageChart({ loading }: { loading?: boolean }) {
  if (loading) {
    return <div className="h-[324px] animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold">AI Usage by Module</CardTitle>
        <button type="button" className="text-sm font-medium text-primary">
          See All
        </button>
      </CardHeader>
      <CardContent>
        <div className="relative h-[200px] w-full mt-4 flex items-center justify-center">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={chartConfig[entry.key as keyof typeof chartConfig].color}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground font-medium">Total Tokens</span>
            <span className="text-xl font-bold">8.4M</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "size-2.5 rounded-full",
                    item.key === "content" && "bg-chart-1",
                    item.key === "chat" && "bg-chart-2",
                    item.key === "market" && "bg-chart-3",
                    item.key === "other" && "bg-chart-4"
                  )}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-semibold">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
