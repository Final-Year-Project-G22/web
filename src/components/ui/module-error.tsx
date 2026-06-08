"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ModuleErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

export function ModuleError({
  error,
  reset,
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again.",
  className,
}: ModuleErrorProps) {
  return (
    <div
      data-slot="module-error"
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center px-4 text-center",
        className
      )}
    >
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="rounded-full bg-destructive/10 p-4">
          <Icon className="size-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight font-display">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <Button onClick={reset} variant="outline" size="lg">
          <RefreshCw className="size-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
