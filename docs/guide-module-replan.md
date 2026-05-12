# Guide Module Replan — Implementation Plan

## Context

The guide module manages **business formalization guides** — step-by-step resources authored by admins and consumed by users on mobile. The admin portal handles creation, editing, listing, and taxonomy management.

### Key Changes

| Before | After |
|--------|-------|
| Categories (hierarchical, guide-specific) | Sectors + Tags (application-wide taxonomy) |
| Both EN/AM sent together in every API call | Per-language CRUD via admin language toggle |
| Hardcoded `locale: "en"` in queries | Active language drives queries and saves |
| `setGuideTranslations` replaces all | Merge-mode preserves unsent languages |

## Prerequisites — Backend Changes

These must be done before any frontend work.

### B1. Fix admin GET endpoints for locale

| Endpoint | Current | Required |
|----------|---------|----------|
| `GET /admin/guides` | Locale ignored — picks `Translations[0]` | `Preload("Translations", "language = ?", locale)` with EN fallback |
| `GET /admin/guides/{id}/steps` | Locale ignored — preloads all | `Preload("Translations", "language = ?", locale)` with EN fallback |
| `GET /admin/guides/{id}` | In-memory filter (works but inefficient) | Optionally switch to DB-level `Preload("Translations", "language = ?", locale)` |

### B2. Add merge-mode to `setGuideTranslations`

Modify the existing `setGuideTranslations` helper to support a `?mode=merge` flag:

- **`mode=replace`** (default, current behavior): upsert incoming, delete absent
- **`mode=merge`**: upsert incoming, **preserve** absent (skip delete step)

Apply same change to `setStepTranslations`.

### B3. Regenerate Orval types/services

After backend changes, regenerate the OpenAPI spec and re-run Orval to update frontend types and service functions.

---

## Phase 1: Taxonomy Module (Sectors & Tags)

New standalone module for application-wide taxonomy management.

### 1.1 Create `taxonomy.hook.ts`

File: `src/app/[locale]/(modules)/admin/_services/taxonomy.hook.ts`

React Query hooks wrapping `admin-taxonomy.ts` service functions:

```typescript
KEYS = {
  sectors: { all: ["admin", "sectors"], list: (p?) => [...KEYS.sectors.all, "list", p] },
  tags:    { all: ["admin", "tags"],    list: (p?) => [...KEYS.tags.all, "list", p] },
};

// Sectors
useSectorList(params)           // useQuery -> listSectors()
useCreateSector()               // useMutation -> createSector()
useUpdateSector()               // useMutation -> updateSector()
useDeleteSector()               // useMutation -> deleteSector()

// Tags
useTagList(params)              // useQuery -> listTags()
useCreateTag()                  // useMutation -> createTag()
useUpdateTag()                  // useMutation -> updateTag()
useDeleteTag()                  // useMutation -> deleteTag()
```

### 1.2 Create Sectors management page

Route: `/admin/sectors`
File: `src/app/[locale]/(modules)/admin/sectors/page.tsx`

Features:
- Paginated table with search
- Inline create/edit form in a drawer or card
- Fields: nameEn, nameAm, descEn, descAm, icon, parentId (tree select), sortOrder, isActive
- Language toggle (EN/AM) for name/description fields
- Delete with confirmation

### 1.3 Create Tags management page

Route: `/admin/tags`
File: `src/app/[locale]/(modules)/admin/tags/page.tsx`

Features:
- Paginated table with search + group filter
- Inline create/edit form in a drawer or card
- Fields: nameEn, nameAm, descEn, descAm, group, icon, isMultiSelect, sortOrder, isActive
- Language toggle (EN/AM) for name/description fields
- Delete with confirmation

### 1.4 Update sidebar

File: `src/components/layout/sidebar.tsx`

- Remove "Categories" link
- Add a collapsible "Taxonomy" section with:
  - "Sectors" → `/admin/sectors`
  - "Tags" → `/admin/tags`

### 1.5 Update CONTEXT.md

