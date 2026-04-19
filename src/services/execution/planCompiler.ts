import { ScenePlan } from '@/schema/scenePlan'
import { ExecutionPayload } from '@/types/firebase'
import { MCP_TOOL_VERSION, MCPToolCall, validateToolCall } from '@/services/mcp/toolRegistry'
import { v4 as uuidv4 } from 'uuid'

/**
 * Plan Compiler
 * Converts validated scene plans into deterministic MCP tool calls.
 * Only registered MCP tools can be emitted.
 */

interface CompileResult {
  success: boolean
  payload?: ExecutionPayload
  error?: string
}

export function compilePlan(plan: ScenePlan): CompileResult {
  try {
    // Validate plan structure
    if (!plan.objects || plan.objects.length === 0) {
      return {
        success: false,
        error: 'Plan has no objects to create',
      }
    }

    const toolCalls: MCPToolCall[] = []

    // Step 1: Create all primitives in order
    for (const obj of plan.objects) {
      toolCalls.push(validateToolCall({
        tool: 'create_primitive',
        version: MCP_TOOL_VERSION,
        requestId: uuidv4(),
        payload: {
          id: obj.id,
          name: obj.name,
          primitiveType: obj.primitive.type,
          position: obj.primitive.position,
          rotation: obj.primitive.rotation,
          scale: obj.primitive.scale,
          color: obj.primitive.color || '#FFFFFF',
          segments: obj.primitive.segments,
        },
      }))
    }

    // Step 2: Apply supported operations in order
    if (plan.operations && plan.operations.length > 0) {
      for (const op of plan.operations) {
        switch (op.type) {
          case 'transform':
            toolCalls.push(validateToolCall({
              tool: 'transform_object',
              version: MCP_TOOL_VERSION,
              requestId: uuidv4(),
              payload: {
                objectId: op.targetId,
                position: op.position,
                rotation: op.rotation,
                scale: op.scale,
              },
            }))
            break
          case 'apply_color':
            toolCalls.push(validateToolCall({
              tool: 'apply_material',
              version: MCP_TOOL_VERSION,
              requestId: uuidv4(),
              payload: {
                objectId: op.targetId,
                color: op.color,
              },
            }))
            break
          case 'apply_material':
            toolCalls.push(validateToolCall({
              tool: 'apply_material',
              version: MCP_TOOL_VERSION,
              requestId: uuidv4(),
              payload: {
                objectId: op.targetId,
                metallic: op.metallic,
                roughness: op.roughness,
                emissive: op.emissive,
              },
            }))
            break
          case 'export_glb':
            toolCalls.push(validateToolCall({
              tool: 'export_scene',
              version: MCP_TOOL_VERSION,
              requestId: uuidv4(),
              payload: {
                format: 'glb',
                filename: op.filename,
              },
            }))
            break
          default:
            return {
              success: false,
              error: `Operation ${op.type} is not mapped to a registered MCP tool`,
            }
        }
      }
    }

    return {
      success: true,
      payload: {
        toolCalls,
        metadata: {
          planIntent: plan.intent,
          complexity: plan.metadata?.estimatedComplexity,
          confidence: plan.metadata?.confidence,
          objectCount: plan.objects.length,
          operationCount: plan.operations?.length || 0,
        },
      },
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown compilation error'
    return {
      success: false,
      error: `Plan compilation failed: ${errorMsg}`,
    }
  }
}
