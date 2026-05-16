# Mucho3D — Detailed Project Description

## 1) Project Overview

**Mucho3D** is a TypeScript-first 3D generation and editing platform that combines:

- A React + React Three Fiber frontend for interactive 3D visualization.
- An AI-assisted generation pipeline (prompt → structured plan → executable operations).
- Optional backend integrations for LLM planning (Ollama), model/tool execution, and persistent job tracking.

At its core, the project is designed to convert natural-language intent into deterministic 3D scene outcomes while keeping the UI responsive and production-oriented.

---

## 2) Repository Scope and Major Modules

This repository is organized as a multi-part system:

### A. Frontend Application (root project)
- Path: `src/*`
- Stack: React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Framer Motion, Three.js/R3F.
- Responsibility:
  - User authentication flow and protected routes.
  - Project and generation workflows.
  - Interactive 3D studio and scene inspection tools.
  - Prompt-driven generation UX and status visualization.

### B. Proxy Server (`proxy-server/`)
- Stack: Node.js + Express + TypeScript.
- Responsibility:
  - API gateway for chat/plan/model endpoints.
  - Integration point to Ollama.
  - Integration point to MCP bridge and Blender job lifecycle.
  - Optional Firebase-backed persistence for job records.
  - WebSocket endpoint for real-time job updates.

### C. MCP Bridge (`mcp-bridge/`)
- Stack: Express + TypeScript + Zod.
- Responsibility:
  - Exposes tool discovery and tool execution endpoints.
  - Validates and executes whitelisted tool operations.
  - Normalizes tool results for downstream consumers.

### D. Blender Worker (`apps/blender-worker/`)
- Stack: Python (FastAPI/Uvicorn execution pattern in docs).
- Responsibility:
  - Minimal local worker that executes validated tool calls inside Blender.
  - Supports health checks and controlled execution via whitelisted operations.
  - Explicitly avoids arbitrary Python execution from model output.

---

## 3) Product Direction and Use Cases

Mucho3D targets workflows where users:

1. Create/manage projects.
2. Describe desired 3D outcomes in natural language.
3. Receive structured generation behavior through validated and constrained execution.
4. Inspect/edit resulting scenes interactively in a web-based studio.
5. Persist, revisit, and iterate on generated assets.

This positions the product between:
- **Creative tooling** (interactive scene editing),
- **AI-assisted design** (prompt-driven generation),
- **Engineering workflows** (deterministic constraints, typed schemas, execution logs, and status tracking).

---

## 4) Frontend Architecture (Root App)

### 4.1 Routing Model

The app uses `createBrowserRouter` with clear separation between public/auth/protected areas:

- Public:
  - `/` (home/landing)
  - `/health` (frontend health payload)
- Auth:
  - `/auth/signin`
  - `/auth/callback`
- Protected (`/app/*`):
  - `/app/dashboard`
  - `/app/studio`
  - `/app/projects`
  - `/app/projects/:projectId`
  - `/app/projects/:projectId/studio`
  - `/app/settings`
  - `/app/chat`
  - `/app/builder`
- Legacy redirects:
  - `/dashboard` → `/app/dashboard`
  - `/studio` → `/app/studio`
  - `/shop` → `/`

Protected sections are guarded through `ProtectedRoute`, with `AuthProvider` wrapping the whole application.

### 4.2 State Management

Zustand stores separate concerns into domain-driven slices:

- `uiStore`: layout, sidebar/palette state, UX flags.
- `sceneStore`: scene object state and 3D controls.
- `studioStore`: studio-specific editing interactions.
- `aiStore`: AI and command/chat state.

This design keeps rendering reactive while reducing global coupling.

### 4.3 3D Engine Layer

The 3D layer is built on:

- `three` + `@react-three/fiber`
- `@react-three/drei` helpers
- Dedicated components in `src/components/3d/*` (camera control, lights, grid, HUD, mesh rendering).

Studio-focused panels live under `src/components/studio/*` and combine:
- object list management,
- inspector/editor panels,
- canvas shell and viewport orchestration.

### 4.4 Feature Modules

Key domain features:

- `src/features/auth/AuthProvider.tsx`
  - Central auth context and app-level auth state flow.
- Prompt/session/generation hooks:
  - `useProjects`, `useProject`, `useGenerations`, `usePromptSession`, `useJobStatusRealtime`.
- Service-driven architecture:
  - Firestore services for CRUD and subscriptions.
  - AI/orchestration services for planning and execution handoff.
  - MCP/proxy bridge services for external execution paths.

