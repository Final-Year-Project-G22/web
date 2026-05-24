"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Folder,
  Folders,
  LayoutDashboard,
  Moon,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Tags,
  TriangleAlert,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_NAME } from "@/lib/constants";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./language-toggle";

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
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDark ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-full bg-background shadow-xs transition-transform duration-200",
          isDark ? "translate-x-5" : "translate-x-0.5"
        )}
      >
        {isDark ? <Moon className="size-3" /> : <Sun className="size-3 text-muted-foreground" />}
      </span>
    </button>
  );
}

function NavLink({
  href,
  icon,
  label,
  excludePaths,
}: {
  href: string;
  icon?: ReactNode;
  label: string;
  excludePaths?: string[];
}) {
  const pathname = usePathname();
  const isSubPath = href !== "/dashboard" && pathname.startsWith(`${href}/`);
  const isExcluded = excludePaths?.some((p) => pathname.startsWith(p));
  const isActive = (pathname === href || isSubPath) && !isExcluded;

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent",
        isActive
          ? "bg-primary/8 text-primary font-semibold border-primary/10 shadow-xs before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-primary before:rounded-r-md"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
      )}
    >
      {icon}
      <span className="text-sm tracking-wide">{label}</span>
    </Link>
  );
}

function SubNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();

  const active =
    href === "/library/template-groups"
      ? pathname === href || pathname.startsWith(`${href}/`)
      : pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200 border border-transparent",
        active
          ? "bg-primary/5 font-semibold text-primary border-primary/5 shadow-xs"
          : "text-muted-foreground hover:bg-sidebar-accent/30 hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

