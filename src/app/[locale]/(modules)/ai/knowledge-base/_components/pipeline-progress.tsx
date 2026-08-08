"use client";

import { useTranslations } from "next-intl";
import { useAIStatusList } from "../_services/ai.hook";

type StageTone = "muted" | "info" | "warning" | "success";

const STAGES: { key: string; tone: StageTone }[] = [
  { key: "queued", tone: "muted" },
  { key: "validating", tone: "info" },
  { key: "fetching", tone: "info" },
  { key: "chunking", tone: "warning" },
  { key: "embedding", tone: "warning" },
  { key: "indexing", tone: "warning" },
  { key: "completed", tone: "success" },
];

const DOT: Record<StageTone, string> = {
  muted: "bg-muted-foreground/50",
  info: "bg-info-strong",
  warning: "bg-warning-strong",
  success: "bg-success-strong",
};

export function PipelineProgress() {
  const t = useTranslations("surfaces.ai.kb");
  const { data: documents } = useAIStatusList(1, 100);

  const counts: Record<string, number> = {};
  for (const s of STAGES) counts[s.key] = 0;
  let failed = 0;

  if (documents) {
    for (const doc of documents) {
      const stage = doc.currentStage.toLowerCase();
      if (stage === "failed") {
        failed++;
      } else if (stage in counts) {
        counts[stage]++;
      }
    }
  }

  const total = documents?.length ?? 0;
  const live = counts.completed;
  const processing = total - live - failed;
  const currentStage = STAGES.find((s) => s.key !== "completed" && counts[s.key] > 0)?.key;

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="font-display text-[13.5px] font-semibold text-ink">{t("pipelineTitle")}</h2>
        <span className="text-[11.5px] text-muted-foreground">{t("pipelineMeta")}</span>
      </div>

      <div className="flex flex-wrap items-stretch">
        {STAGES.map((stage, idx) => {
          const n = counts[stage.key];
          const isCurrent = stage.key === currentStage;
          const isDone = stage.key === "completed";
          return (
            <div
              key={stage.key}
              className={`flex min-w-[92px] flex-1 flex-col gap-1 border-line px-4 py-3 ${
                idx > 0 ? "border-l" : ""
              } ${isCurrent ? "bg-warning-tint/25" : ""}`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    isDone && n === 0 ? "bg-muted-foreground/50" : DOT[stage.tone]
                  }`}
                />
                <span
                  className={`text-[11px] font-medium ${
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t(stage.key === "completed" ? "live" : stage.key)}
                </span>
              </span>
              <span
                className={`font-display text-[18px] font-semibold leading-none tabular-nums ${
                  isDone
                    ? n > 0
                      ? "text-success-strong"
                      : "text-muted-foreground"
                    : isCurrent
                      ? "text-ink"
                      : "text-ink-2"
                }`}
              >
                {n}
              </span>
            </div>
          );
        })}

        {/* summary */}
        <div className="flex items-center gap-4 border-l border-line px-4 py-3 text-[11.5px]">
          {processing > 0 ? (
            <span className="font-medium text-warning-strong">
              {processing} {t("processing")}
            </span>
          ) : null}
          <span className={live > 0 ? "text-success-strong" : "text-muted-foreground"}>
            {live} {t("live")}
          </span>
          {failed > 0 ? (
            <span className="font-medium text-destructive-strong">
              {failed} {t("failed")}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
