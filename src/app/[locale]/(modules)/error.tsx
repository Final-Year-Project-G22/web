"use client";

import { FileX } from "lucide-react";
import { ModuleError } from "@/components/ui/module-error";

export default function ModuleErrorBoundary({
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
      icon={FileX}
      title="Unable to load this section"
      description="We can't reach this module right now. Check your connection and try again."
    />
  );
}
