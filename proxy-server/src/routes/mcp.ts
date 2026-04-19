import { Router, Request, Response } from 'express'
import { z } from 'zod'
import {
  MCPToolCallResponseSchema,
  validateToolCall,
  validateToolOutput,
} from '../toolRegistry'

export const mcpRouter = Router()

const DEFAULT_TIMEOUT_MS = 10000

async function forwardToBridge(req: Request, res: Response, bridgePath: string) {
  const bridgeUrl = req.app.locals.mcpBridgeUrl as string | undefined
  if (!bridgeUrl) {
    res.status(503).json({
      ok: false,
      configured: false,
      error: 'MCP bridge URL is not configured',
    })
    return
  }

  const target = new URL(bridgePath, bridgeUrl)
  const response = await fetch(target, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {}),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  })

  const text = await response.text()
  res.status(response.status)

  try {
    res.json(text ? JSON.parse(text) : {})
  } catch {
    res.type('text/plain').send(text)
  }
}

mcpRouter.get('/status', async (req: Request, res: Response) => {
  const bridgeUrl = req.app.locals.mcpBridgeUrl as string | undefined
  if (!bridgeUrl) {
    res.json({
      ok: false,
      configured: false,
      reachable: false,
      bridgeUrl: null,
      connections: [],
      message: 'MCP bridge URL is not configured',
    })
    return
  }

  try {
    const response = await fetch(new URL('/health', bridgeUrl), {
      signal: AbortSignal.timeout(5000),
    })
    res.json({
      ok: response.ok,
      configured: true,
      reachable: response.ok,
      bridgeUrl,
      status: response.ok ? 'healthy' : 'unhealthy',
    })
  } catch (error) {
    res.json({
      ok: false,
      configured: true,
      reachable: false,
      bridgeUrl,
      error: error instanceof Error ? error.message : 'MCP bridge is not reachable',
    })
  }
})

mcpRouter.get('/connections', async (req: Request, res: Response) => {
  try {
    await forwardToBridge(req, res, '/connections')
  } catch (error) {
    res.status(502).json({
      ok: false,
      connections: [],
      error: error instanceof Error ? error.message : 'Could not fetch MCP connections',
    })
  }
})

mcpRouter.post('/connect', async (req: Request, res: Response) => {
  try {
    await forwardToBridge(req, res, '/connect')
  } catch (error) {
    res.status(502).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Could not connect MCP bridge',
    })
  }
})

mcpRouter.post('/tools/list', async (req: Request, res: Response) => {
  try {
    await forwardToBridge(req, res, '/tools/list')
  } catch (error) {
    res.status(502).json({
      ok: false,
      tools: [],
      error: error instanceof Error ? error.message : 'Could not list MCP tools',
    })
  }
})

mcpRouter.post('/tools/call', async (req: Request, res: Response) => {
  try {
    const toolCall = validateToolCall(req.body)
    const bridgeUrl = req.app.locals.mcpBridgeUrl as string | undefined
    if (!bridgeUrl) {
      res.status(503).json({
        success: false,
        result: null,
        logs: [],
        error: 'MCP bridge URL is not configured',
      })
      return
    }

    const startedAt = Date.now()
    const response = await fetch(new URL('/tools/call', bridgeUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toolCall),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })

    const bridgeData = await response.json().catch(() => null) as {
      success?: boolean
      result?: unknown
      logs?: unknown
      error?: string | null
    } | null
    const normalized = MCPToolCallResponseSchema.parse({
      success: response.ok && Boolean(bridgeData?.success),
      result: bridgeData?.result ?? null,
      logs: Array.isArray(bridgeData?.logs) ? bridgeData.logs : [],
      error: response.ok
        ? bridgeData?.error ?? null
        : `MCP bridge error: ${response.status} ${response.statusText}`,
    })

    if (normalized.success) {
      validateToolOutput(toolCall.tool, normalized.result)
    }

    res.status(response.ok ? 200 : response.status).json({
      ...normalized,
      logs: [
        ...normalized.logs,
        `proxy validated ${toolCall.tool}@${toolCall.version} in ${Date.now() - startedAt}ms`,
      ],
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        result: null,
        logs: [],
        error: `MCP validation failed: ${error.message}`,
      })
      return
    }

    res.status(502).json({
      success: false,
      result: null,
      logs: [],
      error: error instanceof Error ? error.message : 'Could not call MCP tool',
    })
  }
})
