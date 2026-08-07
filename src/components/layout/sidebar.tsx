"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Folders,
  LayoutDashboard,
  Moon,
  Shield,
  Sun,
  Tags,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/constants";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "./language-toggle";
import {
  type SidebarCollapsible,
  type SidebarItem,
  type SidebarLink,
  sidebarConfig,
} from "./sidebar-config";

const iconMap: Record<string, ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="size-4" strokeWidth={1.5} />,
  BookOpen: <BookOpen className="size-4" strokeWidth={1.5} />,
  BrainCircuit: <BrainCircuit className="size-4" strokeWidth={1.5} />,
  Shield: <Shield className="size-4" strokeWidth={1.5} />,
  Tags: <Tags className="size-4" strokeWidth={1.5} />,
  Folders: <Folders className="size-4" strokeWidth={1.5} />,
  TriangleAlert: <TriangleAlert className="size-4" strokeWidth={1.5} />,
};

/* woven section bar — the tibeb weave at 18px (locked §10.4) */
const WEAVE =
  "repeating-linear-gradient(90deg, var(--navy) 0 4px, var(--emerald) 4px 8px, var(--amber) 8px 11px, var(--navy) 11px 15px)";

const COLLAPSE_KEY = "admin-rail-collapsed";

/* The proxy serves AM routes under /am, EN under / (as-needed prefix).
   Strip the locale segment so active-state matching is locale-agnostic. */
function useShellPathname(): string {
  const pathname = usePathname();
  return pathname.replace(/^\/(en|am)(?=\/|$)/, "") || "/";
}

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
        "relative inline-flex h-6 w-10 flex-none items-center rounded-full transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDark ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center rounded-full bg-background shadow-xs transition-transform duration-base",
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
  collapsed,
  onNavigate,
}: {
  href: string;
  icon?: ReactNode;
  label: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useShellPathname();
  const isSubPath = href !== "/dashboard" && pathname.startsWith(`${href}/`);
  const isActive = pathname === href || isSubPath;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md border border-transparent px-3 py-[7px] text-[13px] font-medium transition-colors duration-fast",
        collapsed && "justify-center px-0 py-2",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-ink-2 hover:bg-panel hover:border-line hover:text-ink"
      )}
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SubNavLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  const pathname = useShellPathname();
  const active =
    href === "/library/template-groups"
      ? pathname === href || pathname.startsWith(`${href}/`)
      : pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center rounded-md border border-transparent px-3 py-[5px] text-[12.5px] font-medium transition-colors duration-fast",
        active
          ? "bg-primary text-primary-foreground"
          : "text-ink-2 hover:bg-panel hover:border-line hover:text-ink"
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
  collapsed,
  children,
}: {
  icon: ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  isActive: boolean;
  collapsed: boolean;
  children: ReactNode;
}) {
  /* collapsed rail: sub-groups are hidden (the reference icon rail), the
     parent keeps its filled-row active state only */
  if (collapsed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-transparent px-0 py-2",
          isActive ? "bg-primary text-primary-foreground" : "text-ink-2"
        )}
        title={label}
      >
        {icon}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-[7px] text-[13px] font-medium transition-colors duration-fast",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-ink-2 hover:bg-panel hover:border-line hover:text-ink"
        )}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <ChevronRight
          className={cn("size-3 flex-none transition-transform duration-base", open && "rotate-90")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-6 space-y-0.5 border-l border-line-2 pl-3 pt-1 pb-0.5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({
  collapsed = false,
  inDrawer = false,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed?: boolean;
  inDrawer?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const t = useTranslations("sidebar");
  const pathname = useShellPathname();

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const section of sidebarConfig) {
      for (const item of section.items) {
        if (item.kind === "collapsible") {
          const anyActive = item.children.some(
            (child) => pathname.startsWith(`${child.href}/`) || pathname === child.href
          );
          if (anyActive) initial.add(item.labelKey);
        }
      }
    }
    return initial;
  });

  useEffect(() => {
    for (const section of sidebarConfig) {
      for (const item of section.items) {
        if (item.kind === "collapsible") {
          const anyActive = item.children.some(
            (child) => pathname.startsWith(`${child.href}/`) || pathname === child.href
          );
          if (anyActive) {
            setOpenSections((prev) => {
              if (prev.has(item.labelKey)) return prev;
              return new Set(prev).add(item.labelKey);
            });
          }
        }
      }
    }
  }, [pathname]);

  const visibleSections = sidebarConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.permissionCode ? hasPermission(item.permissionCode) : true
      ),
    }))
    .filter((section) => section.items.length > 0);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-3 px-4 pt-4 pb-2",
          collapsed && "justify-center px-0 pt-5"
        )}
      >
        <Image
          src="/logo.svg"
          alt={APP_NAME}
          width={32}
          height={32}
          className="flex-none rounded-md"
        />
        {!collapsed && (
          <div className={cn("min-w-0 leading-tight", inDrawer && "pr-10")}>
            <p className="truncate font-display text-sm font-semibold tracking-[0.01em]">
              {APP_NAME}
            </p>
            <p className="truncate text-[11px] font-medium text-muted">{t("brand.subtitle")}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar" aria-label="Main">
        {visibleSections.map((section) => (
          <div key={section.id}>
            {collapsed ? (
              <div className="mx-3 my-2.5 h-px bg-line" />
            ) : (
              <div className="mt-5 mb-1.5 flex items-center gap-2 px-2">
                <span
                  aria-hidden="true"
                  className="h-[3px] w-[18px] flex-none rounded-sm"
                  style={{ background: WEAVE }}
                />
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t(section.labelKey)}
                </h4>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) =>
                renderItem(item, t, pathname, toggleSection, openSections, collapsed, onNavigate)
              )}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "mt-auto flex flex-col gap-3 border-t border-line px-4 py-3",
          collapsed && "items-center px-2"
        )}
      >
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md border border-line bg-panel text-ink-2 transition-colors duration-fast hover:border-line-2 hover:text-ink",
              collapsed && "self-center"
            )}
            aria-label={collapsed ? t("footer.expand") : t("footer.collapse")}
          >
            {collapsed ? (
              <ChevronRight className="size-3.5" />
            ) : (
              <ChevronLeft className="size-3.5" />
            )}
          </button>
        )}
        <LanguageToggle compact={collapsed} />
        <div
          className={cn(
            "flex items-center justify-between gap-2 text-xs text-muted",
            collapsed && "justify-center"
          )}
        >
          {!collapsed && <span>{t("footer.darkMode")}</span>}
          <DarkModeSwitch />
        </div>
      </div>
    </div>
  );
}

