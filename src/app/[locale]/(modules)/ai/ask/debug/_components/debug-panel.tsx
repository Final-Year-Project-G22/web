"use client";

import { Bot, ChevronDown, ChevronRight, Send, Wrench } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CitationDTO } from "@/lib/api/types";
import { useAdminLanguageStore } from "@/stores/admin-language.store";
import type { ThinkingChunk, ToolUseEvent } from "../../_services/ask.hook";
import { useAskAIStream } from "../../_services/ask.hook";

type DebugEntry = {
  type: "thinking" | "tool_use" | "tool_result" | "chunk" | "citations" | "error";
  timestamp: number;
  data: unknown;
};

export function DebugPanel() {
  const { start, cancel, isStreaming } = useAskAIStream();
  const adminLanguage = useAdminLanguageStore((s) => s.language);

  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<CitationDTO[] | null>(null);
  const [thinkingChunks, setThinkingChunks] = useState<ThinkingChunk[]>([]);
  const [toolUses, setToolUses] = useState<ToolUseEvent[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    thinking: true,
    tools: true,
  });
  const entriesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    entriesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

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
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Agentic Debug</h1>
        {isStreaming && (
          <Button variant="outline" size="sm" onClick={cancel}>
            Cancel
          </Button>
        )}
      </div>

      <div className="relative flex items-center">
        <Input
          className="pr-12 py-6 rounded-xl border-muted bg-muted/20"
          placeholder="Ask a question (agentic mode, debug on)..."
          value={query}
          disabled={isStreaming}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <Button
          size="icon"
          className="absolute right-2 h-8 w-8 rounded-lg"
          onClick={handleSend}
          disabled={!query.trim() || isStreaming}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Thinking section */}
          <Card>
            <CardHeader
              className="py-3 px-4 cursor-pointer select-none"
              onClick={() => toggleSection("thinking")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {expandedSections.thinking ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Bot className="w-4 h-4 text-muted-foreground" />
                  Reasoning
                  <span className="text-xs text-muted-foreground font-normal">
                    ({thinkingChunks.length} steps)
                  </span>
                </CardTitle>
              </div>
            </CardHeader>
            {expandedSections.thinking && (
              <CardContent className="px-4 pb-3 pt-0">
                {thinkingChunks.length === 0 && !isStreaming && (
                  <p className="text-xs text-muted-foreground">No reasoning steps yet.</p>
                )}
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {thinkingChunks.map((tc) => (
                    <p
                      key={tc.timestamp}
                      className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-muted pl-3"
                    >
                      {tc.text}
                    </p>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Tool calls section */}
          <Card>
            <CardHeader
              className="py-3 px-4 cursor-pointer select-none"
              onClick={() => toggleSection("tools")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  {expandedSections.tools ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  Tool Calls
                  <span className="text-xs text-muted-foreground font-normal">
                    ({toolUses.length} calls)
                  </span>
                </CardTitle>
              </div>
            </CardHeader>
            {expandedSections.tools && (
              <CardContent className="px-4 pb-3 pt-0">
                {entries.filter((e) => e.type === "tool_use" || e.type === "tool_result").length ===
                  0 &&
                  !isStreaming && (
                    <p className="text-xs text-muted-foreground">No tool calls yet.</p>
                  )}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {entries
                    .filter((e) => e.type === "tool_use" || e.type === "tool_result")
                    .map((entry, i) => {
                      if (entry.type === "tool_use") {
                        const tu = entry.data as ToolUseEvent;
                        return (
                          <div
                            key={`${entry.timestamp}-${entry.type}-${i}`}
                            className="border rounded-md p-2 bg-muted/20"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                CALL
                              </span>
                              <span className="text-xs font-semibold">{tu.tool}</span>
                            </div>
                            {tu.argumentsJson && (
                              <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
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
                            key={`${entry.timestamp}-${entry.type}-${i}`}
                            className="border rounded-md p-2 bg-muted/20 ml-4"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                RESULT
                              </span>
                              <span className="text-xs font-semibold">{tr.tool}</span>
                            </div>
                            {tr.resultSummary && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {tr.resultSummary}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Final answer */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Answer
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 overflow-y-auto flex-1 min-h-0">
              {!answer && !isStreaming && (
                <p className="text-xs text-muted-foreground">No answer yet.</p>
              )}
              <div className="prose text-sm max-w-none">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
              {citations && citations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {citations.slice(0, 5).map((cit) => (
                    <span
                      key={cit.chunkId}
                      className="text-xs px-2 py-1 rounded-full border bg-card text-muted-foreground"
                    >
                      {cit.title || "Source"}
                    </span>
                  ))}
                  {citations.length > 5 && (
                    <span className="text-xs px-2 py-1 text-muted-foreground">
                      +{citations.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event stream sidebar */}
        <Card className="w-80 shrink-0 flex flex-col min-h-0">
          <CardHeader className="py-3 px-4 border-b shrink-0">
            <CardTitle className="text-sm font-semibold">Event Stream</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1 min-h-0">
            {entries.length === 0 && (
              <p className="text-xs text-muted-foreground p-4">Waiting for events...</p>
            )}
            <div className="divide-y">
              {entries.map((entry) => (
                <div key={entry.timestamp} className="px-4 py-2 text-xs font-mono">
                  <span className="text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>{" "}
                  <span
                    className={
                      entry.type === "error"
                        ? "text-destructive"
                        : entry.type === "tool_use"
                          ? "text-blue-600 dark:text-blue-400"
                          : entry.type === "tool_result"
                            ? "text-green-600 dark:text-green-400"
                            : entry.type === "thinking"
                              ? "text-muted-foreground italic"
                              : "text-foreground"
                    }
                  >
                    {entry.type}
                  </span>
                </div>
              ))}
            </div>
            <div ref={entriesEndRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
