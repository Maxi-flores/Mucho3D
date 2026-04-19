import { SceneObject } from '@/types'
import { ExecutionPayload, ExecutionResult } from '@/types/firebase'

/**
 * Scene Executor
 * Executes deterministic instructions from compiled plan
 * Generates scene objects suitable for Studio rendering
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
    // Execute each instruction in order
    for (const instruction of payload.instructions) {
      const result = executeInstruction(instruction, context)
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
      summary: `Executed ${payload.instructions.length} instructions, created ${objects.length} objects`,
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

function executeInstruction(
  instruction: ExecutionPayload['instructions'][0],
  context: ExecutionContext
): InstructionResult {
  try {
    switch (instruction.type) {
      case 'create_primitive':
        return executCreatePrimitive(instruction, context)
      case 'transform':
        return executeTransform(instruction, context)
      case 'apply_color':
        return executeApplyColor(instruction, context)
      case 'apply_material':
        return executeApplyMaterial(instruction, context)
      case 'mirror':
        return executeMirror(instruction, context)
      case 'group':
      case 'boolean_union':
      case 'boolean_difference':
      case 'boolean_intersection':
      case 'export_glb':
        // Scaffold for future implementation
        return { success: true }
      default:
        return { success: false, error: `Unknown operation: ${instruction.type}` }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: `Instruction execution failed: ${errorMsg}` }
  }
}

function executCreatePrimitive(
  instruction: ExecutionPayload['instructions'][0],
  context: ExecutionContext
): InstructionResult {
  const params = instruction.params as any
  const id = params?.id || instruction.targetId || `obj-${context.nextId++}`

  const primitive = params?.primitive
  if (!primitive) {
    return { success: false, error: 'Missing primitive definition' }
  }

  // Clamp numeric values to safe range
  const position = clampVector3(primitive.position || [0, 0, 0])
  const scale = clampVector3(primitive.scale || [1, 1, 1])
  const rotation = clampVector3(primitive.rotation || [0, 0, 0])

  const obj: SceneObject = {
    id,
    type: 'mesh',
    name: params?.name || `${primitive.type}`,
    visible: true,
    position,
    rotation,
    scale,
    metadata: {
      primitiveType: primitive.type,
      color: primitive.color || '#FFFFFF',
      segments: primitive.segments || 32,
    },
  }

  context.objects.set(id, obj)
  return { success: true }
}

function executeTransform(
  instruction: ExecutionPayload['instructions'][0],
  context: ExecutionContext
): InstructionResult {
  const targetId = instruction.targetId
  if (!targetId) {
    return { success: false, error: 'Transform missing targetId' }
  }

  const obj = context.objects.get(targetId)
  if (!obj) {
    return { success: false, error: `Target object not found: ${targetId}` }
  }

  const params = instruction.params as any
  if (params?.position) obj.position = clampVector3(params.position)
  if (params?.rotation) obj.rotation = clampVector3(params.rotation)
  if (params?.scale) obj.scale = clampVector3(params.scale)

  return { success: true }
}

function executeApplyColor(
  instruction: ExecutionPayload['instructions'][0],
  context: ExecutionContext
): InstructionResult {
  const targetId = instruction.targetId
  if (!targetId) {
    return { success: false, error: 'Apply color missing targetId' }
  }

  const obj = context.objects.get(targetId)
  if (!obj) {
    return { success: false, error: `Target object not found: ${targetId}` }
  }

  const params = instruction.params as any
  const color = params?.color
  if (!color || typeof color !== 'string') {
    return { success: false, error: 'Invalid color value' }
  }

  if (!obj.metadata) obj.metadata = {}
  obj.metadata.color = color

  return { success: true }
}

function executeApplyMaterial(
  instruction: ExecutionPayload['instructions'][0],
  context: ExecutionContext
): InstructionResult {
  const targetId = instruction.targetId
  if (!targetId) {
    return { success: false, error: 'Apply material missing targetId' }
  }

  const obj = context.objects.get(targetId)
  if (!obj) {
    return { success: false, error: `Target object not found: ${targetId}` }
  }

  const params = instruction.params as any
  if (!obj.metadata) obj.metadata = {}

  obj.metadata.material = {
    metallic: clampNumber(params?.metallic || 0, 0, 1),
    roughness: clampNumber(params?.roughness || 0.5, 0, 1),
    emissive: params?.emissive || undefined,
  }

  return { success: true }
}

function executeMirror(
  instruction: ExecutionPayload['instructions'][0],
  context: ExecutionContext
): InstructionResult {
  const targetId = instruction.targetId
  if (!targetId) {
    return { success: false, error: 'Mirror missing targetId' }
  }

  const obj = context.objects.get(targetId)
  if (!obj) {
    return { success: false, error: `Target object not found: ${targetId}` }
  }

  // Scaffold: actual mirroring logic would clone and invert axis
  if (!obj.metadata) obj.metadata = {}
  obj.metadata.isMirrored = true

  return { success: true }
}

function clampVector3(v: any): [number, number, number] {
  if (!Array.isArray(v) || v.length !== 3) {
    return [0, 0, 0]
  }
  return [
    clampNumber(v[0], -1000, 1000),
    clampNumber(v[1], -1000, 1000),
    clampNumber(v[2], -1000, 1000),
  ]
}

function clampNumber(n: any, min: number, max: number): number {
  const num = typeof n === 'number' ? n : 0
  if (!isFinite(num)) return (min + max) / 2
  return Math.max(min, Math.min(max, num))
}
