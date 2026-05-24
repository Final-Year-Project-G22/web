import { History, ListFilter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const logs = [
  {
    id: 1,
    admin: { name: "Sarah J.", avatar: "/avatars/sarah.jpg", initials: "SJ" },
    action: "Updated Policy",
    target: "Knowledge Base",
    targetVariant: "default" as const,
    time: "2m ago",
  },
  {
    id: 2,
    admin: { name: "Mike R.", avatar: "/avatars/mike.jpg", initials: "MR" },
    action: "Banned User",
    target: "User: ID-922",
    targetVariant: "destructive" as const,
    time: "15m ago",
  },
  {
    id: 3,
    admin: { name: "System", avatar: "", initials: "SY", isSystem: true },
    action: "Auto-Scale",
    target: "Cluster B",
    targetVariant: "default" as const,
    time: "1h ago",
  },
];

function TargetBadge({
  label,
  variant,
}: {
  label: string;
  variant: "default" | "destructive" | "success";
}) {
  const colors = {
    default: "text-chart-1 bg-chart-1/10",
    destructive: "text-destructive bg-destructive/10",
    success: "text-success bg-success/10",
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${colors[variant]}`}>{label}</span>
  );
}

export function RecentLogs() {
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
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      className={`size-8 border ${log.admin.isSystem ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      {!log.admin.isSystem && (
                        <AvatarImage src={log.admin.avatar} alt={log.admin.name} />
                      )}
                      <AvatarFallback
                        className={log.admin.isSystem ? "bg-primary text-primary-foreground" : ""}
                      >
                        {log.admin.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{log.admin.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{log.action}</TableCell>
                <TableCell>
                  <TargetBadge label={log.target} variant={log.targetVariant} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {log.time}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
