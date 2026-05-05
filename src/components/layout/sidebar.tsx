"use client";

import {
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Folder,
  LayoutDashboard,
  Moon,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

function DarkModeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? theme === "dark" : true;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDark ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-background shadow transition-transform",
          isDark ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NavLink({ href, icon, label }: { href: string; icon?: ReactNode; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-md transition-colors",
        isActive ? "bg-primary/5 text-primary font-medium" : "text-muted-foreground hover:bg-accent"
      )}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [guideOpen, setGuideOpen] = useState(pathname.startsWith("/guide"));

  useEffect(() => {
    if (pathname.startsWith("/guide")) setGuideOpen(true);
  }, [pathname]);

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
              <NavLink
                href="/dashboard"
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Dashboard"
              />
              <Link
                href="#"
                className="flex items-center justify-between px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">MSME Users</span>
                </div>
              </Link>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setGuideOpen((prev) => !prev)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-accent",
                    pathname.startsWith("/guide") ? "bg-primary/5 font-medium text-primary" : ""
                  )}
                  aria-expanded={guideOpen}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm flex-1 text-left">Guide Module</span>
                  <ChevronRight
                    className={cn("h-3 w-3 transition-transform", guideOpen ? "rotate-90" : "")}
                  />
                </button>

                {guideOpen ? (
                  <div className="ml-6 space-y-1 border-l pl-3">
                    <Link
                      href="/guide"
                      className={cn(
                        "flex items-center rounded-md px-2 py-2 text-sm transition-colors",
                        pathname === "/guide"
                          ? "bg-primary/5 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      Guides
                    </Link>
                    <Link
                      href="/guide/categories"
                      className={cn(
                        "flex items-center rounded-md px-2 py-2 text-sm transition-colors",
                        pathname === "/guide/categories"
                          ? "bg-primary/5 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      Categories
                    </Link>
                  </div>
                ) : null}
              </div>
              <NavLink
                href="/ai/knowledge-base"
                icon={<BrainCircuit className="w-4 h-4" />}
                label="AI Knowledge"
              />
              {hasPermission("iam.admin.list") && (
                <NavLink href="/admin" icon={<Shield className="w-4 h-4" />} label="Admin Hub" />
              )}
              <Link
                href="#"
                className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
              >
                <span className="text-sm">Manage Templates</span>
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 px-2 tracking-wider">
              COMMUNITY
            </h4>
            <nav className="space-y-1">
              <NavLink
                href="/community/categories"
                icon={<Folder className="w-4 h-4" />}
                label="Categories"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 px-2 py-2 rounded-md transition-colors text-muted-foreground hover:bg-accent",
                      usePathname().startsWith("/moderation")
                        ? "bg-primary/5 text-primary font-medium"
                        : ""
                    )}
                  >
                    <TriangleAlert className="w-4 h-4" />
                    <span className="text-sm flex-1 text-left">Moderation</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={4} className="w-48">
                  <DropdownMenuItem asChild>
                    <NavLink
                      href="/moderation/blocked-users"
                      icon={<ShieldAlert className="w-4 h-4" />}
                      label="Blocked Users"
                    />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink
                      href="/moderation/reported-content"
                      icon={<TriangleAlert className="w-4 h-4" />}
                      label="Reported Content"
                    />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink
                      href="/moderation/reported-users"
                      icon={<TriangleAlert className="w-4 h-4" />}
                      label="Reported Users"
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          <DarkModeSwitch />
        </div>
      </div>
    </aside>
  );
}
