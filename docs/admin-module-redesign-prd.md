# Admin Module Redesign — Product Requirements Document

## Problem Statement

Currently, admin management is fragmented: there is a single standalone `/admin/register` page and no unified way for super admins to manage admin accounts, roles, or permissions from a single admin hub. The role and permission management backend already supports listing roles, permissions, and role CRUD, but there is no frontend for managing roles or viewing permission catalogs, nor any admin listing or password reset capabilities. The result is a disjointed experience where the super admin cannot list admins, edit their roles, reset their passwords, or manage custom roles without directly interacting with backend/database.

## Solution

A unified **Admin Hub** under the `/admin` route group, providing a consolidated UI for super admins (and scoped IAM admins) to:

- View a paginated, searchable list of admin accounts with roles and statuses.
- Open admin detail drawers to update roles, lock/suspend/activate accounts, and trigger password resets.
- Create, edit, and delete custom roles (with system roles read-only).
- Register new admins directly from within the Admin Hub.

The UI will be guarded by a fine-grained permission system so only authorized users see or can use specific actions.

## User Stories

1. As a **super admin**, I want to see a unified Admin Hub, so that I can manage admin accounts, roles, and permissions from one place.
2. As a **super admin**, I want to list all admin accounts with search, pagination, and status/role filters, so that I can quickly find and manage admins.
3. As a **super admin**, I want to view an admin’s details in a slide-over drawer, so that I can inspect their roles, status, and last login without leaving the list.
4. As a **super admin**, I want to update an admin’s roles from the drawer, so that I can adjust permissions without navigating elsewhere.
5. As a **super admin**, I want to lock or suspend an admin account from the drawer, so that I can enforce access control immediately.
6. As a **super admin**, I want to trigger a password reset for another admin from the drawer, so that I can help admins who forget their passwords.
7. As a **super admin**, I want to register a new admin account from within the Admin Hub, so that onboarding is streamlined.
8. As a **super admin**, I want to create, edit, and delete custom roles with specific permissions, so that I can tailor access without touching system roles.
9. As a **super admin**, I want to see permissions grouped by module with search, so that assigning permissions to roles is fast and intuitive.
10. As a **super admin**, I want system roles to be read-only in the UI, so that I cannot accidentally break built-in roles.
11. As an **admin with `iam_admin` role**, I want to view the admin list and manage roles (excluding super-admin-sensitive actions), so that I can support admin management without full super-admin powers.
12. As a **frontend user**, I want the app to hide Admin navigation items if I don’t have access, so that the UI is clean and I’m not presented with inaccessible pages.
13. As a **frontend user**, I want to see a clear “Access Denied” page if I try to access an admin page without permission, so that I understand why I’m blocked.
14. As a **developer**, I want the backend admin listing to reuse existing query options (pagination, search, filters), so that the list behavior is consistent with other admin lists.
15. As a **developer**, I want the frontend pagination component to be reusable across all admin lists, so that pagination UI is consistent and maintainable.
16. As a **security auditor**, I want reset-password tokens to be hashed and short-lived (5 minutes), so that the reset flow is secure.
17. As a **security auditor**, I want the system to enforce at least one remaining super admin, so that we never lock the platform.
18. As a **backend maintainer**, I want admin management endpoints under `/api/v1/admin/accounts`, separate from auth routes, so that routing and middleware are clear.
19. As a **backend maintainer**, I want admin listing to be permission-based (not just role-code based), so that custom roles with admin permissions are handled correctly.
20. As a **developer**, I want roles and permissions stored in the auth store after login/hydration, so that UI guards are fast and consistent.

## Implementation Decisions

### Backend

- **New endpoints under `/api/v1/admin/accounts`:**
  - `GET /api/v1/admin/accounts` — list admins with search, status filter, roleId filter, and pagination via existing `query.QueryOptions`.
  - `PATCH /api/v1/admin/accounts/{id}/status` — update account status (active, locked, suspended) with allowed-transition validation.
  - `POST /api/v1/admin/accounts/{id}/reset-password` — trigger a password reset for an admin.
- **New public endpoint:**
  - `POST /api/v1/auth/admin/reset-password` — validate reset token and set new password (no auth required).
