"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useAddCategoryTranslation,
  useDeleteCategoryTranslation,
  useLibraryCategory,
  useUpdateCategoryTranslation,
} from "@/app/[locale]/(modules)/library/_services/library.hook";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/utils";

type CategoryTranslationDrawerProps = {
  categoryId: string;
  onClose: () => void;
};

export function CategoryTranslationDrawer({ categoryId, onClose }: CategoryTranslationDrawerProps) {
  const categoryQuery = useLibraryCategory(categoryId);
  const addTranslation = useAddCategoryTranslation();
  const updateTranslation = useUpdateCategoryTranslation();
  const deleteTranslation = useDeleteCategoryTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (categoryQuery.data) {
      const amTranslation = categoryQuery.data.translations?.find((t) => t.language === "am");
      if (amTranslation) {
        setIsEditing(true);
        setName(amTranslation.name);
        setDescription(amTranslation.description ?? "");
      } else {
        setIsEditing(false);
        setName("");
        setDescription("");
      }
    }
  }, [categoryQuery.data]);

  function handleSave() {
    if (isEditing) {
      updateTranslation.mutate(
        {
          id: categoryId,
          lang: "am",
          payload: { name: name.trim(), description: description.trim() || undefined },
        },
        { onSuccess: onClose }
      );
    } else {
      addTranslation.mutate(
        {
          id: categoryId,
          payload: {
            language: "am",
            name: name.trim(),
            description: description.trim() || undefined,
          },
        },
        { onSuccess: onClose }
      );
    }
  }

  function handleDelete() {
    deleteTranslation.mutate({ id: categoryId, lang: "am" }, { onSuccess: onClose });
  }

  const isPending =
    addTranslation.isPending || updateTranslation.isPending || deleteTranslation.isPending;
  const isError = addTranslation.isError || updateTranslation.isError || deleteTranslation.isError;

  const title = isEditing ? "Edit Amharic Translation" : "Add Amharic Translation";
  const saveLabel = isPending ? "Saving…" : isEditing ? "Update Translation" : "Add Translation";

  return (
    <>
      <button
        type="button"
        aria-label="Close drawer"
        className="fixed inset-0 bg-black/40 z-40 cursor-default"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {categoryQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading category&hellip;</p>
          ) : categoryQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load: {getErrorMessage(categoryQuery.error)}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="am-name">Name (Amharic)</Label>
                <Input
                  id="am-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="አማርኛ ስም"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="am-description">Description (optional)</Label>
                <Textarea
                  id="am-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="መግለጫ"
                  rows={3}
                />
              </div>
            </>
          )}

          {isError && (
            <p className="text-sm text-destructive">
              Failed to save:{" "}
              {getErrorMessage(
                addTranslation.error ?? updateTranslation.error ?? deleteTranslation.error
              )}
            </p>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          {isEditing && (
            <ConfirmDialog
              title="Remove Translation"
              description="Remove the Amharic translation? This cannot be undone."
              confirmLabel="Remove"
              variant="destructive"
              onConfirm={handleDelete}
            >
              <Button variant="destructive" disabled={isPending}>
                Remove
              </Button>
            </ConfirmDialog>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || categoryQuery.isLoading}>
            {saveLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
