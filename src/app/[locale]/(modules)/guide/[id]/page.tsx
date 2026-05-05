"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAdminGuideCategoryTree,
  useAdminGuideDetail,
  useAdminGuideSteps,
  useDeleteStep,
  useUpdateGuide,
} from "@/app/[locale]/(modules)/guide/_services/guide.hook";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/utils";

export default function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();

  const guideQuery = useAdminGuideDetail(id, { locale: "en" });
  const stepsQuery = useAdminGuideSteps(id, { locale: "en", pageSize: 100 });
  const categoriesQuery = useAdminGuideCategoryTree({ includeInactive: false });

  const updateGuide = useUpdateGuide();
  const deleteStepMutation = useDeleteStep();

  const categories = categoriesQuery.data ?? [];
  const guide = guideQuery.data;
  const steps = stepsQuery.data?.steps ?? [];

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  useEffect(() => {
    if (guide) {
      const enTranslation = guide.translations?.find((t) => t.language === "en");
      setEditName(enTranslation?.name ?? "");
      setEditDescription(enTranslation?.description ?? "");
      setEditSlug(guide.slug);
      setEditCategoryId(guide.categoryId);
    }
  }, [guide]);

  async function handleSaveGuide() {
    try {
      await updateGuide.mutateAsync({
        id,
        patch: {
          categoryId: editCategoryId,
          slug: editSlug,
          translations: [
            { language: "en", name: editName, description: editDescription },
            { language: "am", name: editName, description: editDescription },
          ],
        },
      });
      toast.success("Guide saved");
    } catch (err) {
      toast.error(`Failed to save: ${getErrorMessage(err)}`);
    }
  }

  if (guideQuery.isLoading || stepsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-muted-foreground">Loading guide&hellip;</p>
      </div>
    );
  }

  if (guideQuery.isError) {
    return (
      <div className="mx-auto max-w-7xl py-8">
        <p className="text-sm text-destructive">
          Failed to load: {getErrorMessage(guideQuery.error)}
        </p>
      </div>
    );
  }

  const guideTitle = guide?.translations?.find((t) => t.language === "en")?.name ?? "Untitled";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/guide">Guides</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-foreground">{guideTitle}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{guideTitle}</CardTitle>
          <CardDescription>Manage guide details and steps</CardDescription>
          <CardAction className="flex gap-2">
            <Button onClick={handleSaveGuide} disabled={updateGuide.isPending}>
              {updateGuide.isPending ? "Saving..." : "Save"}
            </Button>
            <Button asChild variant="outline">
              <Link href={`/guide/${id}/edit`}>Edit Steps</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guide-name">Name (EN)</Label>
              <Input
                id="guide-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Guide name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guide-slug">Slug</Label>
              <Input
                id="guide-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="guide-slug"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="guide-description">Description (EN)</Label>
              <textarea
                id="guide-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Short guide description"
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              {categoriesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading categories&hellip;</p>
              ) : (
                <Select value={editCategoryId} onValueChange={setEditCategoryId}>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Steps</CardTitle>
          <CardDescription>
            {steps.length} step{steps.length !== 1 ? "s" : ""}
          </CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href={`/guide/${id}/edit?step=new`}>Add Step</Link>
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {stepsQuery.isError ? (
            <p className="py-4 text-sm text-destructive">
              Failed to load steps: {getErrorMessage(stepsQuery.error)}
            </p>
          ) : steps.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No steps yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {steps.map((step, idx) => {
                    const stepTitle =
                      step.translations?.find((t) => t.language === "en")?.title ??
                      `Step ${idx + 1}`;
                    return (
                      <TableRow key={step.id}>
                        <TableCell className="text-muted-foreground">{step.sortOrder}</TableCell>
                        <TableCell className="font-medium">{stepTitle}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/guide/${id}/edit?step=${step.id}`}>Edit</Link>
                            </Button>
                            <ConfirmDialog
                              title="Delete Step"
                              description="Are you sure you want to delete this step? This may trigger reordering of remaining steps."
                              confirmLabel="Delete"
                              variant="destructive"
                              onConfirm={() =>
                                deleteStepMutation.mutate({ id: step.id, guideId: id })
                              }
                            >
                              <Button size="sm" variant="outline">
                                Delete
                              </Button>
                            </ConfirmDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
