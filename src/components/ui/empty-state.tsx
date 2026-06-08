import { BookOpen, Inbox, MessageSquareWarning, Brain } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "default" | "guide" | "moderation" | "ai";

interface VariantConfig {
  icon: LucideIcon;
  title: string;
  description: string;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, VariantConfig> = {
  default: {
    icon: Inbox,
    title: "No items yet",
    description: "Get started by creating the first item.",
  },
  guide: {
    icon: BookOpen,
    title: "Your library is empty",
    description: "Drop your first PDF to create a guide.",
  },
  moderation: {
    icon: MessageSquareWarning,
    title: "No reports in queue",
    description: "Everything is clean.",
  },
  ai: {
    icon: Brain,
    title: "No documents in the knowledge base",
    description: "Upload a document to get started.",
  },
};

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  variant = "default",
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = icon ?? config.icon;
  const displayTitle = title ?? config.title;
  const displayDescription = description ?? config.description;

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground/60" />
      </div>
      <h3 className="text-base font-medium mb-1">{displayTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {displayDescription}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
