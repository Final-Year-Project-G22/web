# AI Module Upgrade — Design & Implementation Plan

## Status: Draft

## Context

The AI module currently has a single Knowledge Base page with:
- Document upload (bare — no metadata collection)
- Ingestion pipeline status with SSE real-time updates
- Dead Letter Queue management
- A local-state-only test chat (no session persistence, no conversation history, no language awareness)

The API was migrated from the old `categories` taxonomy to `sectors` + `tags`. The existing `FinalizeUploadRequest` already accepts `sectorIds`, `tagIds`, `declaredLanguage`, `sourceFilename`, `region`, `stage` but these are never collected from the user.

## What We're Building

| # | Feature | Scope |
|---|---------|-------|
| 1 | **Rich document management** | Metadata collection on upload, enriched document list display |
| 2 | **Localization** | `Accept-Language` header drives AI language |
| 3 | **Conversation history** | Session persistence, history sidebar, archive/new chat lifecycle |
| 4 | **Chunk inspector** | Citation excerpt display in chat responses |
| 5 | **Two-page split** | Knowledge Base (documents) vs Ask (chat) as separate routes |
| 6 | **Agentic AI** | System persona, tool calling, capability discovery via gRPC |

---

## Architecture

### System Diagram

```
┌─────────────────────────┐       REST / SSE        ┌──────────────────────┐
│    Web Frontend (Next)  │ ◄──────────────────────► │  Core Backend (Go)  │
│                         │                          │                      │
│  /ai/knowledge-base/    │                          │  ┌────────────────┐  │
│  /ai/ask/               │                          │  │ Ingestion      │  │
│                         │                          │  │ Service        │  │
│  custom-fetch.ts        │                          │  ├────────────────┤  │
│    Accept-Language      │                          │  │ Status         │  │
│                         │                          │  │ Projection     │  │
└─────────────────────────┘                          │  ├────────────────┤  │
        │                                            │  │ Ask Service    │──┼──┐
        │ gRPC (via proxy)                           │  ├────────────────┤  │  │
        ▼                                            │  │ AIToolService  │  │  │
┌─────────────────────────┐                          │  │  (NEW)         │  │  │
│   AI Service (Python)    │ ◄──── gRPC Tool ────────┘  └────────────────┘  │  │
│                         │       Execute             │                      │  │
│  ┌───────────────────┐  │                          │  Module Usecases    │  │
│  │ AskAI Use Case    │  │                          │  ├ GuideService     │◄─┘  │
│  │  + tool calling   │  │                          │  ├ TaxonomyService  │     │
│  │  + system prompt  │  │                          │  ├ CommunityService │     │
│  │  + history feed   │  │                          │  └ ...              │     │
│  ├───────────────────┤  │                          └──────────────────────┘     │
│  │ LLM Adapters      │  │                          │                           │
│  │  + tools support  │  │                          │ RabbitMQ                  │
│  ├───────────────────┤  │                          │                           │
│  │ Knowledge Repo    │  │                          └───────────────────────────┘
│  │ (pgvector)        │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Data Flow: Ask with Tool Calling

```
User query
  │
  ▼
Frontend POST /api/v1/ai/ask
  │
  ▼
Core-backend AskHandler
  │  Reads Accept-Language → language
  │  Resolves gRPC to AI service
  ▼
AI Service: AskAIUseCase
  │
  ├── 1. Resolve conversation session
  ├── 2. Embed query → hybrid search (vector + BM25)
  ├── 3. Fetch conversation history (last N messages)
  ├── 4. Call gRPC AIToolService.ListTools → get available tools
  ├── 5. Build prompt:
  │       System: {persona} + "You have these tools: {tool definitions}"
  │       History: last N messages
  │       Context: retrieved chunks
  │       Question: user query
  ├── 6. Call LLM with tools param
  │
  ├── [If LLM returns tool_call]
  │     ▼
  │   AI Service calls gRPC AIToolService.ExecuteTool{tool, args}
  │     ▼
  │   Core-backend validates args → calls module usecase → returns result
  │     ▼
  │   AI Service feeds result → LLM for final answer
  │
  └── [If LLM returns text answer]
        ▼
      Return response (with citations, tool_uses)
