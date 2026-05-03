"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image, Italic, Link2, List, ListOrdered, Pilcrow, Quote, Underline } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useGuideEditor } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";

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
  const updateMeta = useGuideEditor((state) => state.updateMeta);
  const updateStep = useGuideEditor((state) => state.updateStep);

  const activeStep = useMemo(
    () => steps.find((step) => step.clientId === activeStepId) ?? steps[0],
    [activeStepId, steps]
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: activeStep?.ui.summary ?? "",
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc min-h-[360px] max-w-none rounded-lg border bg-white p-6 text-sm leading-7 shadow-sm focus:outline-none",
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      if (!activeStep) return;
      updateStep(activeStep.clientId, {
        ui: {
          ...activeStep.ui,
          summary: tiptapEditor.getHTML(),
        },
      });
    },
  });

  useEffect(() => {
    if (!editor || !activeStep) return;
    const current = editor.getHTML();
    const incoming = activeStep.ui.summary;
    if (current !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [activeStep, editor]);

  if (!activeStep) {
    return <div className="p-6 text-sm text-muted-foreground">No step selected.</div>;
  }

  return (
    <section className="space-y-4 p-6">
      <div className="grid gap-3 md:grid-cols-3">
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
