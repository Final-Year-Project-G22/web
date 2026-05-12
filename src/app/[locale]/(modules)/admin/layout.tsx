"use client";

import { KeyRound, Shield, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/admin/admins",
    label: "Admins",
    icon: Users,
    permission: "iam.admin.list",
  },
  {
    href: "/admin/roles",
    label: "Roles",
    icon: KeyRound,
    permission: "iam.role.read",
  },
  {
    href: "/admin/register",
    label: "Register",
    icon: UserPlus,
    permission: "iam.admin.create",
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hasPermission("iam.admin.list")) {
      router.replace("/403");
    }
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Admin Hub</h1>
      </div>

      <nav className="flex gap-1 border-b pb-px">
        {navItems.map((item) => {
          if (!hasPermission(item.permission)) return null;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
