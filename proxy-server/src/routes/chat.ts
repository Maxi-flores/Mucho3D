import { Router, Request, Response } from 'express'

export const chatRouter = Router()

const TOOL_SYSTEM_PROMPT = `You are a tool-calling assistant.

Rules:

* If user asks to create an object -> call create_primitive
* Otherwise -> return null

Output ONLY JSON:

{
"tool": "...",
"payload": { ... }
}

Examples:

User: create a cube
Response:
{ "tool": "create_primitive", "payload": { "type": "cube" } }

User: hello
Response:
{ "tool": null, "payload": null }

Do NOT include explanations.`

const DEFAULT_OLLAMA_MODEL = 'phi3'
const DEFAULT_MCP_BRIDGE = 'http://localhost:8790'

interface ToolCall {
  tool: string | null
  payload: Record<string, unknown> | null
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
}

interface MCPToolResponse {
  result?: unknown
  logs?: string[]
}

interface OllamaChatResponse {
  message?: {
    content?: string
  }
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
): Promise<MCPToolResponse | null> {
  console.log('[proxy] -> calling MCP')

  const mcpResponse = await fetch(mcpEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool,
      payload,
    }),
  })

  return (await mcpResponse.json().catch(() => null)) as MCPToolResponse | null
}

async function handlePrimitive(
  mcpEndpoint: string,
  type: string
): Promise<ToolResultResponse> {
  const result = await callMCP(mcpEndpoint, 'create_primitive', { type })

  return {
    type: 'tool_result',
    tool: 'create_primitive',
    result: result?.result ?? null,
    logs: result?.logs ?? [],
  }
}

function extractFirstJsonBlock(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return trimmed
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const objectLikeMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectLikeMatch?.[0]) {
    return objectLikeMatch[0]
  }

  return null
}

function parseToolCall(input: string): ToolCall | null {
  const candidate = extractFirstJsonBlock(input)
  if (!candidate) return null

  try {
    const parsed = JSON.parse(candidate) as Partial<ToolCall>
    const tool = typeof parsed.tool === 'string' ? parsed.tool : parsed.tool === null ? null : null
    const payload = parsed.payload && typeof parsed.payload === 'object' && !Array.isArray(parsed.payload)
      ? parsed.payload as Record<string, unknown>
      : parsed.payload === null
      ? null
      : null

    if (tool === null && payload === null) {
      return { tool: null, payload: null }
    }

    if (tool && payload) {
      return { tool, payload }
    }

    return null
  } catch {
    return null
  }
}

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    console.log('[proxy] -> received request')

    const { messages } = req.body as ChatRequest

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array required' })
      return
    }

    const ollamaUrl = req.app.locals.ollamaUrl as string
    const ollamaEndpoint = `${ollamaUrl}/api/chat`
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

    const ollamaRequest = {
      model: DEFAULT_OLLAMA_MODEL,
      messages: [
        { role: 'system', content: TOOL_SYSTEM_PROMPT },
        ...messages,
      ],
      stream: false,
      options: {
        temperature: 0,
      },
    }

    console.log('[proxy] -> calling ollama')
    const response = await fetch(ollamaEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaRequest),
    })

    if (response.status !== 200) {
      const errorBody = await response.text()
      console.error('[proxy] -> ollama non-200 response', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      })
      res.status(response.status).json({ error: `Ollama error: ${response.statusText}` })
      return
    }

    const data = (await response.json()) as OllamaChatResponse
    const rawResponse = typeof data?.message?.content === 'string' ? data.message.content : JSON.stringify(data)
    console.log('[proxy] -> raw response', rawResponse)

    const parsedToolCall = parseToolCall(rawResponse)
    console.log('[proxy] -> parsed JSON', parsedToolCall)

    if (parsedToolCall?.tool && parsedToolCall.tool !== 'respond_text') {
      console.log('[proxy] -> tool detected', parsedToolCall.tool)
      const mcpPayload = parsedToolCall.payload
      if (!mcpPayload) {
        res.status(400).json({ error: 'Tool payload required' })
        return
      }

      const mcpData = await callMCP(mcpEndpoint, parsedToolCall.tool, mcpPayload)
      res.json({
        type: 'tool_result',
        tool: parsedToolCall.tool,
        result: mcpData?.result ?? mcpData,
        logs: mcpData?.logs ?? [],
      })
      return
    }

    if (parsedToolCall?.tool === 'respond_text') {
      const textMessage = parsedToolCall.payload?.['message']
      res.json({
        type: 'text',
        message: typeof textMessage === 'string'
          ? textMessage
          : rawResponse,
      })
      return
    }

    res.json({
      type: 'text',
      message: rawResponse,
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Chat request failed' })
  }
})
