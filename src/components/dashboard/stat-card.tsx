import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  iconColorClass?: string;
  iconBgClass?: string;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  iconColorClass = "text-primary",
  iconBgClass = "bg-primary/10",
  subtitle,
}: StatCardProps) {
  const isPositive = trend >= 0;

  return (
    <Card className="shadow-sm border-slate-200/60 rounded-xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-2 rounded-lg ${iconBgClass}`}>
            <Icon className={`w-5 h-5 ${iconColorClass}`} />
          </div>
          {subtitle ? (
            <span className="text-xs font-medium text-muted-foreground bg-accent px-2 py-1 rounded-md">
              {subtitle}
            </span>
          ) : (
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${
                isPositive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive ? "+" : ""}
              {trend}%
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
