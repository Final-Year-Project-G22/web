"use client";

import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { EditGuideHeader } from "@/app/[locale]/(modules)/guide/_components/edit-guide-header";
import { EditGuideSidebar } from "@/app/[locale]/(modules)/guide/_components/edit-guide-sidebar";
import { EditStepForm } from "@/app/[locale]/(modules)/guide/_components/edit-step-form";
import { MobilePreview } from "@/app/[locale]/(modules)/guide/_components/mobile-preview";
import {
  useAdminGuideDetail,
  useAdminGuideSteps,
  useCreateStep,
  useDeleteStep,
  useReorderSteps,
  useUpdateStep,
} from "@/app/[locale]/(modules)/guide/_services/guide.hook";
import {
  editGuideStore,
  isDraft,
  useEditGuide,
} from "@/app/[locale]/(modules)/guide/_stores/edit-guide.store";
import type { GuideEditorStep } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.types";
import type { AdminGuideStepDTO } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

// ─── Data mapping ──────────────────────────────────────────────

function mapApiToEditorSteps(apiSteps: AdminGuideStepDTO[], language: string): GuideEditorStep[] {
  return apiSteps.map((s) => {
    const richContent =
      (s.translations?.find((t) => t.language === language)?.detailedContent as Record<
        string,
        unknown
      >) ?? {};
    return {
      clientId: s.id,
      guideId: s.guideId,
      slug: s.slug,
      sortOrder: s.sortOrder,
      stepType: s.stepType,
      isOptional: s.isOptional,
      estimatedTime: s.estimatedTime,
      difficultyLevel: s.difficultyLevel,
      feeEstimate: s.feeEstimate,
      effectiveDate: s.effectiveDate,
      expiryDate: s.expiryDate,
      complianceType: s.complianceType,
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
          s.translations?.find((t) => t.language === language)?.description ??
          "",
        proTip: (richContent.proTip as string) ?? "",
        checklistTitle: (richContent.checklistTitle as string) ?? "",
        checklist: (richContent.checklist as GuideEditorStep["ui"]["checklist"]) ?? [],
        imageUrl: (richContent.imageUrl as string) ?? "",
        requiredDocuments:
          (richContent.requiredDocuments as GuideEditorStep["ui"]["requiredDocuments"]) ?? [],
      },
    };
  });
}

function createEmptyStep(guideId: string, order: number, language: string): GuideEditorStep {
  const clientId = `new-${Date.now()}`;
  const ts = Date.now();
  return {
    clientId,
    guideId,
    slug: `step-${ts}`,
    sortOrder: 0,
    stepType: "startup",
    isOptional: false,
    estimatedTime: 15,
    difficultyLevel: 1,
    feeEstimate: 0,
    conditions: null,
    dependencies: null,
    effectiveDate: undefined,
    expiryDate: undefined,
    complianceType: undefined,
    translations: [{ language, title: `Step ${order}`, description: "" }],
    ui: {
      summary: "",
      proTip: "",
      checklistTitle: "",
      checklist: [],
      imageUrl: "",
      requiredDocuments: [],
    },
  };
}

function buildCreatePayload(step: GuideEditorStep) {
  return {
    guideId: step.guideId,
    slug: step.slug,
    sortOrder: 0,
    stepType: step.stepType,
    isOptional: step.isOptional ?? false,
    estimatedTime: step.estimatedTime,
    difficultyLevel: step.difficultyLevel,
    feeEstimate: step.feeEstimate,
    effectiveDate: step.effectiveDate,
    expiryDate: step.expiryDate,
    complianceType: step.complianceType,
    translations: (step.translations ?? []).map((t) => ({
      language: t.language,
      title: t.title,
      description: t.description,
      detailedContent: t.detailedContent,
    })),
  };
}

function buildUpdatePayload(step: GuideEditorStep) {
  return {
    slug: step.slug,
    stepType: step.stepType,
    isOptional: step.isOptional ?? false,
    estimatedTime: step.estimatedTime,
    difficultyLevel: step.difficultyLevel,
    feeEstimate: step.feeEstimate,
    translations: (step.translations ?? []).map((t) => ({
      language: t.language,
      title: t.title,
      description: t.description,
      detailedContent: t.detailedContent,
    })),
    translationMode: "merge" as const,
    complianceType: step.complianceType,
  };
}