Add guide module and taxonomy domain terms.

---

## Phase 2: Localization Infrastructure

### 2.1 Add "am" to next-intl routing

File: `src/i18n/routing.ts`

```typescript
locales: ["en", "am"],
```

### 2.2 Create empty `messages/am.json`

```json
{}
```

### 2.3 Create language toggle component

File: `src/components/layout/language-toggle.tsx`

A toggle/select in the header or sidebar that sets the active language:
- Stores in Zustand `adminLanguageStore` (or a slice of existing auth store)
- Persists selection (localStorage via zustand persist middleware)
- Triggers re-render on switch

```typescript
// store shape
interface AdminLanguageState {
  language: string; // "en" | "am"
  setLanguage: (lang: string) => void;
}
```

### 2.4 Add language store

File: `src/stores/admin-language.store.ts`

Simple Zustand store with persist middleware (localStorage key: `admin-language`).

Default: `"en"`.

### 2.5 Update edit-guide.store to use admin language

File: `src/app/[locale]/(modules)/guide/_stores/edit-guide.store.ts`

The existing `language` field (default `"en"`) should either:
- Sync from the global `adminLanguageStore`
- Or be removed in favor of the global store

**Recommendation:** Remove local `language` from edit-guide store. All components read from the global `adminLanguageStore` directly.

---

## Phase 3: Guide Module Refactor (CRUD Pages)

### 3.1 Update guide create page

File: `src/app/[locale]/(modules)/guide/create/page.tsx`

Changes:
- **Remove** category selector
- **Add** sector multi-select (checkbox group or combobox from taxonomy API)
- **Add** tag multi-select (checkbox group or combobox from taxonomy API)
- **Add** image upload (file input with preview)
- **Add** required documents upload (multiple files with list preview)
- **Add** language context: send only active language's translation

Save payload changes:
```typescript
// Before
{
  slug, categoryId, sortOrder,
  translations: [ { language: "en", name, description }, { language: "am", name, description } ]
}

// After
{
  slug, sortOrder, sectorIds, tagIds,
  translations: [ { language: activeLang, name, description } ]  // single translation
}
```

### 3.2 Update guide detail page

File: `src/app/[locale]/(modules)/guide/[id]/page.tsx`

Changes:
- **Remove** category selector
- **Replace** with sector display + edit (multi-select)
- **Replace** with tag display + edit (multi-select)
- **Add** image preview + upload
- **Add** required documents list + upload
- **Add** additional metadata fields (sort order, icon, etc.)
- **Language toggle**: query with active locale, display active language content
- **Save**: read-modify-write with merge-mode — send only active language's translation to merge endpoint

### 3.3 Remove categories page

Delete `src/app/[locale]/(modules)/guide/categories/page.tsx` and its directory.

### 3.4 Update guide list page

File: `src/app/[locale]/(modules)/guide/page.tsx`

- Remove "Categories" button from header
- Optionally add sector/tag columns in the table

### 3.5 Clean up guide.hook.ts

Remove category-related hooks:
- `useAdminGuideCategoryTree`
- `useCreateGuideCategory`
- `useUpdateGuideCategory`
- `useDeleteGuideCategory`

Remove `KEYS.categories` query key.

Add upload hooks:
- `useUploadGuideImage(guideId)` — FormData POST
- `useUploadGuideDocument(guideId)` — FormData POST
- `useUploadStepImage(stepId)` — FormData POST

---

## Phase 4: Step Editor Locale Fix

### 4.1 Fix `mapApiToEditorSteps`

File: `src/app/[locale]/(modules)/guide/[id]/edit/page.tsx`

Current:
```typescript
const richContent = s.translations?.find((t) => t.language === "en")?.detailedContent
```

Change to use active language from global store:
```typescript
const language = useAdminLanguageStore((s) => s.language);
const richContent = s.translations?.find((t) => t.language === language)?.detailedContent
```

**Note:** When fetching steps with `locale`, each step's `translations` array will contain only one translation. The `find` will always match. If the steps are still fetched without locale (all translations), it picks the right one.

