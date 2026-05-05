"use client";

import { createStore, useStore } from "zustand";
import type { GuideEditorStep } from "./guide-editor.types";

export function isDraft(step: GuideEditorStep): boolean {
  return step.clientId.startsWith("new-");
}

interface EditGuideState {
  persistedSteps: GuideEditorStep[];
  draftSteps: GuideEditorStep[];
  activeStepId: string;
  language: string;
  hasPendingReorder: boolean;

  setPersistedSteps: (steps: GuideEditorStep[]) => void;
  addDraftStep: (step: GuideEditorStep) => void;
  removeStep: (stepId: string) => void;
  updateStep: (stepId: string, updates: Partial<GuideEditorStep>) => void;
  setActiveStepId: (id: string) => void;
  setLanguage: (lang: string) => void;
  setHasPendingReorder: (pending: boolean) => void;
  reorderStep: (oldIndex: number, newIndex: number) => void;
  displaySteps: () => GuideEditorStep[];
  persistedStepIds: () => string[];
}

const createEditGuideStore = () =>
  createStore<EditGuideState>()((set, get) => ({
    persistedSteps: [],
    draftSteps: [],
    activeStepId: "",
    language: "en",
    hasPendingReorder: false,

    setPersistedSteps: (steps) => set({ persistedSteps: steps }),

    displaySteps: () => get().persistedSteps.concat(get().draftSteps),

    persistedStepIds: () => get().persistedSteps.map((s) => s.clientId),

    addDraftStep: (step) =>
      set((state) => ({
        draftSteps: [...state.draftSteps, step],
        activeStepId: step.clientId,
      })),

    removeStep: (stepId) =>
      set((state) => {
        const inPersisted = state.persistedSteps.some((s) => s.clientId === stepId);
        const nextPersisted = inPersisted
          ? state.persistedSteps.filter((s) => s.clientId !== stepId)
          : state.persistedSteps;
        const nextDraft = inPersisted
          ? state.draftSteps
          : state.draftSteps.filter((s) => s.clientId !== stepId);
        const allSteps = [...nextPersisted, ...nextDraft];
        const nextActive =
          state.activeStepId === stepId ? (allSteps[0]?.clientId ?? "") : state.activeStepId;
        return {
          persistedSteps: nextPersisted,
          draftSteps: nextDraft,
          activeStepId: nextActive,
        };
      }),

    updateStep: (stepId, updates) =>
      set((state) => {
        const inPersisted = state.persistedSteps.some((s) => s.clientId === stepId);
        if (inPersisted) {
          return {
            persistedSteps: state.persistedSteps.map((s) =>
              s.clientId === stepId ? { ...s, ...updates } : s
            ),
          };
        }
        return {
          draftSteps: state.draftSteps.map((s) =>
            s.clientId === stepId ? { ...s, ...updates } : s
          ),
        };
      }),

    setActiveStepId: (id) => set({ activeStepId: id }),

    setLanguage: (lang) => set({ language: lang }),

    setHasPendingReorder: (pending) => set({ hasPendingReorder: pending }),

    reorderStep: (oldIndex, newIndex) =>
      set((state) => {
        const combined = [...state.persistedSteps, ...state.draftSteps];
        const [moved] = combined.splice(oldIndex, 1);
        combined.splice(newIndex, 0, moved);
        const renumbered = combined.map((s, idx) => ({ ...s, sortOrder: idx + 1 }));
        return {
          persistedSteps: renumbered.filter((s) => !isDraft(s)),
          draftSteps: renumbered.filter((s) => isDraft(s)),
          hasPendingReorder: true,
        };
      }),
  }));

const editGuideStore = createEditGuideStore();

export { editGuideStore };

export function useEditGuide<T>(selector: (state: EditGuideState) => T): T {
  return useStore(editGuideStore, selector);
}
