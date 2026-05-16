# Mucho3D Data Flow Architecture

## Complete System Flow: Prompt → Blender → Snapshot → Firestore → Web Inventory

This document visualizes the complete data flow through the Mucho3D system, from user input to 3D visualization.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INPUTS (2 Sources)                          │
├────────────────────────────┬────────────────────────────────────────────┤
│   Web UI (React)           │   WhatsApp                                 │
│   - Command Palette        │   - Mobile Messages                        │
│   - Chat Interface         │   - Natural Language                       │
└────────────┬───────────────┴────────────┬───────────────────────────────┘
             │                            │
             ▼                            ▼
     ┌───────────────┐          ┌──────────────────┐
     │  Frontend     │          │  WhatsApp        │
     │  (Port 5173)  │          │  Gateway         │
     │               │          │  (Port 8791)     │
     └───────┬───────┘          └────────┬─────────┘
             │                           │
             └───────────┬───────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Proxy Server      │
              │   (Port 8787)       │
              │   - /api/chat       │
              │   - /api/whatsapp   │
              │   - /api/mcp        │
              └──────────┬──────────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────────┐
    │ Ollama   │  │   MCP    │  │  Firestore   │
    │   AI     │  │  Bridge  │  │  Database    │
    │ (11434)  │  │ (8790)   │  │  (Cloud)     │
    └──────────┘  └────┬─────┘  └──────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Blender Worker  │
              │ (Port 8788)     │
              │ - 3D Rendering  │
              │ - Snapshot Gen  │
              └─────────────────┘
```

---

## 2. Detailed Request Flow

### Web UI Flow

```
User Types Prompt in Web UI
    │
    ├─> "Create a red cube and a blue sphere"
    │
    ▼
┌────────────────────────────────────────┐
│ 1. Frontend (React Component)         │
│    - ChatInterface.tsx                 │
│    - Captures user input               │
└────────┬───────────────────────────────┘
         │
         │ POST /api/chat
         │ { prompt: "create...", userId, projectId }
         ▼
┌────────────────────────────────────────┐
│ 2. Proxy Server                        │
│    - Receives request                  │
│    - Creates Generation record         │
└────────┬───────────────────────────────┘
         │
         │ POST /api/generate-plan
         │ { prompt: "create..." }
         ▼
┌────────────────────────────────────────┐
│ 3. Ollama AI                           │
│    - Generates structured plan         │
│    - Returns JSON with objects         │
└────────┬───────────────────────────────┘
         │
         │ Returns: {
         │   plan: {
         │     objects: [
         │       { type: "box", color: "#FF0000", position: [0,0,0] },
         │       { type: "sphere", color: "#0000FF", position: [2,0,0] }
         │     ]
         │   }
         │ }
         ▼
┌────────────────────────────────────────┐
│ 4. Proxy Server (Plan Validation)     │
│    - Validates plan with Zod           │
│    - Saves to Firestore                │
└────────┬───────────────────────────────┘
         │
         │ For each object in plan:
         │ POST /api/mcp/tools/call
         │ { tool: "create_primitive", payload: {...} }
         ▼
┌────────────────────────────────────────┐
│ 5. MCP Bridge                          │
│    - Routes tool call                  │
│    - Validates payload                 │
└────────┬───────────────────────────────┘
         │
         │ POST /execute
         │ { tool: "create_primitive", payload: {...}, captureSnapshot: true }
         ▼
┌────────────────────────────────────────┐
│ 6. Blender Worker                      │
│    - Creates 3D object                 │
│    - Applies materials                 │
│    - Renders viewport snapshot         │
│    - Encodes snapshot to Base64        │
└────────┬───────────────────────────────┘
         │
         │ Returns: {
         │   result: {
         │     objectId: "obj_box_1",
         │     snapshot: {
         │       filename: "snapshot_1234567890.png",
         │       base64: "iVBORw0KGgoAAAANS...",
         │       width: 1920,
         │       height: 1080,
         │       timestamp: 1234567890
         │     }
         │   }
         │ }
         ▼
┌────────────────────────────────────────┐
│ 7. Proxy Server (Save Snapshot)       │
│    - Receives snapshot data            │
│    - Saves to Firestore                │
│    - Links to Generation & Scene       │
└────────┬───────────────────────────────┘
         │
         │ Firestore.collection('snapshots').add({
         │   projectId, generationId, sceneId,
         │   base64Data, metadata, timestamp
         │ })
         ▼