```

### Data Flow: Document Lifecycle

```
Upload:
  Frontend                    Core-backend               AI Service
    │                             │                         │
    ├─ modal: title, lang,        │                         │
    │  sectors, tags              │                         │
    ├─ file picker                │                         │
    ├─ SHA-256                    │                         │
    ├─ POST /uploads/intents ───► │                         │
    │◄─── {uploadUrl, key} ──────┤                         │
    ├─ PUT {uploadUrl} (file)     │                         │
    ├─ POST /uploads/finalize ──► │                         │
    │  {title, lang, sectors,     │                         │
    │   tags, checksum, key...}   │                         │
    │                             ├─ store ingestion_document│
    │                             ├─ create outbox event ───►│
    │◄── {documentId, eventId} ───┤                         ├─ ingest pipeline
    │                             │                         │  fetch→chunk→embed→index

Delete:
  Frontend                    Core-backend               AI Service
    │                             │                         │
    ├─ DELETE /documents/{id} ──► │                         │
    │                             ├─ delete from SeaweedFS   │
    │                             ├─ soft-delete ingestion_doc│
    │                             ├─ hard-delete projection  │
    │                             ├─ publish lifecycle event─►│
    │◄── {success} ───────────────┤                         ├─ hard-delete chunks
    │                                                       ├─ soft-delete document
```

---

## Phase 1: Backend Foundation

### 1.1 Enrich Ingestion Status Response

**Files changed (core-backend):**

| File | Change |
|------|--------|
| `internal/modules/ai/delivery/dto/ingestion_dto.go` | Add new `DocumentStatusResponse` type with metadata fields + projection |
| `internal/modules/ai/delivery/handler/status_handler.go` | JOIN `ingestion_documents` to include metadata |
| `internal/modules/ai/domain/entity/ingestion_document.go` | Ensure all exported fields are accessible |
| `web/src/openapi/openapi.json` | Regenerate spec |
| `web/orval.config.ts` | Re-run Orval |

**New `DocumentStatusResponse` schema:**

```json
{
  "documentId": "uuid",
  "sourceFilename": "string | null",
  "declaredLanguage": "string | null",
  "sectorIds": ["uuid"],
  "tagIds": ["uuid"],
  "region": "string | null",
  "stage": "string | null",
  // Projection fields:
  "currentStage": "string",
  "isTerminal": "boolean",
  "startedAt": "datetime",
  "updatedAt": "datetime",
  "completedAt": "datetime | null",
  "lastError": "string | null",
  "chunksProcessedCount": "int",
  "chunksFailedCount": "int"
}
```

### 1.2 Fix Delete Flow

**Core-backend changes:**

`internal/modules/ai/application/service/ingestion_service.go`:
```go
func (s *IngestionService) DeleteDocument(ctx, documentID, accountID) {
    // 1. Fetch document (verify ownership)
    doc := s.docRepo.GetByID(documentID)
    if doc.AccountID != accountID { return ErrForbidden }

    // 2. Delete from storage (new: PresignedDeleteURL)
    signedDeleteURL := s.storage.GetPresignedDeleteURL(doc.StorageKey)
    http.Do(DELETE, signedDeleteURL)

    // 3. Soft-delete ingestion_documents row
    s.docRepo.SoftDelete(documentID)

    // 4. Hard-delete projection
    s.statusRepo.DeleteByDocumentID(documentID)

    // 5. Publish lifecycle removed event (new)
    s.outboxRepo.Create(IngestionOutbox{
        EventType: "document.lifecycle.removed.v1",
        Payload: { "document_id": doc.ID },
    })
}
```

**New storage method** `GetPresignedDeleteURL(storageKey)` — SeaweedFS supports presigned DELETE URLs similar to GET. Implement in the `storage` abstraction layer.

**AI service changes (new handler):**

`workers/tasks/lifecycle_removed.py`:
```python
async def handle(self, payload):
    document_id = payload["document_id"]
    # 1. Hard-delete all chunks
    await self.knowledge_repo.delete_chunks_by_document(document_id)
    # 2. Soft-delete the document
    await self.knowledge_repo.soft_delete_document(document_id)
