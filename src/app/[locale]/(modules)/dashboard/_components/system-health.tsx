"use client";

import { AlertCircle, CheckCircle2, FileWarning } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSystemOverview } from "../_services/dashboard.hook";

const typeMeta = {
  success: { dot: "bg-success", badge: "success", icon: CheckCircle2, statusKey: "operational" },
  warning: { dot: "bg-warning", badge: "warning", icon: AlertCircle, statusKey: "degraded" },
  danger: { dot: "bg-destructive", badge: "destructive", icon: FileWarning, statusKey: "down" },
} as const;

type HealthType = keyof typeof typeMeta;

export function SystemHealth() {
  const t = useTranslations("dashboard");
  const { data: overview } = useSystemOverview();
  const items = overview?.items ?? [];

  return (
    <Card className="gap-0 py-0 shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-line px-5 py-3">
        <CardTitle>{t("health.title")}</CardTitle>
        <span className="text-[11.5px] whitespace-nowrap text-muted">{t("health.uptime")}</span>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("health.empty")}</p>
        ) : (
          <div className="flex flex-col">
            {items.map((item) => {
              const healthType: HealthType =
                item.type === "success" || item.type === "danger" ? item.type : "warning";
              const meta = typeMeta[healthType];
              const Icon = meta.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 border-b border-line px-5 py-3 transition-colors duration-fast last:border-b-0 hover:bg-panel-2"
                >
                  <span className={cn("size-2 flex-none rounded-full", meta.dot)} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {item.label}
                  </span>
                  <span className="font-mono text-[11.5px] whitespace-nowrap text-muted tabular-nums">
                    {item.value}
                  </span>
                  <Badge variant={meta.badge} className="gap-1">
                    <Icon className="size-3" />
                    {t(`health.${meta.statusKey}`)}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
