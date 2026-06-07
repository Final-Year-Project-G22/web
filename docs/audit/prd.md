# Audit Implementation — Full PR Breakdown

**Date:** June 2026
**Source:** `docs/audit/full-audit.md`
**Status:** Ready for implementation

---

## 1. PR Decomposition Summary

The audit surfaced work across 3 domains: architecture (6 deepening candidates + 3 cross-cutting concerns), Next.js compliance (12 issues), and frontend design (14 opportunities). This plan breaks ALL findings into 16 PRs across 5 epics:

### Epic A — Foundation (PR 1–4)
1. **Foundation** — Error boundaries, skeletons, empty states, Suspense fixes
2. **Design System** — Typography swap + warm color tokens
3. **SSE Infrastructure** — Unified SseClient module + migrate 3 callers
4. **Inline Error Rollout** — Replace 14+ inline error strings with `<InlineError>`

### Epic B — Architecture Deepening (PR 5–9)
5. **Moderation Hooks** — Consolidate 3-way duplicated CRUD into hook factory
6. **Storage Upload** — Extract duplicated SeaweedFS orchestration
7. **UserCapabilities** — Unify auth/permissions across 4 files + fix redirect anti-pattern
8. **Guide Editor** — Extract 390-line page orchestration into `useGuideEditor` hook
9. **Query Keys + Error Toasts** — Standardize query key convention + error toast ownership

### Epic C — Next.js Compliance (PR 10–11)
10. **Housekeeping** — Dead code cleanup, next/image, remove axios, add lint/typecheck scripts
11. **RSC Pilot** — Server Component migration strategy + pilot with 2–3 pages

### Epic D — Surface Rebuilds (PR 12–14)
12. **PhoneFrame + Guide Detail** — Extract reusable phone frame + editorial guide rebuild
13. **AI Ask Rebuild** — Phone frame + thinking stream + citations as footnotes
14. **Small Surfaces** — 403 typographic, header cleanup, sidebar texture, login microcopy

### Epic E — Visual Polish (PR 15–16)
15. **List Variation + Motion** — Break Card+Table monotony + page-load stagger
16. **Micro-polish** — Semantic status colors, ID generation standardization

### Decisions made during grilling

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture candidate | #2 SSE infrastructure first | Highest duplication (3×250 lines), fixes real concurrency bug, subsumes #4 (401 re-auth) |
| Design direction | Hybrid — Fraunces for display moments only, warm accent (not dominant) | Admin panel used for hours/day; full editorial would cause fatigue |
| Surface priority | Guide detail first | Highest-impact surface, benefits most from hybrid design |
| Error components | Two components (ModuleError + InlineError), shared vocabulary | Different scales need different components |
| Skeleton scope | Minimal first (TableSkeleton + CardSkeleton) | Covers 90% of list pages; add FormSkeleton/PhoneSkeleton with surface rebuilds |
| PR 1 granularity | Single foundation PR | 4 tasks are independent but ship as one unit |
| InlineError rollout | Separate PR after design system | Rollout uses correct color tokens from day one |
| Design system atomicity | Single PR (typography + color) | Both are CSS token changes, ship together |
| SSE migration | Single PR (all 3 callers) | One cohesive refactor, migrate sequentially within the PR |

---

## 2. Clarifications Needed

None. The audit document (`docs/audit/full-audit.md`) has all file:line references needed for implementation.

---

## 3. PR Plan

---

# Epic A — Foundation

---

### PR 1 — Foundation: Error Boundaries, Skeletons, Empty States, Suspense

**Goal:** Make the app resilient. Every module gets error recovery, loading states, empty states, and Suspense compliance.

**Scope:**
- Create `ModuleError` (full-page) + `InlineError` (compact) components
- Add `error.tsx` at module and global level, `global-error.tsx` at root
- Create `TableSkeleton` + `CardSkeleton` components
- Replace 12+ inline `<p>Loading…</p>` with skeletons
- Rescue `empty-state.tsx`, add 3 module-specific variants (guide, moderation, ai)
- Replace 14+ inline "No items found." with `<EmptyState>`
- Fix 8 Suspense gaps by splitting pages into Content + wrapper

**Out of scope:**
- Replacing inline error strings with `<InlineError>` (PR 4)
- Typography or color changes (PR 2)
- Any architectural refactoring (PR 3)

