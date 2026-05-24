"use client";

import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { useState } from "react";
import type { ToolUseEvent } from "../_services/ask.hook";

type ToolUseIndicatorProps = {
  toolUses: ToolUseEvent[];
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
              className="text-xs px-2 py-1 rounded-md border bg-muted/30 text-muted-foreground"
            >
              <span className="font-medium">{tu.tool}</span>
              {tu.argumentsJson && (
                <pre className="mt-0.5 text-xs overflow-x-auto whitespace-pre-wrap">
                  {tu.argumentsJson.length > 120
                    ? `${tu.argumentsJson.slice(0, 120)}...`
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
