"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image, Italic, Link2, List, ListOrdered, Pilcrow, Quote, Underline } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useGuideEditor } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.store";
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

const categoryOptions = [
  { value: "legal-compliance", label: "Legal & Compliance" },
  { value: "tax", label: "Tax" },
  { value: "licensing", label: "Licensing" },
];

const targetTierOptions = [
  { value: "startup", label: "Start-up" },
  { value: "small-business", label: "Small Business" },
  { value: "enterprise", label: "Enterprise" },
];

export function EditStepForm() {
  const meta = useGuideEditor((state) => state.meta);
  const steps = useGuideEditor((state) => state.steps);
  const activeStepId = useGuideEditor((state) => state.activeStepId);
  const language = useGuideEditor((state) => state.editorLanguage);
  const setEditorLanguage = useGuideEditor((state) => state.setEditorLanguage);
  const updateMeta = useGuideEditor((state) => state.updateMeta);
  const updateStep = useGuideEditor((state) => state.updateStep);

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

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: activeTranslation?.description ?? activeStep?.ui.summary ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc min-h-[360px] max-w-none rounded-lg border bg-white p-6 text-sm leading-7 shadow-sm focus:outline-none",
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      if (!activeStep) return;
      const html = tiptapEditor.getHTML();
      updateStep(activeStep.clientId, {
        ui: {
          ...activeStep.ui,
          summary: html,
        },
      });
      upsertStepTranslation(activeStep.clientId, language, {
        description: html,
        detailedContent: activeStep.ui,
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

  return (
    <section className="space-y-4 p-6">
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
          <Select
            value={meta.categoryId}
            onValueChange={(value) => updateMeta({ categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Image className="h-4 w-4" />
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
    </section>
  );
}
