import { Router, Request, Response } from 'express'
import { runAgentTurn } from '../services/agentLoop'
import { callMCPTool } from '../services/mcpClient'
import { ChatMessage } from '../services/plannerService'

export const chatRouter = Router()

const DEFAULT_MCP_BRIDGE = 'http://localhost:8790'

interface ChatRequest {
  messages: ChatMessage[]
  sessionId?: string
}

interface ToolResultResponse {
  type: 'tool_result'
  tool: 'create_primitive'
  result: unknown
  logs: string[]
}

async function callMCP(
  mcpEndpoint: string,
  tool: string,
  payload: Record<string, unknown>
): Promise<Awaited<ReturnType<typeof callMCPTool>>> {
  return callMCPTool(mcpEndpoint, tool, payload)
}

async function handlePrimitive(
  mcpEndpoint: string,
  type: string
): Promise<ToolResultResponse> {
  const result = await callMCP(mcpEndpoint, 'create_primitive', { type })

  return {
    type: 'tool_result',
    tool: 'create_primitive',
    result: result.result ?? null,
    logs: result.logs ?? [],
  }
}

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    console.log('[proxy] -> received request')

    const { messages, sessionId = 'default' } = req.body as ChatRequest

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array required' })
      return
    }

    const ollamaUrl = req.app.locals.ollamaUrl as string
    const mcpBridgeUrl = (req.app.locals.mcpBridgeUrl as string | undefined) || DEFAULT_MCP_BRIDGE
    const mcpEndpoint = `${mcpBridgeUrl.replace(/\/$/, '')}/tools/call`
    const lastMessage = messages[messages.length - 1]
    const msg = (lastMessage?.content || '').toLowerCase().trim()

    console.log('[proxy] -> evaluating hard rules')
    console.log('🔥 NEW RULE ENGINE ACTIVE', msg)

    let shape: string | undefined

    if (/\bcylinder\b/.test(msg)) shape = 'cylinder'
    else if (/\bsphere\b/.test(msg)) shape = 'sphere'
    else if (/\bcube\b/.test(msg)) shape = 'cube'

    if (shape) {
      console.log('[proxy] -> hard rule matched', shape)
      const response = await handlePrimitive(mcpEndpoint, shape)
      return res.json(response)
    }

    const agentResponse = await runAgentTurn({
      sessionId,
      userInput: msg,
      messages,
      ollamaUrl,
      mcpEndpoint,
    })

    if (agentResponse.type === 'tool_result') {
      return res.json({
        type: 'tool_result',
        tool: agentResponse.tool,
        result: agentResponse.result ?? null,
        logs: agentResponse.logs ?? [],
        sessionId: agentResponse.sessionId,
      })
    }

    return res.json({
      type: 'text',
      message: agentResponse.message ?? '',
      sessionId: agentResponse.sessionId,
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Chat request failed' })
  }
})
