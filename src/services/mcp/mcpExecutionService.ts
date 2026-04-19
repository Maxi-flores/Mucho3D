import { Timestamp } from 'firebase/firestore'
import { callMcpTool } from '@/services/mcpBridgeService'
import { executePayload } from '@/services/execution/sceneExecutor'
import { addExecutionLog } from '@/services/ai/executionLogger'
import { ExecutionPayload, ExecutionResult } from '@/types/firebase'
import {
  ApplyMaterialInputSchema,
  CreatePrimitiveInputSchema,
  MCPToolCall,
  MCPToolCallResult,
  summarizeToolPayload,
  TransformObjectInputSchema,
  validateToolCall,
} from './toolRegistry'

export interface MCPExecutionStepLog {
  timestamp: Timestamp
  tool: string
  requestId: string
  payloadSummary: Record<string, unknown>
  result: unknown
  durationMs: number
  error: string | null
}

export interface MCPExecutionOptions {
  generationId: string
  projectId: string
  userId: string
  allowJsFallback?: boolean
}

function resultToObjects(
  toolCalls: MCPToolCall[],
  toolResults: MCPToolCallResult[]
): ExecutionResult['objects'] {
  const objectsById = new Map<string, ExecutionResult['objects'][number]>()
  const successfulResultCount = toolResults.filter((result) => result.success).length

  for (const toolCall of toolCalls.slice(0, successfulResultCount)) {
    if (toolCall.tool === 'create_primitive') {
      const payload = CreatePrimitiveInputSchema.parse(toolCall.payload)
      objectsById.set(payload.id, {
        id: payload.id,
        type: 'mesh',
        name: payload.name,
        visible: true,
        position: payload.position,
        rotation: payload.rotation,
        scale: payload.scale,
        metadata: {
          primitiveType: payload.primitiveType,
          color: payload.color,
          segments: payload.segments,
        },
      })
      continue
    }

    if (toolCall.tool === 'transform_object') {
      const payload = TransformObjectInputSchema.parse(toolCall.payload)
      const object = objectsById.get(payload.objectId)
      if (!object) continue
      if (payload.position) object.position = payload.position
      if (payload.rotation) object.rotation = payload.rotation
      if (payload.scale) object.scale = payload.scale
      continue
    }

    if (toolCall.tool === 'apply_material') {
      const payload = ApplyMaterialInputSchema.parse(toolCall.payload)
      const object = objectsById.get(payload.objectId)
      if (!object) continue
      object.metadata = {
        ...object.metadata,
        ...(payload.color && { color: payload.color }),
        material: {
          metallic: payload.metallic,
          roughness: payload.roughness,
          emissive: payload.emissive,
        },
      }
    }
  }

  for (const toolResult of toolResults) {
    if (!toolResult.success || !toolResult.result || typeof toolResult.result !== 'object') continue
    const result = toolResult.result as Record<string, unknown>
    if (typeof result.objectId !== 'string') continue
    const object = objectsById.get(result.objectId)
    if (!object) continue
    object.metadata = {
      ...object.metadata,
      mcpResult: result,
    }
  }

  return Array.from(objectsById.values())
}

export async function executeMcpToolCalls(
  payload: ExecutionPayload,
  options: MCPExecutionOptions
): Promise<ExecutionResult> {
  const startTime = Date.now()
  const toolResults: MCPToolCallResult[] = []
  const errors: string[] = []

  await addExecutionLog(
    options.generationId,
    options.projectId,
    options.userId,
    'mcp_execution_start',
    'Starting MCP tool execution',
    { toolCallCount: payload.toolCalls.length },
    'info'
  )

  try {
    for (const rawCall of payload.toolCalls) {
      const callStart = Date.now()
      let toolCall: MCPToolCall

      try {
        toolCall = validateToolCall(rawCall)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid MCP tool call'
        errors.push(message)
        await addExecutionLog(
          options.generationId,
          options.projectId,
          options.userId,
          'mcp_validation_error',
          message,
          {},
          'error'
        )
        break
      }

      const payloadSummary = summarizeToolPayload(toolCall)
      await addExecutionLog(
        options.generationId,
        options.projectId,
        options.userId,
        'mcp_tool_start',
        `Calling MCP tool ${toolCall.tool}`,
        { requestId: toolCall.requestId, tool: toolCall.tool, payloadSummary },
        'info'
      )

      try {
        const result = await callMcpTool(toolCall)
        toolResults.push(result)
        const durationMs = Date.now() - callStart

        await addExecutionLog(
          options.generationId,
          options.projectId,
          options.userId,
          result.success ? 'mcp_tool_success' : 'mcp_tool_error',
          `MCP tool ${toolCall.tool} completed`,
          {
            requestId: toolCall.requestId,
            tool: toolCall.tool,
            payloadSummary,
            result: result.result,
            durationMs,
            error: result.error,
            logs: result.logs,
          },
          result.success ? 'info' : 'error'
        )

        if (!result.success) {
          errors.push(result.error || `MCP tool failed: ${toolCall.tool}`)
          break
        }
      } catch (error) {
        const durationMs = Date.now() - callStart
        const message = error instanceof Error ? error.message : 'MCP tool call failed'
        errors.push(message)

        await addExecutionLog(
          options.generationId,
          options.projectId,
          options.userId,
          'mcp_tool_error',
          message,
          {
            requestId: toolCall.requestId,
            tool: toolCall.tool,
            payloadSummary,
            durationMs,
            error: message,
          },
          'error'
        )
        break
      }
    }

    if (errors.length > 0 && options.allowJsFallback) {
      await addExecutionLog(
        options.generationId,
        options.projectId,
        options.userId,
        'mcp_fallback_start',
        'MCP execution failed; starting validated JS fallback',
        { errors },
        'warning'
      )
      return executePayload(payload)
    }

    const executionTimeMs = Date.now() - startTime
    const objects = resultToObjects(payload.toolCalls, toolResults)

    return {
      success: errors.length === 0,
      objects,
      executionTimeMs,
      summary: `Executed ${toolResults.length}/${payload.toolCalls.length} MCP tool calls`,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown MCP execution error'
    if (options.allowJsFallback) {
      await addExecutionLog(
        options.generationId,
        options.projectId,
        options.userId,
        'mcp_fallback_start',
        'MCP execution crashed; starting validated JS fallback',
        { error: message },
        'warning'
      )
      return executePayload(payload)
    }

    return {
      success: false,
      objects: resultToObjects(payload.toolCalls, toolResults),
      executionTimeMs: Date.now() - startTime,
      summary: `MCP execution failed: ${message}`,
      errors: [message],
    }
  }
}
