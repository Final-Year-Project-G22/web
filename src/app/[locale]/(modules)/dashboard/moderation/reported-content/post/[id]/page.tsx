"use client";

import { ReportDetailPage } from "../../../_components/report-detail-page";

export default function PostReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ReportDetailPage params={params} type="post" />;
}