**Dependencies:** None

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/components/ui/module-error.tsx` | New — full-page error boundary component |
| `src/components/ui/inline-error.tsx` | New — compact inline error component |
| `src/components/ui/skeleton.tsx` | New — TableSkeleton + CardSkeleton |
| `src/components/ui/empty-state.tsx` | Refactor — add variant presets |
| `src/app/error.tsx` | New — global error boundary |
| `src/app/global-error.tsx` | New — root error boundary (includes `<html>` + `<body>`) |
| `src/app/[locale]/(modules)/error.tsx` | New — module-level error boundary |
| `src/app/[locale]/(modules)/guide/page.tsx` | Suspense split + skeleton + empty state |
| `src/app/[locale]/(modules)/guide/[id]/page.tsx` | Skeleton + empty state |
| `src/app/[locale]/(modules)/guide/[id]/edit/page.tsx` | Suspense split + skeleton |
| `src/app/[locale]/(modules)/moderation/reported-content/page.tsx` | Suspense split + skeleton + empty state |
| `src/app/[locale]/(modules)/moderation/reported-users/page.tsx` | Suspense split + skeleton + empty state |
| `src/app/[locale]/(modules)/moderation/blocked-users/page.tsx` | Skeleton + empty state |
| `src/app/[locale]/(modules)/moderation/_components/report-detail-page.tsx` | Skeleton |
| `src/app/[locale]/(modules)/community/categories/page.tsx` | Skeleton + empty state |
| `src/app/[locale]/(modules)/admin/admins/page.tsx` | Skeleton + empty state |
| `src/app/[locale]/(modules)/admin/roles/page.tsx` | Skeleton + empty state |
| `src/app/[locale]/(modules)/admin/layout.tsx` | Suspense split |
| `src/app/[locale]/(modules)/taxonomy/layout.tsx` | Suspense split |
| `src/app/[locale]/(modules)/notifications/campaign-templates/page.tsx` | Suspense split + skeleton + empty state |
| `src/app/[locale]/(modules)/notifications/campaigns/page.tsx` | Suspense split + skeleton + empty state |
| `src/app/[locale]/(modules)/ai/knowledge-base/_components/sidebar-documents.tsx` | Skeleton + empty state |
| `src/app/[locale]/(modules)/ai/knowledge-base/_components/dlq-panel.tsx` | Skeleton |

**Commit checkpoints:**

1. `feat(ui): add ModuleError and InlineError components`
   - `src/components/ui/module-error.tsx` — full-page error with icon, heading, description, retry button
   - `src/components/ui/inline-error.tsx` — compact error with small icon, one-line message, inline retry

2. `feat(app): add error.tsx boundaries at module, global, and root level`
   - `src/app/error.tsx` — global boundary using `<ModuleError>`
   - `src/app/global-error.tsx` — root boundary with `<html>` + `<body>`
   - `src/app/[locale]/(modules)/error.tsx` — module boundary using `<ModuleError>`

3. `feat(ui): add TableSkeleton and CardSkeleton components`
   - `src/components/ui/skeleton.tsx` — TableSkeleton (configurable rows/columns) + CardSkeleton (configurable lines)

4. `refactor(pages): replace inline loading states with skeleton components`
   - 12+ page edits replacing `<p>Loading…</p>` with `<TableSkeleton>` or `<CardSkeleton>`

5. `refactor(ui): rescue empty-state.tsx with module-specific variants`
   - Refactor `empty-state.tsx` to add `variant?: "default" | "guide" | "moderation" | "ai"`
   - Each variant has default icon + message (still overridable)

6. `refactor(pages): replace inline empty states with EmptyState component`
   - 14+ page edits replacing `<p>No items found.</p>` with `<EmptyState variant="..." />`

7. `fix(next): add Suspense boundaries for useSearchParams/usePathname pages`
   - 8 page splits: rename component to `*Content`, wrap in `<Suspense fallback={<TableSkeleton />}>`
   - Files: guide/page, guide/edit/page, reported-content/page, reported-users/page, campaign-templates/page, campaigns/page, admin/layout, taxonomy/layout

**Tests:**
- **Unit:** `ModuleError` renders with icon + message + retry button; `InlineError` renders compact layout; `TableSkeleton` renders correct row/column count; `CardSkeleton` renders correct line count; `EmptyState` renders variant defaults
- **Integration:** Throw error in a child component → `error.tsx` catches it and shows recovery UI
- **Regression:** `next build` passes with no Suspense warnings

**Acceptance criteria:**
- [ ] Zero white screens on error — every module shows `<ModuleError>` with retry
- [ ] Zero `<p>Loading…</p>` in the codebase
- [ ] Zero inline "No items found." in the codebase
- [ ] `next build` produces no `useSearchParams`/`usePathname` Suspense warnings
- [ ] `error.tsx` exists at `(modules)/`, `app/`, and `global-error.tsx` at root

**Risk level:** Low — additive changes, no architectural shifts

**Notes:** `InlineError` is created here but not rolled out to inline error strings yet (PR 4).

---

### PR 2 — Design System: Typography Swap + Warm Color Tokens

**Goal:** Give the app typographic personality and a warm brand accent. Reskins everything in one pass.

**Scope:**
- Replace Inter with Fraunces (display) + Geist (body) in `layout.tsx` + `globals.css`
- Add `--font-display` token, apply Fraunces to display moments (auth headline, 403, guide titles, error headings, empty state titles)
- Introduce `--brand` warm token (terracotta), rewrite `--primary`, `--sidebar-primary`, `--auth-gradient-from/to`
- Add `--brand-accent` (saturated amber, <5% usage)

**Out of scope:**
- Sidebar texture, glow orb changes
- Surface rebuilds (guide detail, AI ask)
- Button component redesign

**Dependencies:** None (can merge independently of PR 1)

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Replace Inter import with Fraunces + Geist |
| `src/app/globals.css` | Update `--font-sans`, `--font-heading`, add `--font-display`, rewrite `--primary`, `--sidebar-primary`, `--auth-gradient-from/to`, add `--brand`, `--brand-accent` |
| `src/app/(auth)/auth/page.tsx` | Add `font-display` class to headline |
| `src/app/403/page.tsx` | Add `font-display` class to heading |
| `src/app/[locale]/(modules)/guide/[id]/page.tsx` | Add `font-display` class to guide title |
| `src/app/[locale]/(modules)/guide/_components/edit-guide-header.tsx` | Add `font-display` class to h1 |
| `src/components/ui/module-error.tsx` | Add `font-display` class to heading |
| `src/components/ui/empty-state.tsx` | Add `font-display` class to title |

**Commit checkpoints:**

1. `feat(design): replace Inter with Fraunces + Geist in layout and globals`
   - `src/app/layout.tsx` — remove Inter, add Fraunces + Geist imports
   - `src/app/globals.css` — update `--font-sans: var(--font-geist)`, `--font-heading: var(--font-fraunces)`, add `--font-display`

2. `feat(design): apply Fraunces display font to hero moments`
   - Auth page headline, 403 heading, guide titles, edit-guide-header, ModuleError heading, EmptyState title

3. `feat(design): introduce warm brand color tokens`
   - `globals.css` — rewrite `--primary` to terracotta, add `--brand`, `--brand-accent`, update `--sidebar-primary`, `--auth-gradient-from/to`
   - Both light and dark mode tokens

**Tests:**
- **Visual:** Auth page shows Fraunces serif headline + warm gradient
- **Visual:** Guide detail page shows Fraunces on guide title
- **Visual:** Primary buttons render terracotta, not indigo
- **Regression:** `next build` passes, no font-loading errors

**Acceptance criteria:**
- [ ] Inter is no longer imported or referenced
- [ ] Fraunces renders on: auth headline, 403 heading, guide titles, error headings, empty state titles
- [ ] Geist renders on all body text, labels, form inputs, table text
- [ ] Primary buttons are terracotta (`oklch(0.45 0.16 45)` light / `oklch(0.65 0.16 45)` dark)
- [ ] Auth gradient is warm, not cool indigo
- [ ] JetBrains Mono unchanged (still used for code/AI debug)

**Risk level:** Low — CSS token changes, no logic changes

---

### PR 3 — SSE Infrastructure: Unified SseClient + Migrate 3 Callers

**Goal:** Consolidate 3 duplicated SSE clients (~600 lines) into one `SseClient` module. Fix the 401 refresh race condition.

**Scope:**
- Create `src/lib/sse-client.ts` with: connect, 401 re-auth (coalesced), exponential backoff, parse, dispatch, abort
- Migrate `ask.hook.ts` to use `SseClient`
- Migrate `ai.hook.ts` (ingestion status) to use `SseClient`
- Migrate `campaign-sse.hook.ts` to use `SseClient`
- Port existing `ask.hook.test.tsx` to test `SseClient` directly
- Add concurrent 401 coalescing test

**Out of scope:**
- `custom-fetch.ts` changes (stays as-is for non-SSE requests)
- Any UI changes to chat, knowledge base, or campaign pages
- New SSE endpoints

**Dependencies:** None (can merge independently of PR 1 and PR 2)

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/lib/sse-client.ts` | New — unified SSE client (~200 lines) |
| `src/lib/sse-client.test.ts` | New — unit tests (~150 lines) |
| `src/app/[locale]/(modules)/ai/ask/_services/ask.hook.ts` | Remove ~200 lines of duplicated SSE primitives |
| `src/app/[locale]/(modules)/ai/ask/_services/ask.hook.test.tsx` | Refactor to test SseClient |
| `src/app/[locale]/(modules)/ai/knowledge-base/_services/ai.hook.ts` | Remove ~200 lines of duplicated SSE primitives |
| `src/app/[locale]/(modules)/notifications/_services/campaign-sse.hook.ts` | Remove ~150 lines of duplicated SSE primitives |

**Duplicated primitives to consolidate:**

| Primitive | Current locations | Lines |
|-----------|-------------------|-------|
| `sseReconnectDelayMs` | ask.hook.ts, ai.hook.ts, campaign-sse.hook.ts | 3× identical |
| `waitForReconnect` | ask.hook.ts, ai.hook.ts, campaign-sse.hook.ts | 3× identical |
| `parseSSEChunk` | ask.hook.ts, ai.hook.ts, campaign-sse.hook.ts | 3× identical |
| `fetchSseWithAuth` | ask.hook.ts, ai.hook.ts | 2× identical (missing in campaign-sse) |

**Commit checkpoints:**

1. `feat(sse): add SseClient module with connect, 401 coalescing, backoff, parse`
   - `src/lib/sse-client.ts` — interface: `connectSse({ url, headers, onEvent, onError, signal })`
   - Implementation: fetch streaming, parse SSE lines, exponential backoff, 401 → refresh → retry, coalesced refresh via singleton `refreshPromise`, abort support

2. `test(sse): add SseClient unit tests including concurrent 401 coalescing`
   - `src/lib/sse-client.test.ts` — tests for: connect, parse, backoff, 401 retry, coalescing, abort

3. `refactor(ai): migrate ask.hook.ts to SseClient`
   - Replace `fetchSseWithAuth` + `parseSSEChunk` + `waitForReconnect` with `connectSse`
   - Keep hook interface unchanged (`useAskChat` returns same shape)
   - Remove ~200 lines of duplicated primitives

4. `refactor(ai): migrate ai.hook.ts ingestion SSE to SseClient`
   - Same pattern: replace SSE primitives with `connectSse`
   - Remove ~200 lines

5. `refactor(notifications): migrate campaign-sse.hook.ts to SseClient`
   - Same pattern
   - Remove ~150 lines

6. `chore: remove dead SSE primitives from hook files`
   - Final cleanup pass: remove any remaining unused imports, types, or helper functions

