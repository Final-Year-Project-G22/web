"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getActivityLogs,
  getDocumentStages,
  getDocumentStats,
  getReportStats,
  getSessionStats,
  getSystemOverview,
  getUserGrowth,
  getUserStats,
} from "@/lib/api/services/admin-dashboard";
import type {
  ActivityLogEntry,
  DocumentStageCount,
  GetActivityLogsParams,
  GetUserGrowthParams,
  SystemOverviewItem,
} from "@/lib/api/types";

const DASHBOARD_KEY = ["admin", "dashboard"] as const;

export function useUserStats() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, "user-stats"],
    queryFn: async () => {
      const res = await getUserStats();
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useSessionStats() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, "session-stats"],
    queryFn: async () => {
      const res = await getSessionStats();
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useUserGrowth(params?: GetUserGrowthParams) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, "user-growth", params],
    queryFn: async () => {
      const res = await getUserGrowth(params);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useSystemOverview() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, "system-overview"],
    queryFn: async () => {
      const res = await getSystemOverview();
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useActivityLogs(params?: GetActivityLogsParams) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, "activity-logs", params],
    queryFn: async () => {
      const res = await getActivityLogs(params);
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useReportStats() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, "report-stats"],
    queryFn: async () => {
      const res = await getReportStats();
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, "document-stats"],
    queryFn: async () => {
      const res = await getDocumentStats();
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export function useDocumentStages() {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, "document-stages"],
    queryFn: async () => {
      const res = await getDocumentStages();
      if (res.status !== 200) throw res.data;
      return res.data;
    },
  });
}

export type {
  ActivityLogEntry,
  DocumentStageCount,
  GetActivityLogsParams,
  GetUserGrowthParams,
  SystemOverviewItem,
};
