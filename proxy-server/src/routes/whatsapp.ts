import { Router, Request, Response } from 'express'
import { z } from 'zod'

export const whatsappRouter = Router()

interface GeneratedPlanObject {
  type?: unknown
  position?: unknown
  rotation?: unknown
  scale?: unknown
  color?: unknown
  name?: unknown
}

interface GeneratePlanResponse {
  plan?: {
    objects?: GeneratedPlanObject[]
  }
}

// Schema for WhatsApp generation request
const WhatsAppGenerateSchema = z.object({
  prompt: z.string().min(1),
  metadata: z.object({
    source: z.string(),
    userId: z.string(),
    userName: z.string(),
    messageId: z.string()
  })
})

// WhatsApp prompt processing endpoint
whatsappRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, metadata } = WhatsAppGenerateSchema.parse(req.body)

    console.log(`[WhatsApp] Request from ${metadata.userName}: ${prompt}`)

    // Forward to MCP bridge for execution
    const mcpBridgeUrl = req.app.locals.mcpBridgeUrl as string | undefined
    if (!mcpBridgeUrl) {
      res.status(503).json({
        success: false,
        error: 'MCP bridge not configured'
      })
      return
    }

    // Generate plan first using AI
    const planResponse = await fetch(`${req.protocol}://${req.get('host')}/api/generate-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(30000)
    })

    if (!planResponse.ok) {
      throw new Error(`Plan generation failed: ${planResponse.status}`)
    }

    const planData = (await planResponse.json()) as GeneratePlanResponse

    // Execute the plan through MCP bridge
    const executionResults: unknown[] = []
    if (planData.plan && planData.plan.objects) {
      for (const obj of planData.plan.objects) {
        const toolCall = {
          tool: 'create_primitive',
          version: '1.0.0',
          payload: {
            primitiveType: obj.type || 'box',
            position: obj.position || [0, 0, 0],
            rotation: obj.rotation || [0, 0, 0],
            scale: obj.scale || [1, 1, 1],
            color: obj.color || '#00A3FF',
            name: obj.name || `Object ${executionResults.length + 1}`
          }
        }

        const mcpResponse = await fetch(new URL('/tools/call', mcpBridgeUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toolCall),
          signal: AbortSignal.timeout(10000)
        })

        if (mcpResponse.ok) {
          const result = await mcpResponse.json()
          executionResults.push(result)
        }
      }
    }

    // Return success response
    res.json({
      success: true,
      plan: planData.plan,
      result: {
        objects: executionResults,
        metadata: metadata
      },
      sceneUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/studio`
    })

  } catch (error) {
    console.error('[WhatsApp] Error:', error)

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request format'
      })
      return
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// Health check for WhatsApp integration
whatsappRouter.get('/status', (req: Request, res: Response) => {
  const mcpBridgeUrl = req.app.locals.mcpBridgeUrl as string | undefined
  res.json({
    ok: true,
    mcpConfigured: Boolean(mcpBridgeUrl),
    timestamp: new Date().toISOString()
  })
})
