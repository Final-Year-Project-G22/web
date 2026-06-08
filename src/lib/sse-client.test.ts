import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectSse, type SseEvent } from "@/lib/sse-client";

const mockRefreshToken = vi.fn();
const mockEnsureFreshSession = vi.fn();
const mockLogoutAndRedirect = vi.fn();
const mockToken = "test-token";

vi.mock("@/lib/api/mutator/custom-fetch", () => ({
  refreshToken: () => mockRefreshToken(),
  ensureFreshSession: () => mockEnsureFreshSession(),
  logoutAndRedirect: () => mockLogoutAndRedirect(),
}));

vi.mock("@/store/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ token: mockToken }),
  },
}));

function createSseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 5));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("sse-client", () => {
  beforeEach(() => {
    mockRefreshToken.mockReset();
    mockEnsureFreshSession.mockReset();
    mockLogoutAndRedirect.mockReset();
    mockEnsureFreshSession.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects and dispatches parsed events", async () => {
    const events: SseEvent[] = [];
    const onEvent = vi.fn((e: SseEvent) => events.push(e));

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        createSseResponse([
          'event: chunk\ndata: {"text":"hello"}\n\n',
          'event: done\ndata: {"ok":true}\n\n',
        ])
      );

    const handle = connectSse({ url: "/api/stream", onEvent, reconnect: false });

    await new Promise((r) => setTimeout(r, 50));

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(events[0]).toEqual({ event: "chunk", data: '{"text":"hello"}' });
    expect(events[1]).toEqual({ event: "done", data: '{"ok":true}' });

    handle.close();
  });

  it("handles multi-line data fields", async () => {
    const events: SseEvent[] = [];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createSseResponse(["event: msg\ndata: line1\ndata: line2\n\n"]));

    const handle = connectSse({
      url: "/api/stream",
      onEvent: (e) => events.push(e),
      reconnect: false,
    });

    await new Promise((r) => setTimeout(r, 30));

    expect(events[0].data).toBe("line1\nline2");

    handle.close();
  });

  it("ignores comment lines (lines starting with :)", async () => {
    const events: SseEvent[] = [];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(createSseResponse([": heartbeat\nevent: ping\ndata: ok\n\n"]));

    const handle = connectSse({
      url: "/api/stream",
      onEvent: (e) => events.push(e),
      reconnect: false,
    });

    await new Promise((r) => setTimeout(r, 30));

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("ping");

    handle.close();
  });

  it("retries on 401 with token refresh, then succeeds", async () => {
    const events: SseEvent[] = [];
    mockRefreshToken.mockResolvedValue(true);

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(createSseResponse(["event: ok\ndata: success\n\n"]));

    const handle = connectSse({
      url: "/api/stream",
      onEvent: (e) => events.push(e),
      reconnect: false,
    });

    await new Promise((r) => setTimeout(r, 30));

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe("success");

    handle.close();
  });

  it("coalesces concurrent 401 refreshes from multiple connections", async () => {
    mockRefreshToken.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 20))
    );

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(createSseResponse(["event: ok\ndata: a\n\n"]))
      .mockResolvedValueOnce(createSseResponse(["event: ok\ndata: b\n\n"]))
      .mockResolvedValueOnce(createSseResponse(["event: ok\ndata: c\n\n"]));

    const h1 = connectSse({ url: "/api/stream1", onEvent: () => {}, reconnect: false });
    const h2 = connectSse({ url: "/api/stream2", onEvent: () => {}, reconnect: false });
    const h3 = connectSse({ url: "/api/stream3", onEvent: () => {}, reconnect: false });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);

    h1.close();
    h2.close();
    h3.close();
  });

  it("calls logoutAndRedirect when refresh fails after 401", async () => {
    mockRefreshToken.mockResolvedValue(false);

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    const handle = connectSse({
      url: "/api/stream",
      onEvent: () => {},
      reconnect: false,
    });

    await new Promise((r) => setTimeout(r, 30));

    expect(mockLogoutAndRedirect).toHaveBeenCalled();

    handle.close();
  });

  it("aborts cleanly when signal is triggered", async () => {
    const onError = vi.fn();
    const controller = new AbortController();

    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(createSseResponse([])), 100);
        })
    );

    const handle = connectSse({
      url: "/api/stream",
      onEvent: () => {},
      onError,
      signal: controller.signal,
      reconnect: false,
    });

    controller.abort();
    await new Promise((r) => setTimeout(r, 150));

    expect(onError).not.toHaveBeenCalled();

    handle.close();
  });

  it("calls onOpen when connection establishes", async () => {
    const onOpen = vi.fn();

    global.fetch = vi.fn().mockResolvedValueOnce(createSseResponse([]));

    const handle = connectSse({
      url: "/api/stream",
      onEvent: () => {},
      onOpen,
      reconnect: false,
    });

    await new Promise((r) => setTimeout(r, 30));

    expect(onOpen).toHaveBeenCalledTimes(1);

    handle.close();
  });

  it("calls onError when fetch fails", async () => {
    const onError = vi.fn();
    const networkError = new Error("Network down");

    global.fetch = vi.fn().mockRejectedValueOnce(networkError);

    const handle = connectSse({
      url: "/api/stream",
      onEvent: () => {},
      onError,
      reconnect: false,
    });

    await new Promise((r) => setTimeout(r, 30));

    expect(onError).toHaveBeenCalledWith(networkError);

    handle.close();
  });

  it("includes Authorization header with current token", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(createSseResponse([]));

    const handle = connectSse({
      url: "/api/stream",
      onEvent: () => {},
      reconnect: false,
    });

    await new Promise((r) => setTimeout(r, 30));

    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = call[1].headers as Headers;
    expect(headers.get("Authorization")).toBe(`Bearer ${mockToken}`);
    expect(headers.get("Accept")).toBe("text/event-stream");

    handle.close();
  });
});
