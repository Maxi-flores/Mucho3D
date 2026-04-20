import { z } from 'zod'
import { executeInBlender } from '../blenderClient'

const Vector3Schema = z.tuple([
  z.number().finite().safe().min(-1000).max(1000),
  z.number().finite().safe().min(-1000).max(1000),
  z.number().finite().safe().min(-1000).max(1000),
])

const ObjectIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/)
const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

const PrimitiveTypeSchema = z.enum(['box', 'cube', 'sphere', 'cylinder'])
type Vector3 = [number, number, number]

const CreatePrimitiveInputSchema = z.object({
  id: ObjectIdSchema.optional(),
  name: z.string().min(1).max(100).optional(),
  type: PrimitiveTypeSchema.optional(),
  primitiveType: PrimitiveTypeSchema.optional(),
  position: Vector3Schema.default([0, 0, 0]),
  scale: Vector3Schema.default([1, 1, 1]),
  rotation: Vector3Schema.default([0, 0, 0]),
  color: ColorSchema.default('#FFFFFF'),
}).strict().refine(
  (value) => Boolean(value.type || value.primitiveType),
  'Either type or primitiveType is required'
)

const TransformObjectInputSchema = z.object({
  objectId: ObjectIdSchema,
  position: Vector3Schema.optional(),
  scale: Vector3Schema.optional(),
  rotation: Vector3Schema.optional(),
}).strict().refine(
  (value) => Boolean(value.position || value.scale || value.rotation),
  'At least one transform field is required'
)

const ApplyMaterialInputSchema = z.object({
  objectId: ObjectIdSchema,
  color: ColorSchema.optional(),
  metallic: z.number().finite().safe().min(0).max(1).default(0),
  roughness: z.number().finite().safe().min(0).max(1).default(0.5),
  emissive: ColorSchema.optional(),
}).strict()

const ExportSceneInputSchema = z.object({
  format: z.enum(['glb', 'fbx']),
  filename: z.string().min(1).max(128).regex(/^[A-Za-z0-9_.-]+$/),
  includeHidden: z.boolean().default(false),
}).strict()

export interface ToolExecutionContext {
  now: () => Date
}

export interface ToolExecutionResult {
  result: unknown
  logs: string[]
}

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: z.ZodTypeAny
  executeLocal: (payload: unknown, context: ToolExecutionContext) => ToolExecutionResult
}

function normalizePrimitiveType(type: z.infer<typeof PrimitiveTypeSchema>): 'box' | 'sphere' | 'cylinder' {
  return type === 'cube' ? 'box' : type
}

function createPrimitive(payload: unknown, context: ToolExecutionContext): ToolExecutionResult {
  const input = CreatePrimitiveInputSchema.parse(payload)
  const primitiveType = normalizePrimitiveType((input.primitiveType || input.type)!)
  const position = input.position as Vector3
  const scale = input.scale as Vector3
  const rotation = input.rotation as Vector3
  const objectId = input.id || `obj_${primitiveType}_${stableVectorHash(position, scale)}`
  const name = input.name || `${primitiveType}_${objectId}`

  const object = {
    id: objectId,
    type: primitiveType,
    position,
    scale,
    rotation,
    color: input.color,
    transform: {
      position,
      scale,
      rotation,
    },
    createdAt: context.now().toISOString(),
  }

  return {
    result: {
      objectId,
      objectType: primitiveType,
      name,
      object,
    },
    logs: [`Created ${primitiveType} primitive ${objectId}`],
  }
}

function transformObject(payload: unknown): ToolExecutionResult {
  const input = TransformObjectInputSchema.parse(payload)

  return {
    result: {
      objectId: input.objectId,
      transformed: true,
      transform: {
        position: input.position,
        scale: input.scale,
        rotation: input.rotation,
      },
    },
    logs: [`Transformed object ${input.objectId}`],
  }
}

function applyMaterial(payload: unknown): ToolExecutionResult {
  const input = ApplyMaterialInputSchema.parse(payload)

  return {
    result: {
      objectId: input.objectId,
      materialApplied: true,
      material: {
        color: input.color,
        metallic: input.metallic,
        roughness: input.roughness,
        emissive: input.emissive,
      },
    },
    logs: [`Applied material to ${input.objectId}`],
  }
}

function exportScene(payload: unknown): ToolExecutionResult {
  const input = ExportSceneInputSchema.parse(payload)

  return {
    result: {
      format: input.format,
      path: `/tmp/${input.filename}`,
    },
    logs: [`Prepared ${input.format} export ${input.filename}`],
  }
}

function stableVectorHash(position: Vector3, scale: Vector3): string {
  return [...position, ...scale]
    .map((value) => Math.round(value * 1000).toString(36).replace('-', 'm'))
    .join('_')
}

export const toolRegistry = new Map<string, ToolDefinition>([
  [
    'create_primitive',
    {
      name: 'create_primitive',
      description: 'Create a deterministic local primitive scene object.',
      inputSchema: CreatePrimitiveInputSchema,
      executeLocal: createPrimitive,
    },
  ],
  [
    'transform_object',
    {
      name: 'transform_object',
      description: 'Apply a deterministic transform to a local scene object.',
      inputSchema: TransformObjectInputSchema,
      executeLocal: transformObject,
    },
  ],
  [
    'apply_material',
    {
      name: 'apply_material',
      description: 'Apply deterministic material metadata to a local scene object.',
      inputSchema: ApplyMaterialInputSchema,
      executeLocal: applyMaterial,
    },
  ],
  [
    'export_scene',
    {
      name: 'export_scene',
      description: 'Prepare a deterministic local export result.',
      inputSchema: ExportSceneInputSchema,
      executeLocal: exportScene,
    },
  ],
])

export function listTools() {
  return Array.from(toolRegistry.values()).map((tool) => ({
    name: tool.name,
    description: tool.description,
  }))
}

export async function executeTool(toolName: string, payload: unknown): Promise<ToolExecutionResult> {
  if (!toolRegistry.has(toolName)) {
    throw new Error(`Unknown MCP tool: ${toolName}`)
  }

  const tool = toolRegistry.get(toolName)!
  const validatedPayload = tool.inputSchema.parse(payload)

  try {
    const blenderResult = await executeInBlender(toolName, validatedPayload)
    if (blenderResult.success) {
      return {
        result: blenderResult.result,
        logs: [...blenderResult.logs, `Executed ${toolName} via Blender worker`],
      }
    }

    return {
      ...tool.executeLocal(validatedPayload, {
        now: () => new Date(0),
      }),
      logs: [
        ...(blenderResult.logs || []),
        `Blender worker rejected ${toolName}: ${blenderResult.error || 'unknown error'}`,
        `Fell back to local execution for ${toolName}`,
      ],
    }
  } catch (error) {
    const fallback = tool.executeLocal(validatedPayload, {
      now: () => new Date(0),
    })

    return {
      result: fallback.result,
      logs: [
        `Blender worker unavailable for ${toolName}: ${error instanceof Error ? error.message : 'unknown error'}`,
        ...fallback.logs,
        `Fell back to local execution for ${toolName}`,
      ],
    }
  }
}

export function executeToolLocal(toolName: string, payload: unknown): ToolExecutionResult {
  if (!toolRegistry.has(toolName)) {
    throw new Error(`Unknown MCP tool: ${toolName}`)
  }

  const tool = toolRegistry.get(toolName)!
  const validatedPayload = tool.inputSchema.parse(payload)
  return tool.executeLocal(validatedPayload, {
    now: () => new Date(0),
  })
}
