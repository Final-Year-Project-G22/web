"use client";

import { Bot, Send, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CitationDTO } from "@/lib/api/types";
import { useAdminLanguageStore } from "@/stores/admin-language.store";
import type { ToolUseEvent } from "../_services/ask.hook";
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [inspectedCitation, setInspectedCitation] = useState<CitationDTO | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedSessionRef = useRef<string | null>(null);

  // Load history when a NEW session is selected (not on every query refetch)
  useEffect(() => {
    if (sessionId && sessionId !== loadedSessionRef.current && conversation?.messages) {
      loadedSessionRef.current = sessionId;
      setMessages(
        conversation.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          citations: m.citations ?? undefined,
        }))
      );
    } else if (!sessionId) {
      loadedSessionRef.current = null;
      setMessages([]);
    }
  }, [conversation, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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

    void start(
      {
        query,
        sessionId: currentSessionId ?? undefined,
        language: adminLanguage,
        topK: 3,
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
        onDone: (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: payload.answer || "",
                    citations: payload.citations ?? undefined,
                    toolUses: payload.toolUses?.length ? payload.toolUses : undefined,
                  }
                : msg
            )
          );
          if (payload.sessionId && payload.sessionId !== currentSessionId) {
            onSessionChange(payload.sessionId);
          }
        },
        onError: () => {
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
  }, [chatInput, isStreaming, sessionId, adminLanguage, cancel, start, onSessionChange]);

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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={handleNewChat}
            >
              New Chat
            </Button>
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
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.toolUses && msg.toolUses.length > 0 && (
                    <ToolUseIndicator toolUses={msg.toolUses} />
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
