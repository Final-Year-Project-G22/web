"use client";

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Pencil, X } from "lucide-react";
import type { CategoryDTO } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/utils";
import { useAdminUpdateCategory, useAdminParentCategories } from "@/app/(admin)/dashboard/community/_services/community.hook";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CategoryEditModalProps {
  category: CategoryDTO;
  onClose: () => void;
}

export function CategoryEditModal({ category, onClose }: CategoryEditModalProps) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(category.description ?? "");
  const [parentCategoryId, setParentCategoryId] = useState<string>(category.parentCategoryId ?? "");
  const [isActive, setIsActive] = useState(category.isActive);
  const [error, setError] = useState<string | null>(null);

  const parentQuery = useAdminParentCategories();
  const updateMutation = useAdminUpdateCategory();

  useEffect(() => {
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description ?? "");
    setParentCategoryId(category.parentCategoryId ?? "");
    setIsActive(category.isActive);
    setError(null);
  }, [category]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    updateMutation.mutate(
      {
        id: category.id,
        patch: {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          parentCategoryId: parentCategoryId || undefined,
          isActive,
        },
      },
      {
        onSuccess: () => onClose(),
        onError: (err) => setError(getErrorMessage(err)),
      }
    );
  }

  const allParentOptions = (parentQuery.data ?? []).filter((c) => c.id !== category.id);

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed z-50 w-full max-w-md gap-4 border bg-background p-6 shadow-lg duration-200 rounded-xl"
          style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <DialogPrimitive.Title className="text-lg font-semibold">
              Edit Category
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-xs" className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-parent">Parent Category</Label>
              <select
                id="edit-parent"
                value={parentCategoryId}
                onChange={(e) => setParentCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">— None —</option>
                {allParentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Active</span>
                <span className="text-xs text-muted-foreground">
                  Inactive categories won&apos;t show in public list.
                </span>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving&hellip;" : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface EditCategoryButtonProps {
  category: CategoryDTO;
  onEdit: (category: CategoryDTO) => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "xs" | "icon";
}

export function EditCategoryButton({ category, onEdit, variant = "outline", size = "sm" }: EditCategoryButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(category);
      }}
    >
      <Pencil className="w-3.5 h-3.5" />
      {size === "default" || size === "sm" ? "Edit" : null}
    </Button>
  );
}