**Tests:**
- **Unit:** `SseClient` connects, parses events, dispatches to `onEvent` handler
- **Unit:** Exponential backoff on disconnect (delay doubles each retry)
- **Unit:** 401 → refresh → retry flow works
- **Unit:** Concurrent 401 from two connections → single `refreshToken()` call
- **Unit:** AbortSignal closes connection cleanly
- **Regression:** Existing `ask.hook.test.tsx` still passes (hook interface unchanged)
- **Manual:** AI chat streaming works, ingestion status updates work, campaign SSE updates work

**Acceptance criteria:**
- [ ] `sseReconnectDelayMs`, `waitForReconnect`, `parseSSEChunk`, `fetchSseWithAuth` exist in exactly one file (`sse-client.ts`)
- [ ] Zero duplicated SSE primitives across hook files
- [ ] 401 refresh is coalesced (singleton `refreshPromise`)
- [ ] Net deletion of ~550 lines across 3 hook files
- [ ] All 3 streaming features work identically to before
- [ ] `SseClient` has unit test coverage for: connect, parse, backoff, 401 retry, coalescing, abort

**Risk level:** Medium — touches wire layer for 3 live features simultaneously

**Notes:** Migrate one caller at a time (ask → ingestion → campaigns), verify each before moving to next. Keep old hook interfaces unchanged — only internal implementation changes.

---

### PR 4 — Inline Error Rollout

**Goal:** Replace 14+ inline `<p>Failed to load: {error}</p>` with `<InlineError>` component (created in PR 1).

**Scope:**
- Replace all inline error strings in list pages, detail pages, sidebar, DLQ panel
- Each replacement adds retry button via `onRetry={query.refetch}`

**Out of scope:**
- Error boundary changes (done in PR 1)
- Any new error handling logic

**Dependencies:** PR 1 (InlineError component), PR 2 (color tokens for destructive styling)

**Files/modules likely touched:**

| File | Current pattern |
|------|----------------|
| `src/app/[locale]/(modules)/guide/page.tsx` | `<p>Failed to load: {getErrorMessage(...)}</p>` |
| `src/app/[locale]/(modules)/guide/[id]/page.tsx` | `<p>Failed to load: {getErrorMessage(...)}</p>` |
| `src/app/[locale]/(modules)/guide/[id]/edit/page.tsx` | `<p>Failed to load: {getErrorMessage(...)}</p>` |
| `src/app/[locale]/(modules)/moderation/reported-content/page.tsx` | `<p>Failed to load: {getErrorMessage(...)}</p>` |
| `src/app/[locale]/(modules)/moderation/reported-users/page.tsx` | `<p>Failed to load: {getErrorMessage(...)}</p>` |
| `src/app/[locale]/(modules)/moderation/blocked-users/page.tsx` | `<p>Failed to load: {getErrorMessage(...)}</p>` |
| `src/app/[locale]/(modules)/moderation/_components/report-detail-page.tsx` | `<p>Failed to load: {getErrorMessage(...)}</p>` |
| `src/app/[locale]/(modules)/community/categories/page.tsx` | `<p>Failed to load: {getErrorMessage(...)}</p>` |
| `src/app/[locale]/(modules)/admin/admins/page.tsx` | `<div>Failed to load admins.</div>` |
| `src/app/[locale]/(modules)/admin/roles/page.tsx` | `<div>Failed to load roles.</div>` |
| `src/app/[locale]/(modules)/notifications/campaign-templates/page.tsx` | `<p>Failed to load: {getErrorMessage(...)}</p>` |
| `src/app/[locale]/(modules)/notifications/campaigns/page.tsx` | `<p>Failed to load: {getErrorMessage(...)}</p>` |
| `src/app/[locale]/(modules)/ai/knowledge-base/_components/sidebar-documents.tsx` | `<p>Failed to load documents</p>` |
| `src/app/[locale]/(modules)/ai/knowledge-base/_components/dlq-panel.tsx` | (no error state currently — add one) |

**Commit checkpoints:**

1. `refactor(pages): replace inline error strings with InlineError component`
   - Mechanical pass across 14+ sites
   - Each replacement: `<InlineError error={query.error} onRetry={() => query.refetch()} />`

**Tests:**
- **Regression:** Each page still renders error state correctly
- **Visual:** Error states show icon + message + retry button with destructive color

**Acceptance criteria:**
- [ ] Zero `<p>Failed to load:` in the codebase
- [ ] Every error state has a retry button
- [ ] `getErrorMessage` is only called inside `<InlineError>`, not inline in pages

**Risk level:** Low — mechanical replacement, no logic changes

---

# Epic B — Architecture Deepening

---

### PR 5 — Moderation Hooks: Consolidate 3-Way Duplicated CRUD

**Goal:** Replace 3 near-identical moderation hook files (~240 lines total) with one parameterized hook factory.

**Scope:**
- Create `useModerationReport` hook factory parameterized by report type (`"post" | "thread" | "user"`)
- Behind the seam: one Orval adapter map `{ post: adminListPostReports, thread: adminListThreadReports, user: adminListUserReports }`
- Delete the 3 individual hook files
- Update `report-detail-page.tsx` consumer to use the new factory

**Out of scope:**
- Changes to `report-detail-page.tsx` UI (already unified)
- Any other moderation component changes

**Dependencies:** None (independent of PR 1–4)

**Audit reference:** §1.1

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/app/[locale]/(modules)/moderation/_services/report.hook.ts` | New — unified hook factory (~90 lines) |
| `src/app/[locale]/(modules)/moderation/_services/post-reports.hook.ts` | Delete (77 lines) |
| `src/app/[locale]/(modules)/moderation/_services/thread-reports.hook.ts` | Delete (77 lines) |
| `src/app/[locale]/(modules)/moderation/_services/user-reports.hook.ts` | Delete (85 lines) |
| `src/app/[locale]/(modules)/moderation/_components/report-detail-page.tsx` | Update imports to use new factory |
| `src/app/[locale]/(modules)/moderation/reported-content/page.tsx` | Update imports |
| `src/app/[locale]/(modules)/moderation/reported-users/page.tsx` | Update imports |

**Commit checkpoints:**

1. `feat(moderation): add useModerationReport hook factory with Orval adapter map`
   - New `report.hook.ts` with `useModerationReport(type, params)` returning `{ list, get, updateStatus, deleteContent }`
   - Adapter map: `{ post: { list: adminListPostReports, ... }, thread: {...}, user: {...} }`

2. `refactor(moderation): migrate consumers to new hook factory`
   - Update `report-detail-page.tsx`, `reported-content/page.tsx`, `reported-users/page.tsx`

3. `chore(moderation): delete 3 duplicated hook files`
   - Remove `post-reports.hook.ts`, `thread-reports.hook.ts`, `user-reports.hook.ts`

**Tests:**
- **Unit:** `useModerationReport("post")` returns same shape as old `useAdminListPostReports`
- **Unit:** `useModerationReport("thread")` and `useModerationReport("user")` work identically
- **Regression:** Moderation list pages load, detail pages load, status updates work, delete works

**Acceptance criteria:**
- [ ] 3 hook files deleted, replaced by 1 factory (~90 lines)
- [ ] Net deletion of ~150 lines
- [ ] `if (res.status !== 200) throw res.data` pattern exists once (in the factory), not 9 times
- [ ] `report-detail-page.tsx` works for all 3 report types
- [ ] List pages for post/thread/user reports work identically to before

**Risk level:** Low — clean seam, well-defined variance axis

---

### PR 6 — Storage Upload: Extract Duplicated SeaweedFS Orchestration

**Goal:** Consolidate 2 duplicated upload pipelines (AI documents + library templates) into one `StorageUploader` module.

**Scope:**
- Create `src/lib/storage-uploader.ts` exposing `upload(file, { kind, metadata }) → record`
- Behind the seam: hash computation (SHA-256), intent fetch, presigned upload, finalize, error translation, idempotency key
- Migrate `useUploadDocument` in `ai.hook.ts` to use `StorageUploader`
- Migrate `useCreateTemplate` and `useUpdateTemplate` in `library.hook.ts` to use `StorageUploader`

**Out of scope:**
- UI changes to upload dialogs or forms
- Chunked uploads, retry, virus-scan hooks (future enhancements)

**Dependencies:** None

**Audit reference:** §1.3

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/lib/storage-uploader.ts` | New — unified upload module (~80 lines) |
| `src/app/[locale]/(modules)/ai/knowledge-base/_services/ai.hook.ts` | Replace `useUploadDocument` internals (~50 lines removed) |
| `src/app/[locale]/(modules)/library/_services/library.hook.ts` | Replace `useCreateTemplate` + `useUpdateTemplate` internals (~80 lines removed) |