```

Register this handler for `document.lifecycle.removed.v1` in `workers/ingestion_worker.py`.

### 1.3 Add Chunk Excerpt to Citations

**Proto change** (`proto/ai/inference/v1/service.proto`):
```protobuf
message Citation {
  string document_id = 1;
  string chunk_id = 2;
  string source_type = 3;
  optional string title = 4;
  double score = 5;
  optional string excerpt = 6;  // NEW
}
```

**Core-backend changes** — thread `Excerpt` through `port.Citation` → `CitationDTO`.

**AI service change** (`infrastructure/rpc/services/inference_service.py`) — populate `excerpt` from `SearchHit.excerpt` (already exists as a field in the domain model but wasn't mapped to gRPC).

### 1.4 gRPC AIToolService

**New proto** (`proto/core/ai_tool/v1/tool_service.proto`):
```protobuf
syntax = "proto3";
package core.ai_tool.v1;

service AIToolService {
  rpc ListTools(ListToolsRequest) returns (ListToolsResponse);
  rpc ExecuteTool(ExecuteToolRequest) returns (ExecuteToolResponse);
}

message ToolDefinition {
  string name = 1;
  string description = 2;
  string parameter_schema_json = 3;  // JSON Schema for parameters
}

message ListToolsRequest {}
message ListToolsResponse {
  repeated ToolDefinition tools = 1;
}

message ExecuteToolRequest {
  string tool = 1;
  string arguments_json = 2;  // JSON-encoded args
  string account_id = 3;
  string user_id = 4;
}
message ExecuteToolResponse {
  bool success = 1;
  string result_json = 2;    // JSON-encoded result
  string error_message = 3;
}
```

**Go implementation** — new module at `internal/modules/ai_tool/`:

```go
// ToolHandler interface — each module implements this
type ToolHandler interface {
    Name() string
    Description() string
    ParameterSchema() string  // JSON Schema
    Execute(ctx, argsJSON, accountID, userID) (resultJSON, error)
}
```

**Registration pattern:**

| Module | Tool | Handler |
|--------|------|---------|
| `guide` | `search_guides(sectorIds, tagIds, region, stage)` | `GuideToolHandler` |
| `taxonomy` | `list_sectors()` | `ListSectorsHandler` |
| `taxonomy` | `list_tags(group)` | `ListTagsHandler` |
| `taxonomy` | `get_sector(id)` | `GetSectorHandler` |
| `guide` | `get_guide_detail(guideId)` | `GuideDetailHandler` |

Tools are registered at startup in `module.go`:
```go
toolRegistry.Register(guide.NewGuideToolHandler(guideService))
toolRegistry.Register(taxonomy.NewListSectorsHandler(taxonomyService))
toolRegistry.Register(taxonomy.NewListTagsHandler(taxonomyService))
```

### 1.5 AI Service: Tool Calling + System Prompt + History

**LLMPort interface update** (`core/ports/llm.py`):
```python
class LLMPort(ABC):
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,  # NEW
        tools: list[ToolDefinition] | None = None,  # NEW
        max_tokens: int = 1024,
        temperature: float = 0.2,
    ) -> LLMResult: ...

    @abstractmethod
    def generate_stream(
        self,
        prompt: str,
        *,
        system_prompt: str | None = None,  # NEW
        tools: list[ToolDefinition] | None = None,  # NEW
        max_tokens: int = 1024,
        temperature: float = 0.2,
    ) -> AsyncIterator[LLMChunk]: ...
```

**LLMResult (new return type)**:
```python
class LLMResult:
    text: str
    tool_calls: list[ToolCall] | None  # NEW
class ToolCall:
    name: str
    arguments: dict
