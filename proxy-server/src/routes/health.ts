import { Router, Request, Response } from 'express'

export const healthRouter = Router()

healthRouter.get('/', async (req: Request, res: Response) => {
  try {
    const ollamaUrl = req.app.locals.ollamaUrl
    const mcpBridgeUrl = req.app.locals.mcpBridgeUrl as string | undefined

    // Check Ollama health
    let ollamaReachable = false
    let mcpBridgeReachable = false
    let blenderReachable = false
    let models: string[] = []
    let defaultModel = 'qwen2.5-coder:latest'

    try {
      const healthResponse = await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      })

      if (healthResponse.ok) {
        ollamaReachable = true
        const data = (await healthResponse.json()) as { models?: Array<{ name: string }> }
        models = data.models?.map((m) => m.name) || []
        defaultModel = models[0] || 'qwen2.5-coder:latest'
      }
    } catch {
      // Ollama not reachable
    }

    if (mcpBridgeUrl) {
      try {
        const mcpResponse = await fetch(`${mcpBridgeUrl}/health`, {
          signal: AbortSignal.timeout(5000),
        })
        mcpBridgeReachable = mcpResponse.ok

        // Also check Blender availability via MCP bridge
        if (mcpBridgeReachable) {
          try {
            const blenderResponse = await fetch(`${mcpBridgeUrl}/blender/health`, {
              signal: AbortSignal.timeout(5000),
            })
            const blenderData = await blenderResponse.json()
            blenderReachable = Boolean(blenderData.ok)
          } catch {
            // Blender not reachable
          }
        }
      } catch {
        // MCP bridge not reachable
      }
    }

    res.json({
      ok: ollamaReachable,
      timestamp: new Date().toISOString(),
      ollamaReachable,
      ollamaUrl,
      mcpBridgeReachable,
      mcpBridgeConfigured: Boolean(mcpBridgeUrl),
      mcpBridgeUrl: mcpBridgeUrl || null,
      blenderReachable,
      models,
      defaultModel,
      status: ollamaReachable ? 'healthy' : 'unhealthy',
      message: ollamaReachable ? 'Ollama is reachable' : 'Ollama is not reachable',
    })
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString(),
    })
  }
})
