# Full Audit — Architecture, Next.js, and Frontend Design

**Date:** June 2026
**Project:** Adisu Serategna Admin Panel
**Scope:** Codebase architecture, Next.js compliance, and frontend design quality

---

## Table of Contents

1. [Architecture — Deepening Opportunities](#1-architecture--deepening-opportunities)
2. [Architecture — Cross-Cutting Concerns](#2-architecture--cross-cutting-concerns)
3. [Next.js — File Conventions & Routing](#3-nextjs--file-conventions--routing)
4. [Next.js — RSC Boundaries & Data Flow](#4-nextjs--rsc-boundaries--data-flow)
5. [Next.js — Async API Hygiene](#5-nextjs--async-api-hygiene)
6. [Next.js — Suspense & Error Handling](#6-nextjs--suspense--error-handling)
7. [Next.js — Hydration Risks](#7-nextjs--hydration-risks)
8. [Next.js — Build, Config & Dependencies](#8-nextjs--build-config--dependencies)
9. [Frontend Design — Aesthetic Direction](#9-frontend-design--aesthetic-direction)
10. [Frontend Design — Typography & Color](#10-frontend-design--typography--color)
11. [Frontend Design — Layout & Component Patterns](#11-frontend-design--layout--component-patterns)
12. [Frontend Design — Motion & Atmosphere](#12-frontend-design--motion--atmosphere)
13. [Frontend Design — Empty States & Microcopy](#13-frontend-design--empty-states--microcopy)
14. [Frontend Design — Specific Surface Opportunities](#14-frontend-design--specific-surface-opportunities)
15. [Synthesis — Recommended Implementation Order](#15-synthesis--recommended-implementation-order)

---

## 1. Architecture — Deepening Opportunities

### 1.1 [HIGH] Moderation Report Hooks — 3-Way Duplicated CRUD

**Files:**
- `src/app/[locale]/(modules)/moderation/_services/post-reports.hook.ts` (77 lines)
- `src/app/[locale]/(modules)/moderation/_services/thread-reports.hook.ts` (77 lines)
- `src/app/[locale]/(modules)/moderation/_services/user-reports.hook.ts` (85 lines)

**Problem:** Three hook files are 90% identical. The only variance is:
- The Orval function name (`adminListPostReports` vs `adminListThreadReports` vs `adminListUserReports`)
- The DTO type (`ListPostReportsResponseBody` vs `ListThreadReportsResponseBody` vs `ListUserReportsResponseBody`)
- The query-key namespace (`"posts"` vs `"threads"` vs `"users"`)

The `if (res.status !== 200) throw res.data` pattern is repeated 3×3 = 9 times. The `onSuccess: invalidateQueries` pattern is repeated 3×3 = 9 times. Each file has the same structure: `useAdminList*Reports`, `useAdminGet*Report`, `useAdminDelete*Report*`, `useAdminUpdate*ReportStatus`.

**Consumer:** `src/app/[locale]/(modules)/moderation/_components/report-detail-page.tsx:172-188` already calls all three hook sets unconditionally because of React's rules-of-hooks. The component has no way to conditionally use a hook — the component is already unified, but the hook layer is not.

**Deletion test:** Deleting any 2 of the 3 files would concentrate ~150 lines of redundancy and force type variance into one place. The complexity vanishes.

**Solution:** One `useModerationReport` hook factory parameterised by report type. Behind the seam: one Orval adapter map `{ post: adminListPostReports, thread: adminListThreadReports, ... }` that maps the discriminant to the concrete API function and types.

**Leverage:** Adding pagination semantics, optimistic updates, error-to-toast wiring, or query-key invalidation happens once, not in three files.

**Locality:** A change to "what happens when a moderator resolves a report" happens in one place.

**Testability:** Zero tests exist today. One hook tested across three parametrised cases.

---

### 1.2 [HIGH] SSE Streaming Infrastructure — 3-Way Duplicated Client

**Files:**
- `src/app/[locale]/(modules)/ai/ask/_services/ask.hook.ts:38-99, 229-389`
- `src/app/[locale]/(modules)/ai/knowledge-base/_services/ai.hook.ts:45-89, 182-354`
- `src/app/[locale]/(modules)/notifications/_services/campaign-sse.hook.ts:27-79, 108-208`

**Duplicated primitives (exact character-for-character copies):**
- `sseReconnectDelayMs` — exponential backoff formula identical in all 3 files
- `waitForReconnect` — abort-aware setTimeout promise identical in all 3 files
- `parseSSEChunk` — SSE line parser identical in all 3 files
- `fetchSseWithAuth` — 401 → refresh → retry → logout identical in 2 files (`ask.hook.ts:58-82`, `ai.hook.ts:65-89`)

**What differs per site:**
- The URL construction (each has its own `get*SseUrl` function)
- The event-name → handler mapping
- The query-cache update strategy (each file manages its own `QUERY_KEYS`)

**Bug in the duplicated code:** The 401 refresh logic in `ask.hook.ts:58-82` and `ai.hook.ts:65-89` does not coalesce concurrent refresh calls. The `custom-fetch.ts:140` version uses a `refreshPromise` singleton, but the SSE copies do not. If two SSE connections receive 401 simultaneously, both fire `refreshToken()` independently — a race condition.

**Deletion test:** If you deleted one of the three copies, the same ~200 lines would still exist in the other two. The infrastructure is being copied, not adapted.

**Solution:** One `SseClient` module that owns: connect, 401 re-auth, exponential backoff, parse, dispatch, abort, and refresh coalescing. Callers provide: URL, headers, and an `onEvent(eventName, payload)` handler.

**Leverage:** New SSE endpoints become a 10-line hook. The 401 race condition is solved once.

**Locality:** The "is the stream healthy?" rule lives in one place. Today, fixing a reconnect bug means hunting across three files.

**Testability:** The existing `ask.hook.test.tsx` (185 lines) mocks `fetch` globally. After deepening, the `SseClient` itself is testable — one fast unit test covers all three sites' wire behaviour.

---

### 1.3 [HIGH] Storage Upload Pipeline — Duplicated SeaweedFS Orchestration

**Files:**
- `src/app/[locale]/(modules)/ai/knowledge-base/_services/ai.hook.ts:434-486` (`useUploadDocument`: SHA-256 → intent → upload → finalize)
- `src/app/[locale]/(modules)/library/_services/library.hook.ts:251-303` (`useCreateTemplate`: intent → upload → create)
- `src/app/[locale]/(modules)/library/_services/library.hook.ts:305-338` (`useUpdateTemplate`: FormData build)

**The pattern (both sites):**
1. Get a presigned upload intent from the API
2. `fetch(intent.uploadUrl, { method: intent.method, body: file, headers: intent.headers })`
3. Finalize/create a record with the `fileKey` from the intent

**What varies:**
- `useUploadDocument` computes SHA-256 checksum inline (`ai.hook.ts:441-445`)
- `useUploadDocument` uses `createIngestionUploadIntent` → `finalizeIngestionUpload`
- `useCreateTemplate` uses `libraryCreateTemplateUploadIntent` → `libraryCreateTemplate`
- Metadata shapes are different (sectorIds/tagIds vs title/language/description)

**Deletion test:** If you deleted one of the two pipelines, you'd write the same code back. The pattern is a transport protocol that reappears whenever storage meets UI.

**Solution:** One `StorageUploader` module exposing `upload(file, { kind, metadata }) → record`. Behind the seam: hash computation, intent + presigned `fetch` + finalize, error translation, idempotency-key generation.

**Leverage:** Adding chunked uploads, retry, virus-scan hooks, or progress events happens in one module.

**Locality:** SHA-256 + intent + fetch + finalize + idempotencyKey are all one concept. Today, knowing how document upload works means opening two hook files side-by-side.

---

### 1.4 [MEDIUM] 401 Re-Auth Logic — Scattered Across Fetch and Two SSE Clients

**Files:**
- `src/lib/api/mutator/custom-fetch.ts:139-165, 167-210` (refresh + 401 retry for normal requests)
- `src/app/[locale]/(modules)/ai/ask/_services/ask.hook.ts:58-82` (`fetchSseWithAuth` for SSE)
- `src/app/[locale]/(modules)/ai/knowledge-base/_services/ai.hook.ts:65-89` (`fetchSseWithAuth` for SSE)

**Problem:** The "401 → call refresh → retry once → logout" dance is implemented three times. `custom-fetch.ts` does it for normal requests; the two SSE hooks each re-implement it because they cannot go through `customFetch` (SSE responses cannot be wrapped in `buildResponse`). All three reach into `useAuthStore.getState()` and `document.cookie` directly.

The "one refresh-in-flight" guarantee (`custom-fetch.ts:140` `refreshPromise` singleton) is unique to the normal-fetch path. The SSE paths can race.

**Solution:** One `AuthedFetch` module exporting `authedFetch(url, init) → Response` (with 401 retry + refresh) and `logoutAndRedirect()`. The three sites become one-liners.

**Leverage:** The concurrency bug (two SSE connections both firing refresh) is fixed. The logout-on-failure redirect lives in one place.

---

### 1.5 [MEDIUM] Auth/Capabilities Lookup — Split Across 4 Files

**Files:**
- `src/store/auth.store.ts:5-25` (state shape: roles, permissions as parallel arrays)
- `src/lib/permissions.ts:7-29` (synchronous `hasPermission` reading the store)
- `src/lib/route-permissions.ts:1-14` (route-prefix → required-permission map)
- `src/components/auth/permission-guard.tsx:10-34` (client guard calling `hasPermission`)
- `src/components/layout/sidebar.tsx:236-243` (sidebar filter calling `hasPermission`)
- `src/app/[locale]/(modules)/admin/_services/permissions.hook.ts:1-14` (just a `useQuery` for the permission catalog)

**Problem:** "What is this user allowed to do?" is split into a state container, a lookup function, a route map, a UI guard, and a UI filter. The `roles` and `permissions` are stored as parallel arrays — the relationship between "user has role X" and "role X grants permission Y" lives in the backend. The `super_admin` bypass is hardcoded into `permissions.ts:13`. There is no single `UserCapabilities` module.

The admin layout (`admin/layout.tsx:35-39`) duplicates the permission check: it does its own `useEffect` + `router.replace("/403")` if `iam.admin.list` is missing — three files encode the same concept of "what routes need what permission."

**Deletion test:** Deleting `route-permissions.ts` would force `permission-guard.tsx` to be the single source of routing knowledge; deleting `permissions.ts` would force every guard/filter to read the store directly.

**Solution:** One `UserCapabilities` module whose interface is `can(permission)`, `canAny(...)`, `canAll(...)`, and `requiredForRoute(path)`. Behind the seam: store read, role bypass, route map, and the persisted permission catalog.

**Leverage:** Adding "can the current user *write* a Guide in sector X?" (a resource-scoped check) is one place. Adding audit logging is one place.

---

### 1.6 [MEDIUM] Guide Editor Page — Page Is Doing Orchestration

**Files:**
- `src/app/[locale]/(modules)/guide/[id]/edit/page.tsx:30-143, 147-315` (390 lines)
- `src/app/[locale]/(modules)/guide/_stores/edit-guide.store.ts:1-106`
- `src/app/[locale]/(modules)/guide/_components/edit-step-form.tsx:42-81, 118-132` (imperative store pokes)

**Problem:** The edit page coordinates: URL ↔ active-step binding, store seeding from server data, payload mapping (`mapApiToEditorSteps`, `buildCreatePayload`, `buildUpdatePayload`), save/delete/reorder handlers, and toast surface. The form component also pokes the store via `editGuideStore.getState()` (lines 50, 70, 75, 80). Three modules (page, store, form) all know the invariants of "what is a step, and what does it look like persisted vs. draft?" — but no one owns that concept.

The "persist-once-on-language-change" invariant is spread across `seededRef` (a `useRef`), a `useEffect`, and the `language` dependency. The `guide/[id]/edit/page.tsx` also has `mapApiToEditorSteps` (lines 30-72) and `buildCreatePayload`/`buildUpdatePayload` (lines 104-143) as standalone functions in the page — they belong in a module.

**Solution:** A `useGuideEditor(guideId)` hook that owns: the store, the URL ↔ active-step binding, the persist-once seed rule, the save/delete/reorder handlers, and the toast surface.

**Leverage:** Testing "what happens when a save succeeds and the URL has `?step=new`" without rendering a 390-line page.

---

## 2. Architecture — Cross-Cutting Concerns

### 2.1 Query Key Strategy — Fragmented

**Files:** Every `_services/*.hook.ts` file has its own `KEYS` or `QUERY_KEYS` constant.

- `moderation/_services/query-keys.ts`: `BLOCKED_QUERY_KEY`, `REPORTS_QUERY_KEY`
- `ai/ask/_services/ask.hook.ts:100-109`: `QUERY_KEYS` object
- `ai/knowledge-base/_services/ai.hook.ts:37-42`: `QUERY_KEYS` object
- `guide/_services/guide.hook.ts:39-46`: `KEYS` object
- `library/_services/library.hook.ts:52-59`: `KEYS` object
- `admin/_services/query-keys.ts`: `ADMIN_QUERY_KEY`, `PERMISSION_QUERY_KEY`
- `notifications/_services/notification.hook.ts`: `CAMPAIGN_TEMPLATES_KEY`, `CAMPAIGNS_KEY`, etc.
- `community/_services/community.hook.ts`: `CATEGORIES_KEY`

**Problem:** Each module invents its own key convention (some use objects, some use arrays, some use `as const`). The invalidation pattern is inconsistent: some modules use `queryClient.invalidateQueries({ queryKey: KEYS.all })` (coarse), others use specific keys. This is the root of the "150 matches for queryKey across the codebase" finding — there is no central registry.

**Solution (deferred):** Not a deepening on its own, but worth noting that any architectural deepen should choose a consistent key convention and apply it.

---

### 2.2 Error Toast Wiring — Inconsistent

**Files:**
- `admin/_services/admin-management.hook.ts:39, 54, 70`: uses `toast.error(getErrorMessage(err))` inside `onError`
- `moderation/_services/post-reports.hook.ts`, `thread-reports.hook.ts`, `user-reports.hook.ts`: no toasts — errors surface via `error` state on the mutation
- `guide/[id]/edit/page.tsx:264, 296, 314`: uses `toast.error(...)` inline in the page
- `ai/ask/_components/chat-panel.tsx`: uses `toast.promise(...)` via the component

**Problem:** Some hooks toast on error, others don't. Some pages toast on error, others rely on the hook's `error` property. There is no consistent rule for "who owns error presentation."

---

### 2.3 The `redirect()` Inside Try-Catch Anti-Pattern

**Files:**
- `src/components/auth/permission-guard.tsx:27-29`: uses `router.replace()` (client-side navigation) inside a `useEffect`
- `src/app/[locale]/(modules)/admin/layout.tsx:35-39`: uses `router.replace("/403")` inside a `useEffect`
- `src/app/(auth)/auth/_services/auth.service.ts:124-132`: `logoutAndRedirect` uses `window.location.href = "/auth"` (hard navigation)

**Problem:** Three different redirect strategies for the same concept ("user is not allowed here"). The right Next.js primitive is `redirect()` (server) or `forbidden()` (Next 15+), not `useEffect` + `router.replace`.

---

## 3. Next.js — File Conventions & Routing

### 3.1 [OK] Proxy/middleware is correctly named

- `src/proxy.ts` exists at `src/` level. For the current Next.js version this is correct (Next supports `src/proxy.ts`). The `proxy()` export name and `config` matcher are correct.

### 3.2 [ISSUE] No error.tsx / loading.tsx / not-found.tsx / global-error.tsx

`find src/app -name "loading.tsx" -o -name "error.tsx" -o -name "not-found.tsx" -o -name "global-error.tsx"` returns zero results.

The `[locale]/layout.tsx:15-16` calls `notFound()` (the Next.js function) when locale is invalid, but there is no `not-found.tsx` at any level to catch it. An unhandled error in any child component will escape the framework entirely.

**Impact:** Errors in any module (Guide, AI, Moderation) produce a white screen with no recovery affordance. A thrown error in the AI streaming hook, for example, would crash the entire admin layout.

---

### 3.3 [OK] Async params typed as Promise<...>

Three detail pages correctly type `params` as `Promise<{ id: string }>`:
- `src/app/[locale]/(modules)/moderation/reported-content/post/[id]/page.tsx:5`
- `src/app/[locale]/(modules)/moderation/reported-content/thread/[id]/page.tsx:5`
- `src/app/[locale]/(modules)/moderation/reported-users/[id]/page.tsx:5`

These pass `params` (a Promise) to `ReportDetailPage`, which calls `use(params)` at `report-detail-page.tsx:168`. This is the correct Next.js 15+ pattern.

---

### 3.4 [ISSUE] The `useParams` in detail pages that don't use async params

Several pages use `useParams` instead of receiving async params from the server:
- `src/app/[locale]/(modules)/guide/[id]/page.tsx:47`: `const { id } = useParams<{ id: string }>()`
- `src/app/[locale]/(modules)/guide/[id]/edit/page.tsx:148`: `const { id } = useParams<{ id: string }>()`
- `src/app/[locale]/(modules)/notifications/campaigns/[id]/page.tsx:551`: `const params = useParams()`

These are client components, so `useParams` is correct — but they forgo the server-side data-fetching opportunity.

---

### 3.5 [ISSUE] No route.ts handlers

`find src/app -name "route.ts"` returns zero. Every request goes through the proxy rewrite (`/api/*` → backend). No server-side proxying, no local API endpoints, no Server Actions (`rg 'use server' src/` returns zero).

Trade-off: no `revalidatePath`/`revalidateTag` possible. Every list page must re-implement its own invalidation strategy — which is what produces the duplicated `invalidateQueries` patterns across all hooks.

---

### 3.6 [ISSUE] Dead file pollution

`src/app/[locale]/(modules)/notifications/campaigns/[id]/page.tsx` is 802 lines, with lines 1-546 being commented-out code and a new implementation starting at line 548. The file has two `"use client"` directives (lines 1 and 548, the second real).

---

## 4. Next.js — RSC Boundaries & Data Flow

### 4.1 [ISSUE] Every page is a client component

47 of 74 files using `"use client"` are `page.tsx` files. The entire Orval-generated API client + `customFetch` (which reads `useAuthStore`) runs only in the browser. The full `lib/api/services/*` directory is shipped to the client.

The two places where Server Components are used correctly:
- `src/app/[locale]/layout.tsx:6-25` (async server component awaiting `params`, calling `getMessages()`)
- `src/app/page.tsx:3-5` (server `redirect()`)

Every other page (Guide, AI, Moderation, Library, Admin, Taxonomy, Community, Notifications, Dashboard) is `"use client"` with `useQuery` for data fetching.

**Trade-off:** The app works, but you forfeit Server-Component data fetching, request memoisation, and a smaller JS bundle.

---

### 4.2 [ISSUE] No async client components (correct)

The audit found no `"use client"` + `async function` combinations. All async components are server components. This is correct per the RSC spec.

---

### 4.3 [ISSUE] Non-serializable props not detected

The `guide/[id]/page.tsx` passes `new Date(...)` comparisons inside component render (lines 170, 285) but does not pass Date objects as props to child client components. No RSC violation found, but the pattern is fragile — moving these pages to server components would break immediately.

---

## 5. Next.js — Async API Hygiene

### 5.1 [OK] cookies() / headers() not used directly

The auth cookie is read in `src/proxy.ts:12-16` (Edge runtime, fine) and written in `src/lib/api/mutator/custom-fetch.ts:86-87` and `src/app/(auth)/auth/_services/auth.service.ts:22`. None of the layouts or pages call `cookies()` directly, which avoids the async-cookies migration concern.

---

### 5.2 [OK] Layout async params

`src/app/[locale]/layout.tsx:6-25` correctly types `params` as `Promise<{ locale: string }>`, awaits it, and calls `notFound()` for invalid locales. This is the correct Next.js 15+ pattern.

---

## 6. Next.js — Suspense & Error Handling

### 6.1 [HIGH] useSearchParams in dynamic routes without Suspense

The following pages use `useSearchParams()` in pages that live under the dynamic `[locale]` segment — the precise condition that causes a CSR bailout without a Suspense boundary:

| Page | Line |
|------|------|
| `moderation/reported-content/page.tsx` | `useSearchParams` at line 2 |
| `moderation/reported-users/page.tsx` | `useSearchParams` at line 2 |
| `notifications/campaign-templates/page.tsx` | uses `useSearchParams` |
| `notifications/campaigns/page.tsx` | uses `useSearchParams` |
| `guide/page.tsx` | `useSearchParams` at line 5 |
| `guide/[id]/edit/page.tsx` | `useSearchParams` at line 5 |
| `admin/layout.tsx` | `usePathname` at line 32 |
| `taxonomy/layout.tsx` | `usePathname` at line 5 |

Per the Next.js docs: `useSearchParams()` in static routes requires a Suspense boundary. Without it, the entire page becomes client-side rendered. In dynamic routes (like `[locale]`), `usePathname()` also requires Suspense.

**None of these pages have a Suspense wrapper.** The entire admin tree CSR-bails on every navigation.

**Exception:** `src/app/[locale]/(modules)/dashboard/page.tsx:73-94` wraps children in `<Suspense>`, but none of those children use `useSearchParams` or `usePathname` in dynamic routes — the Suspense is applied where not needed, and omitted where it is needed.

---

### 6.2 [HIGH] No error.tsx boundaries anywhere

Zero `error.tsx` files exist. An unhandled error in any component will escape the framework and produce a white screen.

**Recommended locations:**
- `src/app/[locale]/(modules)/layout.tsx` → wraps all admin modules
- `src/app/layout.tsx` → global error boundary

---

### 6.3 [LOW] Dashboard Suspense is over-applied

`src/app/[locale]/(modules)/dashboard/page.tsx:73-94` wraps every child in `<Suspense>`. The children (`StatCards`, `UserGrowthChart`, `AIUsageChart`, `SystemHealth`, `RecentLogs`) use `useQuery` (React Query) — which does not require Suspense. The Suspense fallbacks are custom skeletons (lines 98-110), which is good UX, but the Suspense itself is not required by the framework.

---

## 7. Next.js — Hydration Risks

### 7.1 [OK] Date rendering in client components

`new Date().toLocaleString()` and `.toLocaleDateString()` appear in 17+ call sites (e.g., `moderation/reported-content/page.tsx:209`, `reported-users/page.tsx:170`, `report-detail-page.tsx:285`, `sidebar-documents.tsx:206`). All are inside `"use client"` components, so server-rendered HTML and client first-paint match. No hydration risk today.

**Risk:** Moving any of these to a server component would break immediately.

---

### 7.2 [OK] Math.random() for ID generation — client-only

`src/app/[locale]/(modules)/guide/_components/edit-step-form.tsx:42-44` uses `Math.random().toString(36).slice(2, 9)` in `generateId()`. Called from `onClick` handlers in a client component — only runs after hydration. Safe.

Note: `crypto.randomUUID()` is used elsewhere (`ai/hook.ts:468`, `ai/ask/_components/chat-panel.tsx`). Two ID-generation strategies for the same concept.

---

### 7.3 [OK] Theme hydration guard

`src/components/layout/sidebar.tsx:60-66` uses `useState(false)` + `useEffect(() => setMounted(true), [])` for theme. The root layout sets `suppressHydrationWarning` on `<html>` and `<body>` (`src/app/layout.tsx:33,36`). Standard pattern, correct.

---

### 7.4 [ISSUE] <img> instead of <next/image>

Three call sites use raw `<img>` tags for external URLs:
- `src/app/[locale]/(modules)/guide/[id]/page.tsx` (cover image preview, line 203)
- `src/app/[locale]/(modules)/guide/_components/edit-step-form.tsx:330`
- `src/app/[locale]/(modules)/guide/_components/mobile-preview.tsx:88`

The `next.config.ts` has no `images.remotePatterns` configured. Adding `<next/image>` would require adding the pattern.

---

## 8. Next.js — Build, Config & Dependencies

### 8.1 [OK] next.config.ts is minimal

`next.config.ts:1-9`: one `async rewrites()` pointing `/api/*` to the backend. No `images.remotePatterns`, no `experimental.*`, no Cache Components. The `'use cache'` directive is opt-in via `cacheComponents: true` and is not enabled.

---

### 8.2 [ISSUE] axios in package.json but never imported

`rg "axios" src/` returns zero results. The Orval config uses `fetch` as the HTTP client. The unused dep is dead weight.

---

### 8.3 [ISSUE] No lint or typecheck scripts in package.json

`package.json` scripts: `dev`, `build`, `start`, `prepare`, `generate:api`, `test`. No `lint`, no `typecheck`. The project uses biome (`.biomeignore` + `biome.json` exist), and `lint-staged` runs `biome check --write` on pre-commit, but there is no `biome` or `lint` script to run manually.

---

### 8.4 [OK] next-intl plugin is correctly configured

`next.config.ts:4-5`: `createNextIntlPlugin("./src/i18n/request.ts")` wraps the config. The `[locale]/layout.tsx` correctly awaits `getMessages()` and passes `messages` to `NextIntlClientProvider`. This is the correct pattern.

---

## 9. Frontend Design — Aesthetic Direction

### 9.1 Current state

The project is a shadcn-based admin panel with:
- **Typeface:** Inter (body + headings) + JetBrains Mono (mono) — loaded via `next/font/google` at `src/app/layout.tsx:9-17`
- **Palette:** OKLCH neutral base (240° hue family) with indigo primary (`oklch(0.4 0.2 260)`)
- **Layout:** Universal Card + Table pattern for all 14+ list pages
- **Motion:** framer-motion used for page transitions (`AnimatedMain`), login form stagger, and auth card slide
- **Decorative:** Glow orbs in `(modules)/layout.tsx:12-13`, dot grid on auth page (`auth/page.tsx:35-41`)

### 9.2 Recommended direction: Editorial-Typographic + Warm-Dominant + Phone-Frame Motif

**Tone:** editorial-magazine, not dashboard. The Guide product is a *library* — its admin surface should look like an editor working in the back office of a publication, not a CRUD grid.

**Brand color:** A single dominant warm hue (e.g. deep terracotta `oklch(0.45 0.16 45)` or saturated amber for "Adisu"/light), with cream/off-white surfaces and dark indigo only for text and the most important interactive element. One accent (saturated lime or magenta) used <5% of the time.

**Type:** Drop Inter. Pair `Fraunces` (display serif, optical sizing) for page titles + chapter headings + page hero with `Geist` (sans body). Keep `JetBrains Mono` for the AI thinking/tool-call stream and admin debug view.

**Atmosphere:** A single repeating fine horizontal-line texture (inspired by Habesha kemis woven border, reduced to 1px lines at 4-6% opacity) as the sidebar background, auth panel background, and section dividers. Plus a paper-grain noise overlay at 1-2% on long-form surfaces.

**Phone-frame motif:** The faked bezel in `mobile-preview.tsx` is the project's strongest asset. Use it on:
- Guide detail page hero (large phone showing cover image + first step)
- AI Ask panel (phone frame around conversation)
- Moderation case detail (phone frame around reported content)

---

## 10. Frontend Design — Typography & Color

### 10.1 [HIGH] Inter is the only typeface — zero typographic personality

`src/app/layout.tsx:9-17` loads Inter + JetBrains Mono. `src/app/globals.css:139` sets `--font-heading: var(--font-inter)`. Every heading, body, label, and button is Inter. The product has zero typographic distinction.

**Fix:** Replace Inter with `Fraunces` (display) + `Geist` (body). Add `--font-display` token to `globals.css`. Use Fraunces for: page titles, card titles, hero headings, section headers, the auth page headline. Use Geist for: body, labels, form inputs, table text, descriptions.

---

### 10.2 [HIGH] Neutral-on-neutral palette with one blue

`src/app/globals.css:7-91`: 60+ OKLCH stops, all in 240-260° hue range (cool grey-blue). `primary` at `oklch(0.4 0.2 260)` (indigo). Every screen is "neutrals + one blue button." The five chart stops are all mid-saturation in the same family.

**Fix:** Introduce a brand-color token (`--brand` warm, `--accent` saturated) and a paper/noise utility. Rewrite `auth-gradient-from/to` and `primary` in OKLCH around a non-indigo hue. Use the brand color on: sidebar active state, primary buttons, the guide hero, the auth left panel gradient. Keep indigo only for text (foreground).

---

### 10.3 [OK] Status colors are well-defined

`globals.css:88-90` (light) and `globals.css:88-90` (dark) define `--success`, `--warning`, `--info` tokens. These are used in the knowledge-base sidebar (stage badges) and the mobile preview. The tokens exist; the issue is that they are underused — most pages rely on `default`/`secondary`/`outline` badge variants instead of semantic colors.

---

## 11. Frontend Design — Layout & Component Patterns

### 11.1 [HIGH] Universal Card + Table pattern — 14+ identical list pages

All list pages follow the same visual structure:
```
<Card>
  <CardHeader className="border-b">
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent>
    [search/filter row]
    <Table>...</Table>
    <PaginationBar />
  </CardContent>
</Card>
```

Affected pages:
- `moderation/reported-users/page.tsx:74-205`
- `moderation/reported-content/page.tsx:80-246`
- `moderation/blocked-users/page.tsx:40-147`
- `community/categories/page.tsx`
- `guide/page.tsx:70-183`
- `taxonomy/sectors/page.tsx`
- `taxonomy/tags/page.tsx`
- `library/categories/page.tsx`
- `library/template-groups/page.tsx`
- `library/downloads/page.tsx`
- `notifications/campaigns/page.tsx`
- `notifications/campaign-templates/page.tsx`
- `notifications/queue/page.tsx`
- `admin/admins/page.tsx`
- `admin/roles/page.tsx`

**Fix:** Introduce visual variation per module. The Guide list could use a card-grid layout (guide cards with cover images, like a bookshelf). The AI knowledge base already has a sidebar pattern. Moderation pages could use a kanban/queue pattern. The point is not to redesign every page — it is to break the Card+Table monotony on 2-3 high-traffic surfaces.

---

### 11.2 [MEDIUM] The guide detail page is the weakest moment of a core product

`src/app/[locale]/(modules)/guide/[id]/page.tsx:138-368` is two `Card` blocks stacked. Card 1: guide metadata form. Card 2: Steps table. The Guide is the product the end-user MSME consumer actually reads — its admin surface should feel like editing a publication, not a database row.

**Fix:** Rebuild as an editorial layout: full-bleed hero (phone preview + title + tags), chapter-list Steps section with sticky chapter nav, single Save bar.

---

### 11.3 [MEDIUM] The empty-state.tsx component is dead

`src/components/ui/empty-state.tsx` exists but is not imported by any page. Every list page has its own inline `<p>No items found.</p>` fallback.

---

### 11.4 [LOW] The button component is well-crafted

`src/components/ui/button.tsx:7-42` uses `cva` with 6 variants × 8 sizes. The `has-data-[icon=inline-end]` selector for icon padding is sophisticated. This is a strength — do not redesign the button.

---

## 12. Frontend Design — Motion & Atmosphere

### 12.1 [MEDIUM] framer-motion vocabulary exists but is timid

The motion vocabulary is:
- `AnimatedMain` (`animated-main.tsx:5-15`): 150ms opacity+y:4 on every route change
- Login form stagger (`login-form.tsx:22-33`): `staggerChildren: 0.06` on mount
- Auth card slide (`auth-card.tsx:14-37`): `x: ±12` on mode change

These are small, correct, and limited to one page each. There is no page-load stagger on list pages (the 14+ Card+Table pages render all rows at once). No motion on the guide detail page. No motion on the AI ask page.

**Fix:** Add a single orchestrated page-load: list rows stagger in by index (40ms apart), headers fade + slide from 8px above, the search bar "settles" last. Use framer-motion's `staggerChildren` per page.

---

### 12.2 [LOW] Glow orbs are the only atmospheric element

`src/app/globals.css:155-187` defines a `.glow-orb` utility with `float 25s` and `pulse-slow 10s` animations. `(modules)/layout.tsx:12-13` places two orbs (same hue, same size, positioned at top-right and bottom-left). The auth page adds two more at lines 28-29.

The orbs are at 3-6% opacity — barely visible in light mode, slightly more in dark. They add atmosphere without being distracting. This is a strength.

**Risk:** Adding more decorative elements (noise, patterns, textures) alongside the orbs could make the UI feel cluttered. The recommendation is to keep the orbs and add ONE texture (the horizontal-line pattern), not more.

---

## 13. Frontend Design — Empty States & Microcopy

### 13.1 [HIGH] All loading states are inline text

Every list page uses `<p>Loading…</p>` or `<p>Loading {module}…</p>`:
- `sidebar-documents.tsx:150`
- `report-detail-page.tsx:269`
- `moderation/reported-users/page.tsx:123-124`
- `guide/[id]/page.tsx:120-122`
- `guide/page.tsx` (after the table)
- `blocked-users/page.tsx` (after the table)
- `library/template-groups/page.tsx`
- `admin/admins/page.tsx`
- `admin/roles/page.tsx`
- `notifications/campaign-templates/page.tsx`
- `notifications/campaigns/page.tsx`
- `notifications/queue/page.tsx`

There is no `Skeleton` component in `src/components/ui/`. The only skeleton-like UI is in `dashboard/page.tsx:98-110` (hand-rolled `StatCardsFallback` and `ChartFallback`).

**Fix:** Add a `<Skeleton />` component family (table skeleton, card skeleton, form skeleton, phone skeleton) to `src/components/ui/`. Replace the 12+ inline text loading states.

---

### 13.2 [HIGH] All error states are backend error strings

Every list page: `<p>Failed to load: {getErrorMessage(error)}</p>`. The `getErrorMessage` function (`src/lib/utils.ts:8-18`) surfaces `title` or `detail` from the backend DTO. Result: a literal backend error string with no design, no recovery affordance, no voice.

Examples:
- `sidebar-documents.tsx:152`: "Failed to load documents"
- `guide/[id]/page.tsx:129-131`: "Failed to load: {getErrorMessage(guideQuery.error)}"
- `blocked-users/page.tsx`: "Failed to load"

**Fix:** Design a themed error component with: the module's icon, a human-readable message ("We can't reach the guide library. Check your connection."), and a Retry button. Replace `<p>Failed to load: {getErrorMessage(error)}</p>` 14+ times.

---

### 13.3 [MEDIUM] All empty states are one line of text

14+ list pages all show `<p>No items found.</p>` or similar:
- `guide/[id]/page.tsx:318`: "No steps yet."
- `sidebar-documents.tsx:155`: "No documents found."
- `community/categories/page.tsx`: inline text
- `moderation/blocked-users/page.tsx`: inline text

The one component named `empty-state.tsx` exists in `src/components/ui/` but is never imported.

The DLQ panel (`dlq-panel.tsx:26-35`) is the only place with a designed empty state ("No failed events. All healthy." with icon + heading).

**Fix:** Rescue `empty-state.tsx`. Design 3 module-specific variants: Guide empty ("Your library is empty. Drop your first PDF."), Moderation empty ("No reports in queue. Everything is clean."), AI empty ("No documents in the knowledge base yet.").

---

### 13.4 [MEDIUM] The login microcopy is corporate, not product

- `auth/page.tsx:62`: "Secure Access for Administrators"
- `auth/page.tsx:65`: "Join the platform dedicated to empowering MSMEs with AI-driven insights and secure management tools."
- `login-form.tsx:74`: "Welcome back" / "Sign in to your admin account"

This is generic B2B voice. Compare to a designed alternative: "Welcome back. The library is open." or a quieter, more typographic statement.

---

## 14. Frontend Design — Specific Surface Opportunities

### 14.1 [HIGH] The Guide detail page rebuild

**Surface:** `src/app/[locale]/(modules)/guide/[id]/page.tsx:138-368` (369 lines)

**Current:** Two stacked `Card` blocks. Card 1: form fields (name, slug, image, description, sectors, tags). Card 2: Steps table.

**Proposed:** Editorial layout with:
- Full-bleed hero: phone preview on the left, guide title + description + tags on the right, cover image as background
- Chapter-list Steps section: each step as a card with step number, title, estimated time, compliance type
- Sticky chapter nav on desktop (like the guide editor sidebar)
- Single Save bar at the bottom

**Estimated LOC:** ~250 lines

---

### 14.2 [HIGH] The AI Ask page

**Surface:** `src/app/[locale]/(modules)/ai/ask/page.tsx` + `chat-panel.tsx` (455 lines)

**Current:** Two-panel layout: `ConversationSidebar` (left) + `ChatPanel` (right). Chat messages are simple text bubbles.

**Proposed:**
- Phone frame around the conversation (using the `mobile-preview.tsx` motif)
- Custom token-stream component for thinking chunks (not just JSON in the debug panel)
- Tool-use indicator already exists (`tool-use-indicator.tsx`) but could be more visual (step indicator, not just a list)
- Citations rendered as inline footnotes, not a separate panel

**Estimated LOC:** ~300 lines

---

### 14.3 [MEDIUM] The 403 page

**Surface:** `src/app/403/page.tsx`

**Current:** A plain page with no styling, no illustration, no copy.

**Proposed:** Typographic statement: "Restricted." in Fraunces display, with a single brand-color horizontal rule, and a "Return to Dashboard" link below.

**Estimated LOC:** ~30 lines

---

### 14.4 [MEDIUM] Phone-frame as a reusable component

**Surface:** New component + 3 sites

**Current:** `mobile-preview.tsx:24-109` has a hardcoded 320px phone frame with bezel, notch, and status pill.

**Proposed:** Extract `<PhoneFrame>{children}</PhoneFrame>` as a reusable component. Use in:
- Guide detail hero (phone showing cover + first step)
- AI Ask conversation (phone showing chat bubbles)
- Moderation case detail (phone showing reported content)

**Estimated LOC:** ~60 lines

---

### 14.5 [LOW] The header cleanup

**Surface:** `src/components/layout/header.tsx:51-67`

**Current:** Avatar shows `/placeholder-avatar.jpg` (line 63). Bell icon has a red dot but no notification logic. The header title is "Admin Dashboard" in Inter.

**Proposed:** Drop the placeholder avatar. Use initials-only fallback (already implemented at line 64). Drop the bell icon if not wired. Change "Admin Dashboard" to the current page title (read from route config or context).

**Estimated LOC:** ~20 lines

---

### 14.6 [LOW] Sidebar texture

**Surface:** `globals.css` + `sidebar.tsx`

**Current:** Solid background with no texture.

**Proposed:** Add a 1px horizontal-line repeating pattern at 4% opacity over `--sidebar`. Add a 4px brand-color bar at section headers.

**Estimated LOC:** ~30 lines

---

### 14.7 [LOW] error.tsx files at module boundaries

**Surface:** New files at `(modules)/layout.tsx` and `app/layout.tsx` level

**Current:** Zero error boundaries.

**Proposed:** Add `error.tsx` at `(modules)/layout.tsx` level with the new typographic error component. Add `global-error.tsx` at `app/layout.tsx` level.

**Estimated LOC:** ~40 lines

---

## 15. Synthesis — Recommended Implementation Order

### Phase 1: Foundation (do first, everything else builds on this)

| # | Work | Rationale |
|---|------|-----------|
| 1 | **Add error.tsx at `(modules)/layout.tsx` and `app/layout.tsx`** | Bounds the blast radius. Any subsequent refactor that throws an error will show a recovery UI instead of a white screen. ~40 lines, zero risk. |
| 2 | **Add Skeleton component family** to `src/components/ui/skeleton.tsx` | Reusable by every list page. Removes 12+ inline `<p>Loading…</p>` in one pass. ~80 lines. |
| 3 | **Rescue empty-state.tsx** and design 3 module-specific variants | Removes 14+ inline "No items found." and gives each module a designed empty state. ~120 lines. |
| 4 | **Fix the 8 Suspense gaps** (useSearchParams/usePathname in dynamic routes) | Small, mechanical, removes CSR bailout on every navigation. ~30 lines across 8 files. |

### Phase 2: Design System (typography + color swap)

| # | Work | Rationale |
|---|------|-----------|
| 5 | **Replace Inter with Fraunces + Geist** in `globals.css` + `layout.tsx` | Foundational — every screen inherits. Adds typographic personality. ~30 lines. |
| 6 | **Introduce brand-color token** (`--brand` warm, `--accent` saturated) and rewrite `primary` + `auth-gradient-from/to` | Reskins everything in one pass. ~25 lines in `globals.css`. |

### Phase 3: Architectural Deepens (pick one, run alongside Phase 1-2)

| # | Work | Rationale |
|---|------|-----------|
| 7a | **SSE infrastructure** (#2) | Highest duplication (3×250 lines), fixes a real concurrency bug, existing test to port. |
| 7b | **Moderation report hooks** (#1) | Second-highest duplication, simplest to execute (no SSE complexity). |
| 7c | **Storage upload pipeline** (#3) | Smallest scope, clear seam, two call sites. |

### Phase 4: Surface Rebuilds (do after Phase 1-2)

| # | Work | Rationale |
|---|------|-----------|
| 8 | **Guide detail page** editorial rebuild | Highest-impact surface, most-touched by users. |
| 9 | **Phone-frame as reusable component** + use in 3 sites | One motif, three sites. |
| 10 | **AI Ask page** with phone frame + thinking stream | Flagship product surface. |
| 11 | **403 page** typographic statement | Small surface, big character. |
| 12 | **Header cleanup** + sidebar texture | Polish. |

### Phase 5: Cross-Cutting Polish (do last)

| # | Work | Rationale |
|---|------|-----------|
| 13 | **Error component** (replace 14+ "Failed to load: {error}") | Voice + recovery affordance. |
| 14 | **List page visual variation** (Guide list as card grid, etc.) | Breaks Card+Table monotony on 2-3 surfaces. |
| 15 | **Page-load stagger motion** on list pages | One orchestrated motion moment. |
| 16 | **Guide editor** (#6) orchestration deepen | Testability of the most complex coordination. |

---

## Appendix: Files Referenced

### Architecture files
- `src/lib/api/mutator/custom-fetch.ts` — 212 lines, SSE/auth infrastructure
- `src/app/[locale]/(modules)/moderation/_services/post-reports.hook.ts` — 77 lines
- `src/app/[locale]/(modules)/moderation/_services/thread-reports.hook.ts` — 77 lines
- `src/app/[locale]/(modules)/moderation/_services/user-reports.hook.ts` — 85 lines
- `src/app/[locale]/(modules)/moderation/_components/report-detail-page.tsx` — 349 lines
- `src/app/[locale]/(modules)/ai/ask/_services/ask.hook.ts` — 392 lines
- `src/app/[locale]/(modules)/ai/knowledge-base/_services/ai.hook.ts` — 505 lines
- `src/app/[locale]/(modules)/notifications/_services/campaign-sse.hook.ts` — 208 lines
- `src/app/[locale]/(modules)/guide/_services/guide.hook.ts` — 244 lines
- `src/app/[locale]/(modules)/library/_services/library.hook.ts` — 365 lines
- `src/store/auth.store.ts` — 60 lines
- `src/lib/permissions.ts` — 30 lines
- `src/lib/route-permissions.ts` — 14 lines
- `src/components/auth/permission-guard.tsx` — 35 lines
- `src/app/[locale]/(modules)/guide/[id]/edit/page.tsx` — 390 lines
- `src/app/[locale]/(modules)/guide/_stores/edit-guide.store.ts` — 106 lines
- `src/app/[locale]/(modules)/guide/_components/edit-step-form.tsx` — 502 lines

### Next.js files
- `src/proxy.ts` — 24 lines
- `src/app/layout.tsx` — 52 lines
- `src/app/[locale]/layout.tsx` — 26 lines
- `src/app/[locale]/(modules)/layout.tsx` — 25 lines
- `src/app/[locale]/(modules)/admin/layout.tsx` — 74 lines
- `src/app/[locale]/(modules)/taxonomy/layout.tsx` — 52 lines
- `src/app/403/page.tsx` — exists but unstated
- `next.config.ts` — 9 lines
- `package.json` — scripts section

### Design files
- `src/app/globals.css` — 208 lines
- `src/app/(auth)/auth/page.tsx` — 97 lines
- `src/app/(auth)/auth/_components/auth-card.tsx` — 48 lines
- `src/app/(auth)/auth/_components/login-form.tsx` — 200 lines
- `src/app/[locale]/(modules)/guide/[id]/page.tsx` — 369 lines
- `src/app/[locale]/(modules)/guide/_components/mobile-preview.tsx` — 112 lines
- `src/components/layout/header.tsx` — 108 lines
- `src/components/layout/sidebar.tsx` — 414 lines
- `src/components/layout/animated-main.tsx` — 16 lines
- `src/components/ui/button.tsx` — 67 lines
- `src/components/ui/empty-state.tsx` — exists, unused
- `src/app/[locale]/(modules)/ai/ask/_components/chat-panel.tsx` — 455 lines
- `src/app/[locale]/(modules)/ai/knowledge-base/_components/sidebar-documents.tsx` — 250 lines
- `src/app/[locale]/(modules)/ai/knowledge-base/_components/dlq-panel.tsx` — 75 lines
- `src/app/[locale]/(modules)/notifications/campaigns/[id]/page.tsx` — 802 lines (546 commented)
