# Permission-Based Sidebar & Route Protection — Implementation Plan

**Status:** Draft  
**Drivers:** Sidebar exposes every module to every authenticated user; route-level guards are absent.

---

## Overview

The admin panel shows all sidebar sections to every authenticated user, even though the backend guards each API endpoint by RBAC permissions. This plan introduces:

1. **Config-driven sidebar** — a data structure replaces the hardcoded JSX
2. **Permission-gated sidebar items** — sections hide when the user lacks the module's `read` permission
3. **Route-level permission guards** — direct URL access to a protected page redirects if unauthorised
4. **Sidebar i18n** — all labels translated via `next-intl`

---

## Phase 0 — Backend: Add `ai.read` / `ai.write` Permissions

**Why:** The AI module currently only has `ai.admin.stream`. The Knowledge Base (`/ai/knowledge-base`) needs an `ai.read` gate to match the module's patterns (`guide.read`, `library.read`, etc.).

### Files to modify (core-backend)

| File | Change |
|---|---|
| `internal/modules/ai/permission_constants.go` | Add `AiRead = "ai.read"` and `AiWrite = "ai.write"` |
| `internal/modules/ai/permission_seeds.go` | Add `AiRead` and `AiWrite` to the permission seeds list |
| `internal/modules/ai/module.go` | Register `AiRead`/`AiWrite` middleware for KB routes |

Super admin bypass (`["super_admin"]` in `PermissionMiddleware` call) ensures no regression for existing super admins.

### Verification
- Rebuild core-backend, confirm startup logs show `ai.read` and `ai.write` in seeded permissions
- Confirm `super_admin` role now lists `ai.read` and `ai.write`

---

## Phase 1 — Sidebar Config (`SidebarConfig`)

**Why:** Extract navigation structure from JSX into data so permission checks, i18n, and future extensions are a single-source-of-truth change.

### New file: `src/components/layout/sidebar-config.ts`

```typescript
export type SidebarItemKind = "link" | "collapsible" | "dropdown";

export interface SidebarSection {
  id: string;
  labelKey: string;       // i18n key: "sections.main"
  items: SidebarItem[];
}

export interface SidebarLink {
  kind: "link";
  href: string;
  labelKey: string;       // i18n key: "links.dashboard"
  iconName: string;       // lucide icon name, e.g. "LayoutDashboard"
  permissionCode?: string;
}

export interface SidebarCollapsible {
  kind: "collapsible";
  labelKey: string;
  iconName: string;
  permissionCode?: string;
  children: { href: string; labelKey: string }[];
}

export interface SidebarDropdown {
  kind: "dropdown";
  labelKey: string;
  iconName: string;
  permissionCode?: string;
  children: { href: string; labelKey: string; iconName: string }[];
}

export type SidebarItem = SidebarLink | SidebarCollapsible | SidebarDropdown;
```

### Config definition (`sidebar-config.ts`)

Sections: **MAIN**, **COMMUNITY**, **SYSTEM**

**MAIN section items:**

| Item | Kind | Permission | Notes |
|---|---|---|---|
| Dashboard | link | — | Always visible |
| MSME Users | link (`href: "#"`) | — | Disabled, kept for future |
| Guide Module | collapsible | `guide.read` | Child: Guides (`/guide`) |
| AI Knowledge | collapsible | `ai.read` | Children: Knowledge Base, Ask AI (Ask has no permission) |
| Admin Hub | link | `iam.admin.list` | |
| Taxonomy | collapsible | `iam.read` | Children: Sectors, Tags |
| Library | collapsible | `library.read` | Children: Categories, Template Groups, Download Logs |

**COMMUNITY section:**

| Item | Kind | Permission | Notes |
|---|---|---|---|
| Categories | link | `community.read` | |
| Moderation | dropdown | `community.read` | Children: Blocked Users, Reported Content, Reported Users |

**SYSTEM section:**

| Item | Kind | Permission | Notes |
|---|---|---|---|
| Notifications | collapsible | `notification.read` | Children: Campaign Templates, Campaigns, Queue |

(Configurations and Security Logs removed per decision.)

