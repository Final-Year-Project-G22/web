import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: LucideIcon;
  colorIndex?: 1 | 2 | 3 | 4 | 5;
  subtitle?: string;
  loading?: boolean;
}

const colorMap = {
  1: { text: "text-chart-1", bg: "bg-chart-1/10" },
  2: { text: "text-chart-2", bg: "bg-chart-2/10" },
  3: { text: "text-chart-3", bg: "bg-chart-3/10" },
  4: { text: "text-chart-4", bg: "bg-chart-4/10" },
  5: { text: "text-chart-5", bg: "bg-chart-5/10" },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  colorIndex = 1,
  subtitle,
  loading,
}: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0;

  return (
    <Card className="shadow-sm rounded-xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          {loading ? (
            <>
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </>
          ) : (
            <>
              <div className={cn("p-2 rounded-lg", colorMap[colorIndex].bg)}>
                <Icon className={cn("size-5", colorMap[colorIndex].text)} />
              </div>
              {subtitle ? (
                <span className="text-xs font-medium text-muted-foreground bg-accent px-2 py-1 rounded-md">
                  {subtitle}
                </span>
              ) : trend !== undefined ? (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-semibold",
                    isPositive ? "text-success" : "text-destructive"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {isPositive ? "+" : ""}
                  {trend}%
                </div>
              ) : null}
            </>
          )}
        </div>
        <div className="space-y-1">
          {loading ? (
            <>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-20" />
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