```

**Cohere adapter update** (`infrastructure/llm/cohere.py`):
```python
payload = {"model": self._model, "max_tokens": max_tokens, "temperature": temperature}
if system_prompt:
    payload["messages"] = [{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt}]
else:
    payload["messages"] = [{"role": "user", "content": prompt}]
if tools:
    payload["tools"] = [{"name": t.name, "description": t.description, "parameter_definitions": json.loads(t.parameter_schema_json)} for t in tools]
```

Cohere v2 Chat API returns tool calls in `tool_calls` field of the response. Parse and return as `LLMResult.tool_calls`.

**AskAIUseCase update** (`core/usecases/ask_ai.py`):

```python
class AskAIUseCase:
    def __init__(self, ...):
        self._ai_tool_client: AIToolServiceClient  # NEW: gRPC client to core-backend

    async def execute(self, command: AskAICommand) -> AskAIResult:
        # ... existing session resolution, embedding, retrieval ...

        # NEW: Fetch available tools
        tools = await self._ai_tool_client.list_tools()

        # NEW: Fetch conversation history
        history = await self._conversation_repo.list_messages(command.session_id, limit=10)

        # NEW: Build system prompt
        system_prompt = self._build_system_prompt(tools)

        # NEW: Build full prompt with history
        full_prompt = self._build_prompt_with_history(
            command.query, context_hits, history
        )

        # Call LLM with tools and system prompt
        result = await self._llm_port.generate(
            full_prompt,
            system_prompt=system_prompt,
            tools=tools if tools else None,
        )

        # NEW: Handle tool calls
        if result.tool_calls:
            for tc in result.tool_calls:
                tool_result = await self._ai_tool_client.execute_tool(tc.name, tc.arguments)
                # Feed tool result back to LLM for final answer
                result = await self._llm_port.generate(
                    self._build_tool_result_prompt(command.query, tc, tool_result),
                    system_prompt=system_prompt,
                )

        # ... persist, cache, return ...
```

**System prompt construction**:
```python
def _build_system_prompt(self, tools: list[ToolDefinition]) -> str:
    base = self._config.ai_persona  # e.g. "You are Adisu Serategna's AI assistant..."
    if tools:
        tool_descs = "\n".join(f"- {t.name}: {t.description}" for t in tools)
        base += f"\n\nYou have access to the following tools:\n{tool_descs}"
    base += "\n\n" + self._config.ai_restrictions  # e.g. "You cannot access user personal data..."
    return base
```

`ai_persona` and `ai_restrictions` are new config settings in `app/config.py`, loaded from environment or DB.

---

## Phase 2: Frontend — Knowledge Base Page

### 2.1 Split AI Module into Two Pages

**File structure:**

```
src/app/[locale]/(modules)/ai/
  layout.tsx                            # Sub-nav: "Knowledge Base" | "Ask"
  knowledge-base/
    page.tsx                            # Existing page (keep as index)
    _components/
      header-tools.tsx                  # Updated: remove chat-related, add upload dialog trigger
      sidebar-documents.tsx             # Updated: richer document list
      upload-dialog.tsx                 # NEW: pre-upload metadata form
      pipeline-progress.tsx             # Existing
      dlq-panel.tsx                     # Existing
    _services/
      ai.hook.ts                        # Existing (split: keep KB hooks, extract chat hooks)
      ai.hook.test.tsx
  ask/
    page.tsx                            # NEW: chat page
    _components/
      conversation-sidebar.tsx          # NEW
      chat-panel.tsx                    # NEW (refactored from test-retrieval-chat.tsx)
      chunk-inspector.tsx               # NEW
    _services/
      ask.hook.ts                       # NEW (extracted chat hooks from ai.hook.ts)
