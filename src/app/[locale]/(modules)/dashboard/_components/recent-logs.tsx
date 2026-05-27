import { History, ListFilter } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActivityLogs } from "../_services/dashboard.hook";

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function TargetBadge({ label }: { label: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide border uppercase text-chart-1 bg-chart-1/8 border-chart-1/15">
      {label}
    </span>
  );
}

export function RecentLogs() {
  const { data: logsData } = useActivityLogs({ limit: 10 });
  const logs = logsData?.data ?? [];

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <History className="size-5 text-primary" />
          <CardTitle className="text-base font-bold">Recent Admin Logs</CardTitle>
        </div>
        <button
          type="button"
          className="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground"
        >
          <ListFilter className="size-4" />
        </button>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity logs yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={`${log.timestamp}-${i}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 border">
                        <AvatarFallback className="text-xs font-medium">
                          {log.adminName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) ?? "SY"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{log.adminName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.action}</TableCell>
                  <TableCell>
                    <TargetBadge label={log.target} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {timeAgo(log.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
