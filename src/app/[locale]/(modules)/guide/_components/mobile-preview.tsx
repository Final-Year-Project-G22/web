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
    <aside className="hidden border-l bg-[#f9fafb] p-6 xl:block">
      <p className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground">LIVE PREVIEW</p>

      <div className="mx-auto w-[320px] rounded-[2.2rem] border-8 border-slate-800 bg-slate-800 p-2 shadow-2xl">
        <div className="relative h-155 overflow-hidden rounded-[1.6rem] bg-white">
          <div className="absolute left-1/2 top-0 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-800" />

          <div className="h-full overflow-auto">
            <div className="bg-blue-600 px-4 pb-3 pt-8 text-white">
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4" />
                <span className="truncate font-medium">{guideName}</span>
              </div>
            </div>

            <div className="space-y-3 p-4">
              {step ? (
                <>
                  <p className="text-[11px] font-semibold text-blue-700">
                    STEP {step.sortOrder} OF {totalSteps}
                  </p>
                  <h3 className="text-xl font-semibold leading-tight text-slate-900">
                    {step.title}
                  </h3>

                  {/* Render HTML summary with Tailwind prose styling */}
                  <div
                    className="prose prose-sm prose-zinc max-w-none text-sm leading-6 text-slate-600"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML from controlled tiptap editor
                    dangerouslySetInnerHTML={{ __html: step.summary }}
                  />

                  {/* Pro Tip - only if present */}
                  {step.proTip && (
                    <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      <span className="font-semibold">Pro Tip:</span> {step.proTip}
                    </div>
                  )}

                  {/* Checklist - only if items exist */}
                  {step.checklist.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-slate-900">
                        {step.checklistTitle || "Checklist"}
                      </p>
                      <ul className="space-y-2">
                        {step.checklist.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start gap-2 text-sm text-slate-600"
                          >
                            {item.isCompleted ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 text-slate-400" />
                            )}
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Image - only if URL present */}
                  {step.imageUrl && (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg bg-slate-100">
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
                <p className="text-sm text-slate-500">No step selected</p>
              )}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 rounded-lg border bg-emerald-50 px-3 py-2 shadow-md">
            <p className="text-xs font-medium text-emerald-700">Auto-saved</p>
            <p className="text-[11px] text-emerald-600">Your changes are safe.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
