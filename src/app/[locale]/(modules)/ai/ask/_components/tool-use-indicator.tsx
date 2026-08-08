"use client";

import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ToolUseEvent } from "../_services/ask.hook";

type ToolUseIndicatorProps = {
  toolUses: ToolUseEvent[];
};

export function ToolUseIndicator({ toolUses }: ToolUseIndicatorProps) {
  const t = useTranslations("surfaces.ai.ask");
  const [expanded, setExpanded] = useState(false);

  if (toolUses.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors duration-base hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Wrench className="h-3 w-3" />
        <span>
          {toolUses.length === 1 ? toolUses[0].tool : t("usedTools", { count: toolUses.length })}
        </span>
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-1">
          {toolUses.map((tu, i) => (
            <div
              key={`${tu.tool}-${i}`}
              className="rounded-md border border-info-tint bg-info-tint/40 px-2 py-1.5 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-info-strong" />
                <span className="font-medium text-info-strong">{tu.tool}</span>
              </div>
              {tu.argumentsJson && (
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap border-t border-info-tint pt-1 font-mono text-[11px] text-muted-foreground">
                  {tu.argumentsJson.length > 150
                    ? `${tu.argumentsJson.slice(0, 150)}...`
                    : tu.argumentsJson}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
