"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAIStatusList } from "../_services/ai.hook";

const STAGES = [
  "queued",
  "validating",
  "fetching",
  "chunking",
  "embedding",
  "indexing",
  "completed",
] as const;

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued",
  validating: "Validating",
  fetching: "Fetching",
  chunking: "Chunking",
  embedding: "Embedding",
  indexing: "Indexing",
  completed: "Live",
};

const STAGE_COLORS: Record<string, string> = {
  queued: "bg-slate-400",
  validating: "bg-blue-400",
  fetching: "bg-sky-400",
  chunking: "bg-orange-400",
  embedding: "bg-amber-400",
  indexing: "bg-yellow-400",
  completed: "bg-green-500",
};

export function PipelineProgress() {
  const { data: documents } = useAIStatusList(1, 100);

  const counts: Record<string, number> = {};
  for (const s of STAGES) counts[s] = 0;
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
  const active = total - (counts.completed + failed);
  const hasDocs = total > 0;

  return (
    <Card>
      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Pipeline stages */}
          <div className="flex-1 flex items-center gap-0">
            {STAGES.map((stage) => {
              const n = counts[stage];
              const isActive = n > 0 && stage !== "completed";
              const width = hasDocs
                ? `${Math.max((n / total) * 100, 4)}%`
                : `${100 / STAGES.length}%`;

              return (
                <div key={stage} className="flex flex-col items-center gap-1" style={{ width }}>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${isActive ? `${STAGE_COLORS[stage]} animate-pulse` : STAGE_COLORS[stage]}`}
                    />
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      {STAGE_LABELS[stage]}
                    </span>
                  </div>
                  <Progress
                    value={hasDocs ? (n / total) * 100 : 0}
                    className={`h-1.5 w-full ${isActive ? `[&>div]:${STAGE_COLORS[stage]}` : ""}`}
                  />
                  <span
                    className={`text-[10px] font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {n}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="flex items-center gap-3 shrink-0 text-xs">
            {failed > 0 && <span className="text-destructive font-medium">{failed} Failed</span>}
            <span className="text-muted-foreground">{counts.completed} Live</span>
            {active > 0 && <span className="text-primary font-medium">{active} Processing</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