┌────────────────────────────────────────┐
│ 8. Firestore Database                  │
│    Collection: snapshots               │
│    - Stores snapshot metadata          │
│    - Triggers real-time listeners      │
└────────┬───────────────────────────────┘
         │
         │ Real-time update via onSnapshot()
         │
         ▼
┌────────────────────────────────────────┐
│ 9. Frontend (Auto-refresh)             │
│    - subscribeToProjectSnapshots()     │
│    - Inventory UI updates              │
│    - Displays new snapshot             │
└────────────────────────────────────────┘
```

### WhatsApp Flow

```
User Sends WhatsApp Message
    │
    ├─> "create a yellow cylinder"
    │
    ▼
┌────────────────────────────────────────┐
│ 1. WhatsApp Gateway                    │
│    - Receives message via WhatsApp     │
│    - Sends acknowledgment              │
└────────┬───────────────────────────────┘
         │
         │ POST /api/whatsapp/generate
         │ {
         │   prompt: "create...",
         │   metadata: { source: "whatsapp", userId, messageId }
         │ }
         ▼
┌────────────────────────────────────────┐
│ 2. Proxy Server (/api/whatsapp)       │
│    - Same flow as Web UI               │
│    - Calls Ollama → MCP → Blender      │
└────────┬───────────────────────────────┘
         │
         │ [Same steps 3-8 as Web UI flow]
         │
         ▼
┌────────────────────────────────────────┐
│ 9. WhatsApp Gateway (Send Response)   │
│    - Formats confirmation message      │
│    - Sends back to user                │
│    - Includes scene URL                │
└────────────────────────────────────────┘
```

---

## 3. Snapshot Capture Process

```
┌─────────────────────────────────────────────────────────────┐
│              Blender Worker Snapshot Flow                   │
└─────────────────────────────────────────────────────────────┘

Tool Execution Complete
    │
    ▼
Check: captureSnapshot enabled?
    │
    ├─> NO  ──> Return result without snapshot
    │
    └─> YES
         │
         ▼
    capture_viewport_snapshot()
         │
         ├─> 1. Create snapshots directory
         │
         ├─> 2. Store original render settings
         │        - filepath, resolution, format
         │
         ├─> 3. Configure snapshot settings
         │        - Resolution: 1920x1080
         │        - Format: PNG
         │        - Color mode: RGBA
         │
         ├─> 4. Render viewport
         │        bpy.ops.render.render(write_still=True)
         │
         ├─> 5. Read PNG file
         │
         ├─> 6. Encode to Base64
         │        base64.b64encode(image_data)
         │
         ├─> 7. Restore original settings
         │
         └─> 8. Return snapshot data
                  {
                    filename: "snapshot_123.png",
                    path: "/snapshots/snapshot_123.png",
                    base64: "iVBORw0KGg...",
                    format: "png",
                    width: 1920,
                    height: 1080,
                    size: 524288,
                    timestamp: 1234567890
                  }
```

---

## 4. Firestore Data Model

```
Firestore Collections:
├── projects/
│   └── {projectId}
│       ├── name: string
│       ├── userId: string
│       └── createdAt: timestamp
│
├── generations/
│   └── {generationId}
│       ├── projectId: string
│       ├── userId: string
│       ├── prompt: string
│       ├── structuredPlan: object
│       ├── status: "pending" | "running" | "complete" | "error"
│       ├── outputSceneId: string (reference)
│       └── createdAt: timestamp
│
├── scenes/
│   └── {sceneId}
│       ├── projectId: string
│       ├── userId: string
│       ├── objects: array
│       ├── camera: object
│       ├── settings: object
│       └── version: number
│
└── snapshots/  ← NEW
    └── {snapshotId}
        ├── projectId: string
        ├── generationId: string (optional)
        ├── sceneId: string (optional)
        ├── userId: string
        ├── filename: string
        ├── base64Data: string (large)
        ├── fileUrl: string (optional)
        ├── filePath: string
        ├── format: "png"
        ├── width: number
        ├── height: number
        ├── size: number
        ├── timestamp: number
        ├── metadata: {
        │   tool: string,
        │   objectId: string,
        │   objectType: string,
        │   source: "web" | "whatsapp"
        │ }
        ├── createdAt: timestamp
        └── updatedAt: timestamp
