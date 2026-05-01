"use client";

import { ReportDetailPage } from "@/app/[locale]/(modules)/moderation/_components/report-detail-page";

export default function ThreadReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ReportDetailPage params={params} type="thread" />;
}
