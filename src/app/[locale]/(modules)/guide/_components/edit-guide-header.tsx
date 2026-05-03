"use client";

import { Rocket } from "lucide-react";
import { useGuideEditor } from "@/app/[locale]/(modules)/guide/_stores/guide-editor.store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export function EditGuideHeader() {
  const language = useGuideEditor((state) => state.editorLanguage);
  const title = useGuideEditor(
    (state) =>
      state.meta.translations?.find((translation) => translation.language === language)?.name ??
      "Untitled Guide"
  );

  return (
    <header className="border-b bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
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
                <span className="text-foreground">Edit Guide</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Last saved 2m ago</p>
          <Button variant="outline">Save Draft</Button>
          <Button>
            <Rocket className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>
    </header>
  );
}
