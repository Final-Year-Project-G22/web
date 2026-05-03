"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { EditGuideHeader } from "@/app/[locale]/(modules)/guide/_components/edit-guide-header";
import { EditGuideSidebar } from "@/app/[locale]/(modules)/guide/_components/edit-guide-sidebar";
import { EditStepForm } from "@/app/[locale]/(modules)/guide/_components/edit-step-form";
import { MobilePreview } from "@/app/[locale]/(modules)/guide/_components/mobile-preview";
import { useGuideEditor } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.store";

export default function EditGuidePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const steps = useGuideEditor((state) => state.steps);
  const activeStepId = useGuideEditor((state) => state.activeStepId);
  const setActiveStepId = useGuideEditor((state) => state.setActiveStepId);

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

  useEffect(() => {
    const current = searchParams.get("step");
    if (current === activeStepId || !activeStepId) return;
    router.replace(`?step=${activeStepId}`);
  }, [activeStepId, router, searchParams]);

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