**The shared pattern (both sites):**
1. Get a presigned upload intent from the API
2. `fetch(intent.uploadUrl, { method: intent.method, body: file, headers: intent.headers })`
3. Finalize/create a record with the `fileKey` from the intent

**What varies (handled by adapter):**
- Intent endpoint (`createIngestionUploadIntent` vs `libraryCreateTemplateUploadIntent`)
- Finalize endpoint (`finalizeIngestionUpload` vs `libraryCreateTemplate`)
- SHA-256 computation (AI documents only)
- Metadata shape (sectorIds/tagIds vs title/language/description)

**Commit checkpoints:**

1. `feat(storage): add StorageUploader module with intent → upload → finalize pipeline`
   - `src/lib/storage-uploader.ts` — `upload(file, { getIntent, finalize, computeHash? })`

2. `refactor(ai): migrate useUploadDocument to StorageUploader`
   - Replace inline SHA-256 + intent + fetch + finalize with `upload()` call

3. `refactor(library): migrate useCreateTemplate and useUpdateTemplate to StorageUploader`
   - Replace inline intent + fetch + create with `upload()` call

**Tests:**
- **Unit:** `StorageUploader` calls getIntent → fetch → finalize in order
- **Unit:** SHA-256 hash is computed correctly when `computeHash` is true
- **Unit:** Error in intent → rejects with translated error
- **Unit:** Error in presigned fetch → rejects with upload error
- **Regression:** AI document upload works, library template upload works

**Acceptance criteria:**
- [ ] Upload intent + presigned fetch + finalize pattern exists in one module
- [ ] Net deletion of ~100 lines across 2 hook files
- [ ] AI document upload and library template upload work identically to before
- [ ] SHA-256 hash computation is in one place

**Risk level:** Low — clear seam, two call sites

---

### PR 7 — UserCapabilities: Unify Auth/Permissions + Fix Redirect Anti-Pattern

**Goal:** Consolidate auth/permissions lookup (split across 4 files) into one `UserCapabilities` module. Fix the 3 different redirect strategies for "user is not allowed here."

**Scope:**
- Create `src/lib/user-capabilities.ts` with `can(permission)`, `canAny(...)`, `canAll(...)`, `requiredForRoute(path)`
- Consolidate: `auth.store.ts` state, `permissions.ts` lookup, `route-permissions.ts` map, `permission-guard.tsx` guard
- Fix redirect anti-pattern: replace `useEffect` + `router.replace("/403")` with Next.js `redirect()` or `forbidden()` primitives
- Unify the 3 redirect strategies: `permission-guard.tsx` (router.replace), `admin/layout.tsx` (router.replace), `auth.service.ts` (window.location.href)

**Out of scope:**
- Backend RBAC changes
- New permissions or roles

**Dependencies:** None

**Audit reference:** §1.5, §2.3

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/lib/user-capabilities.ts` | New — unified capabilities module (~60 lines) |
| `src/store/auth.store.ts` | Minor — expose via UserCapabilities, no state shape change |
| `src/lib/permissions.ts` | Delete or reduce to thin wrapper (~30 lines → ~5 lines) |
| `src/lib/route-permissions.ts` | Move into `user-capabilities.ts` (~14 lines → 0) |
| `src/components/auth/permission-guard.tsx` | Refactor to use `UserCapabilities.requiredForRoute()` |
| `src/components/layout/sidebar.tsx` | Update filter to use `UserCapabilities.can()` |
| `src/app/[locale]/(modules)/admin/layout.tsx` | Replace `useEffect` + `router.replace` with proper redirect primitive |

**Commit checkpoints:**

1. `feat(auth): add UserCapabilities module with can(), canAny(), canAll(), requiredForRoute()`
   - `src/lib/user-capabilities.ts` — reads auth store, applies super_admin bypass, checks route map

2. `refactor(auth): migrate permission-guard and sidebar to UserCapabilities`
   - `permission-guard.tsx` — calls `requiredForRoute(pathname)` + `can()`
   - `sidebar.tsx` — calls `can()` for item filtering

3. `fix(auth): unify redirect strategies for forbidden access`
   - `admin/layout.tsx` — replace `useEffect` + `router.replace("/403")` with consistent approach
   - `permission-guard.tsx` — same fix
   - Document the single redirect strategy

4. `chore(auth): remove dead permission files`
   - Delete or reduce `permissions.ts`, `route-permissions.ts`

**Tests:**
- **Unit:** `can("guide.read")` returns true when user has permission
- **Unit:** `can("guide.read")` returns true for `super_admin` role (bypass)
- **Unit:** `canAny("guide.read", "guide.write")` returns true if user has either
- **Unit:** `requiredForRoute("/guide/123")` returns correct permission code
- **Regression:** Permission guard redirects to /403 for unauthorized routes
- **Regression:** Sidebar hides items user doesn't have permission for

**Acceptance criteria:**
- [ ] "What can this user do?" is answered by one module (`user-capabilities.ts`)
- [ ] `permissions.ts` and `route-permissions.ts` are deleted or reduced to thin re-exports
- [ ] `super_admin` bypass is in one place, not hardcoded in `permissions.ts:13`
- [ ] Redirect strategy is consistent (no more 3 different approaches)
- [ ] `admin/layout.tsx` no longer has `useEffect` + `router.replace("/403")`

**Risk level:** Medium — touches auth flow, but behavior should be identical

---

### PR 8 — Guide Editor: Extract Orchestration into useGuideEditor Hook

**Goal:** Move the 390-line guide editor page's orchestration logic into a `useGuideEditor(guideId)` hook. The page becomes a thin wrapper.

**Scope:**
- Create `src/app/[locale]/(modules)/guide/_services/use-guide-editor.ts` hook
- Owns: store binding, URL ↔ active-step sync, persist-once seed rule, save/delete/reorder handlers, toast surface
- Move `mapApiToEditorSteps`, `buildCreatePayload`, `buildUpdatePayload` into a `guide-editor.mapper.ts` module
- Reduce `edit/page.tsx` from ~390 lines to ~100 lines

**Out of scope:**
- Changes to `edit-step-form.tsx`, `edit-guide-sidebar.tsx`, `mobile-preview.tsx` UI
- Changes to `edit-guide.store.ts` state shape

**Dependencies:** None

**Audit reference:** §1.6

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/app/[locale]/(modules)/guide/_services/use-guide-editor.ts` | New — orchestration hook (~150 lines) |
| `src/app/[locale]/(modules)/guide/_services/guide-editor.mapper.ts` | New — payload mapping functions (~80 lines) |
| `src/app/[locale]/(modules)/guide/[id]/edit/page.tsx` | Reduce from ~390 to ~100 lines |
| `src/app/[locale]/(modules)/guide/_components/edit-step-form.tsx` | Minor — stop poking `editGuideStore.getState()` directly |

**Commit checkpoints:**

1. `feat(guide): add guide-editor.mapper.ts with payload mapping functions`
   - Move `mapApiToEditorSteps`, `createEmptyStep`, `buildCreatePayload`, `buildUpdatePayload` out of page

2. `feat(guide): add useGuideEditor hook owning store, URL sync, seed, handlers`
   - `useGuideEditor(guideId)` returns `{ guideName, allSteps, activeStep, handleSave, handleDelete, handleSaveOrder, navigateToStep, isLoading, isError }`

