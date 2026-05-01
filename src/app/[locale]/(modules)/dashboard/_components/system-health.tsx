import { Cloud, Database, RefreshCw, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SystemHealth() {
  return (
    <Card className="col-span-1 shadow-sm border-slate-200/60 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-emerald-500" />
          <CardTitle className="text-base font-bold">System Health</CardTitle>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border px-2.5 py-1.5 rounded-md"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">API Response Time</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <h4 className="text-2xl font-bold">42ms</h4>
              <span className="text-xs font-medium text-emerald-600">-5ms avg</span>
            </div>
            <div className="flex items-end gap-1 h-8">
              {/* Mock sparkline */}
              {[40, 30, 20, 50, 45, 60, 42].map((val) => (
                <div
                  key={val}
                  className="flex-1 bg-emerald-400 rounded-t-sm"
                  style={{ height: `${val}%` }}
                />
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Database Load</span>
              <div className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <h4 className="text-2xl font-bold">68%</h4>
              <span className="text-xs font-medium text-amber-600">Peak Load</span>
            </div>
            <div className="h-2 bg-amber-100 rounded-full mt-auto">
              <div className="h-full bg-amber-500 rounded-full w-[68%]" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">AWS US-East-1</span>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              Operational
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">OpenAI Gateway</span>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              Operational
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
