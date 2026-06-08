"use client";

import { AlertTriangle } from "lucide-react";
import { ModuleError } from "@/components/ui/module-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ModuleError
          error={error}
          reset={reset}
          icon={AlertTriangle}
          title="Application Error"
          description="A critical error occurred. Please refresh the page or try again later."
        />
      </body>
    </html>
  );
}