---

## 5) Generation Pipeline Design

The repository supports an AI-assisted deterministic generation flow conceptually aligned with:

1. **Prompt intake** from UI.
2. **Planning** (Ollama or fallback path) into structured scene plan.
3. **Validation** through Zod schemas (`src/schema/scenePlan.ts`).
4. **Compilation** to executable instructions (`planCompiler`).
5. **Execution** through local executor and/or external bridge.
6. **Result mapping** into scene-friendly structures.
7. **Persistence and tracking** via Firestore services and generation/job records.
8. **Realtime UX updates** through hooks and WebSocket job status channels.

This architecture favors predictable and traceable outcomes over opaque freeform generation.

---

## 6) Backend and Integration Surfaces

### 6.1 Proxy Server API Surface

The proxy server mounts route groups for:

- `/api/chat`
- `/api/generate-plan`
- `/api/health`
- `/api/models`
- `/api/mcp`
- `/api/blender/jobs`

It also exposes `/health` and hosts WS updates at:
- `ws://<host>:<port>/ws/jobs`

Environment variables define connectivity to Ollama, MCP bridge, Blender mode, job behavior, and optional Firebase credentials.

### 6.2 MCP Bridge Responsibilities

The MCP bridge offers:

- `GET /health`
- `GET /tools` (and `/tools/list` compatibility)
- `POST /tools/call` (validated execution)

It enforces tool-level validation and maps execution outputs into stable response shapes.

### 6.3 Blender Worker Safety Model

The Blender worker is intentionally minimal and constrained:

- Health endpoint (`GET /health`)
- Controlled execution endpoint (`POST /execute`)
- Only whitelisted actions from `run_tool.py`
- No acceptance of raw model-generated Python code

This is a key guardrail for secure local execution.

---

## 7) Data and Persistence Model

The repository includes typed document models for:

- Users
- Projects
- Generations
- Scenes
- Prompt sessions
- Execution logs

Firestore service modules encapsulate operations and isolate persistence logic from UI components, improving testability and reducing duplication in hooks/pages.

---

## 8) Developer Experience and Quality Tooling

Core developer commands at repository root:

- `npm run dev`
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm run preview`

During baseline verification in this repository state:

- Type-check succeeds.
- Build succeeds.
- Lint reports pre-existing issues in multiple modules (including one lint error outside this documentation change scope).

The project uses strict typing, code splitting via lazy routes, and modular service/store organization for maintainability.

---

## 9) Environment Configuration (Summary)

Root `.env` values configure frontend behavior for:

- Ollama endpoint/model
- Proxy API URL
- MCP bridge feature flag
- Blender bridge URL
- Optional Firebase credentials
- Optional analytics/sentry flags

Proxy server `.env` controls:

- Ollama URL/model
- MCP bridge URL
- port and execution mode
- Blender bridge host/port/timeout
- job polling and timeout
- optional Firebase admin credentials

The setup supports both local-first runs and expanded integrated runs.

---

## 10) Notable Engineering Characteristics

1. **Deterministic pipeline emphasis**: schema validation + constrained execution.
2. **Modular boundaries**: UI, orchestration, execution, persistence are separated by services.
3. **Hybrid execution architecture**: local execution paths plus bridge/worker-based externalization.
4. **Realtime-aware UX**: generation/job statuses are surfaced through hooks and WS support.
5. **Security-aware execution model**: whitelisted tool calls and guarded Blender execution.

---

## 11) Current Maturity Snapshot

Mucho3D is beyond a static frontend prototype and already structured as an integrated platform:

- Feature-rich frontend for auth, projects, studio, and generation workflows.
- Operational proxy and bridge components for local AI/execution integration.
- Dedicated Blender worker scaffolding with a constrained execution model.
- Production-oriented patterns (typed contracts, route modularity, persistence services, health endpoints).

In practice, this repository provides both:

- a usable application surface for iterative 3D generation workflows, and
- a strong technical foundation for continued expansion (deeper Blender automation, richer tools, and broader orchestration capabilities).

---

## 12) Quick Start (Minimal)

1. Install dependencies at root:
   - `npm install`
2. Configure `.env.local` from `.env.example`.
3. Start frontend:
   - `npm run dev`
4. (Optional) Run proxy server in `proxy-server/` for integrated generation routes.
5. (Optional) Run MCP bridge and Blender worker for full local execution chain.

This allows progressive onboarding: frontend-only first, then full pipeline integration.
