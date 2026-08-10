"use client";

import { Bell, Key, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useLogout } from "@/app/(auth)/auth/_services/auth.hook";
import { SidebarContent } from "@/components/layout/sidebar";
import { useShellPathname } from "@/components/layout/use-shell-pathname";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/store/auth.store";
import { sidebarConfig } from "./sidebar-config";

function useCrumbLabel(): string | null {
  const pathname = useShellPathname();
  const t = useTranslations("sidebar");

  for (const section of sidebarConfig) {
    for (const item of section.items) {
      if (
        item.kind === "link" &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`))
      ) {
        return t(item.labelKey);
      }
      if (
        item.kind === "collapsible" &&
        item.children.some(
          (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
        )
      ) {
        return t(item.labelKey);
      }
    }
  }
  return null;
}

export function Header() {
  const router = useRouter();
  const t = useTranslations("common");
  const { user, account } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const crumb = useCrumbLabel();

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "U";

  const logoutMutation = useLogout(() => router.push("/auth"));

  return (
    <header className="flex h-14 flex-none items-center justify-between gap-4 border-b border-line bg-layout-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="hidden max-[759px]:inline-flex"
              aria-label={t("openMenu")}
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[min(300px,86vw)] border-r border-sidebar-border bg-sidebar p-0">
            <SidebarContent inDrawer onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className="flex-none">{t("modules")} /</span>
          {crumb && (
            <b className="truncate font-semibold text-ink" data-testid="header-crumb">
              {crumb}
            </b>
          )}
        </div>
      </div>

      <div className="flex flex-none items-center gap-3">
        <Button variant="outline" size="icon" className="relative" aria-label={t("notifications")}>
          <Bell className="size-4" strokeWidth={1.5} />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border-2 border-layout-surface bg-destructive" />
        </Button>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("account")}
            >
              <Avatar className="size-8 border border-line">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                <AvatarFallback className="bg-panel-2 text-ink-2">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {user ? `${user.firstName} ${user.lastName}` : t("admin")}
                </span>
                {account && (
                  <span className="text-xs font-normal text-muted-foreground">{account.email}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              inset
              onClick={() => {
                setOpen(false);
                router.push("/settings/password");
              }}
            >
              <Key className="size-4" />
              {t("changePassword")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              inset
              variant="destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="size-4" />
              {logoutMutation.isPending ? t("loggingOut") : t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
