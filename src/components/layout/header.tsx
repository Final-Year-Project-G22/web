"use client";

import { Bell, Key, LogOut, Menu, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLogout } from "@/app/(auth)/auth/_services/auth.hook";
import { SidebarContent } from "@/components/layout/sidebar";
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

export function Header() {
  const router = useRouter();
  const { user, account } = useAuthStore();
  const [open, setOpen] = useState(false);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "U";

  const logoutMutation = useLogout(() => router.push("/auth"));

  return (
    <header className="h-20 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width={36} height={36} className="rounded-md" />
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
          <Link href="/admin/register">
            <UserPlus className="size-4" />
            Register New Admin
          </Link>
        </Button>

        <button
          type="button"
          className="p-2 hover:bg-accent rounded-full transition-colors relative text-muted-foreground"
        >
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-destructive rounded-full border border-background" />
        </button>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button type="button" className="outline-none cursor-pointer">
              <Avatar className="size-8 border ring-2 ring-background">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {user ? `${user.firstName} ${user.lastName}` : "Admin"}
                </span>
                {account && (
                  <span className="text-xs text-muted-foreground font-normal">{account.email}</span>
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
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              inset
              variant="destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="size-4" />
              {logoutMutation.isPending ? "Logging out…" : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
