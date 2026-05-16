import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import {
  executeTool,
  listTools as listRegisteredTools,
} from './src/tools/registry'
import { isBlenderAvailable } from './src/blenderSocketBridge'

const app = express()
const PORT = 8790

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ─────────────────────────────────────────────
// Health & Meta
// ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'mcp-bridge',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

app.get('/blender/health', async (_req, res) => {
  try {
    const available = await isBlenderAvailable()
    res.json({
      ok: available,
      service: 'blender',
      status: available ? 'healthy' : 'unreachable',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      ok: false,
      service: 'blender',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
})

app.get('/connections', (_req, res) => {
  // placeholder for future multi-client tracking
  res.json([])
})

app.post('/connect', (_req, res) => {
  // placeholder handshake endpoint
  res.json({ success: true })
})

// ─────────────────────────────────────────────
// Tools API
// ─────────────────────────────────────────────

// List available tools
app.get('/tools', (_req, res) => {
  res.json({
    tools: listRegisteredTools(),
  })
})

// Backward compatibility (optional)
app.get('/tools/list', (_req, res) => {
  res.redirect('/tools')
})

// Execute tool
app.post('/tools/call', async (req, res) => {
  const startedAt = Date.now()

  const { tool, payload } = req.body as {
    tool?: string
    payload?: unknown
  }

  const isProxyContractCall =
    typeof req.body?.version === 'string' ||
    typeof req.body?.requestId === 'string'

  if (!tool) {
    return res.status(400).json({
      success: false,
      error: 'tool is required',
      result: null,
      logs: [],
    })
  }

  try {
    const execution = await executeTool(tool, payload)
    const durationMs = Date.now() - startedAt

    console.log(
      '[mcp-tool]',
      JSON.stringify({
        tool,
        durationMs,
        payload,
      })
    )

    return res.json({
      success: true,
      result: isProxyContractCall
        ? toProxyContractResult(tool, execution.result)
        : execution.result,
      logs: [
        ...execution.logs,
        `Executed ${tool} in ${durationMs}ms`,
      ],
      error: null,
    })
  } catch (error) {
    const durationMs = Date.now() - startedAt

    const message =
      error instanceof z.ZodError
        ? `Validation failed: ${error.message}`
        : error instanceof Error
        ? error.message
        : 'Tool execution failed'

    console.error(
      '[mcp-tool-error]',
      JSON.stringify({
        tool,
        payload,
        durationMs,
        error: message,
      })
    )

    return res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      result: null,
      logs: [`Failed ${tool} in ${durationMs}ms`],
      error: message,
    })
  }
})

// ─────────────────────────────────────────────
// Proxy Contract Mapping
// ─────────────────────────────────────────────
function toProxyContractResult(
  tool: string,
  result: unknown
): unknown {
  if (!result || typeof result !== 'object') return result

  const value = result as Record<string, unknown>

  switch (tool) {
    case 'create_primitive':
      return {
        objectId: value.objectId,
        objectType: value.objectType,
        name: value.name,
      }

    case 'transform_object':
      return {
        objectId: value.objectId,
        transformed: value.transformed,
      }

    case 'apply_material':
      return {
        objectId: value.objectId,
        materialApplied: value.materialApplied,
      }

    case 'export_scene':
      return {
        format: value.format,
        path: value.path,
      }

    default:
      return result
  }
}

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🔌 MCP Bridge running on http://localhost:${PORT}`)
})