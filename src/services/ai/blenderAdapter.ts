import { MCPToolCall, validateToolCall } from '@/services/mcp/toolRegistry'
import { callMcpTool } from '@/services/mcpBridgeService'

/**
 * Legacy Blender adapter boundary.
 * Blender execution now flows exclusively through validated MCP tool calls.
 */

export interface BlenderMCPPayload {
  toolCalls: MCPToolCall[]
}

export interface BlenderMCPResult {
  success: boolean
  logs: string[]
  errors?: string[]
}

export function validateBlenderToolCalls(toolCalls: MCPToolCall[]): string[] {
  const errors: string[] = []

  for (const call of toolCalls) {
    try {
      validateToolCall(call)
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid MCP tool call')
    }
  }

  return errors
}

export async function executeBlenderToolCalls(
  payload: BlenderMCPPayload
): Promise<BlenderMCPResult> {
  const validationErrors = validateBlenderToolCalls(payload.toolCalls)
  if (validationErrors.length > 0) {
    return {
      success: false,
      logs: [],
      errors: validationErrors,
    }
  }

  const logs: string[] = []
  const errors: string[] = []

  for (const toolCall of payload.toolCalls) {
    const result = await callMcpTool(toolCall)
    logs.push(...result.logs)

    if (!result.success) {
      errors.push(result.error || `MCP tool failed: ${toolCall.tool}`)
      break
    }
  }

  return {
    success: errors.length === 0,
    logs,
    errors: errors.length > 0 ? errors : undefined,
  }
}