function renderLinkItem(
  item: SidebarLink,
  t: ReturnType<typeof useTranslations>,
  collapsed: boolean,
  onNavigate?: () => void
) {
  return (
    <NavLink
      key={item.labelKey}
      href={item.href}
      icon={iconMap[item.iconName]}
      label={t(item.labelKey)}
      collapsed={collapsed}
      onNavigate={onNavigate}
    />
  );
}

function renderCollapsibleItem(
  item: SidebarCollapsible,
  t: ReturnType<typeof useTranslations>,
  pathname: string,
  toggleSection: (key: string) => void,
  openSections: Set<string>,
  collapsed: boolean,
  onNavigate?: () => void
) {
  const isActive = item.children.some(
    (child) => pathname.startsWith(`${child.href}/`) || pathname === child.href
  );

  return (
    <CollapsibleSection
      key={item.labelKey}
      icon={iconMap[item.iconName]}
      label={t(item.labelKey)}
      open={openSections.has(item.labelKey)}
      onToggle={() => toggleSection(item.labelKey)}
      isActive={isActive}
      collapsed={collapsed}
    >
      {item.children.map((child) => (
        <SubNavLink
          key={child.href}
          href={child.href}
          label={t(child.labelKey)}
          onNavigate={onNavigate}
        />
      ))}
    </CollapsibleSection>
  );
}

function renderItem(
  item: SidebarItem,
  t: ReturnType<typeof useTranslations>,
  pathname: string,
  toggleSection: (key: string) => void,
  openSections: Set<string>,
  collapsed: boolean,
  onNavigate?: () => void
) {
  switch (item.kind) {
    case "link":
      return renderLinkItem(item, t, collapsed, onNavigate);
    case "collapsible":
      return renderCollapsibleItem(
        item,
        t,
        pathname,
        toggleSection,
        openSections,
        collapsed,
        onNavigate
      );
  }
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "hidden h-full flex-none flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-base min-[760px]:flex",
        collapsed ? "w-16" : "w-rail"
      )}
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
    </aside>
  );
}

export { SidebarContent };
