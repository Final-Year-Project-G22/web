import { getGetCurrentUserUrl, getRefreshUrl } from "@/lib/api/services/authentication";
import type { AccountDTO, UserDTO } from "@/lib/api/types";
import { useAdminLanguageStore } from "@/stores/admin-language.store";
import { useAuthStore } from "@/store/auth.store";

const REFRESH_BUFFER_MS = 60_000;

let refreshPromise: Promise<boolean> | null = null;

const isBrowser = () => typeof document !== "undefined";

function parseExpiresAt(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const ms = Date.parse(expiresAt);
  return Number.isNaN(ms) ? null : ms;
}

function isTokenExpiring(): boolean {
  const { expiresAt, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !expiresAt) return false;
  const expiresAtMs = parseExpiresAt(expiresAt);
  if (expiresAtMs === null) return true;
  return expiresAtMs - Date.now() < REFRESH_BUFFER_MS;
}

function isTokenExpired(): boolean {
  const { expiresAt, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !expiresAt) return false;
  const expiresAtMs = parseExpiresAt(expiresAt);
  if (expiresAtMs === null) return true;
  return expiresAtMs <= Date.now();
}

async function readResponseBody(res: Response): Promise<unknown> {
  if ([204, 205, 304].includes(res.status)) return {};
  const text = await res.text();
  if (!text) return {};
  const contentType = res.headers.get("content-type") ?? "";
  const looksLikeJson = text.trim().startsWith("{") || text.trim().startsWith("[");
  if (contentType.includes("json") || looksLikeJson) {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
  return { raw: text };
}

function unwrapData<T>(body: unknown): T | null {
  if (!body || typeof body !== "object") return null;
  if ("data" in body) {
    const wrapped = (body as { data?: unknown }).data;
    if (wrapped && typeof wrapped === "object") return wrapped as T;
  }
  return body as T;
}

function getRefreshPayload(body: unknown): { accessToken: string; expiresAt: string } | null {
  const payload = unwrapData<Record<string, unknown>>(body);
  if (!payload) return null;
  const accessToken = payload.accessToken;
  if (typeof accessToken !== "string" || !accessToken) return null;
  const expiresAt = typeof payload.expiresAt === "string" ? payload.expiresAt : undefined;
  if (!expiresAt) return null;
  return { accessToken, expiresAt };
}

function getCurrentUserPayload(
  body: unknown,
): { user: UserDTO; account: AccountDTO } | null {
  const payload = unwrapData<Record<string, unknown>>(body);
  if (!payload) return null;
  if (!payload.user || !payload.account) return null;
  return {
    user: payload.user as UserDTO,
    account: payload.account as AccountDTO,
  };
}

function setAccessCookie(accessToken: string, expiresAt: string): void {
  if (!isBrowser()) return;
  const expiresAtMs = parseExpiresAt(expiresAt);
  if (expiresAtMs === null) return;
  const maxAgeSec = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  document.cookie = `access_token=${accessToken}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

export async function ensureFreshSession(): Promise<boolean> {
  const expired = isTokenExpired();
  if (!isTokenExpiring()) return true;
  const refreshed = await refreshToken();
  if (refreshed) return true;
  if (expired) {
    logoutAndRedirect();
    return false;
  }
  return true;
}

async function rehydrateSession(accessToken: string, expiresAt: string): Promise<boolean> {
  const state = useAuthStore.getState();
  let user = state.user;
  let account = state.account;

  if (!user || !account) {
    const res = await fetch(getGetCurrentUserUrl(), {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return false;
    const body = await readResponseBody(res);
    const payload = getCurrentUserPayload(body);
    if (!payload) return false;
    user = payload.user;
    account = payload.account;
  }

  useAuthStore.getState().setSession(accessToken, user, account, expiresAt, state.roles, state.permissions);
  setAccessCookie(accessToken, expiresAt);
  return true;
}

export function logoutAndRedirect(): void {
  useAuthStore.getState().logout();
  if (isBrowser()) {
    document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
  }
  if (typeof window !== "undefined") {
    window.location.href = "/auth";
  }
}

async function buildResponse<T>(res: Response): Promise<T> {
  const data = await readResponseBody(res);
  return { data, status: res.status, headers: res.headers } as T;
}

export async function refreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(getRefreshUrl(), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const body = await readResponseBody(res);
      const payload = getRefreshPayload(body);
      if (!payload) return false;
      const expiresAt = payload.expiresAt;
      const expiresAtMs = parseExpiresAt(expiresAt);
      if (expiresAtMs === null || expiresAtMs <= Date.now()) return false;
      const refreshed = await rehydrateSession(payload.accessToken, expiresAt);
      return refreshed;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const customFetch = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const fresh = await ensureFreshSession();
  if (!fresh) {
    return { data: {}, status: 401, headers: new Headers() } as T;
  }

  // Strip body from GET/HEAD requests — many HTTP stacks reject bodies on GET.
  const method = (options.method || "GET").toUpperCase();
  const safeOptions = method === "GET" || method === "HEAD"
    ? { ...options, body: undefined }
    : options;

  // Attach Bearer token if available (fallback if proxy middleware misses it)
  const token = useAuthStore.getState().token;
  const headers = new Headers(safeOptions.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // Set Accept-Language from the admin language store for localization.
  if (!headers.has("Accept-Language")) {
    const lang = useAdminLanguageStore.getState().language || "en";
    headers.set("Accept-Language", lang);
  }

  const res = await fetch(url, { ...safeOptions, headers, credentials: "include" });

  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      const retryRes = await fetch(url, { ...safeOptions, credentials: "include" });
      if (retryRes.status === 401) {
        logoutAndRedirect();
      }
      return buildResponse<T>(retryRes);
    }

    logoutAndRedirect();
  }

  return buildResponse<T>(res);
};

export default customFetch;
