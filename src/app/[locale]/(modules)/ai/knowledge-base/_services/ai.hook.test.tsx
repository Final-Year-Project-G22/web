import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/auth.store";
import { useAskAIStream } from "./ai.hook";

const encoder = new TextEncoder();

const sseEvent = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

const createStream = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockFetchStream = (chunks: string[]) => {
  const stream = createStream(chunks);
  const response = {
    ok: true,
    status: 200,
    body: stream,
    headers: new Headers(),
  };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  useAuthStore.setState({ token: null });
});

describe("useAskAIStream", () => {
  it("streams chunks, replaces citations, and returns done payload", async () => {
    useAuthStore.setState({ token: "test-token" });

    const full =
      sseEvent("chunk", { text: "Hello " }) +
      sseEvent("citations", {
        citations: [
          {
            chunkId: "c1",
            documentId: "d1",
            score: 0.9,
            sourceType: "doc",
            title: "Doc 1",
          },
        ],
      }) +
      sseEvent("chunk", { text: "world" }) +
      sseEvent("citations", {
        citations: [
          {
            chunkId: "c2",
            documentId: "d2",
            score: 0.8,
            sourceType: "doc",
          },
        ],
      }) +
      sseEvent("done", {
        model: "test-model",
        latencyMs: 12,
        usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
        sessionId: "s1",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      });

    const chunks = [full.slice(0, 40), full.slice(40, 120), full.slice(120)];
    mockFetchStream(chunks);

    const onChunk = vi.fn();
    const onCitations = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useAskAIStream(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.start({ query: "hello" }, { onChunk, onCitations, onDone, onError });
    });

    expect(onError).not.toHaveBeenCalled();
    expect(onChunk).toHaveBeenCalled();
    expect(onCitations).toHaveBeenCalledTimes(2);
    expect(onDone).toHaveBeenCalledTimes(1);

    const donePayload = onDone.mock.calls[0][0];
    expect(donePayload.answer).toBe("Hello world");
    expect(donePayload.citations?.[0]?.documentId).toBe("d2");
  });

  it("handles error events", async () => {
    useAuthStore.setState({ token: "test-token" });

    mockFetchStream([sseEvent("error", { code: "bad", message: "oops" })]);

    const onDone = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useAskAIStream(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.start({ query: "hello" }, { onDone, onError });
    });

    expect(onDone).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith({ code: "bad", message: "oops" });
    expect(result.current.isStreaming).toBe(false);
  });
});
