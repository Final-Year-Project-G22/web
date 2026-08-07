"use client";

import { CheckCircle2, Circle, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GuideEditorChecklistItem } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.types";
import { Button } from "@/components/ui/button";

interface PreviewStep {
  sortOrder: number;
  title: string;
  summary: string;
  proTip: string;
  checklistTitle: string;
  checklist: GuideEditorChecklistItem[];
  imageUrl: string;
}

interface MobilePreviewProps {
  guideName: string;
  totalSteps: number;
  step: PreviewStep | null;
}

export function MobilePreview({ guideName, totalSteps, step }: MobilePreviewProps) {
  const t = useTranslations("surfaces.guide.editor");

  return (
    <aside className="hidden min-h-0 flex-col border-l border-line bg-editor-surface p-6 xl:flex">
      <p className="mb-4 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
        {t("livePreview")}
      </p>

      <div className="mx-auto w-[320px] shrink-0 rounded-[2.2rem] border-8 border-foreground/15 bg-foreground/5 p-2 shadow-popover">
        <div className="relative h-155 overflow-hidden rounded-[1.6rem] bg-background">
          <div className="absolute left-1/2 top-0 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-foreground/10" />

          <div className="h-full overflow-auto">
            <div className="bg-primary px-4 pb-3 pt-8 text-primary-foreground">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="size-4" />
                <span className="truncate font-medium">{guideName}</span>
              </div>
            </div>

            <div className="space-y-3 p-4">
              {step ? (
                <>
                  <p className="font-mono text-[10.5px] font-semibold tracking-[0.12em] text-primary tabular-nums">
                    {t("stepOf", {
                      current: String(step.sortOrder || 1).padStart(2, "0"),
                      total: String(totalSteps).padStart(2, "0"),
                    })}
                  </p>
                  <h3 className="text-xl font-semibold leading-tight text-foreground">
                    {step.title}
                  </h3>

                  <div
                    className="prose prose-sm max-w-none text-sm leading-6 text-muted-foreground dark:prose-invert"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML from controlled tiptap editor
                    dangerouslySetInnerHTML={{ __html: step.summary }}
                  />

                  {step.proTip && (
                    <div className="rounded-md border-l-4 border-amber bg-amber-tint px-3 py-2 text-xs text-warning-strong">
                      <span className="font-semibold">{t("proTip")}:</span> {step.proTip}
                    </div>
                  )}

                  {step.checklist.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-foreground">
                        {step.checklistTitle || "Checklist"}
                      </p>
                      <ul className="space-y-2">
                        {step.checklist.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            {item.isCompleted ? (
                              <CheckCircle2 className="mt-0.5 size-4 text-success-strong" />
                            ) : (
                              <Circle className="mt-0.5 size-4 text-muted-foreground" />
                            )}
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.imageUrl && (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg bg-canvas-2">
                      {/* biome-ignore lint/performance/noImgElement: external image in preview */}
                      <img
                        src={step.imageUrl}
                        alt={step.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <Button className="w-full">{t("markComplete")}</Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noStep")}</p>
              )}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 rounded-lg border border-success/25 bg-success-tint px-3 py-2 shadow-card">
            <p className="text-xs font-medium text-success-strong">{t("autoSaved")}</p>
            <p className="text-xs text-success-strong/80">{t("changesSafe")}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
