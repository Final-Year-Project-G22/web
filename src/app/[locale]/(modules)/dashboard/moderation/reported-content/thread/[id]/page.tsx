"use client";

import { ReportDetailPage } from "../../../_components/report-detail-page";

export default function ThreadReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ReportDetailPage params={params} type="thread" />;
}