```

**AI module layout** (`ai/layout.tsx`):
```tsx
export default function AILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAsk = pathname.includes("/ask");
  return (
    <div>
      <nav className="flex gap-4 mb-4">
        <Link href="/ai/knowledge-base" className={isAsk ? "text-muted-foreground" : "font-bold"}>
          Knowledge Base
        </Link>
        <Link href="/ai/ask" className={isAsk ? "font-bold" : "text-muted-foreground"}>
          Ask AI
        </Link>
      </nav>
      {children}
    </div>
  );
}
```

### 2.2 Pre-Upload Metadata Dialog

**Component** `upload-dialog.tsx`:

```tsx
function UploadDialog() {
  // State
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<"en" | "am">("en");
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  // Queries
  const { data: sectors } = useSectorList();
  const { data: tags } = useTagList();
  const uploadDoc = useUploadDocument();  // Updated to accept metadata

  // Handlers
  const handleUpload = async () => {
    if (!file) return;
    await uploadDoc.mutateAsync({
      file,
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      language,
      sectorIds: selectedSectorIds,
      tagIds: selectedTagIds,
    });
  };

  return (
    <Dialog>
      <DialogTrigger>Upload Document</DialogTrigger>
      <DialogContent>
        <TextField label="Title" value={title} onChange={setTitle} placeholder={file?.name} />
        <RadioGroup label="Language" value={language} onChange={setLanguage} options={["en", "am"]} />
        <MultiSelect label="Sectors" options={sectors} selected={selectedSectorIds} onChange={setSelectedSectorIds} />
        <MultiSelect label="Tags" options={tags} selected={selectedTagIds} onChange={setSelectedTagIds} />
        <FileInput onChange={setFile} accept=".pdf,.doc,.docx" />
        <Button onClick={handleUpload} disabled={!file}>Upload</Button>
      </DialogContent>
    </Dialog>
  );
}
```

**Sector/Tag components** — extract reusable `SectorMultiSelect` and `TagMultiSelect` from the taxonomy pages.

**Updated `useUploadDocument`** — accepts `UploadDocumentInput` instead of bare `File`:
```typescript
type UploadDocumentInput = {
  file: File;
  title?: string;
  language?: string;
  sectorIds?: string[];
  tagIds?: string[];
};

