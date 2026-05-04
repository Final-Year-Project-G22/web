"use client";

import { Rocket } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateGuide, useUpdateStep } from "@/app/[locale]/(modules)/guide/_services/guide.hook";
import { useGuideEditor } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export function EditGuideHeader() {
  const { id: guideId } = useParams<{ id: string }>();

  const language = useGuideEditor((state) => state.editorLanguage);
  const meta = useGuideEditor((state) => state.meta);
  const steps = useGuideEditor((state) => state.steps);
  const title = useGuideEditor(
    (state) =>
      state.meta.translations?.find((translation) => translation.language === language)?.name ??
      "Untitled Guide"
  );

  const [isSaving, setIsSaving] = useState(false);

  const updateGuide = useUpdateGuide();
  const updateStep = useUpdateStep();

  const activeStepId = useGuideEditor((state) => state.activeStepId);
  const activeStep = steps.find((s) => s.clientId === activeStepId);

  async function saveGuideMeta() {
    await updateGuide.mutateAsync({
      id: guideId,
      patch: {
        categoryId: meta.categoryId,
        slug: meta.slug,
        sortOrder: meta.sortOrder,
        icon: meta.icon ?? undefined,
        translations: (meta.translations ?? []).map((t) => ({
          language: t.language,
          name: t.name,
          description: t.description,
        })),
      },
    });
  }

  function buildStepPatch(step: (typeof steps)[number]) {
    return {
      slug: step.slug,
      stepType: step.stepType,
      sortOrder: step.sortOrder,
      isOptional: step.isOptional,
      estimatedTime: step.estimatedTime,
      difficultyLevel: step.difficultyLevel,
      feeEstimate: step.feeEstimate,
      translations: (step.translations ?? []).map((t) => ({
        language: t.language,
        title: t.title,
        description: t.description,
        detailedContent: t.detailedContent,
      })),
    };
  }

  async function saveActiveStep() {
    if (!activeStep) return;
    await updateStep.mutateAsync({
      id: activeStep.clientId,
      guideId,
      patch: buildStepPatch(activeStep),
    });
  }

  async function saveAllSteps() {
    await Promise.all(
      steps.map((step) =>
        updateStep.mutateAsync({
          id: step.clientId,
          guideId,
          patch: buildStepPatch(step),
        })
      )
    );
  }

  async function handleSaveDraft() {
    setIsSaving(true);
    try {
      await saveGuideMeta();
      await saveActiveStep();
      toast.success("Draft saved successfully");
    } catch {
      toast.error("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    setIsSaving(true);
    try {
      await saveGuideMeta();
      await saveAllSteps();
      toast.success("Guide published successfully");
    } catch {
      toast.error("Failed to publish guide. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <header className="border-b bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/guide">Guides</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-foreground">Edit Guide</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Last saved 2m ago</p>
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={handlePublish} disabled={isSaving}>
            <Rocket className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Publish"}
          </Button>
        </div>
      </div>
    </header>
  );
}
