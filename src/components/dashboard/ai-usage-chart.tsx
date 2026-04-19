"use client";

import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { name: "Content Generator", value: 45, color: "#a855f7" }, // purple-500
  { name: "Chat Assistant", value: 30, color: "#d946ef" }, // fuchsia-500
  { name: "Market Analysis", value: 15, color: "#eab308" }, // yellow-500
  { name: "Other", value: 10, color: "#94a3b8" }, // slate-400
];

const chartConfig = {
  content: { label: "Content Generator", color: "#a855f7" },
  chat: { label: "Chat Assistant", color: "#d946ef" },
  market: { label: "Market Analysis", color: "#eab308" },
  other: { label: "Other", color: "#94a3b8" },
} satisfies ChartConfig;

export function AIUsageChart() {
  return (
    <Card className="col-span-1 shadow-sm border-slate-200/60 rounded-xl">
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
                  <Cell key={entry.name} fill={entry.color} />
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
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
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
