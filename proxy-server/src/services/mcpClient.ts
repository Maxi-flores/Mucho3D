export interface MCPToolResponse {
  success?: boolean
  result?: unknown
  logs?: string[]
  error?: string | null
}

export async function callMCPTool(
  mcpEndpoint: string,
  tool: string,
  payload: Record<string, unknown>
): Promise<MCPToolResponse> {
  console.log('[proxy] -> calling MCP')

  const mcpResponse = await fetch(mcpEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool,
      payload,
    }),
  })

  const data = (await mcpResponse
    .json()
    .catch(() => null)) as MCPToolResponse | null

  if (!mcpResponse.ok || data?.success === false) {
    throw new Error(
      data?.error ||
        `MCP error: ${mcpResponse.status} ${mcpResponse.statusText}`
    )
  }

  return {
    success: true,
    result: data?.result ?? null,
    logs: Array.isArray(data?.logs) ? data.logs : [],
    error: null,
  }
}