```

---

## 5. Frontend Inventory UI Flow

```
┌────────────────────────────────────────┐
│ Studio Page (React Component)         │
└────────┬───────────────────────────────┘
         │
         ├─> useEffect(() => {
         │     subscribeToProjectSnapshots(projectId, callback)
         │   })
         │
         ▼
┌────────────────────────────────────────┐
│ snapshotService.ts                     │
│ - subscribeToProjectSnapshots()        │
└────────┬───────────────────────────────┘
         │
         │ Firestore.onSnapshot(query)
         │
         ▼
┌────────────────────────────────────────┐
│ Real-time Listener                     │
│ - Listens for new snapshots            │
│ - Auto-triggers on Firestore changes   │
└────────┬───────────────────────────────┘
         │
         │ callback(snapshots)
         │
         ▼
┌────────────────────────────────────────┐
│ React State Update                     │
│ - setSnapshots(newSnapshots)           │
│ - Component re-renders                 │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Inventory UI Display                   │
│ - Renders snapshot grid                │
│ - Shows Base64 images                  │
│ - Displays metadata                    │
│ - Links to generation/scene            │
└────────────────────────────────────────┘
```

---

## 6. API Endpoints Summary

| Endpoint | Method | Service | Purpose |
|----------|--------|---------|---------|
| `/api/chat` | POST | Proxy | Chat-based prompt submission |
| `/api/generate-plan` | POST | Proxy | AI plan generation |
| `/api/whatsapp/generate` | POST | Proxy | WhatsApp prompt processing |
| `/api/mcp/tools/call` | POST | Proxy | MCP tool execution |
| `/tools/call` | POST | MCP Bridge | Direct tool execution |
| `/execute` | POST | Blender | 3D object creation + snapshot |
| `/health` | GET | All | Service health check |

---

## 7. Technology Stack per Flow Step

```
┌────────────────┬──────────────────┬─────────────────────┐
│ Flow Step      │ Technology       │ Language            │
├────────────────┼──────────────────┼─────────────────────┤
│ UI Input       │ React + Zustand  │ TypeScript          │
│ WhatsApp       │ whatsapp-web.js  │ TypeScript          │
│ Routing        │ Express          │ TypeScript          │
│ AI Planning    │ Ollama           │ Go (external)       │
│ Tool Registry  │ Express + Zod    │ TypeScript          │
│ 3D Rendering   │ Blender + bpy    │ Python              │
│ Database       │ Firestore        │ Cloud (NoSQL)       │
│ Real-time Sync │ Firestore SDK    │ TypeScript          │
└────────────────┴──────────────────┴─────────────────────┘
```

---

## 8. Error Handling Flow

```
Error Occurs at Any Step
    │
    ▼
Service Catches Exception
    │
    ├─> Logs error to console
    │
    ├─> If Firestore configured:
    │   └─> updateGenerationError(generationId, errorMessage)
    │
    ├─> Returns error response:
    │   { success: false, error: "message", logs: [...] }
    │
    └─> Frontend/WhatsApp displays error to user
```

---

## 9. Performance Considerations

| Component | Optimization | Impact |
|-----------|--------------|--------|
| Snapshot Base64 | Large data (~500KB-2MB) | Firestore size limits |
| Real-time Listeners | Limited subscriptions | Firestore read costs |
| Blender Rendering | Async execution | CPU intensive |
| WhatsApp Messages | Rate limiting | API throttling |
| AI Planning | Token limits | Ollama capacity |

### Recommendations:
1. **Snapshot Storage**: Consider using Firebase Storage for large images, store only URLs in Firestore
2. **Pagination**: Implement pagination for snapshot lists (limit initial load)
3. **Caching**: Cache snapshots locally in Frontend to reduce re-fetches
4. **Compression**: Compress PNG snapshots before Base64 encoding
5. **Cleanup**: Implement snapshot retention policy (delete old snapshots)

---

## 10. Diagram Legend

```
┌─────────┐
│ Service │  = Standalone service/component
└─────────┘

    │
    ├─>      = Data flow direction
    │
    ▼

POST /api   = HTTP request method and endpoint

{ data }    = JSON payload structure

onSnapshot  = Real-time listener function

Collection  = Firestore collection
```

---

This flow diagram provides a complete visualization of how Mucho3D processes prompts from multiple sources, generates 3D scenes, captures snapshots, persists them to Firestore, and automatically refreshes the inventory UI.
