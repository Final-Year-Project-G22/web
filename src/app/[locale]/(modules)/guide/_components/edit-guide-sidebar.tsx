"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  editGuideStore,
  isDraft,
  useEditGuide,
} from "@/app/[locale]/(modules)/guide/_stores/edit-guide.store";
import type { GuideEditorStep } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

interface SidebarStep {
  clientId: string;
  translations?: { language: string; title: string }[] | null;
}

function SortableStepItem({
  step,
  idx,
  language,
  isActive,
  onSelect,
  onRemove,
}: {
  step: SidebarStep;
  idx: number;
  language: string;
  isActive: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.clientId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const title =
    step.translations?.find((tr) => tr.language === language)?.title ?? `Step ${idx + 1}`;
  const number = String(idx + 1).padStart(2, "0");

  return (
    // biome-ignore lint/a11y/useSemanticElements: DnD sortable requires div
    <div
      role="button"
      tabIndex={0}
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(step.clientId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(step.clientId);
        }
      }}
      className={`group flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer ${
        isActive
          ? "border-transparent bg-navy text-primary-foreground"
          : "border-transparent hover:bg-panel-2"
      }`}
    >
      <span
        className={`font-mono text-[11px] font-medium tabular-nums ${
          isActive ? "text-primary-foreground/80" : "text-muted-foreground"
        }`}
      >
        {number}
      </span>
      <div
        {...attributes}
        {...listeners}
        className={`shrink-0 cursor-grab touch-none ${
          isActive
            ? "text-primary-foreground/70"
            : "text-muted-foreground/50 group-hover:text-muted-foreground"
        }`}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{title}</p>
      </div>
      {isDraft(step as GuideEditorStep) ? (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            isActive ? "bg-primary-foreground/80" : "bg-amber"
          }`}
          title="New step"
        />
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        className={`h-6 w-6 shrink-0 ${
          isActive
            ? "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            : "text-muted-foreground/60 opacity-0 group-hover:opacity-100 hover:text-destructive-strong"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(step.clientId);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface EditGuideSidebarProps {
  onSelect: (stepId: string) => void;
  onAdd: () => void;
  onDelete: (stepId: string) => void;
  onSaveOrder: () => void;
}

export function EditGuideSidebar({
  onSelect,
  onAdd,
  onDelete,
  onSaveOrder,
}: EditGuideSidebarProps) {
  const t = useTranslations("surfaces.guide.editor");
  const persistedSteps = useEditGuide((s) => s.persistedSteps);
  const draftSteps = useEditGuide((s) => s.draftSteps);
  const activeStepId = useEditGuide((s) => s.activeStepId);
  const language = useAdminLanguageStore((s) => s.language);
  const hasPendingReorder = useEditGuide((s) => s.hasPendingReorder);

  const steps = useMemo(() => [...persistedSteps, ...draftSteps], [persistedSteps, draftSteps]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.clientId === active.id);
    const newIndex = steps.findIndex((s) => s.clientId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    editGuideStore.getState().reorderStep(oldIndex, newIndex);
  }

  return (
    <aside className="flex min-h-0 w-full flex-col border-r border-line bg-panel lg:w-[16.5rem] lg:shrink-0">
      <div className="shrink-0 border-b border-line px-4 py-3.5">
        <div className="flex items-baseline justify-between">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {t("steps")}
          </p>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {String(steps.length).padStart(2, "0")}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{t("journeyHint")}</p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={steps.map((s) => s.clientId)}
              strategy={verticalListSortingStrategy}
            >
              {steps.map((step, idx) => (
                <SortableStepItem
                  key={step.clientId}
                  step={step}
                  idx={idx}
                  language={language}
                  isActive={activeStepId === step.clientId}
                  onSelect={onSelect}
                  onRemove={onDelete}
                />
              ))}
            </SortableContext>
          </DndContext>

          {hasPendingReorder && (
            <Button variant="outline" className="mt-2 w-full" onClick={onSaveOrder}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {t("saveOrder")}
            </Button>
          )}

          <Button
            variant="outline"
            className="mt-2 w-full border-dashed"
            onClick={onAdd}
            aria-label={t("addStep")}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("addStep")}
          </Button>
        </div>
      </ScrollArea>
    </aside>
  );
}
