export type GuideEditorChecklistItem = {
  id: string;
  label: string;
  isRequired: boolean;
  isCompleted: boolean;
};

export type GuideEditorRequiredDocument = {
  clientId: string;
  name: string;
  description?: string;
};

export type GuideEditorRichContent = {
  summary: string;
  proTip: string;
  checklistTitle: string;
  checklist: GuideEditorChecklistItem[];
  imageUrl: string;
  requiredDocuments: GuideEditorRequiredDocument[];
};

export type GuideEditorStep = {
  clientId: string;
  guideId: string;
  slug: string;
  sortOrder: number;
  stepType: string;
  isOptional: boolean;
  estimatedTime?: number;
  difficultyLevel?: number;
  feeEstimate?: number;
  conditions?: unknown[] | null;
  dependencies?: unknown[] | null;
  effectiveDate?: string;
  expiryDate?: string;
  complianceType?: string;
  translations?:
    | {
        language: string;
        title: string;
        description?: string;
        detailedContent?: unknown;
      }[]
    | null;
  ui: GuideEditorRichContent;
};
