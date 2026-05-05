# Blender Local Execution Mode

Real 3D scene generation using Blender via the MCP bridge and local Blender Python execution.

## Overview

When `BLENDER_MODE=local`, generation jobs execute through the MCP bridge to create scenes in Blender, apply materials/lighting, and export real GLB artifacts.

```
Frontend (ProjectStudio)
  ↓ POST /api/blender/jobs
Proxy Server (blenderExecutor)
  ↓ callMCPTool('execute_plan')
MCP Bridge (HTTP server + socket bridge)
  ↓ socket to Blender on port 9100
Blender (execute_plan.py)
  ↓ creates scene, applies materials, exports GLB
Result artifacts returned to frontend
```

## Prerequisites

### Blender Installation

- **Blender 3.0 or later** (tested on 3.6, 4.0, 4.3)
- Must be accessible via command line
- Requires Python support (enabled by default)

**Platform-specific paths:**

| OS | Default Path | Check Command |
|----|--------------|---------------|
| **macOS** | `/Applications/Blender.app/Contents/MacOS/Blender` | `blender --version` |
| **Linux** | `/usr/bin/blender` or `/opt/blender/blender` | `blender --version` |
| **Windows** | `C:\Program Files\Blender Foundation\Blender 4.3\blender.exe` | `blender --version` |

### Verify Blender Installation

```bash
blender --version
# Output: Blender 4.3.1
```

## Environment Variables

### MCP Bridge

```env
# MCP Bridge configuration (mcp-bridge/.env)
BLENDER_BRIDGE_HOST=127.0.0.1
BLENDER_BRIDGE_PORT=9100
BLENDER_BRIDGE_TIMEOUT_MS=30000
```

### Proxy Server

```env
# Proxy server configuration (proxy-server/.env)
BLENDER_MODE=local
MCP_BRIDGE_URL=http://localhost:8790
PORT=8787

# Job processing
JOB_TIMEOUT_MS=300000  # 5 minutes
```

### Frontend

```env
# Frontend (/.env.local)
VITE_PROXY_API_URL=http://localhost:8787
VITE_OLLAMA_URL=http://localhost:11434
```

## Running the Full Stack

### Terminal 1: Ollama

```bash
ollama serve
# Listens on http://localhost:11434
```

### Terminal 2: MCP Bridge

```bash
cd mcp-bridge
npm install
npm run dev
# Listening on http://localhost:8790
# Connects to Blender socket on 9100
```

### Terminal 3: Proxy Server

```bash
cd proxy-server
npm install
BLENDER_MODE=local npm run dev
# Listening on http://localhost:8787
```

### Terminal 4: Frontend

```bash
npm install
npm run dev
# Listening on http://localhost:5173
```

### Terminal 5: Blender (Headless)

**macOS/Linux:**
```bash
blender \
  --background \
  --python-socket 9100 \
  --enable-autoexec
```

**Windows (PowerShell):**
```powershell
& "C:\Program Files\Blender Foundation\Blender 4.3\blender.exe" `
  --background `
  --python-socket 9100 `
  --enable-autoexec
```

Or use a startup script:

```bash
# Create blender-bridge.sh
#!/bin/bash
blender --background --python-socket 9100 --enable-autoexec
```

## Testing the Pipeline

### 1. Create a Test Project

1. Navigate to http://localhost:5173
2. Create a new project or open existing
3. Navigate to Project Studio

### 2. Create Nodes

Create nodes in the canvas:

- **CONCEPT** node: Describe what you want
- **OBJECT** nodes: 
  - "Box" (creates a cube)
  - "Sphere" (creates a sphere)
  - "Cylinder" (creates a cylinder)
  - Supports: box, sphere, cylinder, cone, torus, plane
- **LIGHT** node: "Main light" (directional by default)
- **CAMERA** node: "Camera" (default position)

Example layout:
```
[CONCEPT: Modern product display]
  └── [OBJECT: Product base box]
  └── [OBJECT: Product pedestal cylinder]
  └── [LIGHT: Rim light]
  └── [CAMERA: Product shot]