### Icon map (in `sidebar.tsx`)

```typescript
const iconMap: Record<string, ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="size-4" />,
  BookOpen: <BookOpen className="size-4" />,
  BrainCircuit: <BrainCircuit className="size-4" />,
  Shield: <Shield className="size-4" />,
  Tags: <Tags className="size-4" />,
  Folders: <Folders className="size-4" />,
  Bell: <Bell className="size-4" />,
  Folder: <Folder className="size-4" />,
  TriangleAlert: <TriangleAlert className="size-4" />,
  Users: <Users className="size-4" />,
};
```

Keeps lucide-react tree-shaking (only imported icons are bundled).

---

## Phase 2 — Route Permission Map (`RoutePermissionMap`)

**Why:** Separate concern from SidebarConfig. Route protection is a flat mapping of path prefix → permission, not a structural concern.

### New file: `src/lib/route-permissions.ts`

```typescript
export const routePermissionMap: Record<string, string | undefined> = {
  "/dashboard": undefined,
  "/guide": "guide.read",
  "/ai/knowledge-base": "ai.read",
  "/ai/ask": undefined,
  "/ai/ask/debug": "ai.admin.stream",
  "/admin": "iam.admin.list",
  "/taxonomy": "iam.read",
  "/library": "library.read",
  "/notifications": "notification.read",
  "/community": "community.read",
  "/moderation": "community.read",
  "/settings": undefined,
};
```

Resolution logic: find the **longest matching prefix** to handle nested routes:
- `/guide/create` → matches `/guide` → requires `guide.read`
- `/ai/ask/debug` → matches `/ai/ask/debug` (longer than `/ai/ask`) → requires `ai.admin.stream`

---

## Phase 3 — PermissionGuard Component

**Why:** Prevent direct URL access to pages the user shouldn't reach.

### New file: `src/components/auth/permission-guard.tsx`

```typescript
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasPermission } from "@/lib/permissions";
import { routePermissionMap } from "@/lib/route-permissions";

export function PermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Find longest matching prefix
    const sorted = Object.keys(routePermissionMap).sort((a, b) => b.length - a.length);
    const match = sorted.find((p) => pathname.startsWith(p));
    const required = match ? routePermissionMap[match] : undefined;

    if (required && !hasPermission(required)) {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  return <>{children}</>;
}
```

### Integration in `(modules)/layout.tsx`