3. `refactor(guide): reduce edit/page.tsx to thin wrapper`
   - Page calls `useGuideEditor(id)`, renders `<EditGuideHeader>`, `<EditGuideSidebar>`, `<EditStepForm>`, `<MobilePreview>`

4. `refactor(guide): remove imperative store pokes from edit-step-form.tsx`
   - Pass handlers via props instead of `editGuideStore.getState()`

**Tests:**
- **Unit:** `mapApiToEditorSteps` correctly maps API DTOs to editor steps
- **Unit:** `buildCreatePayload` and `buildUpdatePayload` produce correct shapes
- **Unit:** `useGuideEditor` seeds persisted steps once on initial load
- **Unit:** `useGuideEditor` handles `?step=new` by creating a draft
- **Regression:** Guide editor page works: load, edit step, save, delete, reorder

**Acceptance criteria:**
- [ ] `edit/page.tsx` is ~100 lines (down from 390)
- [ ] `mapApiToEditorSteps`, `buildCreatePayload`, `buildUpdatePayload` are in a mapper module, not in the page
- [ ] `edit-step-form.tsx` no longer calls `editGuideStore.getState()` directly
- [ ] Guide editor works identically to before (load, edit, save, delete, reorder)

**Risk level:** Medium — most complex page in the app, but hook interface preserves behavior

---

### PR 9 — Query Keys + Error Toasts: Standardize Cross-Cutting Conventions

**Goal:** Establish a consistent query key convention and error toast ownership rule across all modules.

**Scope:**
- Create `src/lib/query-keys.ts` — central query key registry with typed factory
- Migrate all 8+ module-level key constants to the central registry
- Establish error toast rule: **hooks own error toasts for mutations, queries expose error state for components to render**
- Standardize: every mutation hook toasts on error, every query hook exposes `error` for `<InlineError>`

**Out of scope:**
- React Query configuration changes
- New query caching strategies

**Dependencies:** PR 4 (InlineError rollout complete), PR 5 (moderation hooks consolidated)

**Audit reference:** §2.1, §2.2

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/lib/query-keys.ts` | New — central key registry (~40 lines) |
| `src/app/[locale]/(modules)/moderation/_services/query-keys.ts` | Delete — migrate to central |
| `src/app/[locale]/(modules)/ai/ask/_services/ask.hook.ts` | Update key references |
| `src/app/[locale]/(modules)/ai/knowledge-base/_services/ai.hook.ts` | Update key references |
| `src/app/[locale]/(modules)/guide/_services/guide.hook.ts` | Update key references |
| `src/app/[locale]/(modules)/library/_services/library.hook.ts` | Update key references |
| `src/app/[locale]/(modules)/admin/_services/query-keys.ts` | Delete — migrate to central |
| `src/app/[locale]/(modules)/notifications/_services/notification.hook.ts` | Update key references |
| `src/app/[locale]/(modules)/community/_services/community.hook.ts` | Update key references |
| `src/app/[locale]/(modules)/admin/_services/admin-management.hook.ts` | Standardize toast wiring |
| `src/app/[locale]/(modules)/guide/[id]/edit/page.tsx` | Remove inline toast (hook owns it) |

**Query key convention:**
```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  guides: { all: ["guides"] as const, detail: (id: string) => ["guides", id] as const, steps: (id: string) => ["guides", id, "steps"] as const },
  moderation: { posts: ["moderation", "posts"] as const, threads: ["moderation", "threads"] as const, users: ["moderation", "users"] as const },
  // ... etc
}
```

**Error toast rule:**
- **Mutations:** Hook calls `toast.error(getErrorMessage(err))` in `onError`. Pages do NOT toast mutation errors.
- **Queries:** Hook exposes `error` state. Pages render `<InlineError error={query.error} onRetry={query.refetch} />`.

**Commit checkpoints:**

1. `feat(query): add central query key registry`
   - `src/lib/query-keys.ts` with typed key factory for all modules

2. `refactor(hooks): migrate all module query keys to central registry`
   - Update 8+ hook files to import from `queryKeys` instead of local constants
   - Delete `moderation/_services/query-keys.ts` and `admin/_services/query-keys.ts`

3. `refactor(hooks): standardize error toast ownership`
   - Mutation hooks: add `toast.error()` in `onError` where missing
   - Pages: remove inline `toast.error()` calls (guide edit page, etc.)

**Tests:**
- **Unit:** `queryKeys.guides.detail("123")` returns `["guides", "123"]`
- **Regression:** All query invalidation still works (guides, moderation, AI, library, admin, notifications, community)
- **Regression:** Mutation errors still produce toasts

**Acceptance criteria:**
- [ ] All query keys defined in one file (`src/lib/query-keys.ts`)
- [ ] Zero module-level `KEYS` or `QUERY_KEYS` constants
- [ ] Consistent key naming convention across all modules
- [ ] Mutation errors toast from hooks, not from pages
- [ ] Query errors render via `<InlineError>`, not inline `<p>` tags

**Risk level:** Medium — touches every hook file, but changes are mechanical

---

# Epic C — Next.js Compliance

---

### PR 10 — Housekeeping: Dead Code, next/image, Dependencies, Scripts

**Goal:** Clean up build config, remove dead code, fix image tags, add missing dev scripts.

**Scope:**
- Remove 546 commented-out lines from `campaigns/[id]/page.tsx`
- Replace 3 `<img>` tags with `<next/image>` + add `images.remotePatterns` to `next.config.ts`
- Remove unused `axios` from `package.json`
- Add `lint` and `typecheck` scripts to `package.json`

**Out of scope:**
- Any functional changes
- RSC migration (PR 11)

**Dependencies:** None

**Audit reference:** §3.6, §7.4, §8.2, §8.3

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/app/[locale]/(modules)/notifications/campaigns/[id]/page.tsx` | Remove lines 1–546 (commented code), remove duplicate `"use client"` |
| `src/app/[locale]/(modules)/guide/[id]/page.tsx` | Replace `<img>` with `<Image>` (line 203) |
| `src/app/[locale]/(modules)/guide/_components/edit-step-form.tsx` | Replace `<img>` with `<Image>` (line 330) |
| `src/app/[locale]/(modules)/guide/_components/mobile-preview.tsx` | Replace `<img>` with `<Image>` (line 88) |
| `next.config.ts` | Add `images.remotePatterns` for the image CDN |
| `package.json` | Remove `axios`, add `lint` and `typecheck` scripts |

**Commit checkpoints:**

1. `chore(notifications): remove 546 lines of commented-out code from campaigns detail`
   - Delete lines 1–546, keep implementation at line 548+
   - Remove duplicate `"use client"` directive

2. `fix(guide): replace <img> with <next/image> in 3 call sites`
   - `guide/[id]/page.tsx`, `edit-step-form.tsx`, `mobile-preview.tsx`
   - Add `images.remotePatterns` to `next.config.ts`

3. `chore(deps): remove unused axios from package.json`

4. `chore(scripts): add lint and typecheck scripts to package.json`
   - `"lint": "biome check src/"`
   - `"typecheck": "tsc --noEmit"`

**Tests:**
- **Regression:** `next build` passes
- **Regression:** `npm run lint` runs without errors
- **Regression:** `npm run typecheck` runs without errors
- **Visual:** Guide images still render correctly with `<next/image>`

**Acceptance criteria:**
- [ ] `campaigns/[id]/page.tsx` has no commented-out code
- [ ] Zero `<img>` tags in the codebase (all use `<next/image>`)
- [ ] `axios` removed from `package.json`
- [ ] `npm run lint` and `npm run typecheck` both work
- [ ] `next.config.ts` has `images.remotePatterns` configured

**Risk level:** Low — mechanical cleanup

---

### PR 11 — RSC Pilot: Server Component Migration Strategy + 2–3 Pages

**Goal:** Establish the Server Component migration pattern and prove it on 2–3 simple pages. Full rollout deferred to a later epic.

