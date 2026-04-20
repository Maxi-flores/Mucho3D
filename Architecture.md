# Mucho3D Architecture (Current)

## 1) System overview

Mucho3D is a local-first, multi-service architecture with a React frontend and optional AI/Blender execution backend services.

```text
Browser (React/Vite)
  ├─ Firebase Auth + Firestore (optional; demo fallback exists)
  └─ Proxy Server (:8787)
       ├─ Ollama API (:11434) for chat + scene planning
       └─ MCP Bridge (:8790)
            └─ Blender Worker (:7860) with validated tool execution
```

Core runtime behavior:
- If Firebase is configured, auth + persistence use Firebase.
- If Firebase is not configured, app falls back to local demo behavior for auth.
- AI generation uses proxy endpoints and gracefully degrades to deterministic local execution when services are unavailable.

---

## 2) Frontend architecture (`src/`)

### Entry and composition
- `src/main.tsx`: mounts React app.
- `src/App.tsx`: wraps router with `AuthProvider` and global toast container.

### Routing and access control
- `src/router.tsx` uses `createBrowserRouter` with lazy-loaded pages.
- Public routes: `/`, `/auth/*`, `/health`.
- Protected routes: `/app/*` guarded by `src/components/ProtectedRoute.tsx`.
- Legacy redirects kept for backward compatibility (`/dashboard`, `/studio`, `/shop`).

### UI and page structure
- Page layer: `src/pages/*` and `src/pages/app/*`.
- Layout layer: `src/components/layout/*` (topbar, sidebar, dashboard layout).
- Feature UI: `src/components/3d/*`, `src/components/studio/*`, `src/components/ai/*`, `src/features/chat/*`.

### State management
- Zustand stores under `src/store/*`:
  - `sceneStore`: scene objects, camera, display controls, import/export.
  - `uiStore`: global UI state.
  - `aiStore`, `studioStore`: feature-specific state.

### Service layer
- AI orchestration: `src/services/ai/*`.
- Execution compilation/runtime: `src/services/execution/*`.
- MCP call flow: `src/services/mcp/*` + `src/services/mcpBridgeService.ts`.
- Firestore persistence services: `src/services/firestore/*`.
- Firebase setup: `src/lib/firebase.ts`.

---

## 3) Data architecture

Typed Firestore document models are defined in `src/types/firebase.ts`:
- `users`
- `projects`
- `scenes`
- `generations`
- `promptSessions`
- `executionLogs`

The generation pipeline persists artifacts across these collections (generation status, structured plan, execution payload/result, produced scene, and logs).

---

## 4) AI generation pipeline

Primary orchestrator: `src/services/ai/generationOrchestrator.ts`

Pipeline stages:
1. Create generation record (`pending`).
2. Request plan from Ollama via proxy (`planning`).
3. Validate/parse plan schema.
4. Compile plan to deterministic MCP tool calls.
5. Execute tool calls through proxy → MCP bridge → Blender worker.
6. Persist execution result + generated scene.
7. Mark generation `complete` or `error`.

Resilience behavior:
- If Ollama is unavailable, a demo scene plan can be used.
- If MCP/Blender execution fails and fallback is enabled, validated JS execution fallback runs (`sceneExecutor`).

---

## 5) Backend service architecture

### Proxy Server (`proxy-server/`)
- Express API gateway on port `8787`.
- Routes:
  - `/api/chat`
  - `/api/generate-plan`
  - `/api/models`
  - `/api/health`
  - `/api/mcp/*` (bridge forwarding + validation)
- Forwards Ollama requests and MCP calls, normalizes/validates responses.

### MCP Bridge (`mcp-bridge/`)
- Express service on port `8790`.
- Exposes tool listing and tool execution endpoints.
- Uses strict `zod` payload validation per tool.
- Tries Blender worker execution first; falls back to deterministic local execution.

### Blender Worker (`apps/blender-worker/`)
- Python HTTP worker exposing `/health` and `/execute`.
- Executes only whitelisted tools from `run_tool.py`.
- Explicitly avoids arbitrary model-generated Python execution.

---

## 6) Security and safety controls

- Schema validation on tool inputs/outputs (`zod`) across frontend, proxy, and bridge.
- Whitelisted MCP tool registry; unknown tools are rejected.
- Deterministic fallback execution path to prevent unsafe behavior.
- No direct raw-Python execution from LLM output in Blender worker path.

---

## 7) Key environment variables

Frontend:
- `VITE_PROXY_API_URL`
- `VITE_OLLAMA_URL`
- `VITE_OLLAMA_MODEL`
- Firebase vars (`VITE_FIREBASE_*`)

Proxy server:
- `PORT`
- `OLLAMA_URL`
- `MCP_BRIDGE_URL`

MCP bridge:
- `BLENDER_WORKER_URL`
- `BLENDER_WORKER_TIMEOUT_MS`

