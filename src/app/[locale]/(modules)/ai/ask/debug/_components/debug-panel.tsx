"use client";

import { Bot, ChevronDown, ChevronRight, Send, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CitationDTO } from "@/lib/api/types";
import { useAdminLanguageStore } from "@/stores/admin-language.store";
import type { ThinkingChunk, ToolSuppressedEvent, ToolUseEvent } from "../../_services/ask.hook";
import { useAskAIStream } from "../../_services/ask.hook";

type DebugEntry = {
  type:
    | "thinking"
    | "tool_use"
    | "tool_result"
    | "tool_suppressed"
    | "chunk"
    | "citations"
    | "error";
  timestamp: number;
  data: unknown;
};

export function DebugPanel() {
  const t = useTranslations("surfaces.ai.debug");
  const { start, cancel, isStreaming } = useAskAIStream();
  const adminLanguage = useAdminLanguageStore((s) => s.language);

  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<CitationDTO[] | null>(null);
  const [thinkingChunks, setThinkingChunks] = useState<ThinkingChunk[]>([]);
  const [toolUses, setToolUses] = useState<ToolUseEvent[]>([]);
  const [toolSuppressed, setToolSuppressed] = useState<ToolSuppressedEvent[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    thinking: true,
    tools: true,
  });
  const entriesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (entries.length === 0) return;
    const container = entriesEndRef.current?.closest(".overflow-y-auto");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [entries.length]);

  const addEntry = useCallback((entry: DebugEntry) => {
    setEntries((prev) => [...prev, entry]);
  }, []);

  const handleSend = useCallback(() => {
    if (!query.trim() || isStreaming) return;

    const q = query;
    setQuery("");
    setAnswer("");
    setCitations(null);
    setThinkingChunks([]);
    setToolUses([]);
    setToolSuppressed([]);
    setEntries([]);

    void start(
      {
        query: q,
        language: adminLanguage,
        topK: 5,
        strategy: "agentic",
        debugMode: true,
      },
      {
        onThinking: (thinking, state) => {
          setThinkingChunks(state.thinkingChunks);
          addEntry({ type: "thinking", timestamp: Date.now(), data: thinking });
        },
        onToolUse: (toolUse) => {
          setToolUses((prev) => [...prev, toolUse]);
          addEntry({ type: "tool_use", timestamp: Date.now(), data: toolUse });
        },
        onToolResult: (toolResult) => {
          addEntry({ type: "tool_result", timestamp: Date.now(), data: toolResult });
        },
        onToolSuppressed: (suppressed) => {
          setToolSuppressed((prev) => [...prev, suppressed]);
          addEntry({ type: "tool_suppressed", timestamp: Date.now(), data: suppressed });
        },
        onChunk: (text) => {
          setAnswer((prev) => prev + text);
        },
        onCitations: (cits) => {
          setCitations(cits);
          addEntry({ type: "citations", timestamp: Date.now(), data: cits });
        },
        onError: (error) => {
          addEntry({ type: "error", timestamp: Date.now(), data: error });
        },
      },
      true
    );
  }, [query, isStreaming, adminLanguage, start, addEntry]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
          {t("title")}
        </h1>
        {isStreaming && (
          <Button variant="outline" size="sm" onClick={cancel}>
            {t("cancel")}
          </Button>
        )}
      </div>

      <div className="relative flex items-center">
        <Input
          className="bg-canvas-2 py-2.5 pr-12"
          placeholder={t("placeholder")}
          value={query}
          disabled={isStreaming}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <Button
          size="icon"
          className="absolute right-1.5 h-7 w-7"
          onClick={handleSend}
          disabled={!query.trim() || isStreaming}
          aria-label={t("answer")}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 gap-5">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          {/* Thinking section */}
          <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
            <header className="shrink-0 border-b border-line">
              <button
                type="button"
                onClick={() => toggleSection("thinking")}
                className="flex w-full cursor-pointer select-none items-center gap-2 px-4 py-3 text-left transition-colors duration-base hover:bg-panel-2"
              >
                {expandedSections.thinking ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Bot className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-ink">{t("reasoning")}</h2>
                <span className="text-xs font-normal text-muted-foreground">
                  {t("steps", { count: thinkingChunks.length })}
                </span>
              </button>
            </header>
            {expandedSections.thinking && (
              <div className="px-4 pb-3 pt-3">
                {thinkingChunks.length === 0 && !isStreaming && (
                  <p className="text-xs text-muted-foreground">{t("noReasoning")}</p>
                )}
                <div className="max-h-60 space-y-1 overflow-y-auto">
                  {thinkingChunks.map((tc) => (
                    <p
                      key={tc.timestamp}
                      className="border-l-2 border-line pl-3 text-xs italic leading-relaxed text-muted-foreground"
                    >
                      {tc.text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Tool calls section */}
          <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-card">
            <header className="shrink-0 border-b border-line">
              <button
                type="button"
                onClick={() => toggleSection("tools")}
                className="flex w-full cursor-pointer select-none items-center gap-2 px-4 py-3 text-left transition-colors duration-base hover:bg-panel-2"
              >
                {expandedSections.tools ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-ink">{t("toolCalls")}</h2>
                <span className="text-xs font-normal text-muted-foreground">
                  {t("calls", { count: toolUses.length + toolSuppressed.length })}
                </span>
              </button>
            </header>
            {expandedSections.tools && (
              <div className="px-4 pb-3 pt-3">
                {entries.filter(
                  (e) =>
                    e.type === "tool_use" ||
                    e.type === "tool_result" ||
                    e.type === "tool_suppressed"
                ).length === 0 &&
                  !isStreaming && <p className="text-xs text-muted-foreground">{t("noTools")}</p>}
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {entries
                    .filter(
                      (e) =>
                        e.type === "tool_use" ||
                        e.type === "tool_result" ||
                        e.type === "tool_suppressed"
                    )
                    .map((entry) => {
                      if (entry.type === "tool_use") {
                        const tu = entry.data as ToolUseEvent;
                        return (
                          <div
                            key={`${entry.timestamp}-${entry.type}`}
                            className="rounded-md border border-line bg-panel-2 p-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-info-strong">
                                {t("call")}
                              </span>
                              <span className="text-xs font-semibold text-ink">{tu.tool}</span>
                            </div>
                            {tu.argumentsJson && (
                              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                                {tu.argumentsJson.length > 200
                                  ? `${tu.argumentsJson.slice(0, 200)}...`
                                  : tu.argumentsJson}
                              </pre>
                            )}
                          </div>
                        );
                      }
                      if (entry.type === "tool_result") {
                        const tr = entry.data as { tool: string; resultSummary?: string };
                        return (
                          <div
                            key={`${entry.timestamp}-${entry.type}`}
                            className="ml-4 rounded-md border border-line bg-panel-2 p-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-success-strong">
                                {t("result")}
                              </span>
                              <span className="text-xs font-semibold text-ink">{tr.tool}</span>
                            </div>
                            {tr.resultSummary && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {tr.resultSummary}
                              </p>
                            )}
                          </div>
                        );
                      }
                      if (entry.type === "tool_suppressed") {
                        const ts = entry.data as ToolSuppressedEvent;
                        return (
                          <div
                            key={`${entry.timestamp}-${entry.type}`}
                            className="ml-4 rounded-md border border-line bg-panel-2 p-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-warning-strong">
                                {t("skipped")}
                              </span>
                              <span className="text-xs font-semibold text-ink">{ts.tool}</span>
                            </div>
                            {ts.reason && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t("suppressedReason", { reason: ts.reason })}
                              </p>
                            )}
                            {ts.matchedQuery && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t("matchedQuery", { query: ts.matchedQuery })}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                </div>
              </div>
            )}
          </section>

          {/* Final answer */}
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-card">
            <header className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-3">
              <Bot className="h-4 w-4 text-navy-strong" />
              <h2 className="text-sm font-semibold text-ink">{t("answer")}</h2>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-3">
              {!answer && !isStreaming && (
                <p className="text-xs text-muted-foreground">{t("noAnswer")}</p>
              )}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
              {citations && citations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {citations.slice(0, 5).map((cit) => (
                    <span
                      key={cit.chunkId}
                      className="rounded-full border border-line bg-panel px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {cit.title || "Source"}
                    </span>
                  ))}
                  {citations.length > 5 && (
                    <span className="px-2 py-0.5 text-[11px] text-muted-foreground">
                      +{citations.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Event stream sidebar */}
        <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-card">
          <header className="shrink-0 border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">{t("eventStream")}</h2>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {entries.length === 0 && (
              <p className="p-4 text-xs text-muted-foreground">{t("noEvents")}</p>
            )}
            <div className="divide-y divide-line">
              {entries.map((entry) => (
                <div key={entry.timestamp} className="px-4 py-2 font-mono text-[11px]">
                  <span className="tabular-nums text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>{" "}
                  <span
                    className={
                      entry.type === "error"
                        ? "text-destructive-strong"
                        : entry.type === "tool_use"
                          ? "text-info-strong"
                          : entry.type === "tool_result"
                            ? "text-success-strong"
                            : entry.type === "tool_suppressed"
                              ? "text-warning-strong"
                              : entry.type === "thinking"
                                ? "italic text-muted-foreground"
                                : "text-ink"
                    }
                  >
                    {entry.type}
                  </span>
                </div>
              ))}
            </div>
            <div ref={entriesEndRef} />
          </div>
        </aside>
      </div>
    </div>
  );
}