**Scope:**
- Document the RSC migration strategy (how to handle `customFetch` + `useAuthStore` on the server)
- Create a server-side data fetching utility that reads auth cookies without Zustand
- Migrate 2–3 simple pages to Server Components as a pilot:
  - `admin/admins/page.tsx` (simple list)
  - `admin/roles/page.tsx` (simple list)
  - `community/categories/page.tsx` (list with hierarchy)

**Out of scope:**
- Full RSC migration (47 pages — deferred to later epic)
- Server Actions (deferred)
- `route.ts` handlers (deferred)

**Dependencies:** PR 10 (housekeeping clean), PR 7 (UserCapabilities for server-side permission checks)

**Audit reference:** §4.1, §3.5

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/lib/server-data.ts` | New — server-side fetch utility that reads cookies (~40 lines) |
| `src/app/[locale]/(modules)/admin/admins/page.tsx` | Migrate to Server Component |
| `src/app/[locale]/(modules)/admin/admins/_components/admin-list-client.tsx` | New — client component for interactive parts |
| `src/app/[locale]/(modules)/admin/roles/page.tsx` | Migrate to Server Component |
| `src/app/[locale]/(modules)/admin/roles/_components/role-list-client.tsx` | New — client component for interactive parts |
| `docs/adr/rsc-migration-strategy.md` | New — ADR documenting the approach |

**Migration pattern:**
```
page.tsx (Server Component)
  ├── await fetchAdmins(params) — server-side data fetch using cookies()
  ├── Pass serialized data as props to client component
  └── <AdminListClient admins={admins} /> — interactive parts (filters, drawers)
```

**Server-side fetch utility:**
```typescript
// src/lib/server-data.ts
import { cookies } from "next/headers";

export async function serverFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const url = `${process.env.NEXT_PUBLIC_API_URL}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Server fetch failed: ${res.status}`);
  return res.json();
}
```

**Commit checkpoints:**

1. `docs: add RSC migration strategy ADR`
   - Document the pattern: server page fetches data, passes to client component
   - Document the cookie-reading approach
   - Document what stays client (filters, drawers, mutations)

2. `feat(server): add serverFetch utility for cookie-based server data fetching`
   - `src/lib/server-data.ts`

3. `refactor(admin): migrate admins page to Server Component pilot`
   - `page.tsx` becomes async server component
   - Interactive parts extracted to `admin-list-client.tsx`

4. `refactor(admin): migrate roles page to Server Component pilot`
   - Same pattern

**Tests:**
- **Unit:** `serverFetch` reads cookies and makes authenticated request
- **Regression:** Admin list page loads, filters work, drawer opens
- **Regression:** Roles page loads, drawer opens
- **Build:** `next build` passes, pilot pages render on server (check build output)

**Acceptance criteria:**
- [ ] `serverFetch` utility exists and reads auth cookies without Zustand
- [ ] 2–3 pages migrated to Server Components (page.tsx is NOT `"use client"`)
- [ ] Pilot pages fetch data on server, pass serialized props to client components
- [ ] Interactive parts (filters, drawers, mutations) still work via client components
- [ ] ADR documents the migration pattern for future pages

**Risk level:** Medium — establishes new pattern, but limited blast radius (2–3 pages)

**Notes:** This is a pilot, not a full migration. The 47 remaining client pages are deferred. The pilot proves the pattern works before committing to a full rollout.

---

# Epic D — Surface Rebuilds

---

### PR 12 — PhoneFrame + Guide Detail Editorial Rebuild

**Goal:** Extract the phone-frame motif as a reusable component. Rebuild the guide detail page as an editorial layout — the highest-impact surface.

**Scope:**
- Extract `<PhoneFrame>` from `mobile-preview.tsx` as reusable component
- Rebuild `guide/[id]/page.tsx` with:
  - Full-bleed hero: phone preview (left) + guide title/description/tags (right), cover image as blurred background
  - Chapter-list Steps section: each step as a card with number, title, estimated time, compliance badge
  - Sticky chapter nav on desktop
  - Single Save bar (fixed bottom, visible when dirty)
- Apply Fraunces display font to hero headings (uses PR 2 tokens)

**Out of scope:**
- Guide editor page changes (PR 8)
- Guide list page visual variation (PR 15)
- AI Ask phone frame (PR 13)

**Dependencies:** PR 1 (skeletons for loading states), PR 2 (design tokens), PR 4 (InlineError)

**Audit reference:** §14.1, §14.4, §11.2

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/components/ui/phone-frame.tsx` | New — reusable PhoneFrame component (~60 lines) |
| `src/app/[locale]/(modules)/guide/_components/mobile-preview.tsx` | Refactor to use `<PhoneFrame>` |
| `src/app/[locale]/(modules)/guide/[id]/page.tsx` | Full rebuild (~250 lines, editorial layout) |

**Commit checkpoints:**

1. `feat(ui): extract PhoneFrame as reusable component`
   - `src/components/ui/phone-frame.tsx` — 320px frame with bezel, notch, status pill
   - Refactor `mobile-preview.tsx` to wrap content in `<PhoneFrame>`

2. `feat(guide): rebuild guide detail page with editorial layout`
   - Full-bleed hero: `<PhoneFrame>` + guide metadata
   - Chapter-list Steps section with step cards
   - Sticky chapter nav
   - Fixed Save bar

**Tests:**
- **Visual:** Guide detail page shows editorial layout with phone frame hero
- **Visual:** Mobile preview in guide editor still works (uses extracted PhoneFrame)
- **Regression:** Guide save, step edit, step delete all work
- **Responsive:** Layout works on desktop (3-column) and tablet (stacked)

**Acceptance criteria:**
- [ ] `<PhoneFrame>` is a standalone reusable component
- [ ] `mobile-preview.tsx` uses `<PhoneFrame>` (no visual regression)
- [ ] Guide detail page has editorial layout (not two stacked Cards)
- [ ] Fraunces display font on guide title hero
- [ ] Save bar appears when form is dirty
- [ ] Steps section shows step cards (not a table)

**Risk level:** Low — isolated surface rebuild, no shared logic changes

---

### PR 13 — AI Ask Page Rebuild: Phone Frame + Thinking Stream

**Goal:** Rebuild the AI Ask page with phone-frame conversation, custom thinking-stream component, and inline footnote citations.

**Scope:**
- Wrap conversation in `<PhoneFrame>` (from PR 12)
- Create custom token-stream component for thinking chunks (not just JSON in debug panel)
- Render citations as inline footnotes (not a separate panel)
- Enhance tool-use indicator as a step indicator (visual timeline, not just a list)

**Out of scope:**
- SSE infrastructure changes (PR 3)
- Conversation sidebar changes
- AI debug page changes

**Dependencies:** PR 3 (SseClient), PR 12 (PhoneFrame component)

