"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface InlineErrorProps {
  error: unknown;
  onRetry?: () => void;
  icon?: LucideIcon;
  message?: string;
  className?: string;
}

export function InlineError({
  error,
  onRetry,
  icon: Icon = AlertCircle,
  message,
  className,
}: InlineErrorProps) {
  const errorMessage =
    message ||
    (error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An error occurred");

  return (
    <div
      data-slot="inline-error"
      className={cn(
        "flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm",
        className
      )}
    >
      <Icon className="size-4 shrink-0 text-destructive" />
      <span className="flex-1 text-destructive">{errorMessage}</span>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
        >
          <RefreshCw className="size-3" />
          Retry
        </Button>
      )}
    </div>
  );
}