```

### 3. Execute Pipeline

1. Click "Execute Pipeline" in Studio header
2. Watch status progress in bottom bar:
   - sending_to_blender (validates plan, sends to MCP)
   - executing_blender (creates objects in scene)
   - exporting (renders and exports GLB)
   - complete (artifact ready for download)

### 4. Verify Output

- **Local artifacts directory:** `proxy-server/artifacts/jobs/{jobId}/`
- Check for `scene.glb` file
- Artifact metadata returned in job response

## Architecture Details

### GenerationPlan Schema

The plan sent to Blender includes:

```typescript
{
  id: string
  projectId: string
  title: string
  description: string
  objects: [{
    id: string
    name: string
    type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane'
    position: [x, y, z]
    rotation: [rx, ry, rz]  // degrees
    scale: [sx, sy, sz]
    color?: '#RRGGBB'
    material?: { metallic: 0-1, roughness: 0-1 }
    modifiers?: [{ type, params }]
  }]
  lights?: [{
    id: string
    type: 'directional' | 'point' | 'spot'
    position: [x, y, z]
    intensity: 0-5
  }]
  camera?: {
    position: [x, y, z]
    target: [x, y, z]
    fov: degrees
  }
  outputFormat: 'glb' | 'fbx' | 'stl'
  qualityLevel: 'low' | 'medium' | 'high'
}
```

### MCP Bridge Tools

**execute_plan:**
- Accepts GenerationPlan + jobId
- Creates scene in Blender
- Returns: success, createdObjects, logs, errors

**export_scene:**
- Accepts formats, outputDir, jobId
- Exports GLB/FBX/STL
- Returns: exports array with file paths

### Job Status Progression

```
queued
  ↓ (immediately)
sending_to_blender  (0.5s - validate and send plan)
  ↓
executing_blender   (2-30s depending on complexity)
  ↓
exporting          (1-5s - render and export)
  ↓
complete           (with artifact metadata)
```

Or on error:
```
any stage → failed (with error message)
```

## Safety & Validation

### Input Validation (Proxy Server)

- Max 100 objects per plan
- Max 10 lights
- Coordinates in range [-1000, 1000]
- Scales in range [0.01, 100]
- Only whitelisted primitive types
- Valid export formats only

### Execution Safety (Blender Script)

- No arbitrary Python execution
- Whitelisted primitive types
- Numeric bounds checking
- Output written to isolated directory
- Timeout protection (30s per tool call, 5m per job)

## Troubleshooting

### "Blender bridge not reachable on 127.0.0.1:9100"

**Cause:** Blender not running or socket not open

**Fix:**
```bash
# 1. Verify Blender is running
ps aux | grep blender

# 2. Check socket is listening
lsof -i :9100

# 3. Restart Blender with correct socket port
blender --background --python-socket 9100
```

### "MCP bridge timeout after 30000ms"

**Cause:** Blender execution taking too long

**Fix:**
```bash
# Increase timeout in proxy-server/.env
MCP_BRIDGE_TIMEOUT_MS=60000
```

### "Plan validation failed: Too many objects"

**Cause:** Plan exceeds 100-object limit

**Fix:**
- Reduce number of objects in scene
- Split into multiple jobs
- Check object count in logs

### "Export failed"

**Cause:** Blender crash or export error

**Fix:**
- Check Blender version compatibility
- Verify outputFormat is valid (glb/fbx/stl)
- Check disk space in artifacts directory
- Review Blender error logs

### No artifact file created

**Cause:** Export stage didn't complete

**Check:**
1. Job status in WebSocket updates
2. Logs in job response for error messages
3. Blender terminal output for exceptions
4. `proxy-server/artifacts/jobs/{jobId}/` directory

## Performance Notes

### Current Limitations

- Single Blender instance (no parallelization)
- Max ~100 objects per scene
- Export to one format per job (run multiple jobs for multiple formats)
- No GPU rendering (could be added)

### Optimization Opportunities

1. **Multiple Blender Workers:** Run pool of Blender instances
2. **Async Exports:** Queue multiple export formats
3. **Caching:** Cache frequently-used scene templates
4. **GPU Rendering:** Use Cycles with CUDA/OptiX
5. **Cloud Rendering:** Deploy to GCP/AWS Compute

## Integration Checklist

- [ ] Blender 3.0+ installed and in PATH
- [ ] MCP bridge running on port 8790
- [ ] Proxy server configured with BLENDER_MODE=local
- [ ] Frontend environment variables set
- [ ] Ollama running for LLM planning
- [ ] WebSocket connection working (check browser dev tools)
- [ ] Test job created and completed
- [ ] Artifact downloaded and opened in 3D viewer
- [ ] Job logs reviewed for any warnings

## Next Steps

1. **Real-Time Execution Feedback:** Add live Blender console output
2. **Multiple Export Formats:** Support simultaneous GLB, FBX, STL export
3. **Material Customization:** Full PBR material assignment from nodes
4. **Procedural Models:** Geometry nodes for procedural generation
5. **Distributed Execution:** Worker pool for parallel processing
6. **Cloud Rendering:** Deploy Blender to cloud with artifact storage

## Support

For issues with:

- **Blender socket connection:** Check `BLENDER_BRIDGE_HOST:PORT` env vars
- **Execution errors:** Review job logs in browser WebSocket updates
- **Export failures:** Check `proxy-server/artifacts/jobs/{jobId}/` for partial output
- **Performance:** Monitor Blender process memory and CPU usage
- **Schema mismatches:** Verify GenerationPlan matches execute_plan tool schema

See `BLENDER_PIPELINE.md` for overall architecture.
