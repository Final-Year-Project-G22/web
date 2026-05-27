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
import { useDocumentStages } from "../_services/dashboard.hook";

const colors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function AIUsageChart({ loading }: { loading?: boolean }) {
  const { data: stagesData } = useDocumentStages();
  const stages = stagesData?.data ?? [];

  const chartConfig = Object.fromEntries(
    stages.map((s, i) => [s.stage, { label: s.stage, color: colors[i % colors.length] }])
  ) satisfies ChartConfig;

  const total = stages.reduce((sum, s) => sum + s.count, 0);

  if (loading) {
    return <div className="h-[324px] animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold">Documents by Pipeline Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[200px] w-full mt-4 flex items-center justify-center">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={stages}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                stroke="none"
              >
                {stages.map((entry, i) => (
                  <Cell key={entry.stage} fill={colors[i % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground font-medium">Total Documents</span>
            <span className="text-xl font-bold">{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {stages.map((item, i) => (
            <div key={item.stage} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={cn("size-2.5 rounded-full")}
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="text-muted-foreground capitalize">{item.stage}</span>
              </div>
              <span className="font-semibold">{item.percentage}%</span>
            </div>
          ))}
          {stages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">No documents found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
