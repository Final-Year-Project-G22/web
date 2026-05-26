"use client";

import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { useState } from "react";
import type { ToolUseEvent } from "../_services/ask.hook";

type ToolUseIndicatorProps = {
  toolUses: ToolUseEvent[];
};

const STATUS_COLORS: Record<string, string> = {
  default: "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900",
};

export function ToolUseIndicator({ toolUses }: ToolUseIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  if (toolUses.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Wrench className="w-3 h-3" />
        <span>Used {toolUses.length === 1 ? toolUses[0].tool : `${toolUses.length} tools`}</span>
      </button>
      {expanded && (
        <div className="mt-1 space-y-1">
          {toolUses.map((tu, i) => (
            <div
              key={`${tu.tool}-${i}`}
              className={`text-xs px-2 py-1.5 rounded-md border ${STATUS_COLORS.default}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span className="font-medium text-blue-700 dark:text-blue-300">{tu.tool}</span>
              </div>
              {tu.argumentsJson && (
                <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap border-t border-blue-100 dark:border-blue-900 pt-1">
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
