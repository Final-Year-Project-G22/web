"use client";

import { CheckCircle2, Circle, Smartphone } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { useGuideEditor } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.store";
import { Button } from "@/components/ui/button";

export function MobilePreview() {
  const language = useGuideEditor((state) => state.editorLanguage);
  const meta = useGuideEditor((state) => state.meta);
  const steps = useGuideEditor((state) => state.steps);
  const activeStepId = useGuideEditor((state) => state.activeStepId);

  const activeStep = useMemo(
    () => steps.find((step) => step.clientId === activeStepId) ?? steps[0],
    [activeStepId, steps]
  );

  const guideTitle =
    meta.translations?.find((translation) => translation.language === language)?.name ?? "Guide";
  const stepTitle =
    activeStep?.translations?.find((translation) => translation.language === language)?.title ??
    "Step";

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
                <span className="truncate font-medium">{guideTitle}</span>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <p className="text-[11px] font-semibold text-blue-700">
                STEP {activeStep?.sortOrder ?? 1} OF {steps.length}
              </p>
              <h3 className="text-xl font-semibold leading-tight text-slate-900">{stepTitle}</h3>

              <p className="text-sm leading-6 text-slate-600">
                {activeStep?.ui.summary.replace(/<[^>]*>?/gm, "")}
              </p>

              <div className="rounded-md border-l-4 border-blue-500 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Pro Tip: {activeStep?.ui.proTip}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">Checklist:</p>
                <ul className="space-y-2">
                  {activeStep?.ui.checklist.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 text-sm text-slate-600">
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

              <div className="relative h-24 w-full overflow-hidden rounded-lg bg-slate-100">
                <Image src="/window.svg" alt={stepTitle} fill className="object-cover p-2" />
              </div>

              <Button className="w-full">Mark Step Complete</Button>
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
