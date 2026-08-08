"use client";

import { Bot, Send, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CitationDTO } from "@/lib/api/types";
import { useAuthStore } from "@/store/auth.store";
import { useAdminLanguageStore } from "@/stores/admin-language.store";
import type { ThinkingChunk, ToolUseEvent } from "../_services/ask.hook";
import {
  useAIGetConversation,
  useArchiveConversation,
  useAskAIStream,
} from "../_services/ask.hook";
import { ChunkInspector } from "./chunk-inspector";
import { ToolUseIndicator } from "./tool-use-indicator";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: CitationDTO[];
  toolUses?: ToolUseEvent[];
  toolResults?: string[];
  thinkingChunks?: ThinkingChunk[];
};

type ChatPanelProps = {
  sessionId: string | null;
  onSessionChange: (id: string | null) => void;
};

export function ChatPanel({ sessionId, onSessionChange }: ChatPanelProps) {
  const t = useTranslations("surfaces.ai.ask");
  const { data: conversation } = useAIGetConversation(sessionId);
  const archiveConv = useArchiveConversation();
  const { start, cancel, isStreaming } = useAskAIStream();
  const adminLanguage = useAdminLanguageStore((s) => s.language);
  const permissions = useAuthStore((s) => s.permissions);
  const isAdmin =
    permissions?.some((p) => p.name === "ai.admin.stream" || p.name === "super_admin") ?? false;

  const [strategy, setStrategy] = useState<"simple" | "agentic">("simple");
  const [debugMode, setDebugMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [inspectedCitation, setInspectedCitation] = useState<CitationDTO | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentSessionRef = useRef<string | null>(null);
  const streamingSessionRef = useRef<string | null>(null);

  // Load messages from the server whenever sessionId changes to a session we haven't yet displayed.
  // Once displayed (bootstrapped or streamed into), further conversation refetches are ignored.
  useEffect(() => {
    if (!sessionId) {
      currentSessionRef.current = null;
      setMessages([]);
      setInspectedCitation(null);
      return;
    }
    // Already showing this session's messages (either from server bootstrapping or local streaming).
    if (sessionId === currentSessionRef.current) return;
    // Currently streaming into this session — the streaming data is authoritative.
    if (sessionId === streamingSessionRef.current) return;
    // No server data yet.
    if (!conversation?.messages) return;

    currentSessionRef.current = sessionId;

    const sorted = [...conversation.messages].sort((a, b) => {
      const time = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (time !== 0) return time;
      // Same timestamp: user messages come before assistant messages
      if (a.role !== b.role) return a.role === "user" ? -1 : 1;
      return 0;
    });

    // Remove true duplicates only (same role + identical content)
    const deduped = sorted.reduce<typeof conversation.messages>((acc, m) => {
      const last = acc[acc.length - 1];
      if (last && last.role === m.role && last.content === m.content) return acc;
      acc.push(m);
      return acc;
    }, []);

    setMessages(
      deduped.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        citations: m.citations ?? undefined,
      }))
    );
  }, [conversation, sessionId]);

  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    if (!lastMessage) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lastMessage]);

  const handleSend = useCallback(() => {
    if (!chatInput.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: chatInput,
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    const query = chatInput;
    setChatInput("");

    cancel();
    const currentSessionId = sessionId;
    if (currentSessionId) streamingSessionRef.current = currentSessionId;

    void start(
      {
        query,
        sessionId: currentSessionId ?? undefined,
        language: adminLanguage,
        topK: 3,
        strategy,
        debugMode,
      },
      {
        onChunk: (_, state) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: state.answer || "" } : msg
            )
          );
        },
        onCitations: (citations) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, citations: citations ?? undefined } : msg
            )
          );
        },
        onToolUse: (toolUse) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, toolUses: [...(msg.toolUses ?? []), toolUse] }
                : msg
            )
          );
        },
        onToolResult: (toolResult) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    toolResults: [
                      ...(msg.toolResults ?? []),
                      toolResult.resultSummary || `Executed ${toolResult.tool}`,
                    ],
                  }
                : msg
            )
          );
        },
        onThinking: (_, state) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, thinkingChunks: state.thinkingChunks } : msg
            )
          );
        },
        onDone: (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: payload.answer || "",
                    citations: payload.citations ?? undefined,
                    toolUses: payload.toolUses?.length ? payload.toolUses : undefined,
                    thinkingChunks: payload.thinkingChunks?.length
                      ? payload.thinkingChunks
                      : undefined,
                  }
                : msg
            )
          );
          if (payload.sessionId) {
            currentSessionRef.current = payload.sessionId;
            onSessionChange(payload.sessionId);
          }
          streamingSessionRef.current = null;
        },
        onError: () => {
          streamingSessionRef.current = null;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: "*Error fetching response from AI.*" }
                : msg
            )
          );
        },
      }
    );
  }, [
    chatInput,
    isStreaming,
    sessionId,
    adminLanguage,
    strategy,
    debugMode,
    cancel,
    start,
    onSessionChange,
  ]);

  const handleNewChat = () => {
    if (sessionId) {
      archiveConv.mutate(sessionId);
    }
    cancel();
    setMessages([]);
    setInspectedCitation(null);
    onSessionChange(null);
  };

  // Close the citation inspector with Escape on every viewport (mobile sheet + desktop aside).
  useEffect(() => {
    if (!inspectedCitation) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInspectedCitation(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inspectedCitation]);

  const showEmptyState = messages.length === 0 && !sessionId;

  // Citations for the hairline sources sidebar — from the latest answered message.
  const sources =
    [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.citations && m.citations.length > 0)?.citations ??
    [];

  return (
    <div className="flex min-h-0 flex-1 gap-5">
      {/* conversation column — composer bottom-locked */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-card">
        {/* header */}
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy-tint text-navy-strong">
              <Bot className="h-4 w-4" />
            </span>
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-[14px] font-semibold text-ink">{t("title")}</h2>
              {sources.length > 0 && (
                <span className="text-[11.5px] text-muted-foreground">
                  {t("grounded", { count: sources.length })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-7 items-center rounded-md border border-input bg-panel p-0.5">
              <button
                type="button"
                onClick={() => setStrategy("simple")}
                className={`h-full rounded-[5px] px-2.5 text-xs font-medium transition-colors duration-base ${
                  strategy === "simple"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("simple")}
              </button>
              <button
                type="button"
                onClick={() => setStrategy("agentic")}
                className={`h-full rounded-[5px] px-2.5 text-xs font-medium transition-colors duration-base ${
                  strategy === "agentic"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("agentic")}
              </button>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setDebugMode((d) => !d)}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-base ${
                  debugMode
                    ? "border-warning/30 bg-warning-tint text-warning-strong"
                    : "border-line text-muted-foreground hover:text-foreground"
                }`}
              >
                Debug
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={handleNewChat}
            >
              {t("newChat")}
            </Button>
          </div>
        </header>

        {/* messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {showEmptyState && (
            <div className="flex h-full flex-col items-center justify-center space-y-2 text-muted-foreground">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-panel-2">
                <Bot className="h-5 w-5 opacity-60" />
              </span>
              <p className="text-sm">{t("emptyState")}</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex max-w-[85%] gap-3 ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  msg.role === "user" ? "bg-panel-2" : "bg-navy-tint"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-navy-strong" />
                )}
              </div>
              <div
                className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`rounded-lg px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-navy text-primary-foreground rounded-br-sm"
                      : "border border-line bg-panel-2 text-ink rounded-bl-sm"
                  }`}
                >
                  {!msg.content &&
                  msg.role === "assistant" &&
                  !msg.toolUses?.length &&
                  !msg.thinkingChunks?.length ? (
                    <span className="flex items-center gap-1.5 py-0.5 text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-info-strong" />
                      {t("thinking")}
                    </span>
                  ) : msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                  {/* Inline debug view: shown when debug mode is active and there's any debug data */}
                  {(msg.thinkingChunks?.length ||
                    msg.toolUses?.length ||
                    msg.toolResults?.length) && (
                    <div className="mt-2 space-y-1.5 rounded-md border border-line bg-panel p-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Debug
                      </p>
                      {msg.thinkingChunks?.map((tc) => (
                        <p
                          key={tc.timestamp}
                          className="border-l-2 border-line pl-2 text-xs italic leading-relaxed text-muted-foreground"
                        >
                          {tc.text}
                        </p>
                      ))}
                      {msg.toolUses?.length ? <ToolUseIndicator toolUses={msg.toolUses} /> : null}
                      {msg.toolResults?.map((result) => (
                        <p
                          key={result}
                          className="ml-3 border-l-2 border-success-tint pl-2 text-xs text-success-strong"
                        >
                          {result}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {msg.citations.slice(0, 3).map((cit) => (
                      <button
                        key={cit.chunkId}
                        type="button"
                        onClick={() => setInspectedCitation(cit)}
                        className="rounded-full border border-line bg-panel px-2 py-0.5 text-[11px] text-muted-foreground transition-colors duration-base hover:bg-panel-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <span className="font-medium text-info-strong">
                          {cit.sourceType || t("source")}
                        </span>
                        <span className="mx-1">·</span>
                        {cit.title || `Source ${cit.chunkId.slice(0, 8)}`}
                      </button>
                    ))}
                    {msg.citations.length > 3 && (
                      <span className="px-2 py-0.5 text-[11px] text-muted-foreground">
                        +{msg.citations.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* composer — bottom-locked */}
        <div className="shrink-0 border-t border-line bg-panel px-5 py-3">
          <div className="relative flex items-center">
            <Input
              className="bg-canvas-2 py-2.5 pr-12"
              placeholder={t("placeholder")}
              value={chatInput}
              disabled={isStreaming}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <Button
              size="icon"
              className="absolute right-1.5 h-7 w-7"
              onClick={handleSend}
              disabled={!chatInput.trim() || isStreaming}
              aria-label={t("ask")}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("disclaimer")}</p>
        </div>

        {/* mobile citation inspector — bottom sheet within the chat column (desktop keeps the hairline aside) */}
        {inspectedCitation ? (
          <div className="absolute inset-0 z-20 flex flex-col justify-end lg:hidden">
            <button
              type="button"
              aria-label={t("close")}
              onClick={() => setInspectedCitation(null)}
              className="absolute inset-0 animate-in bg-black/50 duration-150 fade-in-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 motion-reduce:animate-none"
            />
            <div className="relative max-h-[70%] animate-in overflow-y-auto rounded-t-lg border-t border-line bg-panel shadow-popover duration-200 motion-reduce:animate-none slide-in-from-bottom-2">
              <ChunkInspector
                citation={inspectedCitation}
                onClose={() => setInspectedCitation(null)}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* citations — hairline sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-card lg:flex">
        <div className="flex items-baseline justify-between border-b border-line px-4 py-3.5">
          <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            {t("sources")}
          </h2>
          {sources.length > 0 && (
            <span className="text-[11.5px] text-muted-foreground">
              {t("grounded", { count: sources.length })}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {inspectedCitation ? (
            <ChunkInspector
              citation={inspectedCitation}
              onClose={() => setInspectedCitation(null)}
            />
          ) : sources.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
              {t("noSources")}
            </p>
          ) : (
            <div className="space-y-1 p-3">
              {sources.map((cit, idx) => (
                <button
                  key={cit.chunkId}
                  type="button"
                  onClick={() => setInspectedCitation(cit)}
                  className="flex w-full items-start gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors duration-base hover:bg-panel-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {cit.title || `${t("source")} ${idx + 1}`}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium text-info-strong">
                        {cit.sourceType || t("source")}
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">
                        {(cit.score * 100).toFixed(0)}%
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
