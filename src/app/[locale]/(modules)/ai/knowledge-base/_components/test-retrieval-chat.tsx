"use client";

import { Bot, Send, Settings, User } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAskAI } from "../_services/ai.hook";

// Helper internal type to hold chat pairs
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: { title: string; excerpt: string };
};

export function TestRetrievalChat() {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { mutate: askAI, isPending } = useAskAI();

  const handleSend = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = chatInput;
    setChatInput("");

    askAI(
      { query: currentQuery, topK: 3 }, // Simplified settings payload for now
      {
        onSuccess: (data) => {
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.answer || "No answer provided.",
            source: data.citations?.[0]
              ? {
                  title: data.citations[0].title || `Chunk - ${data.citations[0].documentId}`,
                  excerpt: `(Chunk ID: ${data.citations[0].chunkId})`,
                }
              : undefined,
          };
          setMessages((prev) => [...prev, aiMessage]);
        },
        onError: () => {
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "*Error fetching response form AI.*",
          };
          setMessages((prev) => [...prev, aiMessage]);
        },
      }
    );
  };

  return (
    <Card className="flex-1 flex flex-col max-h-[600px]">
      <CardHeader className="pb-3 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-semibold">Test Retrieval</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              title="Settings (topK, language)"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => setMessages([])}
            >
              Reset Context
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
            <Bot className="w-10 h-10 opacity-20" />
            <p className="text-sm">Start asking questions based on your knowledge base.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
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
              </div>
              {msg.source && (
                <div className="mt-1 border rounded-lg p-3 bg-card w-full max-w-sm text-xs space-y-1">
                  <div className="font-semibold text-muted-foreground flex justify-between">
                    <span>TOP SOURCE USED</span>
                  </div>
                  <div className="bg-muted/30 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors border">
                    <p className="font-medium truncate">{msg.source.title}</p>
                    <p className="text-muted-foreground line-clamp-2 mt-1">{msg.source.excerpt}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="px-4 py-3 rounded-2xl text-sm bg-muted/50 border rounded-tl-sm text-muted-foreground">
              Thinking...
            </div>
          </div>
        )}
      </CardContent>

      {/* Input Box */}
      <div className="p-4 border-t bg-card mt-auto rounded-b-xl">
        <div className="relative flex items-center">
          <Input
            className="pr-12 py-6 rounded-xl border-muted bg-muted/20"
            placeholder="Ask a question..."
            value={chatInput}
            disabled={isPending}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <Button
            size="icon"
            className="absolute right-2 h-8 w-8 rounded-lg"
            onClick={handleSend}
            disabled={!chatInput.trim() || isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-3">
          AI can make mistakes. Verify with source documents.
        </p>
      </div>
    </Card>
  );
}
