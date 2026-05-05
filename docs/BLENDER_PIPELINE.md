# Mucho3D Blender Execution Pipeline

## Overview

Phase 4 implements a real, job-based execution backend for Mucho3D's Project Studio Workspace. The pipeline converts node graphs → AI-generated plans → Blender execution → exported 3D artifacts.

```
Project Studio
  ↓ (nodes)
Node Compiler
  ↓ (text prompt)
Ollama LLM (scene planner)
  ↓ (structured plan)
Blender MCP Bridge
  ↓ (Python execution)
Blender
  ↓ (GLB/FBX/STL)
Frontend Preview / Download
```

## Architecture

### 1. **Frontend** (`src/` directory)

#### `src/types/generation.ts`
Defines the shared execution contract:
- `GenerationPlan` — structured scene definition
- `GenerationJob` — job lifecycle and status
- `ExportArtifact` — output files
- `BlenderObject`, `BlenderLight`, `BlenderCamera` — scene elements

#### `src/services/nodeCompiler.ts`
Converts Studio nodes → structured plans:
- `compileNodesToPrompt()` — text prompt for LLM
- `compileNodesToGenerationPlanDraft()` — structured `GenerationPlan`
- `validateGenerationPlan()` — safety validation

#### `src/services/generationJobService.ts`
Frontend API client for job management:
- `createGenerationJob()` — start execution
- `getJobStatus()` — poll for updates
- `pollJobUntilComplete()` — async wait with callbacks
- `cancelJob()` — abort execution

#### `src/pages/app/ProjectStudio.tsx`
Updated execution flow:
1. Node readiness check
2. Compile nodes to text prompt
3. Call `/api/generate-plan` (Ollama)
4. Parse response into structured plan
5. Validate plan
6. Create job via `/api/blender/jobs`
7. Poll job status (non-blocking)
8. Display artifacts on completion

### 2. **Proxy Server** (`proxy-server/` directory)

Express.js gateway between frontend and local Blender.

#### `proxy-server/src/services/jobService.ts`
In-memory job store (replace with database in production):
- `createJob()` — queue new job
- `getJob()` — fetch status
- `updateJobStatus()` — advance workflow
- `appendJobLog()` — add execution log
- `completeJob()` — finalize with artifacts

**In production**, replace with:
- Firestore
- Redis job queue
- PostgreSQL with job table

#### `proxy-server/src/routes/blenderJobs.ts`
REST API for job lifecycle:

```
POST /api/blender/jobs
  Request: { projectId, userId, prompt, plan }
  Response: { job, jobId }

GET /api/blender/jobs/:jobId
  Response: { job, isComplete, progress }

POST /api/blender/jobs/:jobId/cancel
  Response: { job }
```

**Mock mode** (`BLENDER_MODE=mock`):
- Simulates pipeline stages with delays
- Returns synthetic artifacts
- No Blender required (useful for frontend development)

**Local mode** (`BLENDER_MODE=local`):
- Connects to Blender via MCP bridge
- Executes `execute_plan.py` in Blender
- Returns real artifacts

#### `.env.example`
Configuration options:
```env
BLENDER_MODE=local        # or "mock"
OLLAMA_URL=...
MCP_BRIDGE_URL=...
BLENDER_BRIDGE_HOST=127.0.0.1
BLENDER_BRIDGE_PORT=9100
JOB_TIMEOUT_MS=300000    # 5 minutes
```

### 3. **MCP Bridge** (`mcp-bridge/` directory)

Model Context Protocol bridge to Blender.

#### `mcp-bridge/blender-scripts/execute_plan.py`
Python script running inside Blender:

```python
class PlanExecutor:
    - clear_scene()
    - create_primitive(spec)      # box, sphere, cylinder, cone, torus, plane
    - create_light(spec)          # directional, point, spot
    - set_camera(spec)            # position + target
    - apply_color(obj, hex)
    - execute_plan(plan_dict)     # main orchestration
    - export_glb(filepath)
    - export_fbx(filepath)
```

**Input** (JSON):
```json
{
  "id": "...",
  "objects": [
    {
      "id": "obj_1",
      "name": "Box",
      "type": "box",
      "position": [0, 0, 0],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "color": "#FF0000"
    }
  ],
  "lights": [
    {
      "id": "light_1",
      "type": "directional",
      "position": [3, 3, 3],
      "intensity": 2.0
    }
  ],
  "camera": {
    "position": [5, 5, 5],
    "target": [0, 0, 0]
  },
  "outputFormat": "glb"
}
```

**Output** (JSON):
```json
{
  "success": true,
  "created_objects": 5,
  "output_file": "/path/to/scene.glb",
  "errors": [],
  "logs": ["...", "..."]
}
```

## Setup & Running

### Prerequisites

**Frontend + Proxy:**
```bash
npm install                 # Install frontend + proxy deps
cd proxy-server && npm install && cd ..
npm run build               # TypeScript check + Vite build
```

**Blender (for local mode):**
- Blender 3.0+ installed and in PATH
- MCP bridge running on port 9100 (separate process)

### Environment Variables

#### Frontend (`.env.local`)
```env
VITE_PROXY_API_URL=http://localhost:8787
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=qwen2.5-coder:latest
```

#### Proxy Server (`proxy-server/.env`)
```env
BLENDER_MODE=mock                 # Start with mock for testing
PORT=8787
OLLAMA_URL=http://localhost:11434
MCP_BRIDGE_URL=http://localhost:3001
```

