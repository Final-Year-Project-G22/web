"use client";

import { History } from "lucide-react";
import { useTranslations } from "next-intl";
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

function timeAgo(timestamp: string, t: ReturnType<typeof useTranslations>): string {
  const diffMin = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diffMin < 1) return t("logs.justNow");
  if (diffMin < 60) return t("logs.minutesAgo", { n: diffMin });
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return t("logs.hoursAgo", { n: diffHrs });
  return t("logs.daysAgo", { n: Math.floor(diffHrs / 24) });
}

function TargetBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-md border border-line bg-panel-2 px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-ink-2">
      {label}
    </span>
  );
}

export function RecentLogs() {
  const t = useTranslations("dashboard");
  const { data: logsData } = useActivityLogs({ limit: 10 });
  const logs = logsData?.data ?? [];

  return (
    <Card className="gap-0 py-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" strokeWidth={1.5} />
          <CardTitle>{t("logs.title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {logs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("logs.empty")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("logs.admin")}</TableHead>
                <TableHead>{t("logs.action")}</TableHead>
                <TableHead>{t("logs.target")}</TableHead>
                <TableHead className="text-right">{t("logs.time")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={`${log.timestamp}-${i}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 border border-line">
                        <AvatarFallback className="bg-panel-2 text-xs font-medium text-ink-2">
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
                  <TableCell className="text-right font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {timeAgo(log.timestamp, t)}
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
