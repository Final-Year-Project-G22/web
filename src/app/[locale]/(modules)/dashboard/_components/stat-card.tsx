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
  1: { text: "text-chart-1", bg: "bg-chart-1/8 border border-chart-1/15" },
  2: { text: "text-chart-2", bg: "bg-chart-2/8 border border-chart-2/15" },
  3: { text: "text-chart-3", bg: "bg-chart-3/8 border border-chart-3/15" },
  4: { text: "text-chart-4", bg: "bg-chart-4/8 border border-chart-4/15" },
  5: { text: "text-chart-5", bg: "bg-chart-5/8 border border-chart-5/15" },
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
    <Card className="rounded-xl border border-border/50 bg-card/95 hover:-translate-y-1 hover:shadow-md hover:border-primary/25 transition-all duration-300 ease-out shadow-xs overflow-hidden relative group/stat">
      {/* Sleek top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300" />
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          {loading ? (
            <>
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-md" />
            </>
          ) : (
            <>
              <div
                className={cn(
                  "p-2 rounded-xl flex items-center justify-center",
                  colorMap[colorIndex].bg
                )}
              >
                <Icon className={cn("size-5", colorMap[colorIndex].text)} />
              </div>
              {subtitle ? (
                <span className="text-xs font-semibold text-muted-foreground bg-accent px-2.5 py-1 rounded-lg border border-border/50">
                  {subtitle}
                </span>
              ) : trend !== undefined ? (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border",
                    isPositive
                      ? "text-success bg-success/8 border-success/15"
                      : "text-destructive bg-destructive/8 border-destructive/15"
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
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {title}
              </p>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{value}</h3>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
