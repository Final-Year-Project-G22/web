"use client";

import { ReportDetailPage } from "@/app/[locale]/(modules)/moderation/_components/report-detail-page";

export default function UserReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ReportDetailPage params={params} type="user" />;
}
