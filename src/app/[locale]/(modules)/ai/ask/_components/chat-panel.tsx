"use client";

import { Bot, Send, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSessionRef = useRef<string | null>(null);
  const streamingSessionRef = useRef<string | null>(null);

  // Load messages from the server whenever sessionId changes to a session we haven't yet displayed.
  // Once displayed (bootstrapped or streamed into), further conversation refetches are ignored.
  useEffect(() => {
    if (!sessionId) {
      currentSessionRef.current = null;
      setMessages([]);
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
      const t = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (t !== 0) return t;
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

  useEffect(() => {
    if (messages.length === 0) return;
    const container = messagesEndRef.current?.closest("[data-slot='card-content']");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length]);

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

  const showEmptyState = messages.length === 0 && !sessionId;

  return (
    <div className="flex flex-1 gap-4 min-h-0">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-semibold">Ask AI</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border p-0.5">
                  <button
                    type="button"
                    onClick={() => setStrategy("simple")}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      strategy === "simple"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setStrategy("agentic")}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      strategy === "agentic"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Agentic
                  </button>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setDebugMode((d) => !d)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      debugMode
                        ? "bg-warning/10 text-warning border-warning/30"
                        : "text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    Debug
                  </button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={handleNewChat}
              >
                New Chat
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {showEmptyState && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
              <Bot className="w-10 h-10 opacity-20" />
              <p className="text-sm">Ask questions based on your knowledge base.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === "user" ? "bg-muted" : "bg-primary/10"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-primary" />
                )}
              </div>
              <div
                className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-sm prose ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/50 text-foreground border rounded-tl-sm prose-p:leading-relaxed"
                  }`}
                >
                  {!msg.content &&
                  msg.role === "assistant" &&
                  !msg.toolUses?.length &&
                  !msg.thinkingChunks?.length ? (
                    <span className="flex items-center gap-1 py-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </span>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                  {/* Inline debug view: shown when debug mode is active and there's any debug data */}
                  {(msg.thinkingChunks?.length ||
                    msg.toolUses?.length ||
                    msg.toolResults?.length) && (
                    <div className="mt-2 space-y-1.5 border rounded-md bg-muted/20 p-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Debug
                      </p>
                      {msg.thinkingChunks?.map((tc) => (
                        <p
                          key={tc.timestamp}
                          className="text-xs text-muted-foreground italic leading-relaxed border-l-2 border-muted pl-2"
                        >
                          {tc.text}
                        </p>
                      ))}
                      {msg.toolUses?.map((tu) => (
                        <div
                          key={`${tu.tool}-${tu.argumentsJson ?? ""}`}
                          className="flex items-start gap-1.5 text-xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />
                          <div>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {tu.tool}
                            </span>
                            {tu.argumentsJson && (
                              <pre className="text-[10px] text-muted-foreground mt-0.5 overflow-x-auto whitespace-pre-wrap">
                                {tu.argumentsJson.length > 150
                                  ? `${tu.argumentsJson.slice(0, 150)}...`
                                  : tu.argumentsJson}
                              </pre>
                            )}
                          </div>
                        </div>
                      ))}
                      {msg.toolResults?.map((r) => (
                        <p
                          key={r}
                          className="text-xs text-green-600 dark:text-green-400 border-l-2 border-green-500 pl-2 ml-3"
                        >
                          {r}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.citations.slice(0, 3).map((cit) => (
                      <button
                        key={cit.chunkId}
                        type="button"
                        onClick={() => setInspectedCitation(cit)}
                        className="text-xs px-2 py-1 rounded-full border bg-card text-muted-foreground hover:bg-muted transition-colors"
                      >
                        {cit.title || `Source`}
                      </button>
                    ))}
                    {msg.citations.length > 3 && (
                      <span className="text-xs px-2 py-1 text-muted-foreground">
                        +{msg.citations.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 border-t bg-card mt-auto rounded-b-xl">
          <div className="relative flex items-center">
            <Input
              className="pr-12 py-6 rounded-xl border-muted bg-muted/20"
              placeholder="Ask a question..."
              value={chatInput}
              disabled={isStreaming}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <Button
              size="icon"
              className="absolute right-2 h-8 w-8 rounded-lg"
              onClick={handleSend}
              disabled={!chatInput.trim() || isStreaming}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            AI can make mistakes. Verify with source documents.
          </p>
        </div>
      </Card>

      {inspectedCitation && sessionId && (
        <div className="w-72 shrink-0">
          <ChunkInspector citation={inspectedCitation} onClose={() => setInspectedCitation(null)} />
        </div>
      )}
    </div>
  );
}