- **Permission model:**
  - Add fine-grained permission codes seeded in `seedPermissions()`: `iam.admin.list`, `iam.admin.read`, `iam.admin.roles.update`, `iam.admin.reset_password`, `iam.admin.status.update`, `iam.admin.create`, `iam.role.create`, `iam.role.update`, `iam.role.delete`, `iam.role.read`, `iam.permission.read`.
  - `super_admin` role gets all permissions.
  - `iam_admin` gets all IAM permissions except sensitive ones (`iam.admin.reset_password`, `iam.admin.status.update`, `iam.role.delete`).
- **OTP reuse for password reset:**
  - Extend `AccountEmailOTP` (or equivalent) with a `purpose` field (`email_verification` | `password_reset`).
  - Add a new event/template for password reset notifications with a reset-specific link.
  - TTL = 5 minutes; hashed token storage; reuse existing rate limits (60s cool-off, max 5 resends, max 5 attempts).
- **Admin definition for listing:**
  - Permission-based: include any account whose effective permissions include `iam.admin.list` or `iam.role.read`.
  - Return roles inline (IDs + names) but not full permission lists in list response.
- **Safety guard:**
  - Server-side enforcement: prevent removing the last `super_admin` role from all accounts.

### Frontend

- **Route structure under `/admin`:**
  - `/admin` — overview/landing page with quick links.
  - `/admin/admins` — admin list with pagination, search, filters.
  - `/admin/roles` — roles list + drawer editor (create/update/delete custom roles, assign permissions grouped by module with search).
  - `/admin/register` — register new admin.
  - Add redirect from old `/admin/register` to `/admin/register`.
- **Layout:**
  - Shared `admin/layout.tsx` with left sidebar sub-navigation (Admins, Roles, Register) and permission-based visibility.
- **Admin list page:**
  - Search by email/username/name; filters for `status` and `roleId`; pagination using reusable pagination component.
  - Default sort: newest-created first; default page size 20.
- **Admin detail:**
  - Slide-over drawer from the list page.
  - Show account info, roles (editable with guard), status (lock/suspend/activate with guard), reset-password action (super-admin only, with confirmation modal).
- **Role editor:**
  - Drawer for create/edit.
  - Auto-generate role code from name (editable).
  - Permission assignment grouped by module with search/filter.
  - System roles (`isSystem=true` or `isMutable=false`) are read-only (no edit/delete).
- **Permission guarding:**
  - Store roles + permissions from `/api/v1/auth/me` in Zustand auth store after login and on app hydration.
  - Use a shared `hasPermission(code)` helper to guard nav items, page access, and action visibility.
  - Hide Admin nav item unless `iam.admin.list`.
  - Show global `403` page for direct access to forbidden pages.
- **Pagination component:**
  - Reusable generic pagination in `src/components/pagination.tsx` (or `src/components/ui/pagination.tsx`).
  - Includes page size selector (10/20/50), prev/next, page numbers, and total count display.

### OpenAPI / Client Generation

- Update OpenAPI spec to include new admin endpoints and permission-related types.
- Regenerate Orval client types and services so the frontend gets typed hooks for new APIs.

## Testing Decisions

- **Frontend:** Test the `hasPermission()` guard helper with various role/permission combinations.
- **Frontend:** Test the reusable pagination component with different total/page-size combinations.
- **Backend:** Test admin listing query options (search, filters, pagination) and permission-based filtering.
- **Backend:** Test status transition validation (e.g., reject invalid transitions, enforce last super admin).
- **Backend:** Test password reset flow end-to-end (trigger, token validation, expiration, rate limiting).
- **Backend:** Test role CRUD guards (system roles read-only, custom roles editable/deletable).

## Out of Scope

- Audit logs for admin actions (can be added later).
- Admin activity/metrics dashboard on the overview page (kept lightweight for now).
- User-facing password reset flow (only admin reset is in scope).
- Multi-factor authentication management in the Admin Hub.
- Bulk admin operations (bulk delete, bulk role assignment).
- Email template customization in the UI.

## Further Notes

- The existing `/admin/register` page should be removed and replaced by the new route; add a redirect for backward compatibility.
- The login/register response should remain unchanged; roles and permissions will be fetched via `/api/v1/auth/me` after login and on hydration.
- The frontend should fetch `/api/v1/auth/me` on app start to ensure the auth store has up-to-date roles/permissions for guards.
- The `iam_admin` role is intended as a scoped admin manager; sensitive actions remain super-admin only.
- Future iterations may add audit logs, activity charts, and bulk operations once the core hub is stable.