#### Blender MCP Bridge (`mcp-bridge/.env`)
```env
BLENDER_EXECUTABLE=/path/to/blender  # Linux/Mac: blender, Windows: blender.exe
BLENDER_BRIDGE_PORT=9100
```

### Running the Stack

**Terminal 1: Ollama** (required for LLM planning)
```bash
ollama serve
# Listens on http://localhost:11434
```

**Terminal 2: Proxy Server**
```bash
cd proxy-server
npm run dev
# Listens on http://localhost:8787
```

**Terminal 3 (optional): MCP Bridge** (only for local Blender mode)
```bash
cd mcp-bridge
npm run dev
# Listens on http://localhost:3001
# Connects to Blender on port 9100
```

**Terminal 4: Frontend**
```bash
npm run dev
# Listens on http://localhost:5173
# Accesses proxy at http://localhost:8787
```

### Test Workflow

1. Open http://localhost:5173
2. Navigate to `/app/projects/:id/studio`
3. Create nodes: CONCEPT + OBJECT + LIGHT + CAMERA
4. Click "Execute Pipeline"
5. Watch the progress bar and status updates
6. On completion, download the GLB artifact

## Execution Modes

### Mock Mode

**Use for:**
- Frontend development
- Testing without Blender
- CI/CD pipelines
- Vercel deployments

**Set:**
```env
BLENDER_MODE=mock
```

**Behavior:**
- Returns synthetic artifacts after ~4 seconds
- No Blender installation required
- Logs simulated stages: planning → validating → sending → executing → exporting

### Local Mode

**Use for:**
- Full-stack development
- Real Blender execution
- Production (with cloud rendering)

**Set:**
```env
BLENDER_MODE=local
```

**Behavior:**
- Connects to Blender via MCP bridge
- Executes `execute_plan.py` with structured plan
- Returns real GLB/FBX from Blender

## Safety & Validation

**Input Validation** (frontend):
- `validateGenerationPlan()` in `nodeCompiler.ts`
- Checks: object count, coordinate ranges, required fields

**Execution Safety** (Blender script):
- Only whitelisted primitive types: box, sphere, cylinder, cone, torus, plane
- Numeric validation: coordinates in [-1000, 1000], scales in [0.01, 100]
- No arbitrary Python execution
- All output written to sandbox directory

**Job Isolation:**
- Each job has unique ID
- Results stored in memory per session
- (Future: store in persistent DB with user auth)

## Extending the Pipeline

### Add a New Primitive Type

**Step 1: Update Blender script** (`execute_plan.py`):
```python
elif obj_type == 'icosphere':
    bpy.ops.mesh.primitive_ico_sphere_add(location=position, scale=scale)
```

**Step 2: Update UI validation** (`nodeCompiler.ts`):
```typescript
const parsePrimitiveType = (label: string): PrimitiveType => {
  if (lower.includes('ico') || lower.includes('geodesic')) return 'icosphere'
  // ...
}
```

### Add Real-Time Job Updates

Replace polling with WebSockets:

```typescript
// TODO: Implement
const socket = new WebSocket(`ws://localhost:8787/jobs/${jobId}`)
socket.onmessage = (e) => {
  const { status, progress } = JSON.parse(e.data)
  onStatusChange(status, progress)
}
```

### Add Multi-User Job Queue

Replace in-memory store with message queue:

```typescript
// proxy-server/src/services/jobService.ts
// Use Redis or Bull for job queueing
const queue = new Queue('generation', 'redis://...')
queue.process(async (job) => {
  // Execute plan via MCP bridge
})
```

### Add Persistent Artifact Storage

```typescript
// Instead of returning URL in memory
// Upload to cloud storage (GCS, S3, etc.)
const bucket = storage.bucket('mucho3d-artifacts')
await bucket.file(filename).save(fileBuffer)
const url = bucket.file(filename).publicUrl()
```

## Troubleshooting

### "Job not found"
- Check job ID in browser console
- Verify proxy server is running on port 8787
- Check browser network tab for `/api/blender/jobs` response

### "Blender timeout"
- In local mode: verify Blender is running
- Check MCP bridge is reachable on port 9100
- Increase `BLENDER_BRIDGE_TIMEOUT_MS` in `.env`

### "Plan validation failed"
- Check object coordinates and scales
- Ensure at least one OBJECT node with status=reviewed/locked
- Ensure LIGHT or CAMERA node exists

### Mock execution gets stuck
- Check browser console for fetch errors
- Verify BLENDER_MODE=mock in proxy `.env`
- Restart proxy server

## Performance Notes

**Current Limitations:**
- In-memory job store (max ~1000 concurrent jobs)
- No persistence across server restart
- No distributed execution

**Optimization Ideas:**
1. **Job Persistence:** Move to Firestore + job metadata
2. **Queue System:** Implement Bull/Bee-Queue for long-running jobs
3. **Worker Pool:** Spawn multiple Blender instances for parallel execution
4. **Caching:** Cache generated plans by prompt hash
5. **CDN:** Serve artifacts from S3/GCS with CloudFront

## Future Phases

**Phase 5: Advanced Materials**
- PBR material assignment
- Texture mapping
- Shader nodes

**Phase 6: Modifiers & Proceduralism**
- Geometry nodes
- Procedural generation
- Parametric models

**Phase 7: Real-Time Preview**
- WebGL preview in Studio
- Low-poly preview before execution
- Live material editing

**Phase 8: Collaboration**
- Multi-user scenes
- Real-time sync
- Version control for scenes