```typescript
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute target="/dashboard">
      <div className="relative flex h-screen overflow-hidden ...">
        <Sidebar />
        <div className="relative flex-1 flex flex-col h-full overflow-hidden">
          <Header />
          <AnimatedMain>
            <PermissionGuard>{children}</PermissionGuard>
          </AnimatedMain>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

---

## Phase 4 — Refactor Sidebar Component

**Why:** Replace the hardcoded 399-line sidebar with a config-driven render.

### Changes in `src/components/layout/sidebar.tsx`

1. Import `sidebarConfig` from `sidebar-config.ts`
2. Import `iconMap` (local lookup)
3. Import `useTranslations` from `next-intl`
4. Replace `SidebarContent()` body:

```typescript
function SidebarContent() {
  const t = useTranslations("sidebar");
  const pathname = usePathname();

  const visibleSections = sidebarConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.permissionCode ? hasPermission(item.permissionCode) : true
      ),
    }))
    .filter((section) => section.items.length > 0);

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
              {section.items.map((item, i) => renderItem(item, i, pathname, t))}
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
```

5. Keep `NavLink`, `SubNavLink`, `CollapsibleSection` as-is (they are stateless renderers)
6. Add a new `renderItem()` dispatcher that switches on `item.kind`

---

## Phase 5 — i18n Messages

**Why:** The sidebar currently uses hardcoded English strings. Localisation is wired up (`next-intl`) but messages are empty.

### `src/messages/en.json`

```json
{
  "sidebar": {
    "sections": {
      "main": "MAIN",
      "community": "COMMUNITY",
      "system": "SYSTEM"
    },
    "links": {
      "dashboard": "Dashboard",
      "msme_users": "MSME Users",
      "guide": "Guide Module",
      "guides": "Guides",
      "ai_knowledge": "AI Knowledge",
      "knowledge_base": "Knowledge Base",
      "ask_ai": "Ask AI",
      "admin_hub": "Admin Hub",
      "taxonomy": "Taxonomy",
      "sectors": "Sectors",
      "tags": "Tags",
      "library": "Library",
      "categories": "Categories",
      "template_groups": "Template Groups",
      "download_logs": "Download Logs",
      "notifications": "Notifications",
      "campaign_templates": "Campaign Templates",
      "campaigns": "Campaigns",
      "queue": "Queue",
      "community_categories": "Categories",
      "moderation": "Moderation",
      "blocked_users": "Blocked Users",
      "reported_content": "Reported Content",
      "reported_users": "Reported Users"
    },
    "footer": {
      "darkMode": "Dark Mode",
      "language": "Language"
    }
  }
}
```

### `src/messages/am.json`

Amharic translations for the same keys:

```json
{
  "sidebar": {
    "sections": {
      "main": "ዋና",
      "community": "ማህበረሰብ",
      "system": "ስርዓት"
    },
    "links": {
      "dashboard": "ዳሽቦርድ",
      "msme_users": "MSME ተጠቃሚዎች",
      "guide": "መመሪያ ሞጁል",
      "guides": "መመሪያዎች",
      "ai_knowledge": "AI እውቀት",
      "knowledge_base": "የእውቀት መሰረት",
      "ask_ai": "AI ጠይቅ",
      "admin_hub": "አስተዳዳሪ ማዕከል",
      "taxonomy": "ታክሶኖሚ",
      "sectors": "ዘርፎች",
      "tags": "መለያዎች",
      "library": "ቤተ-መጻህፍት",
      "categories": "ምድቦች",
      "template_groups": "የቅርጸት ቡድኖች",
      "download_logs": "የወረዱ ምዝግብ",
      "notifications": "ማሳወቂያዎች",
      "campaign_templates": "የዘመቻ ቅርጸቶች",
      "campaigns": "ዘመቻዎች",
      "queue": "ወረፋ",
      "community_categories": "ምድቦች",
      "moderation": "ማስተካከያ",
      "blocked_users": "የታገዱ ተጠቃሚዎች",
      "reported_content": "ሪፖርት የተደረገ ይዘት",
      "reported_users": "ሪፖርት የተደረጉ ተጠቃሚዎች"
    },
    "footer": {
      "darkMode": "ጨለማ ሁነታ",
      "language": "ቋንቋ"
    }
  }
}
```

---

## Phase 6 — Header Cleanup

**Why:** The "Register New Admin" button in the header is a duplicate of the Admin Hub page action and shouldn't be visible to users who can't use it.

### Change in `src/components/layout/header.tsx`

Remove lines 52–57 (the `<Button asChild>` wrapping the `/admin/register` link):

```diff
- <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
-   <Link href="/admin/register">
-     <UserPlus className="size-4" />
-     Register New Admin
-   </Link>
- </Button>
```

---

## Dependency Graph

```
Phase 0 (backend) ──┐
                     ├──► Phase 1 (sidebar config) ──► Phase 4 (sidebar refactor)
                     │                                      │
                     │                                      ├── Phase 5 (i18n messages)
                     │
Phase 2 (route map) ─┼─────────────────────────────────► Phase 3 (PermissionGuard)
                     │
Phase 6 (header) ────┘ (independent)
```

Phases 1, 2, 5, and 6 are fully parallel. Phase 4 depends on Phase 1 + Phase 5. Phase 3 depends on Phase 2.

---

## Verification

1. **Envoy** `super_admin` sees all sidebar sections as before (existing bypass in `hasPermission`)
2. **Community admin** sees only Community/Moderation sections, redirected to `/dashboard` if they hit `/guide`
3. **IAM admin** sees only Taxonomy, Admin Hub; redirected from `/guide`, `/library`, etc.
4. **EN/AM toggle** changes sidebar labels immediately (reacts to `useTranslations` locale)
5. **Navigation works**: all links resolve to correct routes regardless of locale prefix
