"use client";

import {
  ensureFreshSession,
  logoutAndRedirect,
  refreshToken,
} from "@/lib/api/mutator/custom-fetch";
import { useAuthStore } from "@/store/auth.store";

export type SseEvent = {
  event?: string;
  data: string;
};

export type SseClientOptions = {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: BodyInit | null;
  onEvent: (event: SseEvent) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  signal?: AbortSignal;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
};

export type SseClientHandle = {
  close: () => void;
};

let refreshPromise: Promise<boolean> | null = null;

async function coalescedRefreshToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshToken().finally(() => {
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    });
  }
  return refreshPromise;
}

function buildAuthHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  const token = useAuthStore.getState().token;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }
  return headers;
}

function parseSSEChunk(chunk: string): SseEvent | null {
  const lines = chunk.replace(/\r\n/g, "\n").split("\n");
  let event: string | undefined;
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  const data = dataLines.join("\n");
  return data ? { event, data } : null;
}

function sseReconnectDelayMs(attempt: number): number {
  return Math.min(30_000, 1000 * 2 ** Math.min(Math.max(0, attempt - 1), 5));
}

function waitForReconnect(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = window.setTimeout(resolve, ms);
    const onAbort = () => {
      window.clearTimeout(t);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort);
  });
}

async function fetchSseWithAuth(
  url: string,
  init: { method: string; headers: Headers; body?: BodyInit | null; signal: AbortSignal }
): Promise<Response> {
  const fresh = await ensureFreshSession();
  if (!fresh) {
    return new Response(null, { status: 401 });
  }

  const buildInit = (): RequestInit => ({
    method: init.method,
    headers: buildAuthHeaders(init.headers),
    body: init.body ?? undefined,
    signal: init.signal,
  });

  let response = await fetch(url, buildInit());
  if (response.status !== 401) return response;

  const refreshed = await coalescedRefreshToken();
  if (refreshed) {
    response = await fetch(url, buildInit());
    if (response.status !== 401) return response;
  }

  logoutAndRedirect();
  return response;
}

export function connectSse(options: SseClientOptions): SseClientHandle {
  const {
    url,
    method = "GET",
    headers = {},
    body = null,
    onEvent,
    onError,
    onOpen,
    onClose,
    signal: externalSignal,
    reconnect = true,
    maxReconnectAttempts = 10,
  } = options;

  const controller = new AbortController();
  let attempt = 0;
  let closed = false;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", () => controller.abort());
    }
  }

  const cleanup = () => {
    if (closed) return;
    closed = true;
    controller.abort();
    onClose?.();
  };

  (async () => {
    const requestHeaders: Record<string, string> = {
      Accept: "text/event-stream",
      ...headers,
    };
    const headersInstance = new Headers();
    for (const [key, value] of Object.entries(requestHeaders)) {
      headersInstance.set(key, value);
    }

    while (!closed) {
      try {
        const response = await fetchSseWithAuth(url, {
          method,
          headers: headersInstance,
          body,
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE request failed: ${response.status} ${response.statusText}`);
        }

        attempt = 0;
        onOpen?.();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!closed) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk.replace(/\r\n/g, "\n");
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const eventChunk of events) {
            const event = parseSSEChunk(eventChunk);
            if (event) onEvent(event);
          }
        }
      } catch (err) {
        if (controller.signal.aborted) {
          break;
        }
        const error = err instanceof Error ? err : new Error(String(err));
        onError?.(error);
      }

      if (!reconnect || closed || controller.signal.aborted) {
        break;
      }

      attempt += 1;
      if (attempt > maxReconnectAttempts) {
        onError?.(new Error(`Max reconnect attempts (${maxReconnectAttempts}) reached`));
        break;
      }

      try {
        await waitForReconnect(sseReconnectDelayMs(attempt), controller.signal);
      } catch {
        break;
      }
    }

    cleanup();
  })();

  return { close: cleanup };
}
