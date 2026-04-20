import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import { executeTool, listTools as listRegisteredTools } from './src/tools/registry'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 8790

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'mcp-bridge',
    status: 'healthy',
  })
})

app.get('/connections', (_req, res) => {
  res.json([])
})

app.post('/connect', (_req, res) => {
  res.json({ success: true })
})

const listToolsHandler = (_req: express.Request, res: express.Response) => {
  res.json(listRegisteredTools())
}

app.get('/tools/list', listToolsHandler)
app.post('/tools/list', listToolsHandler)

app.post('/tools/call', async (req, res) => {
  const startedAt = Date.now()
  const { tool, payload } = req.body as {
    tool?: string
    payload?: unknown
  }
  const isProxyContractCall = typeof req.body?.version === 'string' || typeof req.body?.requestId === 'string'

  try {
    if (!tool) {
      throw new Error('tool is required')
    }

    const execution = await executeTool(tool, payload)
    const durationMs = Date.now() - startedAt
    const logEntry = {
      tool,
      payload,
      durationMs,
      result: execution.result,
    }

    console.log('[mcp-tool]', JSON.stringify(logEntry))

    res.json({
      success: true,
      result: isProxyContractCall ? toProxyContractResult(tool, execution.result) : execution.result,
      logs: [...execution.logs, `Executed ${tool} in ${durationMs}ms`],
      error: null,
    })
  } catch (error) {
    const durationMs = Date.now() - startedAt
    const message = error instanceof z.ZodError
      ? `Validation failed: ${error.message}`
      : error instanceof Error
        ? error.message
        : 'Tool execution failed'

    console.error('[mcp-tool-error]', JSON.stringify({ tool, payload, durationMs, error: message }))

    res.status(error instanceof z.ZodError ? 400 : 404).json({
      success: false,
      result: null,
      logs: [`Failed ${tool || 'unknown'} in ${durationMs}ms`],
      error: message,
    })
  }
})

function toProxyContractResult(tool: string, result: unknown): unknown {
  if (!result || typeof result !== 'object') return result
  const value = result as Record<string, unknown>

  if (tool === 'create_primitive') {
    return {
      objectId: value.objectId,
      objectType: value.objectType,
      name: value.name,
    }
  }

  if (tool === 'transform_object') {
    return {
      objectId: value.objectId,
      transformed: value.transformed,
    }
  }

  if (tool === 'apply_material') {
    return {
      objectId: value.objectId,
      materialApplied: value.materialApplied,
    }
  }

  if (tool === 'export_scene') {
    return {
      format: value.format,
      path: value.path,
    }
  }

  return result
}

app.listen(PORT, () => {
  console.log(`🔌 MCP Bridge running on http://localhost:${PORT}`)
})
