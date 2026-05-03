"use client";

import { GripVertical, Plus } from "lucide-react";
import { useGuideEditor } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function EditGuideSidebar() {
  const steps = useGuideEditor((state) => state.steps);
  const activeStepId = useGuideEditor((state) => state.activeStepId);
  const setActiveStepId = useGuideEditor((state) => state.setActiveStepId);

  return (
    <aside className="w-full border-r bg-white lg:w-72">
      <div className="border-b px-4 py-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">STRUCTURE</p>
        <p className="text-xs text-muted-foreground">Drag to reorder steps</p>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-2 p-3">
          {steps.map((step, idx) => {
            const title =
              step.translations?.find((translation) => translation.language === "en")?.title ??
              `Step ${idx + 1}`;
            const isActive = activeStepId === step.clientId;

            return (
              <button
                type="button"
                key={step.clientId}
                onClick={() => setActiveStepId(step.clientId)}
                className={`flex w-full items-start gap-2 rounded-lg border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:border-border hover:bg-muted/50"
                }`}
              >
                <GripVertical className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Step {idx + 1}</p>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                </div>
              </button>
            );
          })}

          <Button variant="outline" className="mt-3 w-full border-dashed">
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>
        </div>
      </ScrollArea>
    </aside>
  );
}
