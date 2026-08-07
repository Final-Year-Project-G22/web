"use client";

import { Clock, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Stamp } from "@/components/ui/stamp";

/**
 * Moderation status grammar (§6 triage queue): DECISION states render as the
 * ማህተም rubber stamp (resolved = approved / dismissed = rejected); open
 * states stay pills — pending = amber (the product trio's "warms / pending"),
 * in review = blue informs. Color + icon + text (primitives contract §5).
 */
export function ReportStatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  if (status === "resolved") {
    return (
      <Stamp variant="good" className={className}>
        {label}
      </Stamp>
    );
  }
  if (status === "dismissed") {
    return (
      <Stamp variant="bad" className={className}>
        {label}
      </Stamp>
    );
  }
  const variant = status === "pending" ? "warning" : "info";
  const Icon = status === "pending" ? Clock : Eye;
  return (
    <Badge variant={variant} className={className}>
      <Icon />
      {label}
    </Badge>
  );
}

/**
 * Best-effort reason → semantic pill. Report reasons are free-text data (may
 * be EN or AM), so this is a keyword map, not an enum.
 */
export function reasonVariant(reason: string): "destructive" | "warning" | "info" {
  const r = reason.toLowerCase();
  if (/(scam|fraud|impersonat|abuse|harass|በደል|ማጭበርበር|ማስመሰል)/.test(r)) return "destructive";
  if (/(spam|misinfo|inappropriate|አይፈለጌ|የተሳሳተ|ተገቢ ያልሆነ)/.test(r)) return "warning";
  return "info";
}
