"use client";

import { createStore, useStore } from "zustand";
import type { CreateGuideRequest } from "@/lib/api/types/createGuideRequest";
import type { CreateGuideTranslation } from "@/lib/api/types/createGuideTranslation";
import type { CreateStepRequest } from "@/lib/api/types/createStepRequest";
import type { CreateStepTranslation } from "@/lib/api/types/createStepTranslation";

export type GuideEditorChecklistItem = {
  id: string;
  label: string;
  isRequired: boolean;
  isCompleted: boolean;
};

export type GuideEditorRichContent = {
  summary: string;
  proTip: string;
  checklistTitle: string;
  checklist: GuideEditorChecklistItem[];
  imageUrl: string;
};

export type GuideEditorStep = CreateStepRequest & {
  clientId: string;
  ui: GuideEditorRichContent;
};

export type GuideEditorMeta = CreateGuideRequest;

export type GuideEditorState = {
  meta: GuideEditorMeta;
  steps: GuideEditorStep[];
  activeStepId: string;
  setActiveStepId: (stepId: string) => void;
  updateStep: (stepId: string, updates: Partial<GuideEditorStep>) => void;
  updateMeta: (updates: Partial<GuideEditorMeta>) => void;
};

const createGuideTranslations = (name: string, description: string): CreateGuideTranslation[] => [
  {
    language: "en",
    name,
    description,
  },
  {
    language: "am",
    name,
    description,
  },
];

const createStepTranslations = (
  title: string,
  summary: string,
  ui: GuideEditorRichContent
): CreateStepTranslation[] => [
  {
    language: "en",
    title,
    description: summary,
    detailedContent: ui,
  },
  {
    language: "am",
    title,
    description: summary,
    detailedContent: ui,
  },
];

