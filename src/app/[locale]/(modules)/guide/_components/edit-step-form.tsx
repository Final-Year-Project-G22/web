"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  CheckSquare,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Plus,
  Quote,
  Trash2,
  Underline,
  X,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAdminGuideCategoryTree } from "@/app/[locale]/(modules)/guide/_services/guide.hook";
import { useGuideEditor } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.store";
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
import type { CreateGuideTranslation } from "@/lib/api/types/createGuideTranslation";

const targetTierOptions = [
  { value: "startup", label: "Start-up" },
  { value: "small-business", label: "Small Business" },
  { value: "enterprise", label: "Enterprise" },
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function EditStepForm() {
  const meta = useGuideEditor((state) => state.meta);
  const steps = useGuideEditor((state) => state.steps);
  const activeStepId = useGuideEditor((state) => state.activeStepId);
  const language = useGuideEditor((state) => state.editorLanguage);
  const setEditorLanguage = useGuideEditor((state) => state.setEditorLanguage);
  const updateMeta = useGuideEditor((state) => state.updateMeta);
  const updateStep = useGuideEditor((state) => state.updateStep);

  const categoriesQuery = useAdminGuideCategoryTree({ includeInactive: false });
  const categories = categoriesQuery.data ?? [];

  const activeStep = useMemo(
    () => steps.find((step) => step.clientId === activeStepId) ?? steps[0],
    [activeStepId, steps]
  );

  const activeTranslation = useMemo(
    () => activeStep?.translations?.find((translation) => translation.language === language),
    [activeStep, language]
  );

  const activeGuideTranslation = useMemo(
    () => meta.translations?.find((translation) => translation.language === language),
    [language, meta.translations]
  );

  function upsertGuideTranslation(languageCode: string, updates: Partial<CreateGuideTranslation>) {
    const currentTranslations = meta.translations ?? [];
    const nextTranslations = [...currentTranslations];
    const index = nextTranslations.findIndex(
      (translation) => translation.language === languageCode
    );

    if (index >= 0) {
      const previous = nextTranslations[index];
      nextTranslations[index] = {
        ...previous,
        ...updates,
      };
    } else {
      nextTranslations.push({
        language: languageCode,
        name: updates.name ?? "Untitled Guide",
        description: updates.description ?? "",
      });
    }

    updateMeta({ translations: nextTranslations });
  }

  function upsertStepTranslation(
    stepId: string,
    lang: string,
    updates: Partial<{ title: string; description: string; detailedContent: unknown }>
  ) {
    if (!activeStep) return;
    const currentTranslations = activeStep.translations ?? [];
    const nextTranslations = [...currentTranslations];
    const index = nextTranslations.findIndex((translation) => translation.language === lang);

    if (index >= 0) {
      const previous = nextTranslations[index];
      nextTranslations[index] = {
        ...previous,
        ...updates,
      };
    } else {
      nextTranslations.push({
        language: lang,
        title: updates.title ?? activeTranslation?.title ?? "Untitled Step",
        description: updates.description ?? activeTranslation?.description ?? "",
        detailedContent: updates.detailedContent,
      });
    }

    updateStep(stepId, { translations: nextTranslations });
  }

  function syncStepUi(updates: Partial<typeof activeStep.ui>) {
    if (!activeStep) return;
    const nextUi = { ...activeStep.ui, ...updates };
    updateStep(activeStep.clientId, { ui: nextUi });
    upsertStepTranslation(activeStep.clientId, language, {
      detailedContent: nextUi,
    });
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: activeTranslation?.description ?? activeStep?.ui.summary ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc min-h-[240px] max-w-none rounded-lg border bg-white p-6 text-sm leading-7 shadow-sm focus:outline-none",
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      if (!activeStep) return;
      const html = tiptapEditor.getHTML();
      syncStepUi({ summary: html });
      upsertStepTranslation(activeStep.clientId, language, {
        description: html,
      });
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
    return <div className="p-6 text-sm text-muted-foreground">No step selected.</div>;
  }

  const checklist = activeStep.ui.checklist ?? [];

  return (
    <section className="space-y-6 p-6">
      {/* --- Language + Category + Tier + Time --- */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Language</p>
          <Select value={language} onValueChange={setEditorLanguage}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="am">Amharic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Category</p>
          {categoriesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading categories&hellip;</p>
          ) : (
            <Select
              value={meta.categoryId}
              onValueChange={(value) => updateMeta({ categoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Target Tier</p>
          <Select
            value={activeStep.stepType}
            onValueChange={(value) =>
              updateStep(activeStep.clientId, {
                stepType: value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              {targetTierOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Reading Time</p>
          <Select
            value={String(activeStep.estimatedTime ?? 15)}
            onValueChange={(value) =>
              updateStep(activeStep.clientId, {
                estimatedTime: Number(value),
              })
            }
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

      {/* --- Guide Name + Description --- */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Guide Name ({language.toUpperCase()})
          </p>
          <Input
            value={activeGuideTranslation?.name ?? ""}
            onChange={(e) => {
              upsertGuideTranslation(language, { name: e.target.value });
            }}
            placeholder="Enter guide name"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Guide Description ({language.toUpperCase()})
          </p>
          <Input
            value={activeGuideTranslation?.description ?? ""}
            onChange={(e) => {
              upsertGuideTranslation(language, { description: e.target.value });
            }}
            placeholder="Enter short guide description"
          />
        </div>
      </div>

      {/* --- Step Title --- */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Step Title ({language.toUpperCase()})
        </p>
        <Input
          value={activeTranslation?.title ?? ""}
          onChange={(e) => {
            upsertStepTranslation(activeStep.clientId, language, {
              title: e.target.value,
            });
          }}
          placeholder="Enter step title"
        />
      </div>

      {/* --- Tiptap Toolbar --- */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Step Description</p>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-white p-2">
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
          <Toggle disabled aria-label="Link">
            <Link2 className="h-4 w-4" />
          </Toggle>
          <Toggle disabled aria-label="Image">
            <ImageIcon className="h-4 w-4" />
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
        <p className="text-xs font-medium text-muted-foreground">
          Pro Tip ({language.toUpperCase()})
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
          <p className="text-xs font-medium text-muted-foreground">Step Image URL</p>
          {activeStep.ui.imageUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-red-500 hover:text-red-600"
              onClick={() => syncStepUi({ imageUrl: "" })}
            >
              <X className="mr-1 h-3 w-3" />
              Remove image
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
          <div className="relative mt-2 h-32 w-full overflow-hidden rounded-lg border bg-slate-50">
            <img
              // biome-ignore lint/performance/noImgElement: external user-provided URL
              // eslint-disable-next-line @next/next/no-img-element
              src={activeStep.ui.imageUrl}
              alt="Step preview"
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* --- Checklist Editor --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Checklist</p>
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
            Add item
          </Button>
        </div>

        {checklist.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No checklist items. Click "Add item" to create one.
          </p>
        )}

        <div className="space-y-2">
          {checklist.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border bg-white p-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
              <Input
                value={item.label}
                onChange={(e) => {
                  const next = checklist.map((c) =>
                    c.id === item.id ? { ...c, label: e.target.value } : c
                  );
                  syncStepUi({ checklist: next });
                }}
                placeholder="Item label"
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
                {item.isRequired ? "Required" : "Optional"}
              </Toggle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
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

      {/* Divider */}
      <div className="border-t" />

      {/* --- Checklist Title --- */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Checklist Section Title ({language.toUpperCase()})
        </p>
        <Input
          value={activeStep.ui.checklistTitle ?? ""}
          onChange={(e) => {
            syncStepUi({ checklistTitle: e.target.value });
          }}
          placeholder="e.g. Checklist of items"
        />
      </div>
    </section>
  );
}
