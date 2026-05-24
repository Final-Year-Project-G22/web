"use client";

import { motion } from "framer-motion";
import { Activity, AlertCircle, BrainCircuit, Users } from "lucide-react";
import { Suspense } from "react";
import { AIUsageChart } from "@/app/[locale]/(modules)/dashboard/_components/ai-usage-chart";
import { RecentLogs } from "@/app/[locale]/(modules)/dashboard/_components/recent-logs";
import { StatCard } from "@/app/[locale]/(modules)/dashboard/_components/stat-card";
import { SystemHealth } from "@/app/[locale]/(modules)/dashboard/_components/system-health";
import { UserGrowthChart } from "@/app/[locale]/(modules)/dashboard/_components/user-growth-chart";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function StatCards() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <motion.div variants={item}>
        <StatCard
          title="Total MSME Users"
          value="24,592"
          trend={12.5}
          icon={Users}
          colorIndex={1}
        />
      </motion.div>
      <motion.div variants={item}>
        <StatCard
          title="AI Tokens Consumed"
          value="8.4M"
          trend={8.2}
          icon={BrainCircuit}
          colorIndex={2}
        />
      </motion.div>
      <motion.div variants={item}>
        <StatCard
          title="Active Sessions"
          value="1,520"
          icon={Activity}
          colorIndex={3}
          subtitle="Daily Avg"
        />
      </motion.div>
      <motion.div variants={item}>
        <StatCard
          title="Flagged Content"
          value="43"
          trend={-2.1}
          icon={AlertCircle}
          colorIndex={4}
        />
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">
      <Suspense fallback={<StatCardsFallback />}>
        <StatCards />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={<ChartFallback />}>
          <UserGrowthChart />
        </Suspense>
        <Suspense fallback={<ChartFallback />}>
          <AIUsageChart />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartFallback />}>
          <SystemHealth />
        </Suspense>
        <Suspense fallback={<ChartFallback />}>
          <RecentLogs />
        </Suspense>
      </div>
    </div>
  );
}

function StatCardsFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <StatCard key={i} title="" value="" icon={Users} loading />
      ))}
    </div>
  );
}

function ChartFallback() {
  return <div className="h-[250px] animate-pulse rounded-xl bg-muted" />;
}