export const guideEditorInitialState: {
  meta: GuideEditorMeta;
  steps: GuideEditorStep[];
  activeStepId: string;
} = {
  meta: {
    categoryId: "legal-compliance",
    slug: "register-sole-proprietorship",
    sortOrder: 1,
    icon: "file-check",
    conditions: null,
    translations: createGuideTranslations(
      "How to Register a Sole Proprietorship",
      "Step-by-step process for sole proprietorship registration."
    ),
  },
  activeStepId: "step-1",
  steps: [
    {
      clientId: "step-1",
      guideId: "guide-local-1",
      slug: "prepare-required-documents",
      sortOrder: 1,
      stepType: "document",
      isOptional: false,
      estimatedTime: 15,
      difficultyLevel: 2,
      feeEstimate: 0,
      conditions: null,
      dependencies: null,
      effectiveDate: undefined,
      expiryDate: undefined,
      ui: {
        summary:
          "Before visiting the bureau, ensure you have all necessary identification and business verification documents. This step is crucial to avoid multiple trips.",
        proTip: "Make 3 copies of each document.",
        checklistTitle: "Checklist of items",
        checklist: [
          {
            id: "check-1",
            label: "Valid Kebele ID Card (Original + Copy)",
            isRequired: true,
            isCompleted: true,
          },
          {
            id: "check-2",
            label: "Tax Identification Number (TIN) Registration Form",
            isRequired: true,
            isCompleted: true,
          },
          {
            id: "check-3",
            label: "Completed Trade Name Registration Form",
            isRequired: true,
            isCompleted: false,
          },
          {
            id: "check-4",
            label: "2 Passport Size Photos (taken within 6 months)",
            isRequired: false,
            isCompleted: false,
          },
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80",
      },
      translations: createStepTranslations(
        "Prepare Required Documents",
        "Before visiting the bureau, ensure you have all necessary identification and business verification documents. This step is crucial to avoid multiple trips.",
        {
          summary:
            "Before visiting the bureau, ensure you have all necessary identification and business verification documents. This step is crucial to avoid multiple trips.",
          proTip: "Make 3 copies of each document.",
          checklistTitle: "Checklist of items",
          checklist: [
            {
              id: "check-1",
              label: "Valid Kebele ID Card (Original + Copy)",
              isRequired: true,
              isCompleted: true,
            },
            {
              id: "check-2",
              label: "Tax Identification Number (TIN) Registration Form",
              isRequired: true,
              isCompleted: true,
            },
            {
              id: "check-3",
              label: "Completed Trade Name Registration Form",
              isRequired: true,
              isCompleted: false,
            },
            {
              id: "check-4",
              label: "2 Passport Size Photos (taken within 6 months)",
              isRequired: false,
              isCompleted: false,
            },
          ],
          imageUrl:
            "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80",
        }
      ),
    },
    {
      clientId: "step-2",
      guideId: "guide-local-1",
      slug: "visit-bureau-office",
      sortOrder: 2,
      stepType: "visit",
      isOptional: false,
      estimatedTime: 20,
      difficultyLevel: 2,
      feeEstimate: 0,
      conditions: null,
      dependencies: null,
      effectiveDate: undefined,
      expiryDate: undefined,
      ui: {
        summary:
          "Bring your documents to the nearest bureau and request the registration service. Ensure that all forms are correctly filled out before submission.",
        proTip: "Arrive before 10:00 AM to reduce waiting time.",
        checklistTitle: "Bring with you",
        checklist: [
          {
            id: "check-5",
            label: "All original documents",
            isRequired: true,
            isCompleted: false,
          },
          {
            id: "check-6",
            label: "Printed application form",
            isRequired: true,
            isCompleted: false,
          },
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80",
      },
      translations: createStepTranslations(
        "Visit Bureau Office",
        "Bring your documents to the nearest bureau and request the registration service. Ensure that all forms are correctly filled out before submission.",
        {
          summary:
            "Bring your documents to the nearest bureau and request the registration service. Ensure that all forms are correctly filled out before submission.",
          proTip: "Arrive before 10:00 AM to reduce waiting time.",
          checklistTitle: "Bring with you",
          checklist: [
            {
              id: "check-5",
              label: "All original documents",
              isRequired: true,
              isCompleted: false,
            },
            {
              id: "check-6",
              label: "Printed application form",
              isRequired: true,
              isCompleted: false,
            },
          ],
          imageUrl:
            "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80",
        }
      ),
    },
    {
      clientId: "step-3",
      guideId: "guide-local-1",
      slug: "payment-and-receipt",
      sortOrder: 3,
      stepType: "payment",
      isOptional: false,
      estimatedTime: 10,
      difficultyLevel: 1,
      feeEstimate: 500,
      conditions: null,
      dependencies: null,
      effectiveDate: undefined,
      expiryDate: undefined,
      ui: {
        summary:
          "Pay the registration fee and collect your receipt. Keep it safe as it is required for the final confirmation.",
        proTip: "Ask for a stamped receipt copy.",
        checklistTitle: "After payment",
        checklist: [
          {
            id: "check-7",
            label: "Payment receipt",
            isRequired: true,
            isCompleted: false,
          },
          {
            id: "check-8",
            label: "Stamped confirmation form",
            isRequired: true,
            isCompleted: false,
          },
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80",
      },
      translations: createStepTranslations(
        "Payment & Receipt",
        "Pay the registration fee and collect your receipt. Keep it safe as it is required for the final confirmation.",
        {
          summary:
            "Pay the registration fee and collect your receipt. Keep it safe as it is required for the final confirmation.",
          proTip: "Ask for a stamped receipt copy.",
          checklistTitle: "After payment",
          checklist: [
            {
              id: "check-7",
              label: "Payment receipt",
              isRequired: true,
              isCompleted: false,
            },
            {
              id: "check-8",
              label: "Stamped confirmation form",
              isRequired: true,
              isCompleted: false,
            },
          ],
          imageUrl:
            "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80",
        }
      ),
    },
  ],
};

export const createGuideEditorStore = () =>
  createStore<GuideEditorState>()((set) => ({
    meta: guideEditorInitialState.meta,
    steps: guideEditorInitialState.steps,
    activeStepId: guideEditorInitialState.activeStepId,
    setActiveStepId: (stepId) => set({ activeStepId: stepId }),
    updateStep: (stepId, updates) =>
      set((state) => ({
        steps: state.steps.map((step) =>
          step.clientId === stepId ? { ...step, ...updates } : step
        ),
      })),
    updateMeta: (updates) =>
      set((state) => ({
        meta: {
          ...state.meta,
          ...updates,
        },
      })),
  }));

const guideEditorStore = createGuideEditorStore();

export function useGuideEditor<T>(selector: (state: GuideEditorState) => T): T {
  return useStore(guideEditorStore, selector);
}
