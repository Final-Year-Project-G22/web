# CONTEXT.md — Domain Glossary & Module Conventions

## Route Architecture

```
src/app/
  layout.tsx                     # Root: QueryProvider, ThemeProvider
  (auth)/                        # Public auth route group
    layout.tsx                   # Auth layout
    auth/
      _components/               # login-form, register-form, forgot-password, auth-card
      _services/                 # auth.service (side-effects), auth.hook (react-query bindings)
      _stores/                   # auth-local.store (AuthModeProvider: Context + Zustand)
      page.tsx
  [locale]/                      # Actual i18n dynamic segment (en | am)
    (modules)/                   # All feature modules
      layout.tsx                 # Sidebar + Header + ProtectedRoute
      dashboard/
        _components/             # stat-card, charts, system-health, recent-logs
        page.tsx
      community/
        _services/               # community.hook
        categories/
      guide/
        _components/             # edit-guide-header, edit-guide-sidebar, edit-step-form, mobile-preview
        _services/               # guide.hook (read + mutations)
        _stores/                 # edit-guide.store, guide-editor.types
        page.tsx                 # Guide list (admin)
        create/
        [id]/                    # Detail + step editor
      moderation/
        _components/             # report-detail-page (unified)
        _services/               # blocked-users, thread-reports, post-reports, user-reports hooks
        blocked-users/
        reported-content/
        reported-users/
      settings/
        password/
      admin/
        register/
        sectors/                 # Taxonomy CRUD (application-wide)
        tags/                    # Taxonomy CRUD (application-wide)
```

## Module Conventions

Each module under `(modules)/` follows the same structure:

| Directory     | Purpose                                              |
|---------------|------------------------------------------------------|
| `_components/`| React components owned by this module                |
| `_services/`  | Hooks and business logic (react-query, side-effects) |
| `_stores/`    | Zustand stores (global or Context-bound)             |
| `page.tsx`    | Next.js page (thin, imports from _components)        |

## Domain Terms

| Term              | Definition                                          |
|-------------------|-----------------------------------------------------|
| **Auth**          | Authentication (login, logout, session management). Shared globally across all modules.
| **Admin**         | Admin user management (register new admins, permissions). Available to sys admins.
| **Dashboard**     | Overview of platform metrics and status.
| **Community**     | Community categories management (CRUD).
| **Guide**         | Business formalization guides authored by admins, organized by sectors/tags, consumed step-by-step on mobile.
| **Sector**        | Broad industry classification (hierarchical, with parentId). Application-wide taxonomy.
| **Tag**           | Cross-cutting attribute with group (e.g., business_stage). Application-wide taxonomy.
| **Admin Language**| Persistent EN/AM toggle for admin content entry. Drives per-language API queries and saves.
| **Moderation**    | Content moderation: blocked users, post/thread/user reports, content takedown.
| **Settings**      | User settings (change password, profile).

## Key Concepts

### AuthService (deep module)
- `src/app/(auth)/auth/_services/auth.service.ts`
- Orchestrates login/logout side-effects: API call → Zustand store → document.cookie
- Exposes `login()`, `logout()`, `registerAdmin()`
- React Query hooks (`auth.hook.ts`) delegate to it
- Callers: `login-form.tsx`, `register-form.tsx`, `header.tsx`

### AuthService (deep module)
- `src/app/(auth)/auth/_services/auth.service.ts`
- Orchestrates login/logout side-effects: API call → Zustand store → document.cookie
- Exposes `login()`, `logout()`, `registerAdmin()`
- React Query hooks (`auth.hook.ts`) delegate to it
- Callers: `login-form.tsx`, `register-form.tsx`, `header.tsx`

### ReportDetailPage (unified component)
- `src/app/[locale]/(modules)/moderation/_components/report-detail-page.tsx`
- Parametrized by `type: "post" | "thread" | "user"`
- Replaces 3 near-identical detail pages (~540 lines of duplication eliminated)

### getErrorMessage (shared utility)
- `src/lib/utils.ts`
- Single source of truth for API error formatting
- Consumed by hooks and components across all modules

### Discriminated Union Narrowing
- All API calls use `if (res.status !== 200) throw res.data` to narrow the Orval-generated response type
- No `as any` casts anywhere in application code

### Admin Language Toggle
- `src/stores/admin-language.store.ts`
- Global Zustand store with localStorage persistence
- Drives `locale` param in all admin API queries
- Ensures per-language content entry (EN or AM, not both simultaneously)
