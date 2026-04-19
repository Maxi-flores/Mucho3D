import { SceneObject } from '@/types'
import { ExecutionPayload, ExecutionResult } from '@/types/firebase'
import {
  ApplyMaterialInputSchema,
  CreatePrimitiveInputSchema,
  ExportSceneInputSchema,
  MCPToolCall,
  TransformObjectInputSchema,
  validateToolCall,
} from '@/services/mcp/toolRegistry'

/**
 * Scene Executor
 * JS fallback executor for validated MCP tool calls.
 * MCP bridge execution is the primary path; this is used only when explicit fallback is requested.
 */

interface ExecutionContext {
  objects: Map<string, SceneObject>
  nextId: number
  errors: string[]
}

export async function executePayload(payload: ExecutionPayload): Promise<ExecutionResult> {
  const startTime = Date.now()
  const context: ExecutionContext = {
    objects: new Map(),
    nextId: 0,
    errors: [],
  }

  try {
    for (const toolCall of payload.toolCalls) {
      const result = executeToolCall(toolCall, context)
      if (!result.success) {
        context.errors.push(result.error || 'Unknown execution error')
      }
    }

    // Convert scene objects to array
    const objects = Array.from(context.objects.values())

    return {
      success: context.errors.length === 0,
      objects,
      executionTimeMs: Date.now() - startTime,
      summary: `Fallback executed ${payload.toolCalls.length} MCP tool calls, created ${objects.length} objects`,
      errors: context.errors.length > 0 ? context.errors : undefined,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown execution error'
    return {
      success: false,
      objects: Array.from(context.objects.values()),
      executionTimeMs: Date.now() - startTime,
      summary: `Execution failed: ${errorMsg}`,
      errors: [errorMsg],
    }
  }
}

interface InstructionResult {
  success: boolean
  error?: string
}

function executeToolCall(
  toolCall: MCPToolCall,
  context: ExecutionContext
): InstructionResult {
  try {
    const validatedCall = validateToolCall(toolCall)

    switch (validatedCall.tool) {
      case 'create_primitive':
        return executeCreatePrimitive(validatedCall, context)
      case 'transform_object':
        return executeTransform(validatedCall, context)
      case 'apply_material':
        return executeApplyMaterial(validatedCall, context)
      case 'export_scene':
        return executeExportScene(validatedCall, context)
      default:
        return { success: false, error: `Unknown MCP tool: ${validatedCall.tool}` }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: `Fallback tool execution failed: ${errorMsg}` }
  }
}

function executeCreatePrimitive(
  toolCall: MCPToolCall,
  context: ExecutionContext
): InstructionResult {
  const payload = CreatePrimitiveInputSchema.parse(toolCall.payload)
  const id = payload.id || `obj-${context.nextId++}`

  const obj: SceneObject = {
    id,
    type: 'mesh',
    name: payload.name,
    visible: true,
    position: payload.position,
    rotation: payload.rotation,
    scale: payload.scale,
    metadata: {
      primitiveType: payload.primitiveType,
      color: payload.color,
      segments: payload.segments || 32,
    },
  }

  context.objects.set(id, obj)
  return { success: true }
}

function executeTransform(
  toolCall: MCPToolCall,
  context: ExecutionContext
): InstructionResult {
  const payload = TransformObjectInputSchema.parse(toolCall.payload)
  const obj = context.objects.get(payload.objectId)
  if (!obj) {
    return { success: false, error: `Target object not found: ${payload.objectId}` }
  }

  if (payload.position) obj.position = payload.position
  if (payload.rotation) obj.rotation = payload.rotation
  if (payload.scale) obj.scale = payload.scale

  return { success: true }
}

function executeApplyMaterial(
  toolCall: MCPToolCall,
  context: ExecutionContext
): InstructionResult {
  const payload = ApplyMaterialInputSchema.parse(toolCall.payload)
  const obj = context.objects.get(payload.objectId)
  if (!obj) {
    return { success: false, error: `Target object not found: ${payload.objectId}` }
  }

  if (!obj.metadata) obj.metadata = {}
  if (payload.color) obj.metadata.color = payload.color

  obj.metadata.material = {
    metallic: payload.metallic,
    roughness: payload.roughness,
    emissive: payload.emissive,
  }

  return { success: true }
}

function executeExportScene(
  toolCall: MCPToolCall,
  context: ExecutionContext
): InstructionResult {
  ExportSceneInputSchema.parse(toolCall.payload)
  context.objects.forEach((obj) => {
    obj.metadata = {
      ...obj.metadata,
      exportRequested: true,
    }
  })

  return { success: true }
}
