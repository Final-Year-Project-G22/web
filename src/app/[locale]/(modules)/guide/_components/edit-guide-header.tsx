"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

interface EditGuideHeaderProps {
  guideName: string;
}

export function EditGuideHeader({ guideName }: EditGuideHeaderProps) {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("surfaces.guide.editor");
  const listT = useTranslations("surfaces.guide.list");

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-panel px-6 py-3.5">
      <div className="min-w-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/guide">{listT("title")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/guide/${id}`}>{guideName}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-foreground">{t("steps")}</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mt-1 truncate font-display text-[17px] font-semibold tracking-tight text-ink">
          {guideName}
        </h1>
      </div>

      <Button asChild variant="outline" className="shrink-0">
        <Link href={`/guide/${id}`}>{t("backToGuide")}</Link>
      </Button>
    </header>
  );
}
