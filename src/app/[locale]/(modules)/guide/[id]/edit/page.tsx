"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { EditGuideHeader } from "@/app/[locale]/(modules)/guide/_components/edit-guide-header";
import { EditGuideSidebar } from "@/app/[locale]/(modules)/guide/_components/edit-guide-sidebar";
import { EditStepForm } from "@/app/[locale]/(modules)/guide/_components/edit-step-form";
import { MobilePreview } from "@/app/[locale]/(modules)/guide/_components/mobile-preview";
import {
  useAdminGuideDetail,
  useAdminGuideSteps,
} from "@/app/[locale]/(modules)/guide/_services/guide.hook";
import type {
  GuideEditorMeta,
  GuideEditorStep,
} from "@/app/[locale]/(modules)/guide/_stores/guide-editor.store";
import { useGuideEditor } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.store";
import { getErrorMessage } from "@/lib/utils";

function mapApiToEditorMeta(detail: {
  id: string;
  categoryId: string;
  slug: string;
  sortOrder: number;
  icon?: string;
  translations?: { language: string; name: string; description?: string }[] | null;
  conditions?: unknown[] | null;
}): GuideEditorMeta {
  return {
    categoryId: detail.categoryId,
    slug: detail.slug,
    sortOrder: detail.sortOrder,
    icon: detail.icon,
    conditions: null,
    translations: (detail.translations ?? []).map((t) => ({
      language: t.language,
      name: t.name,
      description: t.description ?? "",
    })),
  };
}

function mapApiToEditorSteps(
  apiSteps: {
    id: string;
    guideId: string;
    slug: string;
    stepType: string;
    sortOrder: number;
    isOptional: boolean;
    estimatedTime?: number;
    difficultyLevel?: number;
    feeEstimate?: number;
    effectiveDate?: string;
    expiryDate?: string;
    translations?:
      | { language: string; title: string; description?: string; detailedContent?: unknown }[]
      | null;
  }[]
): GuideEditorStep[] {
  return apiSteps.map((s) => {
    const richContent =
      (s.translations?.find((t) => t.language === "en")?.detailedContent as Record<
        string,
        unknown
      >) ?? {};
    return {
      clientId: s.id,
      guideId: s.guideId,
      slug: s.slug,
      stepType: s.stepType,
      sortOrder: s.sortOrder,
      isOptional: s.isOptional,
      estimatedTime: s.estimatedTime,
      difficultyLevel: s.difficultyLevel,
      feeEstimate: s.feeEstimate,
      effectiveDate: s.effectiveDate,
      expiryDate: s.expiryDate,
      conditions: null,
      dependencies: null,
      translations: (s.translations ?? []).map((t) => ({
        language: t.language,
        title: t.title,
        description: t.description ?? "",
        detailedContent: t.detailedContent ?? null,
      })),
      ui: {
        summary:
          (richContent.summary as string) ??
          s.translations?.find((t) => t.language === "en")?.description ??
          "",
        proTip: (richContent.proTip as string) ?? "",
        checklistTitle: (richContent.checklistTitle as string) ?? "",
        checklist: (richContent.checklist as GuideEditorStep["ui"]["checklist"]) ?? [],
        imageUrl: (richContent.imageUrl as string) ?? "",
      },
    };
  });
}

export default function EditGuidePage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const detailQuery = useAdminGuideDetail(id, { locale: "en" });
  const stepsQuery = useAdminGuideSteps(id, { locale: "en" });

  const hydrate = useGuideEditor((state) => state.hydrate);
  const steps = useGuideEditor((state) => state.steps);
  const activeStepId = useGuideEditor((state) => state.activeStepId);
  const setActiveStepId = useGuideEditor((state) => state.setActiveStepId);

  useEffect(() => {
    if (detailQuery.data && stepsQuery.data) {
      hydrate(mapApiToEditorMeta(detailQuery.data), mapApiToEditorSteps(stepsQuery.data.steps));
    }
  }, [detailQuery.data, stepsQuery.data, hydrate]);

  useEffect(() => {
    const requestedStep = searchParams.get("step");
    if (!requestedStep) {
      const fallback = steps[0]?.clientId;
      if (fallback) {
        router.replace(`?step=${fallback}`);
        setActiveStepId(fallback);
      }
      return;
    }

    const exists = steps.some((step) => step.clientId === requestedStep);
    if (exists && requestedStep !== activeStepId) {
      setActiveStepId(requestedStep);
    }
  }, [activeStepId, router, searchParams, setActiveStepId, steps]);

  if (detailQuery.isLoading || stepsQuery.isLoading) {
    return (
      <div className="-m-8 flex h-[calc(100vh-4rem)] items-center justify-center bg-[#f4f5f7]">
        <p className="text-sm text-muted-foreground">Loading guide&hellip;</p>
      </div>
    );
  }

  if (detailQuery.isError || stepsQuery.isError) {
    return (
      <div className="-m-8 flex h-[calc(100vh-4rem)] items-center justify-center bg-[#f4f5f7]">
        <p className="text-sm text-destructive">
          Failed to load: {getErrorMessage(detailQuery.error ?? stepsQuery.error)}
        </p>
      </div>
    );
  }

  return (
    <div className="-m-8 flex h-[calc(100vh-4rem)] flex-col bg-[#f4f5f7]">
      <EditGuideHeader />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[18rem_1fr] xl:grid-cols-[18rem_1fr_24rem]">
        <EditGuideSidebar />
        <main className="min-h-0 overflow-auto">
          <EditStepForm />
        </main>
        <MobilePreview />
      </div>
    </div>
  );
}
