import {
  MCPToolCall,
  MCPToolCallResult,
  MCPToolCallResultSchema,
  validateToolCall,
} from './mcp/toolRegistry'

const PROXY_API_URL = import.meta.env.VITE_PROXY_API_URL || 'http://localhost:8787'

export interface McpBridgeStatus {
  ok: boolean
  configured: boolean
  reachable: boolean
  bridgeUrl: string | null
  status?: string
  message?: string
  error?: string
}

export interface McpConnection {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'error'
  transport?: string
  tools?: string[]
}

export async function getMcpBridgeStatus(): Promise<McpBridgeStatus> {
  try {
    const response = await fetch(`${PROXY_API_URL}/api/mcp/status`, {
      signal: AbortSignal.timeout(5000),
    })
    const data = (await response.json()) as Partial<McpBridgeStatus>
    return {
      ok: Boolean(data.ok),
      configured: Boolean(data.configured),
      reachable: Boolean(data.reachable),
      bridgeUrl: data.bridgeUrl || null,
      status: data.status,
      message: data.message,
      error: data.error,
    }
  } catch (error) {
    return {
      ok: false,
      configured: false,
      reachable: false,
      bridgeUrl: null,
      error: error instanceof Error ? error.message : 'Could not reach MCP bridge',
    }
  }
}

export async function getMcpConnections(): Promise<McpConnection[]> {
  try {
    const response = await fetch(`${PROXY_API_URL}/api/mcp/connections`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return []
    const data = (await response.json()) as {
      connections?: McpConnection[]
      servers?: McpConnection[]
    }
    return data.connections || data.servers || []
  } catch {
    return []
  }
}

export async function connectMcpServer(config: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${PROXY_API_URL}/api/mcp/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    throw new Error(`MCP bridge connect failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function callMcpTool(toolCall: MCPToolCall): Promise<MCPToolCallResult> {
  const validatedCall = validateToolCall(toolCall)

  const response = await fetch(`${PROXY_API_URL}/api/mcp/tools/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: validatedCall.tool,
      version: validatedCall.version,
      requestId: validatedCall.requestId,
      payload: validatedCall.payload,
    }),
  })

  if (!response.ok) {
    throw new Error(`MCP tool call failed: ${response.status} ${response.statusText}`)
  }

  return MCPToolCallResultSchema.parse(await response.json())
}
