"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
                <BreadcrumbLink href={`/guide/${id}`}>{guideName}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-foreground">Edit Steps</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-xl font-semibold tracking-tight">{guideName}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href={`/guide/${id}`}>Back to Guide</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