// Flow: compute SHA-256 → create intent → upload file → finalize with metadata
```

### 2.3 Rich Document List

**Updated `sidebar-documents.tsx`** — each document card shows:

```
┌─────────────────────────────────────┐
│ [icon] My Business Plan.pdf         │ ← sourceFilename (or title from API)
│        English  │ 2 sectors, 3 tags │ ← language badge + sector/tag count chips
│        Live ─── 12 Apr 2026         │ ← stage badge + date
│        [trash]                      │ ← delete button
└─────────────────────────────────────┘
```

When metadata fields arrive from the enriched status endpoint:

```typescript
interface EnrichedStatus extends IngestionStatusProjectionResponse {
  sourceFilename?: string;
  declaredLanguage?: string;
  sectorIds?: string[];
  tagIds?: string[];
}
```

Use existing `useSectorList` and `useTagList` to resolve IDs to names (or let the backend return sector/tag names in the enriched projection for efficiency — TBD during implementation).

---

## Phase 3: Frontend — Ask Page

### 3.1 Conversation Sidebar

**Component** `conversation-sidebar.tsx`:

```tsx
function ConversationSidebar() {
  const { data: conversations } = useAIConversationsList();
  const archiveConv = useArchiveConversation();
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <aside className="w-80 border-r">
      <h2>Conversations</h2>
      <Button onClick={startNewChat}>+ New Chat</Button>
      <ul>
        {conversations?.map(conv => (
          <li key={conv.id} onClick={() => selectConversation(conv.id)}
              className={conv.id === activeId ? "bg-muted" : ""}>
            <span>{conv.title}</span>
            <span className="text-xs text-muted-foreground">
              {conv.language === "am" ? "አማ" : "EN"} · {formatDate(conv.updatedAt)}
            </span>
            <button onClick={() => archiveConv.mutate(conv.id)}>×</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

### 3.2 Chat Panel with Session Lifecycle

**Component** `chat-panel.tsx`:

```tsx
function ChatPanel({ sessionId, onSessionChange }: Props) {
  const { data: conversation } = useAIGetConversation(sessionId);
  const { start, cancel, isStreaming } = useAskAIStream();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load history when session changes
  useEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages.map(m => ({
        id: m.id, role: m.role, content: m.content,
        citations: m.citations,
      })));
    }
  }, [conversation]);

  const handleSend = (query: string) => {
    const assistantId = generateId();
    setMessages(prev => [...prev,
      { id: generateId(), role: "user", content: query },
      { id: assistantId, role: "assistant", content: "" }
    ]);

    void start(
      { query, sessionId, topK: 3 },
      {
        onChunk: (text, state) => updateMessage(assistantId, state.answer),
        onCitations: (citations) => updateCitations(assistantId, citations),
        onDone: (payload) => {
          updateSession(payload.sessionId);  // persist sessionId for continuation
        },
      }
    );
  };

  const handleNewChat = () => {
    if (sessionId) archiveConversation(sessionId);
    setMessages([]);
    onSessionChange(null);
  };
}
```

**Key behavior:**
- No active session → `AskRequest` omits `sessionId` → backend creates new session
- Backend returns `sessionId` in response → frontend stores it
- Subsequent questions include `sessionId` → conversation continues
- "New Chat" → archives current session, clears state, next question creates fresh session

### 3.3 Chunk Inspector

**Component** `chunk-inspector.tsx`:

```tsx
function ChunkInspector({ citation }: { citation: CitationDTO & { excerpt?: string } }) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex justify-between">
        <h4 className="font-medium text-sm">{citation.title || `Chunk ${citation.chunkId}`}</h4>
        <span className="text-xs text-muted-foreground">
          Score: {(citation.score * 100).toFixed(0)}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{citation.sourceType}</p>
      {citation.excerpt && (
        <p className="text-sm text-muted-foreground line-clamp-3">{citation.excerpt}</p>
      )}
    </div>
  );
}
```

In the mobile view (Amharic locale), only the `title` in the preferred language is shown without excerpt. The chunk ID itself (currently shown as `Chunk - {chunkId}`) is replaced with the document title.

### 3.4 Accept-Language in Custom Fetch

**File changed** `src/lib/api/mutator/custom-fetch.ts`:

```typescript
import { useLocale } from "next-intl";  // but can't use hooks outside components

// Instead, read from document cookie or a tiny store
// Option A: Read from a global store
// Option B: Accept header passed from the component level

// Simplest: read from <html lang="..."> attribute
function getAcceptLanguage(): string {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang || "en";
}
```

Add to the `customFetch` function:
```typescript
headers.set("Accept-Language", getAcceptLanguage());
```

---

## Phase 4: Agentic Tooling — Initial Tools

### 4.1 Tool Registration

Each module registers its tools in its own file. Example for guide module:

`internal/modules/guide/ai_tools.go`:
```go
type SearchGuidesHandler struct {
    guideService *GuideService
}

func (h *SearchGuidesHandler) Name() string { return "search_guides" }
func (h *SearchGuidesHandler) Description() string {
    return "Search business formalization guides by sectors, tags, region, or stage."
}
func (h *SearchGuidesHandler) ParameterSchema() string {
    return `{
        "type": "object",
        "properties": {
            "sectorIds": {"type": "array", "items": {"type": "string", "format": "uuid"}},
            "tagIds": {"type": "array", "items": {"type": "string", "format": "uuid"}},
            "region": {"type": "string"},
            "stage": {"type": "string"}
        }
    }`
}
func (h *SearchGuidesHandler) Execute(ctx, argsJSON, accountID, userID) (string, error) {
    var args struct { SectorIDs, TagIDs []uuid.UUID; Region, Stage *string }
    json.Unmarshal(argsJSON, &args)
    guides := h.guideService.ListGuides(ctx, args)
    result, _ := json.Marshal(guides)
    return string(result), nil
}
```

### 4.2 Tool Results in Chat UI

When the AI service returns `tool_uses` alongside the answer, the streaming response includes structured events:

```
event: tool_use
data: {"tool": "search_guides", "args": {...}, "result": {...}}

event: chunk
data: {"text": "Based on the guides I found..."}
```

The frontend chat panel displays a collapsible "Used search_guides" indicator:
```
┌─ [AI] Based on the guides I found...                          ─┐
│                                                                  │
│  🔧 Used search_guides — 3 results found                        │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ ▶ Business Registration Guide (Sector: Trade)           │     │
│  │ ▶ Tax Registration Guide (Sector: Finance)              │     │
│  │ ▶ License Renewal Guide (Sector: Trade)                 │     │
│  └─────────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
```

---

## Implementation Order & Dependencies

```
Phase 1 (Backend)
├── 1.1 Enrich status response ────────────────────────┐
├── 1.2 Fix delete flow                                │
├── 1.3 Chunk excerpt in citations ────────────────────┤
├── 1.4 gRPC AIToolService                            │
└── 1.5 AI service: tool calling + prompt              │
                                                       │
Phase 2 (Frontend KB)                                  │
├── 2.1 Two-page split                                 │
├── 2.2 Upload dialog                          depends on 1.1
└── 2.3 Rich document list                     depends on 1.1
                                                       │
Phase 3 (Frontend Ask)                                 │
├── 3.1 Conversation sidebar                           │
├── 3.2 Chat with session lifecycle                    │
├── 3.3 Chunk inspector                       depends on 1.3
└── 3.4 Accept-Language                                │
                                                       │
Phase 4 (Agentic)                                      │
├── 4.1 Register first tools                  depends on 1.4, 1.5
└── 4.2 Tool results in UI                   depends on 1.5
```

**Recommended build order:** 1.1 → 1.2 → 2.1 + 2.2 + 2.3 (KB improvements first) → 1.3 → 3.1 + 3.2 + 3.3 + 3.4 (Ask page) → 1.4 → 1.5 → 4.1 + 4.2 (agentic).

---

## Phase Breakdown

| Phase | Items | Layer | Depends On | Unlocks |
|-------|-------|-------|-----------|---------|
| **1a** | 1.1 Enrich status response + 1.2 Fix delete flow | Go core-backend | — | Phase 2 |
| **2** | 2.1–2.4 KB page, upload dialog, rich doc list, Accept-Language | Web frontend | Phase 1a | — |
| **1b** | 1.3 Chunk excerpt in citations | Proto + Go + Python | — | Phase 3 |
| **3** | 3.1–3.3 Conversation sidebar, chat panel, chunk inspector | Web frontend | Phase 1b, Phase 2 | — |
| **1c** | 1.4 gRPC AIToolService + 1.5 Tool calling/persona/history | Proto + Go + Python | — | Phase 4 |
| **4** | 4.1 Register tools + 4.2 Tool results UI | Go + Web frontend | Phase 1c | — |

### Execution Order

```
Phase 1a ──► Phase 2
Phase 1b ──► Phase 3
Phase 1c ──► Phase 4
```

Phases 1b and 1c can proceed in parallel with Phase 2/3 frontend work since they touch different layers. Each phase is independently reviewable and committable.

---

## Resolved Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Sector/tag names vs IDs in enriched response | IDs only — frontend already has `useSectorList` and `useTagList` which return both IDs and names. No need to duplicate. | Fewer backend changes; existing hooks resolve names client-side. |
| 2 | Tool calling with streaming | Emit checkpoint events (`tool_use` SSE events) rather than blocking the stream. Frontend renders a collapsible tool-use indicator inline. | Better UX: user sees progress rather than waiting silently. |
| 3 | Tool permissions | All tools available to all users. The same endpoints will be consumed by end users in the mobile app. | Simpler authorization; tools operate on the same data the user already has access to. |
| 4 | Persona storage | Env var (`AI_PERSONA_SYSTEM_PROMPT` + `AI_RESTRICTIONS`). Start simple. | Persona changes infrequently; no need for DB roundtrip at every inference. Can migrate to DB later if runtime editing is needed.
