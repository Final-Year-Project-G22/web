import { getRefreshUrl } from "@/lib/api/services/authentication";
import { useAuthStore } from "@/store/auth.store";

const REFRESH_BUFFER_MS = 60_000;

let refreshPromise: Promise<boolean> | null = null;

function isTokenExpiring(): boolean {
  const { expiresAt, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !expiresAt) return false;
  return new Date(expiresAt).getTime() - Date.now() < REFRESH_BUFFER_MS;
}

async function refreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(getRefreshUrl(), {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const body = await res.json();
        if (body.data?.accessToken) {
          const state = useAuthStore.getState();
          const expiresAt =
            body.data.expiresAt ?? new Date(Date.now() + 3600_000).toISOString();
          const maxAgeSec = Math.max(
            0,
            Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
          );
          useAuthStore.getState().setSession(
            body.data.accessToken,
            state.user!,
            state.account!,
            expiresAt,
          );
          document.cookie = `access_token=${body.data.accessToken}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
        }
        return true;
      }
      return false;
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
  if (isTokenExpiring()) {
    await refreshToken();
  }

  const res = await fetch(url, { ...options, credentials: "include" });

  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      const retryRes = await fetch(url, { ...options, credentials: "include" });
      const body = [204, 205, 304].includes(retryRes.status)
        ? null
        : await retryRes.text();
      const data: unknown = body ? JSON.parse(body) : {};
      return { data, status: retryRes.status, headers: retryRes.headers } as T;
    }

    useAuthStore.getState().logout();
    document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
  }

  const body = [204, 205, 304].includes(res.status) ? null : await res.text();
  const data: unknown = body ? JSON.parse(body) : {};
  return { data, status: res.status, headers: res.headers } as T;
};

export default customFetch;
