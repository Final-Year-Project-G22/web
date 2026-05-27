import { AlertCircle, CheckCircle2, Clock, FileWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSystemOverview } from "../_services/dashboard.hook";

const iconMap: Record<string, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertCircle,
  danger: FileWarning,
  info: Clock,
};

const colorMap: Record<string, string> = {
  success: "text-success bg-success/8 border-success/15",
  warning: "text-warning bg-warning/8 border-warning/15",
  danger: "text-destructive bg-destructive/8 border-destructive/15",
  info: "text-chart-1 bg-chart-1/8 border-chart-1/15",
};

function StatusBadge({ label, variant }: { label: string; variant: "success" | "warning" }) {
  return (
    <span
      className={cn(
        "text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md border",
        variant === "success"
          ? "text-success bg-success/8 border-success/15"
          : "text-warning bg-warning/8 border-warning/15"
      )}
    >
      {label}
    </span>
  );
}

export function SystemHealth() {
  const { data: overview } = useSystemOverview();
  const items = overview?.items ?? [];

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-success" />
          <CardTitle className="text-base font-bold">System Overview</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {items.slice(0, 4).map((item) => {
            const Icon = iconMap[item.type] ?? AlertCircle;
            const color = colorMap[item.type] ?? colorMap.info;
            return (
              <div key={item.label} className={cn("p-4 rounded-xl border", color)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {item.label}
                  </span>
                  <Icon className="size-4" />
                </div>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-2xl font-extrabold text-foreground">{item.value}</h4>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" />
              <span className="text-sm font-medium">API Service</span>
            </div>
            <StatusBadge label="Operational" variant="success" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" />
              <span className="text-sm font-medium">Database</span>
            </div>
            <StatusBadge label="Connected" variant="success" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
