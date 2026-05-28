"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Folders,
  LayoutDashboard,
  Moon,
  Shield,
  ShieldAlert,
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
import { useAuthStore } from "@/store/auth.store";
import { LanguageToggle } from "./language-toggle";
import {
  type SidebarCollapsible,
  type SidebarDropdown,
  type SidebarItem,
  type SidebarLink,
  sidebarConfig,
} from "./sidebar-config";

const iconMap: Record<string, ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="size-4" />,
  BookOpen: <BookOpen className="size-4" />,
  BrainCircuit: <BrainCircuit className="size-4" />,
  Shield: <Shield className="size-4" />,
  Tags: <Tags className="size-4" />,
  Folders: <Folders className="size-4" />,
  Bell: <Bell className="size-4" />,
  TriangleAlert: <TriangleAlert className="size-4" />,
  ShieldAlert: <ShieldAlert className="size-4" />,
};

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
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const _permissions = useAuthStore((s) => s.permissions);
  const _roles = useAuthStore((s) => s.roles);

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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt={APP_NAME} width={64} height={64} className="rounded-lg" />
          <span className="font-bold text-xl">{APP_NAME}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 no-scrollbar">
        {visibleSections.map((section) => (
          <div key={section.id}>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 px-2 tracking-wider">
              {t(section.labelKey)}
            </h4>
            <nav className="space-y-1">
              {section.items.map((item) =>
                renderItem(item, t, pathname, toggleSection, openSections)
              )}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-6 mt-auto border-t">
        <div className="mb-4">
          <LanguageToggle />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Moon className="size-4" />
            <span>{t("footer.darkMode")}</span>
          </div>
          <DarkModeSwitch />
        </div>
      </div>
    </div>
  );
}

function renderLinkItem(
  item: SidebarLink,
  t: ReturnType<typeof useTranslations>,
  _pathname: string
) {
  if (item.href === "#") {
    return (
      <Link
        key={item.labelKey}
        href="#"
        className="flex items-center justify-between px-2 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors"
      >
        <div className="flex items-center gap-3">
          {iconMap[item.iconName]}
          <span className="text-sm">{t(item.labelKey)}</span>
        </div>
      </Link>
    );
  }

  return (
    <NavLink
      key={item.labelKey}
      href={item.href}
      icon={iconMap[item.iconName]}
      label={t(item.labelKey)}
    />
  );
}

function renderCollapsibleItem(
  item: SidebarCollapsible,
  t: ReturnType<typeof useTranslations>,
  pathname: string,
  toggleSection: (key: string) => void,
  openSections: Set<string>
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
    >
      {item.children.map((child) => (
        <SubNavLink key={child.href} href={child.href} label={t(child.labelKey)} />
      ))}
    </CollapsibleSection>
  );
}

function renderDropdownItem(
  item: SidebarDropdown,
  t: ReturnType<typeof useTranslations>,
  pathname: string
) {
  const isActive = item.children.some(
    (child) => pathname.startsWith(`${child.href}/`) || pathname === child.href
  );

  return (
    <DropdownMenu key={item.labelKey}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 px-2 py-2 rounded-md transition-colors text-muted-foreground hover:bg-accent",
            isActive ? "bg-primary/5 text-primary font-medium" : ""
          )}
        >
          {iconMap[item.iconName]}
          <span className="text-sm flex-1 text-left">{t(item.labelKey)}</span>
          <ChevronRight className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={4} className="w-48">
        {item.children.map((child, idx) => (
          <div key={child.href}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem asChild>
              <NavLink href={child.href} icon={iconMap[child.iconName]} label={t(child.labelKey)} />
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function renderItem(
  item: SidebarItem,
  t: ReturnType<typeof useTranslations>,
  pathname: string,
  toggleSection: (key: string) => void,
  openSections: Set<string>
) {
  switch (item.kind) {
    case "link":
      return renderLinkItem(item, t, pathname);
    case "collapsible":
      return renderCollapsibleItem(item, t, pathname, toggleSection, openSections);
    case "dropdown":
      return renderDropdownItem(item, t, pathname);
  }
}

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar/85 backdrop-blur-md h-screen flex-col hidden md:flex sticky top-0 z-20">
      <SidebarContent />
    </aside>
  );
}

export { SidebarContent };