// ─── Component ─────────────────────────────────────────────────

export default function EditGuidePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const language = useAdminLanguageStore((s) => s.language);

  const guideQuery = useAdminGuideDetail(id, { locale: language });
  const stepsQuery = useAdminGuideSteps(id, { locale: language, pageSize: 100 });

  const createStepMutation = useCreateStep();
  const updateStepMutation = useUpdateStep();
  const deleteStepMutation = useDeleteStep();
  const reorderStepsMutation = useReorderSteps();

  const setPersistedSteps = useEditGuide((s) => s.setPersistedSteps);
  const setActiveStepId = useEditGuide((s) => s.setActiveStepId);
  const persistedSteps = useEditGuide((s) => s.persistedSteps);
  const draftSteps = useEditGuide((s) => s.draftSteps);
  const addDraftStep = useEditGuide((s) => s.addDraftStep);
  const activeStepId = useEditGuide((s) => s.activeStepId);

  const allSteps = useMemo(() => [...persistedSteps, ...draftSteps], [persistedSteps, draftSteps]);

  const stepParam = searchParams.get("step");

  // Clear drafts when leaving the edit page (back to guide, etc.)
  useEffect(() => {
    return () => {
      editGuideStore.setState({ draftSteps: [] });
    };
  }, []);

  // Seed persistedSteps once on initial load. Never sync again — the store
  // is the source of truth for the edit page to avoid race conditions.
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    if (stepsQuery.data && seededRef.current !== language) {
      seededRef.current = language;
      const serverSteps = mapApiToEditorSteps(stepsQuery.data.steps, language);
      setPersistedSteps(serverSteps);
    }
  }, [stepsQuery.data, setPersistedSteps, language]);

  // Handle ?step=new — create a fresh draft and activate it.
  // Only runs once when entering the page with ?step=new.
  const handledNewRef = useRef(false);
  useEffect(() => {
    if (stepParam !== "new") return;
    if (handledNewRef.current) return;
    handledNewRef.current = true;

    // Clear any stale drafts so the user gets a fresh step every time
    // they click "Add Step" from the guide page.
    editGuideStore.setState({ draftSteps: [] });

    const state = editGuideStore.getState();
    const newStep = createEmptyStep(id, state.displaySteps().length + 1, language);
    addDraftStep(newStep);
  }, [stepParam, id, addDraftStep, language]);

  // URL → activeStepId sync. Always honor the URL step param for persisted IDs.
  useEffect(() => {
    if (!stepParam) return;
    if (stepParam === "new") return;
    if (stepParam.startsWith("new-")) return;

    const state = editGuideStore.getState();
    if (state.activeStepId === stepParam) return;
    if (state.persistedSteps.some((s) => s.clientId === stepParam)) {
      setActiveStepId(stepParam);
    }
  }, [stepParam, setActiveStepId]);

  const guideName =
    guideQuery.data?.translations?.find((t) => t.language === language)?.name ?? "Untitled";

  // ─── Handlers ─────────────────────────────────────────────

  function navigateToStep(stepId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", stepId);
    router.replace(`${pathname}?${params.toString()}`);
  }

  async function handleSave() {
    const state = editGuideStore.getState();
    const step = state.displaySteps().find((s) => s.clientId === state.activeStepId);
    if (!step) return;

    try {
      if (isDraft(step)) {
        const payload = buildCreatePayload(step);
        const result = await createStepMutation.mutateAsync(payload);
        // Remove draft and add the persisted step immediately (no refetch race)
        const created: GuideEditorStep = {
          ...step,
          clientId: result.id,
          sortOrder: state.persistedSteps.length + 1,
        };
        editGuideStore.setState((prev) => ({
          draftSteps: prev.draftSteps.filter((s) => s.clientId !== step.clientId),
          persistedSteps: [...prev.persistedSteps, created],
          activeStepId: result.id,
        }));
        navigateToStep(result.id);
        toast.success("Step created");
      } else {
        const payload = buildUpdatePayload(step);
        await updateStepMutation.mutateAsync({
          id: step.clientId,
          guideId: id,
          patch: payload,
        });
        toast.success("Step saved");
      }
    } catch (err) {
      toast.error(`Failed to save: ${getErrorMessage(err)}`);
    }
  }

  async function handleDeleteStep(stepId: string) {
    if (stepId.startsWith("new-")) {
      editGuideStore.getState().removeStep(stepId);
      if (activeStepId === stepId) {
        const state = editGuideStore.getState();
        const remaining = state.displaySteps();
        if (remaining.length > 0) {
          setActiveStepId(remaining[0].clientId);
          navigateToStep(remaining[0].clientId);
        }
      }
      return;
    }
    try {
      await deleteStepMutation.mutateAsync({ id: stepId, guideId: id });
      const state = editGuideStore.getState();
      const wasActive = state.activeStepId === stepId;
      state.removeStep(stepId);
      if (wasActive) {
        const fresh = editGuideStore.getState();
        const remaining = fresh.displaySteps();
        if (remaining.length > 0) {
          setActiveStepId(remaining[0].clientId);
          navigateToStep(remaining[0].clientId);
        }
      }
      toast.success("Step deleted");
    } catch (err) {
      toast.error(`Failed to delete: ${getErrorMessage(err)}`);
    }
  }

  async function handleSaveOrder() {
    const state = editGuideStore.getState();
    const orderedIds = state.persistedStepIds();
    if (orderedIds.length <= 1) return;

    try {
      await reorderStepsMutation.mutateAsync({
        guideId: id,
        stepIds: orderedIds,
      });
      editGuideStore.getState().setHasPendingReorder(false);
      toast.success("Order saved");
    } catch (err) {
      toast.error(`Failed to save order: ${getErrorMessage(err)}`);
    }
  }

  // ─── Preview data ─────────────────────────────────────────

  const previewStep = useMemo(() => {
    const step = allSteps.find((s) => s.clientId === activeStepId) ?? null;
    if (!step) return null;
    const translation = step.translations?.find((t) => t.language === language);
    return {
      sortOrder: step.sortOrder,
      title: translation?.title ?? "Untitled Step",
      summary: step.ui.summary,
      proTip: step.ui.proTip,
      checklistTitle: step.ui.checklistTitle,
      checklist: step.ui.checklist,
      imageUrl: step.ui.imageUrl,
    };
  }, [allSteps, activeStepId, language]);

  // ─── Loading / Error ──────────────────────────────────────

  if (guideQuery.isLoading || stepsQuery.isLoading) {
    return (
      <div className="-m-8 flex h-[calc(100vh-4rem)] items-center justify-center bg-editor-surface">
        <p className="text-sm text-muted-foreground">Loading guide&hellip;</p>
      </div>
    );
  }

  if (guideQuery.isError || stepsQuery.isError) {
    return (
      <div className="-m-8 flex h-[calc(100vh-4rem)] items-center justify-center bg-editor-surface">
        <p className="text-sm text-destructive">
          Failed to load: {getErrorMessage(guideQuery.error ?? stepsQuery.error)}
        </p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="-m-8 flex h-[calc(100vh-4rem)] flex-col bg-editor-surface">
      <EditGuideHeader guideName={guideName} />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[18rem_1fr] xl:grid-cols-[18rem_1fr_24rem]">
        <EditGuideSidebar
          onDelete={handleDeleteStep}
          onSaveOrder={handleSaveOrder}
          onSelect={navigateToStep}
          onAdd={() => {
            const state = editGuideStore.getState();
            if (state.draftSteps.length > 0) {
              setActiveStepId(state.draftSteps[0].clientId);
              navigateToStep("new");
              return;
            }
            const newStep = createEmptyStep(id, state.displaySteps().length + 1, language);
            addDraftStep(newStep);
            navigateToStep("new");
          }}
        />

        <main className="min-h-0 overflow-auto">
          <EditStepForm onSave={handleSave} />
        </main>

        <MobilePreview
          guideName={guideName}
          totalSteps={persistedSteps.length}
          step={previewStep}
        />
      </div>
    </div>
  );
}
