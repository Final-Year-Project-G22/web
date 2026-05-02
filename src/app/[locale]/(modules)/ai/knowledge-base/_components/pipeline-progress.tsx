"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
// Temporarily we can pass selectedDocId once the UI connects documents to their view
export function PipelineProgress({ selectedDocId }: { selectedDocId?: string }) {
  // If we had SSE, we'd listen to the stream. For now, mock stages based on selection
  const isReady = !selectedDocId;

  return (
    <Card>
      <CardHeader className="pb-3 px-6 pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
            Processing Pipeline
          </CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isReady ? "bg-green-500 animate-pulse" : "bg-primary animate-pulse"}`}
            />
            <span className={`text-sm font-medium ${isReady ? "text-green-600" : "text-primary"}`}>
              {isReady ? "System Ready" : `Processing ${selectedDocId}`}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-6 pb-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">1. Text Extraction (OCR)</span>
            <span className={isReady ? "text-green-600 font-medium" : "text-muted-foreground"}>
              {isReady ? "Complete" : "Pending..."}
            </span>
          </div>
          <Progress
            value={isReady ? 100 : 0}
            className={isReady ? "h-1.5 [&>div]:bg-green-500" : "h-1.5"}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">2. Chunking Strategy</span>
            <span className={isReady ? "text-green-600 font-medium" : "text-muted-foreground"}>
              {isReady ? "Complete" : "Pending..."}
            </span>
          </div>
          <Progress
            value={isReady ? 100 : 0}
            className={isReady ? "h-1.5 [&>div]:bg-green-500" : "h-1.5"}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">3. Vectorization & Indexing</span>
            <span className={isReady ? "text-green-600 font-medium" : "text-muted-foreground"}>
              {isReady ? "Complete" : "Pending..."}
            </span>
          </div>
          <Progress
            value={isReady ? 100 : 0}
            className={isReady ? "h-1.5 [&>div]:bg-green-500" : "h-1.5"}
          />
        </div>
      </CardContent>
    </Card>
  );
}
