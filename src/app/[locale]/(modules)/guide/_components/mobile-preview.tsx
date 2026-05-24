"use client";

import { CheckCircle2, Circle, Smartphone } from "lucide-react";
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
  return (
    <aside className="hidden border-l bg-editor-surface p-6 xl:block">
      <p className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground">LIVE PREVIEW</p>

      <div className="mx-auto w-[320px] rounded-[2.2rem] border-8 border-foreground/20 bg-foreground/10 p-2 shadow-2xl">
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
                  <p className="text-xs font-semibold text-primary">
                    STEP {step.sortOrder} OF {totalSteps}
                  </p>
                  <h3 className="text-xl font-semibold leading-tight text-foreground">
                    {step.title}
                  </h3>

                  <div
                    className="prose prose-sm max-w-none text-sm leading-6 text-muted-foreground"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML from controlled tiptap editor
                    dangerouslySetInnerHTML={{ __html: step.summary }}
                  />

                  {step.proTip && (
                    <div className="rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2 text-xs text-primary">
                      <span className="font-semibold">Pro Tip:</span> {step.proTip}
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
                              <CheckCircle2 className="mt-0.5 size-4 text-success" />
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
                    <div className="relative h-32 w-full overflow-hidden rounded-lg bg-muted">
                      {/* biome-ignore lint/performance/noImgElement: external image in preview */}
                      <img
                        src={step.imageUrl}
                        alt={step.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <Button className="w-full">Mark Step Complete</Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No step selected</p>
              )}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 rounded-lg border bg-success/10 px-3 py-2 shadow-md">
            <p className="text-xs font-medium text-success">Auto-saved</p>
            <p className="text-xs text-success/80">Your changes are safe.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
