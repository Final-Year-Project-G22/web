"use client";

import { AlertTriangle } from "lucide-react";
import { ModuleError } from "@/components/ui/module-error";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ModuleError
      error={error}
      reset={reset}
      icon={AlertTriangle}
      title="Something went wrong"
      description="We encountered an unexpected error. Please try again."
    />
  );
}
