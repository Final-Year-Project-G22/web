import {
  BrainCircuit,
  LayoutDashboard,
  Moon,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background h-screen flex flex-col hidden md:flex sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <span className="font-bold text-xl">Adisu Serategna</span>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 px-2 tracking-wider">
              MAIN
            </h4>
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-2 py-2 bg-primary/5 text-primary font-medium rounded-md"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link
                href="#"
                className="flex items-center justify-between px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">MSME Users</span>
                </div>
              </Link>
              <Link
                href="#"
                className="flex items-center justify-between px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Formalization Guide</span>
                </div>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-between px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-4 h-4" />
                  <span className="text-sm">AI Knowledge</span>
                </div>
              </Link>
              <Link
                href="#"
                className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
              >
                <span className="text-sm">Manage Templates</span>
              </Link>
              <Link
                href="#"
                className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="text-sm">Community & Moderation</span>
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 px-2 tracking-wider">
              SYSTEM
            </h4>
            <nav className="space-y-1">
              <Link
                href="#"
                className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Configurations</span>
              </Link>
              <Link
                href="#"
                className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm">Security Logs</span>
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="p-6 mt-auto border-t">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Moon className="w-4 h-4" />
            <span>Dark Mode</span>
          </div>
          <Switch />
        </div>
      </div>
    </aside>
  );
}