**Audit reference:** §14.2

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/app/[locale]/(modules)/ai/ask/page.tsx` | Rebuild layout with phone frame (~100 lines) |
| `src/app/[locale]/(modules)/ai/ask/_components/chat-panel.tsx` | Rebuild message rendering (~200 lines changed) |
| `src/app/[locale]/(modules)/ai/ask/_components/thinking-stream.tsx` | New — token-stream component for thinking chunks (~80 lines) |
| `src/app/[locale]/(modules)/ai/ask/_components/citation-footnotes.tsx` | New — inline footnote citations (~50 lines) |
| `src/app/[locale]/(modules)/ai/ask/_components/tool-use-indicator.tsx` | Enhance — step indicator timeline (~40 lines changed) |

**Commit checkpoints:**

1. `feat(ai): wrap AI Ask conversation in PhoneFrame`
   - Update `page.tsx` layout to use `<PhoneFrame>` around chat

2. `feat(ai): add thinking-stream component for LLM reasoning chunks`
   - `thinking-stream.tsx` — renders thinking chunks with streaming animation
   - JetBrains Mono font for thinking text

3. `feat(ai): render citations as inline footnotes`
   - `citation-footnotes.tsx` — superscript numbers in message text, footnote details at bottom

4. `feat(ai): enhance tool-use indicator as visual step timeline`
   - Update `tool-use-indicator.tsx` to show tool calls as a vertical timeline with status

**Tests:**
- **Visual:** Chat messages render inside phone frame
- **Visual:** Thinking chunks stream with animation
- **Visual:** Citations show as superscript with footnote details
- **Regression:** Chat send, receive, conversation switch all work
- **Regression:** Debug page still works (not affected)

**Acceptance criteria:**
- [ ] Conversation renders inside `<PhoneFrame>`
- [ ] Thinking chunks display as a streaming component (not raw JSON)
- [ ] Citations render as inline footnotes
- [ ] Tool-use indicator shows a visual timeline
- [ ] Chat functionality works identically (send, receive, history)

**Risk level:** Medium — flagship surface, but SSE layer unchanged (PR 3)

---

### PR 14 — Small Surfaces: 403, Header, Sidebar Texture, Login Microcopy

**Goal:** Polish 4 small surfaces that add character without large effort.

**Scope:**
- **403 page:** Typographic statement — "Restricted." in Fraunces display, brand-color horizontal rule, "Return to Dashboard" link
- **Header cleanup:** Drop placeholder avatar, use initials-only. Drop unwired bell icon. Change "Admin Dashboard" to current page title
- **Sidebar texture:** Add 1px horizontal-line repeating pattern at 4% opacity (Habesha kemis inspired). Add 4px brand-color bar at section headers
- **Login microcopy:** Rewrite from corporate ("Secure Access for Administrators") to product voice ("Welcome back. The library is open.")

**Out of scope:**
- Sidebar navigation structure changes
- Header notification system

**Dependencies:** PR 2 (design tokens — Fraunces, brand color)

**Audit reference:** §14.3, §14.5, §14.6, §13.4

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/app/403/page.tsx` | Rebuild as typographic statement (~30 lines) |
| `src/components/layout/header.tsx` | Drop placeholder avatar, unwired bell, dynamic title (~20 lines changed) |
| `src/components/layout/sidebar.tsx` | Add texture background, brand-color section bars (~15 lines changed) |
| `src/app/globals.css` | Add sidebar texture utility (~10 lines) |
| `src/app/(auth)/auth/page.tsx` | Rewrite microcopy (~10 lines changed) |
| `src/app/(auth)/auth/_components/login-form.tsx` | Rewrite microcopy (~5 lines changed) |

**Commit checkpoints:**

1. `feat(403): rebuild as typographic statement`
   - Fraunces display "Restricted.", brand-color `<hr>`, "Return to Dashboard" link

2. `refactor(header): drop placeholder avatar, unwired bell, add dynamic page title`
   - Remove `/placeholder-avatar.jpg`, keep initials fallback
   - Remove bell icon (no notification logic)
   - Read page title from route config

3. `feat(sidebar): add Habesha kemis-inspired texture and brand-color section bars`
   - CSS: 1px horizontal-line repeating pattern at 4% opacity
   - 4px brand-color bar at section headers

4. `feat(auth): rewrite login microcopy from corporate to product voice`
   - "Secure Access for Administrators" → product-appropriate copy
   - "Welcome back" / "Sign in to your admin account" → product voice

**Tests:**
- **Visual:** 403 page shows Fraunces "Restricted." with brand-color rule
- **Visual:** Header shows initials avatar, no bell, current page title
- **Visual:** Sidebar has subtle line texture, brand-color section bars
- **Visual:** Login page has new microcopy

**Acceptance criteria:**
- [ ] 403 page is a typographic statement, not a plain page
- [ ] Header has no placeholder avatar image, no unwired bell icon
- [ ] Sidebar has subtle texture (not solid background)
- [ ] Login page copy is product voice, not corporate B2B

**Risk level:** Low — small, isolated surface changes

---

# Epic E — Visual Polish

---

### PR 15 — List Page Visual Variation + Page-Load Stagger Motion

**Goal:** Break the Card+Table monotony on 2–3 high-traffic surfaces. Add orchestrated page-load motion.

**Scope:**
- **Guide list:** Replace `<Table>` with card grid — each guide as a card with cover image, title, slug, step count, Edit button
- **Moderation queue:** Replace `<Table>` with vertical queue list — compact cards with status badge, reporter, content preview, View Details button
- **Page-load stagger:** Add framer-motion `staggerChildren` to list items across all list pages (40ms per item)

**Out of scope:**
- Guide detail page (PR 12)
- AI Ask page (PR 13)
- Dashboard (already has stagger)

**Dependencies:** PR 1 (skeletons), PR 2 (design tokens)

**Audit reference:** §11.1, §12.1

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/app/[locale]/(modules)/guide/page.tsx` | Rebuild as card grid (~100 lines changed) |
| `src/app/[locale]/(modules)/moderation/reported-content/page.tsx` | Rebuild as queue list (~80 lines changed) |
| `src/app/[locale]/(modules)/moderation/reported-users/page.tsx` | Rebuild as queue list (~80 lines changed) |
| `src/app/[locale]/(modules)/community/categories/page.tsx` | Add stagger motion (~10 lines) |
| `src/app/[locale]/(modules)/admin/admins/page.tsx` | Add stagger motion (~10 lines) |
| `src/app/[locale]/(modules)/notifications/campaigns/page.tsx` | Add stagger motion (~10 lines) |
| `src/app/[locale]/(modules)/notifications/campaign-templates/page.tsx` | Add stagger motion (~10 lines) |

**Commit checkpoints:**

1. `feat(guide): rebuild guide list as card grid`
   - Replace `<Table>` with `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
   - Each card: cover image, title (Fraunces), slug, step count, Edit/Delete buttons
   - Stagger animation on card mount

2. `feat(moderation): rebuild reported content/users as queue list`
   - Replace `<Table>` with `flex flex-col gap-3`
   - Each item: compact card with status badge, reporter name, content preview, View Details
   - Stagger animation on item mount

3. `feat(motion): add page-load stagger to remaining list pages`
   - Community categories, admin admins, notifications campaigns/templates
   - `staggerChildren: 0.04`, each item fades + slides from 8px below

**Tests:**
- **Visual:** Guide list shows card grid with cover images
- **Visual:** Moderation pages show queue list
- **Visual:** List items stagger in on page load
- **Regression:** Search, filter, pagination, delete all work on rebuilt pages

**Acceptance criteria:**
- [ ] Guide list is a card grid, not a table
- [ ] Moderation pages are queue lists, not tables
- [ ] 4+ list pages have stagger animation on load
- [ ] Search, filter, pagination work on all rebuilt pages

**Risk level:** Low — visual changes only, no logic changes

---

### PR 16 — Micro-Polish: Semantic Status Colors + ID Generation

**Goal:** Final polish pass — use semantic status colors consistently, standardize ID generation.

**Scope:**
- Replace `default`/`secondary`/`outline` badge variants with semantic colors (`--success`, `--warning`, `--info`) where appropriate
- Standardize ID generation: replace `Math.random().toString(36).slice(2, 9)` with `crypto.randomUUID()` everywhere

**Out of scope:**
- New status types
- UUID library introduction

**Dependencies:** PR 2 (design tokens)

**Audit reference:** §10.3, §7.2

**Files/modules likely touched:**

| File | Change |
|------|--------|
| `src/app/[locale]/(modules)/ai/knowledge-base/_components/sidebar-documents.tsx` | Already uses semantic colors — verify |
| `src/app/[locale]/(modules)/moderation/reported-content/page.tsx` | Replace badge variants with semantic colors |
| `src/app/[locale]/(modules)/moderation/reported-users/page.tsx` | Replace badge variants with semantic colors |
| `src/app/[locale]/(modules)/notifications/campaigns/page.tsx` | Replace inline badge styles with semantic tokens |
| `src/app/[locale]/(modules)/guide/_components/edit-step-form.tsx` | Replace `Math.random()` with `crypto.randomUUID()` (line 42-44) |
| Any other files using `Math.random()` for IDs | Standardize to `crypto.randomUUID()` |

**Commit checkpoints:**

1. `refactor(ui): use semantic status colors in badge variants`
   - Replace hardcoded badge classes with `--success`, `--warning`, `--info` tokens
   - Focus on moderation status badges and campaign status badges