function CollapsibleSection({
  icon,
  label,
  open,
  onToggle,
  isActive,
  children,
}: {
  icon: ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all duration-200 border border-transparent",
          isActive
            ? "bg-primary/8 text-primary font-semibold border-primary/10 shadow-xs"
            : "hover:bg-sidebar-accent/50 hover:text-foreground"
        )}
        aria-expanded={open}
      >
        {icon}
        <span className="text-sm flex-1 text-left">{label}</span>
        <ChevronRight
          className={cn("size-3 transition-transform duration-200", open ? "rotate-90" : "")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-6 space-y-1 border-l pl-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const [guideOpen, setGuideOpen] = useState(pathname.startsWith("/guide"));

  useEffect(() => {
    if (pathname.startsWith("/guide")) setGuideOpen(true);
  }, [pathname]);

  const [libraryOpen, setLibraryOpen] = useState(pathname.startsWith("/library"));

  useEffect(() => {
    if (pathname.startsWith("/library")) setLibraryOpen(true);
  }, [pathname]);

  const [notificationOpen, setNotificationOpen] = useState(pathname.startsWith("/notifications"));

  useEffect(() => {
    if (pathname.startsWith("/notifications")) setNotificationOpen(true);
  }, [pathname]);

  const [aiKnowledgeOpen, setAIKnowledgeOpen] = useState(pathname.startsWith("/ai"));

  useEffect(() => {
    if (pathname.startsWith("/ai")) setAIKnowledgeOpen(true);
  }, [pathname]);

  const [taxonomyOpen, setTaxonomyOpen] = useState(pathname.startsWith("/taxonomy"));

  useEffect(() => {
    if (pathname.startsWith("/taxonomy")) setTaxonomyOpen(true);
  }, [pathname]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt={APP_NAME} width={64} height={64} className="rounded-lg" />
          <span className="font-bold text-xl">{APP_NAME}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 no-scrollbar">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 px-2 tracking-wider">
            MAIN
          </h4>
          <nav className="space-y-1">
            <NavLink
              href="/dashboard"
              icon={<LayoutDashboard className="size-4" />}
              label="Dashboard"
            />
            <Link
              href="#"
              className="flex items-center justify-between px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="size-4" />
                <span className="text-sm">MSME Users</span>
              </div>
            </Link>
            <CollapsibleSection
              icon={<BookOpen className="size-4" />}
              label="Guide Module"
              open={guideOpen}
              onToggle={() => setGuideOpen((prev) => !prev)}
              isActive={pathname.startsWith("/guide")}
            >
              <SubNavLink href="/guide" label="Guides" />
            </CollapsibleSection>
            <CollapsibleSection
              icon={<BrainCircuit className="size-4" />}
              label="AI Knowledge"
              open={aiKnowledgeOpen}
              onToggle={() => setAIKnowledgeOpen((prev) => !prev)}
              isActive={pathname.startsWith("/ai")}
            >
              <SubNavLink href="/ai/knowledge-base" label="Knowledge Base" />
              <SubNavLink href="/ai/ask" label="Ask AI" />
            </CollapsibleSection>
            {hasPermission("iam.admin.list") && (
              <NavLink href="/admin" icon={<Shield className="size-4" />} label="Admin Hub" />
            )}
            <CollapsibleSection
              icon={<Tags className="size-4" />}
              label="Taxonomy"
              open={taxonomyOpen}
              onToggle={() => setTaxonomyOpen((prev) => !prev)}
              isActive={pathname.startsWith("/taxonomy")}
            >
              <SubNavLink href="/taxonomy/sectors" label="Sectors" />
              <SubNavLink href="/taxonomy/tags" label="Tags" />
            </CollapsibleSection>
            <CollapsibleSection
              icon={<Folders className="size-4" />}
              label="Library"
              open={libraryOpen}
              onToggle={() => setLibraryOpen((prev) => !prev)}
              isActive={pathname.startsWith("/library")}
            >
              <SubNavLink href="/library/categories" label="Categories" />
              <SubNavLink href="/library/template-groups" label="Template Groups" />
              <SubNavLink href="/library/downloads" label="Download Logs" />
            </CollapsibleSection>
          </nav>
          <CollapsibleSection
            icon={<Bell className="size-4" />}
            label="Notifications"
            open={notificationOpen}
            onToggle={() => setNotificationOpen((prev) => !prev)}
            isActive={pathname.startsWith("/notifications")}
          >
            <SubNavLink href="/notifications/campaign-templates" label="Campaign Templates" />
            <SubNavLink href="/notifications/campaigns" label="Campaigns" />
            <SubNavLink href="/notifications/queue" label="Queue" />
          </CollapsibleSection>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 px-2 tracking-wider">
            COMMUNITY
          </h4>
          <nav className="space-y-1">
            <NavLink
              href="/community/categories"
              icon={<Folder className="size-4" />}
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
                  <TriangleAlert className="size-4" />
                  <span className="text-sm flex-1 text-left">Moderation</span>
                  <ChevronRight className="size-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent sideOffset={4} className="w-48">
                <DropdownMenuItem asChild>
                  <NavLink
                    href="/moderation/blocked-users"
                    icon={<ShieldAlert className="size-4" />}
                    label="Blocked Users"
                  />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink
                    href="/moderation/reported-content"
                    icon={<TriangleAlert className="size-4" />}
                    label="Reported Content"
                  />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink
                    href="/moderation/reported-users"
                    icon={<TriangleAlert className="size-4" />}
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
              <Settings className="size-4" />
              <span className="text-sm">Configurations</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-3 px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
            >
              <ShieldCheck className="size-4" />
              <span className="text-sm">Security Logs</span>
            </Link>
          </nav>
        </div>
      </div>

      <div className="p-6 mt-auto border-t">
        <div className="mb-4">
          <LanguageToggle />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Moon className="size-4" />
            <span>Dark Mode</span>
          </div>
          <DarkModeSwitch />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar/85 backdrop-blur-md h-screen flex-col hidden md:flex sticky top-0 z-20">
      <SidebarContent />
    </aside>
  );
}

export { SidebarContent };
