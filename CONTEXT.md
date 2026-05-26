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
      ai/
        knowledge-base/          # Document upload, pipeline status, DLQ
          _components/           # upload-dialog, sidebar-documents, header-tools, dlq-panel, pipeline-progress
          _services/             # ai.hook (upload, delete, ingestion status SSE, ingestion toggle)
          page.tsx               # KB landing page (admin default)
        ask/                     # Chat with AI (strategy toggle: simple | agentic, debug mode)
          _components/           # conversation-sidebar, chat-panel, chunk-inspector, tool-use-indicator
          _services/             # ask.hook (streaming chat with chunk/citations/tool_use/tool_result/thinking events, conversation list, archive)
          page.tsx               # Ask AI page
          debug/                 # Admin debug page (strategy=agentic, debugMode=true)
            _components/         # debug-panel (thinking chunks, tool call timeline, event stream sidebar)
            page.tsx             # Debug page (admin-only, permission-gated)
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
| **AI Knowledge Base**| Admin document management for RAG: upload, pipeline ingestion status, dead letter queue. Documents tagged with sectors/tags/language.
| **AI Ask**        | Conversational AI interface with session management, conversation history, and RAG against the knowledge base. Supports strategy toggle (simple RAG vs agentic ReAct loop with tool calling) and debug mode (emits LLM reasoning/thinking chunks).
| **Document**      | Uploaded file (PDF/DOCX) processed through an ingestion pipeline (chunking → embedding → indexing) into the vector store. Has metadata: title, language, sector associations, tag associations.
| **Conversation**  | AI chat session with a title, language, and ordered message history. Can be archived (soft-deleted). Linked to a user account.
| **AI Tool**       | A registered capability exposed by a Go module (e.g., guide, taxonomy) that the AI can invoke via gRPC at inference time. Each tool has a name, description, and JSON Schema for parameters.
| **AI Persona**    | The system prompt and behavioral guardrails injected into every LLM call. Defines what the AI is, its tone, its restrictions, and available tools.

## Key Concepts

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

### AI Module Design
- `docs/ai-upgrade/0000-overview.md`
- Full design document covering the 4-phase upgrade: document metadata, localization, conversation history + page split, and agentic AI with tool calling.
- Architecture: Frontend (Next.js) → Core-backend (Go) via REST/SSE, Core-backend → AI Service (Python) via gRPC.
- AI Tool Service: gRPC service where Go modules register tool definitions (name, description, JSON Schema). AI service calls `ListTools` and `ExecuteTool` at inference time.

### Admin Language Toggle
- `src/stores/admin-language.store.ts`
- Global Zustand store with localStorage persistence
- Drives `locale` param in all admin API queries
- Ensures per-language content entry (EN or AM, not both simultaneously)

### Permission System (Frontend Integration)
- Backend implements RBAC with 32 permissions across 6 modules (`guide.*`, `community.*`, `library.*`, `notification.*`, `iam.*`, `ai.*`)
- `src/lib/permissions.ts` — `hasPermission(code)`, `hasAnyPermission(...)`, `hasAllPermissions(...)` synchronously read from Zustand auth store. `super_admin` role bypasses all checks.
- Auth store (`src/store/auth.store.ts`) holds `roles` and `permissions` arrays fetched via `getCurrentUser()` after login.
- Permission state is hydrated on app mount via `AuthHydrator` and kept fresh via token refresh.

### SidebarConfig (config-driven navigation)
- `src/components/layout/sidebar-config.ts`
- Typed configuration array defining all sidebar sections, items, and their permission requirements.
- Replaces the previous hardcoded sidebar JSX. Each item has: `kind` (link | collapsible | dropdown), `labelKey` (i18n), `iconName`, `href`, and optional `permissionCode`.
- Sidebar components filter items at render time using `hasPermission()`.

### RoutePermissionMap
- `src/lib/route-permissions.ts`
- Standalone `Record<string, string | undefined>` mapping route prefixes to required permissions.
- Used by `PermissionGuard` to protect page-level access beyond sidebar visibility.
- Kept separate from `SidebarConfig` (UI structure vs. route protection are different concerns).

### PermissionGuard
- `src/components/auth/permission-guard.tsx`
- Client component wrapping page content in `(modules)/layout.tsx`.
- Reads `usePathname()`, looks up the required permission in `RoutePermissionMap`, calls `hasPermission()`.
- Redirects to `/dashboard` if the user lacks the permission for the current route.

### Sidebar i18n
- Sidebar labels use `useTranslations("sidebar")` from `next-intl`.
- `src/messages/en.json` and `src/messages/am.json` contain all sidebar section headers, link labels, and footer labels.
- The `LanguageToggle` in the sidebar footer controls the admin content language (drives `Accept-Language` header), while `next-intl` handles UI text locale.

### Config-Driven Navigation
- All sidebar items are defined as data in `sidebar-config.ts`, not as JSX.
- Adding a new module = one entry in the config array. No component changes.
- Icons are resolved via a lookup map in `sidebar.tsx` (preserves lucide-react tree-shaking).
- Disabled items use `href: "#"` and can remain in the config for future development.
