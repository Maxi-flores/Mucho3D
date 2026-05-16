/**
 * MCP Bridge client for proxy-server
 * Makes HTTP calls to the MCP bridge service running on port 8790
 */

const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL || 'http://localhost:8790'
const MCP_TIMEOUT_MS = Number(process.env.MCP_BRIDGE_TIMEOUT_MS || 30000)

export interface MCPToolResponse {
  success: boolean
  result?: unknown
  error?: string
  logs?: string[]
  createdObjects?: number
  exports?: Array<{
    format: string
    path: string
    size?: number
  }>
}

/**
 * Call an MCP tool via HTTP
 */
export async function callMCPTool(
  tool: string,
  payload: Record<string, unknown>
): Promise<MCPToolResponse> {
  try {
    console.log(`[mcp-client] Calling tool: ${tool}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS)

    try {
      const response = await fetch(`${MCP_BRIDGE_URL}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tool, payload }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[mcp-client] HTTP error: ${response.status} ${errorText}`)
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          logs: [],
        }
      }

      const data = (await response.json()) as unknown

      // Handle both success and error responses
      if (typeof data === 'object' && data !== null) {
        const result = data as Record<string, unknown>
        return {
          success: Boolean(result.success),
          result: result.result,
          error: (result.error as string) || undefined,
          logs: Array.isArray(result.logs) ? (result.logs as string[]) : [],
          createdObjects: typeof result.createdObjects === 'number' ? result.createdObjects : 0,
          exports: Array.isArray(result.exports) ? (result.exports as Array<{ format: string; path: string; size?: number }>) : [],
        }
      }

      return {
        success: false,
        error: 'Invalid response from MCP bridge',
        logs: [],
      }
    } catch (err) {
      clearTimeout(timeoutId)

      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          error: `MCP bridge timeout after ${MCP_TIMEOUT_MS}ms`,
          logs: [],
        }
      }

      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      return {
        success: false,
        error: `Failed to call MCP bridge: ${errorMsg}`,
        logs: [],
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      error: `MCP client error: ${errorMsg}`,
      logs: [],
    }
  }
}

/**
 * Check MCP bridge health
 */
export async function checkMCPBridgeHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_BRIDGE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * List available MCP tools
 */
export async function listMCPTools(): Promise<Array<{ name: string; description: string }>> {
  try {
    const response = await fetch(`${MCP_BRIDGE_URL}/tools`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) return []

    const data = (await response.json()) as { tools?: Array<{ name: string; description: string }> }
    return Array.isArray(data.tools) ? data.tools : []
  } catch {
    return []
  }
}
