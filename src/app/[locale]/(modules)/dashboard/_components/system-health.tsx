import { Cloud, Database, RefreshCw, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const sparklineData = [40, 30, 20, 50, 45, 60, 42];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-8">
      {data.map((val) => (
        <div
          key={val}
          className={cn("flex-1 rounded-t-sm transition-all duration-300", color)}
          style={{ height: `${(val / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

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
  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Server className="size-5 text-success" />
          <CardTitle className="text-base font-bold">System Health</CardTitle>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 border border-border/80 px-2.5 py-1.5 rounded-lg hover:bg-accent/40"
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-success/8 rounded-xl border border-success/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                API Response Time
              </span>
              <div className="size-2 rounded-full bg-success" />
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <h4 className="text-2xl font-extrabold text-foreground">42ms</h4>
              <span className="text-xs font-medium text-success">-5ms avg</span>
            </div>
            <Sparkline data={sparklineData} color="bg-success/60" />
          </div>

          <div className="p-4 bg-warning/8 rounded-xl border border-warning/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Database Load
              </span>
              <div className="size-2 rounded-full bg-warning" />
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <h4 className="text-2xl font-extrabold text-foreground">68%</h4>
              <span className="text-xs font-medium text-warning">Peak Load</span>
            </div>
            <div className="h-2 bg-warning/20 rounded-full mt-auto">
              <div className="h-full bg-warning rounded-full w-[68%]" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="size-4 text-success" />
              <span className="text-sm font-medium">AWS US-East-1</span>
            </div>
            <StatusBadge label="Operational" variant="success" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-success" />
              <span className="text-sm font-medium">OpenAI Gateway</span>
            </div>
            <StatusBadge label="Operational" variant="success" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
