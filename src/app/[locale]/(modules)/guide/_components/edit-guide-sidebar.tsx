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
import { useMemo } from "react";
import {
  editGuideStore,
  useEditGuide,
} from "@/app/[locale]/(modules)/guide/_stores/edit-guide.store";
import type { GuideEditorStep } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const title = step.translations?.find((t) => t.language === language)?.title ?? `Step ${idx + 1}`;

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
      className={`flex w-full items-start gap-2 rounded-lg border px-3 py-3 text-left transition cursor-pointer ${
        isActive
          ? "border-blue-500 bg-blue-50"
          : "border-transparent hover:border-border hover:bg-muted/50"
      }`}
    >
      <div {...attributes} {...listeners} className="mt-0.5 cursor-grab touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">Step {idx + 1}</p>
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-red-500"
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
  const persistedSteps = useEditGuide((s) => s.persistedSteps);
  const draftSteps = useEditGuide((s) => s.draftSteps);
  const activeStepId = useEditGuide((s) => s.activeStepId);
  const language = useEditGuide((s) => s.language);
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
    <aside className="w-full border-r bg-white lg:w-72">
      <div className="border-b px-4 py-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">STRUCTURE</p>
        <p className="text-xs text-muted-foreground">Drag to reorder steps</p>
      </div>

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-2 p-3">
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
              <Save className="mr-2 h-4 w-4" />
              Save Order
            </Button>
          )}

          <Button variant="outline" className="mt-3 w-full border-dashed" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>
        </div>
      </ScrollArea>
    </aside>
  );
}