2. `refactor: standardize ID generation to crypto.randomUUID()`
   - Replace `Math.random().toString(36).slice(2, 9)` in `edit-step-form.tsx`
   - Audit and fix any other `Math.random()` ID generation

**Tests:**
- **Visual:** Status badges use semantic colors (green for resolved, yellow for pending, etc.)
- **Regression:** Step creation still generates unique IDs

**Acceptance criteria:**
- [ ] Status badges use semantic color tokens, not hardcoded classes
- [ ] Zero `Math.random()` calls for ID generation
- [ ] `crypto.randomUUID()` is the single ID generation strategy

**Risk level:** Low — cosmetic changes

---

## 4. Recommended Order

```
Epic A — Foundation
  PR 1 (Foundation) ──→ PR 2 (Design System) ──→ PR 4 (Inline Error Rollout)
  PR 3 (SSE Infrastructure) ──→ (independent)

Epic B — Architecture Deepening
  PR 5 (Moderation Hooks) ──→ (independent)
  PR 6 (Storage Upload) ──→ (independent)
  PR 7 (UserCapabilities) ──→ (independent)
  PR 8 (Guide Editor) ──→ (independent)
  PR 9 (Query Keys + Toasts) ──→ depends on PR 4, PR 5

Epic C — Next.js Compliance
  PR 10 (Housekeeping) ──→ (independent)
  PR 11 (RSC Pilot) ──→ depends on PR 7, PR 10

Epic D — Surface Rebuilds
  PR 12 (PhoneFrame + Guide Detail) ──→ depends on PR 1, PR 2
  PR 13 (AI Ask Rebuild) ──→ depends on PR 3, PR 12
  PR 14 (Small Surfaces) ──→ depends on PR 2

Epic E — Visual Polish
  PR 15 (List Variation + Motion) ──→ depends on PR 1, PR 2
  PR 16 (Micro-Polish) ──→ depends on PR 2
```

### Merge sequence (recommended)

| Order | PR | Epic | Rationale |
|-------|-----|------|-----------|
| 1 | PR 1 — Foundation | A | Error boundaries must exist before everything |
| 2 | PR 2 — Design System | A | Reskins the app; all subsequent work uses these tokens |
| 3 | PR 3 — SSE Infrastructure | A | Independent, high-leverage, fixes concurrency bug |
| 4 | PR 10 — Housekeeping | C | Clean slate before deeper work |
| 5 | PR 4 — Inline Error Rollout | A | Uses PR 1 + PR 2 components |
| 6 | PR 5 — Moderation Hooks | B | Quick architectural win |
| 7 | PR 6 — Storage Upload | B | Independent seam |
| 8 | PR 7 — UserCapabilities | B | Unifies auth before RSC pilot |
| 9 | PR 8 — Guide Editor | B | Isolates orchestration before surface rebuild |
| 10 | PR 9 — Query Keys + Toasts | B | Cross-cutting, after individual hook refactors |
| 11 | PR 12 — PhoneFrame + Guide Detail | D | Highest-impact surface, uses all foundation work |
| 12 | PR 14 — Small Surfaces | D | Quick polish batch |
| 13 | PR 13 — AI Ask Rebuild | D | Flagship surface, after SSE + PhoneFrame |
| 14 | PR 15 — List Variation + Motion | E | Visual polish |
| 15 | PR 16 — Micro-Polish | E | Final pass |
| 16 | PR 11 — RSC Pilot | C | Last — establishes new pattern for future epic |

---

## 5. Test Strategy Across the Full Epic

| Test Type | Epic A | Epic B | Epic C | Epic D | Epic E |
|-----------|--------|--------|--------|--------|--------|
| Unit (components) | ModuleError, InlineError, Skeleton, EmptyState | Moderation factory, StorageUploader, UserCapabilities, guide mapper | serverFetch | PhoneFrame | — |
| Unit (infra) | SseClient (connect, parse, backoff, 401, coalescing, abort) | Query key factory | — | — | — |
| Integration | error.tsx catches thrown errors | Hook factory across 3 types | Server page → client component props | — | — |
| Visual regression | — | — | — | Editorial layout, phone frame | Semantic colors, card grid |
| Build regression | Suspense warnings gone | — | next/image, dead code gone | — | — |
| Manual E2E | Auth, guide, moderation | Moderation CRUD, upload, permissions | Admin list, roles | Guide detail, AI chat | List pages, 403, header |

---

## 6. Audit Coverage Matrix

Every finding from `docs/audit/full-audit.md` mapped to a PR:

| Audit Section | Finding | PR | Status |
|---------------|---------|-----|--------|
| §1.1 | Moderation hooks 3-way duplication | PR 5 | Planned |
| §1.2 | SSE 3-way duplication + 401 race | PR 3 | Planned |
| §1.3 | Storage upload duplication | PR 6 | Planned |
| §1.4 | 401 re-auth scattered | PR 3 | Subsumed |
| §1.5 | Auth/capabilities split across 4 files | PR 7 | Planned |
| §1.6 | Guide editor orchestration | PR 8 | Planned |
| §2.1 | Query key fragmentation | PR 9 | Planned |
| §2.2 | Error toast inconsistency | PR 9 | Planned |
| §2.3 | redirect() anti-pattern | PR 7 | Planned |
| §3.2 | No error.tsx/loading.tsx/not-found.tsx | PR 1 | Planned |
| §3.4 | useParams in detail pages | PR 11 | Deferred (RSC migration) |
| §3.5 | No route.ts handlers | — | Deferred (future epic) |
| §3.6 | Dead file pollution (campaigns) | PR 10 | Planned |
| §4.1 | Every page is client component | PR 11 | Pilot (2–3 pages) |
| §6.1 | useSearchParams without Suspense | PR 1 | Planned |
| §6.2 | No error.tsx boundaries | PR 1 | Planned |
| §6.3 | Dashboard Suspense over-applied | — | Deferred (cosmetic) |
| §7.2 | Math.random() vs crypto.randomUUID() | PR 16 | Planned |
| §7.4 | `<img>` instead of `<next/image>` | PR 10 | Planned |
| §8.2 | axios unused in package.json | PR 10 | Planned |
| §8.3 | No lint/typecheck scripts | PR 10 | Planned |
| §9.2 | Editorial-typographic direction | PR 2 | Planned (hybrid) |
| §10.1 | Inter only — no typographic personality | PR 2 | Planned |
| §10.2 | Neutral-on-neutral palette | PR 2 | Planned |
| §10.3 | Status colors underused | PR 16 | Planned |
| §11.1 | Universal Card+Table pattern | PR 15 | Planned (2–3 surfaces) |
| §11.2 | Guide detail page weakest moment | PR 12 | Planned |
| §11.3 | empty-state.tsx is dead | PR 1 | Planned |
| §12.1 | framer-motion vocabulary timid | PR 15 | Planned |
| §13.1 | All loading states are inline text | PR 1 | Planned |
| §13.2 | All error states are backend strings | PR 1 + PR 4 | Planned |
| §13.3 | All empty states are one line | PR 1 | Planned |
| §13.4 | Login microcopy is corporate | PR 14 | Planned |
| §14.1 | Guide detail page rebuild | PR 12 | Planned |
| §14.2 | AI Ask page rebuild | PR 13 | Planned |
| §14.3 | 403 page typographic statement | PR 14 | Planned |
| §14.4 | PhoneFrame as reusable component | PR 12 | Planned |
| §14.5 | Header cleanup | PR 14 | Planned |
| §14.6 | Sidebar texture | PR 14 | Planned |

### Deferred to future epics

| Finding | Rationale |
|---------|-----------|
| §3.5 No route.ts / Server Actions | Requires backend coordination, separate epic |
| §4.1 Full RSC migration (47 pages) | PR 11 is a pilot; full rollout is a separate epic |
| §6.3 Dashboard Suspense over-applied | Cosmetic, no user impact |

---

## 7. Open Questions Remaining

None. The audit document (`docs/audit/full-audit.md`) has all file:line references needed for implementation.