### 4.2 Fix `createEmptyStep`

Current creates both EN and AM:
```typescript
translations: [
  { language: "en", title: `Step ${order}`, description: "" },
  { language: "am", title: `Step ${order}`, description: "" },
],
```

Change to create only active language:
```typescript
const language = useAdminLanguageStore((s) => s.language);
translations: [
  { language, title: `Step ${order}`, description: "" },
],
```

### 4.3 Fix save payloads

`buildCreatePayload` and `buildUpdatePayload` currently send all translations in the array. With the merge-mode backend, sending a single translation is safe — the backend will upsert it and preserve others.

No code change needed in the build functions themselves, but the `translations` array on the step will contain only one entry (since `createEmptyStep` and `mapApiToEditorSteps` now produce single-language steps).

### 4.4 Fix step queries

File: `src/app/[locale]/(modules)/guide/[id]/edit/page.tsx`

Current (hardcoded):
```typescript
const guideQuery = useAdminGuideDetail(id, { locale: "en" });
const stepsQuery = useAdminGuideSteps(id, { locale: "en", pageSize: 100 });
```

After:
```typescript
const language = useAdminLanguageStore((s) => s.language);
const guideQuery = useAdminGuideDetail(id, { locale: language });
const stepsQuery = useAdminGuideSteps(id, { locale: language, pageSize: 100 });
```

(With the backend fix, `ListGuideStepsAdmin` will now use locale to filter.)

---

## Phase 5: Polish & Cleanup

### 5.1 Sidebar cleanup

- Ensure no stale "Categories" references
- Verify new Taxonomy section renders correctly

### 5.2 Guide list locale

Optionally update `GET /admin/guides` locale so the displayed name matches active language. This requires the backend fix for the list endpoint to be complete.

### 5.3 Remove dead code

- Remove category-related types if no longer referenced elsewhere
- Remove any unused imports
- Verify all `.find(t => t.language === "en")` patterns are updated

### 5.4 Update CONTEXT.md

```markdown
| **Guide**     | Business formalization guides authored by admins, organized by sectors/tags, consumed step-by-step on mobile. |
| **Sector**    | Broad industry classification (hierarchical). Application-wide taxonomy. |
| **Tag**       | Cross-cutting attribute with group (e.g., business stage). Application-wide taxonomy. |
| **Admin Language** | Persistent EN/AM toggle for admin content entry. Drives per-language API queries and saves. |
```

---

## Dependency Graph

```
Phase 1 (Taxonomy)
  └── Phase 2 (Localization)
       └── Phase 3 (Guide CRUD)
            └── Phase 4 (Step Editor)
                 └── Phase 5 (Polish)

Backend Prerequisites (B1, B2, B3) ──> Phases 2–4
```

**Backend blocks must be deployed first** — without B1 (locale filtering) and B2 (merge-mode), the frontend changes in Phases 2–4 will either display wrong content or corrupt translations on save.

---

## Migration Notes

### Existing data
- Guides already have `sectorIds` and `tagIds` fields in the API types, but current create/edit UIs never populate them
- Old guides with `categoryId` set will have `categoryId` orphaned after backend removes categories — server should handle this gracefully (ignore or migrate)
- Existing translations in DB already have both EN and AM — the merge-mode endpoint ensures neither is lost during the transition

### Rollback
- Keep the categories page code in git history but not deployed
- If merge-mode causes issues, revert to current full-replace behavior by omitting `?mode=merge`

---

## Implementation Order (Recommended)

1. Backend: B1 (fix GET locale) + B2 (merge-mode) + B3 (regenerate)
2. Phase 2: Localization infrastructure (needed for all subsequent phases)
3. Phase 1: Taxonomy CRUD pages (independent of guide module changes)
4. Phase 3: Guide CRUD refactor (create, detail, list)
5. Phase 4: Step editor locale fix
6. Phase 5: Polish + update CONTEXT.md
