import { History, ListFilter } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const logs = [
  {
    id: 1,
    admin: { name: "Sarah J.", avatar: "/avatars/sarah.jpg", initials: "SJ" },
    action: "Updated Policy",
    target: "Knowledge Base",
    targetColor: "text-purple-600 bg-purple-100",
    time: "2m ago",
  },
  {
    id: 2,
    admin: { name: "Mike R.", avatar: "/avatars/mike.jpg", initials: "MR" },
    action: "Banned User",
    target: "User: ID-922",
    targetColor: "text-red-600 bg-red-100",
    time: "15m ago",
  },
  {
    id: 3,
    admin: { name: "System", avatar: "", initials: "SY", isSystem: true },
    action: "Auto-Scale",
    target: "Cluster B",
    targetColor: "text-emerald-600 bg-emerald-100",
    time: "1h ago",
  },
];

export function RecentLogs() {
  return (
    <Card className="col-span-1 shadow-sm border-slate-200/60 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <CardTitle className="text-base font-bold">Recent Admin Logs</CardTitle>
        </div>
        <button
          type="button"
          className="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground"
        >
          <ListFilter className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground font-semibold uppercase tracking-wider bg-accent/50">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3 rounded-r-lg text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b last:border-0 border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className={`w-8 h-8 border ${log.admin.isSystem ? "bg-purple-600 text-white" : ""}`}
                      >
                        {!log.admin.isSystem && (
                          <AvatarImage src={log.admin.avatar} alt={log.admin.name} />
                        )}
                        <AvatarFallback
                          className={log.admin.isSystem ? "bg-purple-600 text-white" : ""}
                        >
                          {log.admin.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{log.admin.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{log.action}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${log.targetColor}`}
                    >
                      {log.target}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
