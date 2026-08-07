"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  CheckSquare,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Plus,
  Quote,
  Trash2,
  Underline,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useComplianceTypes } from "@/app/[locale]/(modules)/guide/_services/guide.hook";
import {
  editGuideStore,
  useEditGuide,
} from "@/app/[locale]/(modules)/guide/_stores/edit-guide.store";
import type { GuideEditorRichContent } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { useAdminLanguageStore } from "@/stores/admin-language.store";

const stepTypeOptions = [
  { value: "startup", label: "Start-up" },
  { value: "small-business", label: "Small Business" },
  { value: "enterprise", label: "Enterprise" },
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function upsertStepTranslation(
  lang: string,
  updates: Partial<{ title: string; description: string; detailedContent: unknown }>
) {
  const state = editGuideStore.getState();
  const step = state.displaySteps().find((s) => s.clientId === state.activeStepId);
  if (!step) return;

  const currentTranslations = step.translations ?? [];
  const nextTranslations = [...currentTranslations];
  const index = nextTranslations.findIndex((tr) => tr.language === lang);

  if (index >= 0) {
    nextTranslations[index] = { ...nextTranslations[index], ...updates };
  } else {
    const activeTranslation = currentTranslations.find((tr) => tr.language === lang);
    nextTranslations.push({
      language: lang,
      title: updates.title ?? activeTranslation?.title ?? "Untitled Step",
      description: updates.description ?? activeTranslation?.description ?? "",
      detailedContent: updates.detailedContent,
    });
  }

  editGuideStore.getState().updateStep(step.clientId, { translations: nextTranslations });
}

function syncStepUi(updates: Partial<GuideEditorRichContent>) {
  const state = editGuideStore.getState();
  const step = state.displaySteps().find((s) => s.clientId === state.activeStepId);
  if (!step) return;

  const nextUi = { ...step.ui, ...updates };
  state.updateStep(step.clientId, { ui: nextUi });
  upsertStepTranslation(useAdminLanguageStore.getState().language, { detailedContent: nextUi });
}

interface EditStepFormProps {
  onSave: () => void;
}

export function EditStepForm({ onSave }: EditStepFormProps) {
  const t = useTranslations("surfaces.guide.editor");
  const language = useAdminLanguageStore((s) => s.language);
  const setLanguage = useAdminLanguageStore((s) => s.setLanguage);
  const persistedSteps = useEditGuide((s) => s.persistedSteps);
  const draftSteps = useEditGuide((s) => s.draftSteps);
  const activeStepId = useEditGuide((s) => s.activeStepId);
  const updateStep = useEditGuide((s) => s.updateStep);
  const { data: complianceTypes } = useComplianceTypes();

  const steps = useMemo(() => [...persistedSteps, ...draftSteps], [persistedSteps, draftSteps]);

  const activeStep = useMemo(
    () => steps.find((step) => step.clientId === activeStepId) ?? null,
    [steps, activeStepId]
  );

  const activeIndex = useMemo(
    () => (activeStep ? steps.findIndex((s) => s.clientId === activeStep.clientId) : -1),
    [steps, activeStep]
  );

  const activeTranslation = useMemo(
    () => activeStep?.translations?.find((tr) => tr.language === language),
    [activeStep, language]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: activeTranslation?.description ?? activeStep?.ui.summary ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm min-h-[240px] max-w-none rounded-lg border border-line bg-panel p-5 text-sm leading-7 focus:outline-none dark:prose-invert",
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      const html = tiptapEditor.getHTML();
      syncStepUi({ summary: html });
      upsertStepTranslation(language, { description: html });
    },
  });

  useEffect(() => {
    if (!editor || !activeStep) return;
    const current = editor.getHTML();
    const incoming = activeTranslation?.description ?? activeStep.ui.summary;
    if (current !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [activeStep, activeTranslation, editor]);

  if (!activeStep) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        {t("noStep")}
      </div>
    );
  }

  const checklist = activeStep.ui.checklist ?? [];

  return (
    <section className="space-y-7 p-6">
      {/* spine header — the step identity: numbering is order data, not decoration */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground tabular-nums">
            {t("stepOf", {
              current: String(activeIndex + 1).padStart(2, "0"),
              total: String(steps.length).padStart(2, "0"),
            })}
          </p>
          <h2 className="mt-1 truncate font-display text-[17px] font-semibold tracking-tight text-ink">
            {activeTranslation?.title ?? "Untitled Step"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {activeStep.isOptional ? (
            <span className="rounded-full border border-warning/30 bg-warning-tint px-2.5 py-0.5 text-[11px] font-medium text-warning-strong">
              Optional
            </span>
          ) : null}
          {activeStep.estimatedTime ? (
            <span className="rounded-full border border-line bg-panel-2 px-2.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
              {activeStep.estimatedTime} min
            </span>
          ) : null}
        </div>
      </div>

      {/* --- Language + Step Type + Compliance + Reading Time --- */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {t("language")}
          </p>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="am">አማርኛ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {t("stepType")}
          </p>
          <Select
            value={activeStep.stepType}
            onValueChange={(value) => {
              updateStep(activeStep.clientId, { stepType: value });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {stepTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {t("compliance")}
          </p>
          <Select
            value={activeStep.complianceType ?? ""}
            onValueChange={(value) => {
              updateStep(activeStep.clientId, {
                complianceType: value === "none" ? undefined : value,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {complianceTypes?.data?.map((ct) => (
                <SelectItem key={ct.slug} value={ct.slug}>
                  {ct.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {t("readingTime")}
          </p>
          <Select
            value={String(activeStep.estimatedTime ?? 15)}
            onValueChange={(value) => {
              updateStep(activeStep.clientId, { estimatedTime: Number(value) });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 mins</SelectItem>
              <SelectItem value="15">15 mins</SelectItem>
              <SelectItem value="20">20 mins</SelectItem>
              <SelectItem value="30">30 mins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* --- Step Title --- */}
      <div className="space-y-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          {t("stepTitle", { lang: language.toUpperCase() })}
        </p>
        <Input
          value={activeTranslation?.title ?? ""}
          onChange={(e) => {
            upsertStepTranslation(language, { title: e.target.value });
          }}
          placeholder="Enter step title"
          className="h-9 text-[15px]"
        />
      </div>

      {/* --- Tiptap Toolbar --- */}
      <div className="space-y-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          {t("stepDescription")}
        </p>
        <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-line border-b-0 bg-panel p-2">
          <Toggle
            pressed={editor?.isActive("bold")}
            onPressedChange={() => editor?.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <span className="font-bold">B</span>
          </Toggle>
          <Toggle
            pressed={editor?.isActive("italic")}
            onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle disabled aria-label="Underline">
            <Underline className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive("bulletList")}
            onPressedChange={() => editor?.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive("orderedList")}
            onPressedChange={() => editor?.chain().focus().toggleOrderedList().run()}
            aria-label="Ordered list"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive("blockquote")}
            onPressedChange={() => editor?.chain().focus().toggleBlockquote().run()}
            aria-label="Quote"
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor?.isActive("paragraph")}
            onPressedChange={() => editor?.chain().focus().setParagraph().run()}
            aria-label="Paragraph"
          >
            <Pilcrow className="h-4 w-4" />
          </Toggle>
        </div>
        <EditorContent editor={editor} />
      </div>

      {/* --- Pro Tip --- */}
      <div className="space-y-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          {t("proTipLabel", { lang: language.toUpperCase() })}
        </p>
        <Input
          value={activeStep.ui.proTip ?? ""}
          onChange={(e) => {
            syncStepUi({ proTip: e.target.value });
          }}
          placeholder="e.g. Make 3 copies of each document"
        />
      </div>

      {/* --- Image URL --- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {t("imageUrl")}
          </p>
          {activeStep.ui.imageUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-destructive-strong hover:text-destructive"
              onClick={() => syncStepUi({ imageUrl: "" })}
            >
              <X className="mr-1 h-3 w-3" />
              {t("removeImage")}
            </Button>
          )}
        </div>
        <Input
          value={activeStep.ui.imageUrl ?? ""}
          onChange={(e) => {
            syncStepUi({ imageUrl: e.target.value });
          }}
          placeholder="https://example.com/image.jpg"
        />
        {activeStep.ui.imageUrl && (
          <div className="relative mt-2 h-32 w-full overflow-hidden rounded-lg border border-line bg-canvas-2">
            {/* biome-ignore lint/performance/noImgElement: external image preview */}
            <img
              src={activeStep.ui.imageUrl}
              alt="Step preview"
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* --- Required Documents --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {t("requiredDocs", { lang: language.toUpperCase() })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const docs = activeStep.ui.requiredDocuments ?? [];
              syncStepUi({
                requiredDocuments: [...docs, { clientId: generateId(), name: "", description: "" }],
              });
            }}
          >
            <Plus className="mr-1 h-3 w-3" />
            {t("addDocument")}
          </Button>
        </div>

        {(activeStep.ui.requiredDocuments ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noDocuments")}</p>
        ) : (
          <div className="space-y-2">
            {(activeStep.ui.requiredDocuments ?? []).map((doc, idx) => (
              <div
                key={doc.clientId}
                className="flex items-start gap-2 rounded-lg border border-line bg-panel p-2.5"
              >
                <div className="flex-1 space-y-2">
                  <Input
                    value={doc.name}
                    onChange={(e) => {
                      const docs = [...(activeStep.ui.requiredDocuments ?? [])];
                      docs[idx] = { ...docs[idx], name: e.target.value };
                      syncStepUi({ requiredDocuments: docs });
                    }}
                    placeholder="Document name"
                  />
                  <Input
                    value={doc.description ?? ""}
                    onChange={(e) => {
                      const docs = [...(activeStep.ui.requiredDocuments ?? [])];
                      docs[idx] = { ...docs[idx], description: e.target.value };
                      syncStepUi({ requiredDocuments: docs });
                    }}
                    placeholder="Optional description"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive-strong"
                  onClick={() => {
                    const docs = (activeStep.ui.requiredDocuments ?? []).filter(
                      (_, i) => i !== idx
                    );
                    syncStepUi({ requiredDocuments: docs });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Checklist Editor --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {t("checklist")}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => {
              syncStepUi({
                checklist: [
                  ...checklist,
                  { id: generateId(), label: "New item", isRequired: true, isCompleted: false },
                ],
              });
            }}
          >
            <Plus className="h-3 w-3" />
            {t("addItem")}
          </Button>
        </div>

        {checklist.length === 0 && (
          <p className="text-xs text-muted-foreground">{t("noChecklist")}</p>
        )}

        <div className="space-y-2">
          {checklist.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-line bg-panel p-2"
            >
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span className="w-5 font-mono text-xs tabular-nums text-muted-foreground">
                {idx + 1}.
              </span>
              <Input
                value={item.label}
                onChange={(e) => {
                  const next = checklist.map((c) =>
                    c.id === item.id ? { ...c, label: e.target.value } : c
                  );
                  syncStepUi({ checklist: next });
                }}
                placeholder={t("itemLabel")}
                className="h-8 flex-1 text-sm"
              />
              <Toggle
                pressed={item.isRequired}
                onPressedChange={() => {
                  const next = checklist.map((c) =>
                    c.id === item.id ? { ...c, isRequired: !c.isRequired } : c
                  );
                  syncStepUi({ checklist: next });
                }}
                aria-label="Required"
                className="h-8 text-xs"
              >
                {item.isRequired ? t("required") : t("optional")}
              </Toggle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive-strong"
                onClick={() => {
                  const next = checklist.filter((c) => c.id !== item.id);
                  syncStepUi({ checklist: next });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* --- Checklist Title --- */}
      <div className="space-y-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          {t("checklistTitle", { lang: language.toUpperCase() })}
        </p>
        <Input
          value={activeStep.ui.checklistTitle ?? ""}
          onChange={(e) => {
            syncStepUi({ checklistTitle: e.target.value });
          }}
          placeholder="e.g. Checklist of items"
        />
      </div>

      {/* --- Save --- */}
      <div className="flex justify-end border-t border-line pt-5">
        <Button onClick={onSave} className="min-w-36">
          {t("save")}
        </Button>
      </div>
    </section>
  );
}
