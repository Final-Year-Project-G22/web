/**
 * Shared knowledge-base pipeline stage vocabulary.
 *
 * Both PipelineProgress (dot tones + ordered columns) and SidebarDocuments
 * (badge variants + labels) consume this single source of truth so the stage
 * list cannot drift between the two surfaces.
 */

export type PipelineStageDotTone = "muted" | "info" | "warning" | "success";

export type PipelineStageBadgeVariant =
  | "secondary"
  | "info"
  | "warning"
  | "success"
  | "destructive";

/** Ordered stage columns rendered by the ingestion pipeline progress widget. */
export const PIPELINE_STAGES: { key: string; dotTone: PipelineStageDotTone }[] = [
  { key: "queued", dotTone: "muted" },
  { key: "validating", dotTone: "info" },
  { key: "fetching", dotTone: "info" },
  { key: "chunking", dotTone: "warning" },
  { key: "embedding", dotTone: "warning" },
  { key: "indexing", dotTone: "warning" },
  { key: "completed", dotTone: "success" },
];

/** Dot fill classes per tone (used by PipelineProgress). */
export const PIPELINE_DOT_CLASS: Record<PipelineStageDotTone, string> = {
  muted: "bg-muted-foreground/50",
  info: "bg-info-strong",
  warning: "bg-warning-strong",
  success: "bg-success-strong",
};

/** Badge variant per stage (used by SidebarDocuments). Unknown stages fall back to "secondary". */
export const PIPELINE_BADGE_VARIANT: Record<string, PipelineStageBadgeVariant> = {
  queued: "secondary",
  validating: "info",
  fetching: "info",
  chunking: "warning",
  embedding: "warning",
  indexing: "warning",
  completed: "success",
  failed: "destructive",
};

/** i18n message key (under surfaces.ai.kb) used to label each stage. */
export const PIPELINE_STAGE_LABEL_KEY: Record<string, string> = {
  queued: "queued",
  validating: "validating",
  fetching: "fetching",
  chunking: "chunking",
  embedding: "embedding",
  indexing: "indexing",
  completed: "live",
  failed: "failed",
};
