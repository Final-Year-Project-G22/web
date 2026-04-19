import { Activity, AlertCircle, BrainCircuit, Users } from "lucide-react";
import { AIUsageChart } from "@/components/dashboard/ai-usage-chart";
import { RecentLogs } from "@/components/dashboard/recent-logs";
import { StatCard } from "@/components/dashboard/stat-card";
import { SystemHealth } from "@/components/dashboard/system-health";
import { UserGrowthChart } from "@/components/dashboard/user-growth-chart";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total MSME Users"
          value="24,592"
          trend={12.5}
          icon={Users}
          iconColorClass="text-purple-600"
          iconBgClass="bg-purple-100"
        />
        <StatCard
          title="AI Tokens Consumed"
          value="8.4M"
          trend={8.2}
          icon={BrainCircuit}
          iconColorClass="text-fuchsia-600"
          iconBgClass="bg-fuchsia-100"
        />
        <StatCard
          title="Active Sessions"
          value="1,520"
          trend={0} // Using 0 as trend to display subtitle instead if preferred, or mock trend.
          icon={Activity}
          iconColorClass="text-blue-600"
          iconBgClass="bg-blue-100"
          subtitle="Daily Avg"
        />
        <StatCard
          title="Flagged Content"
          value="43"
          trend={-2.1}
          icon={AlertCircle}
          iconColorClass="text-red-600"
          iconBgClass="bg-red-100"
        />
      </div>

      {/* Middle Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UserGrowthChart />
        <AIUsageChart />
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemHealth />
        <RecentLogs />
      </div>
    </div>
  );
}
