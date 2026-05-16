import { z } from 'zod'
import { callBlender } from '../blenderClient'

// ─────────────────────────────────────────────
// Shared Schemas
// ─────────────────────────────────────────────

const Vector3Schema = z.tuple([
  z.number().finite().safe().min(-1000).max(1000),
  z.number().finite().safe().min(-1000).max(1000),
  z.number().finite().safe().min(-1000).max(1000),
])

const GenerationPlanSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  description: z.string(),
  objects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']),
      position: Vector3Schema,
      rotation: Vector3Schema,
      scale: Vector3Schema,
      color: z.string().optional(),
      material: z
        .object({
          metallic: z.number().min(0).max(1),
          roughness: z.number().min(0).max(1),
          emissive: Vector3Schema.optional(),
        })
        .optional(),
      modifiers: z
        .array(
          z.object({
            type: z.enum(['bevel', 'subdivision', 'solidify', 'array']),
            params: z.record(z.unknown()),
          })
        )
        .optional(),
    })
  ),
  lights: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['directional', 'point', 'spot']),
        position: Vector3Schema,
        rotation: Vector3Schema.optional(),
        intensity: z.number(),
        color: z.string().optional(),
        energy: z.number().optional(),
      })
    )
    .optional(),
  camera: z
    .object({
      id: z.string(),
      name: z.string(),
      position: Vector3Schema,
      target: Vector3Schema,
      fov: z.number().optional(),
    })
    .optional(),
  units: z.string().optional().default('meters'),
  scale: z.number().optional().default(1),
  outputFormat: z.enum(['glb', 'fbx', 'stl']).optional().default('glb'),
  qualityLevel: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  constraints: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

const ObjectIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/)

const PrimitiveTypeSchema = z.enum(['box', 'cube', 'sphere', 'cylinder'])
type Vector3 = [number, number, number]

const CreatePrimitiveInputSchema = z
  .object({
    id: ObjectIdSchema.optional(),
    name: z.string().min(1).max(100).optional(),
    type: PrimitiveTypeSchema.optional(),
    primitiveType: PrimitiveTypeSchema.optional(),
    location: Vector3Schema.optional(),
    position: Vector3Schema.optional(),
    scale: Vector3Schema.default([1, 1, 1]),
    rotation: Vector3Schema.default([0, 0, 0]),
  })
  .strict()
  .refine(
    (value) => Boolean(value.type || value.primitiveType),
    'Either type or primitiveType is required'
  )

const TransformObjectInputSchema = z
  .object({
    objectId: ObjectIdSchema,
    position: Vector3Schema.optional(),
    location: Vector3Schema.optional(),
    scale: Vector3Schema.optional(),
    rotation: Vector3Schema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(value.position || value.location || value.scale || value.rotation),
    'At least one transform field is required'
  )

const ImportAssetInputSchema = z
  .object({
    query: z.string().min(1).max(256),
    objectId: ObjectIdSchema.optional(),
    source: z.string().min(1).max(512).optional(),
    location: Vector3Schema.default([0, 0, 0]),
    scale: Vector3Schema.default([1, 1, 1]),
    rotation: Vector3Schema.default([0, 0, 0]),
  })
  .strict()

export interface ToolExecutionResult {
  result: unknown
  logs: string[]
}

export interface ToolDefinition<TPayload = unknown> {
  name: string
  description: string
  inputSchema: z.ZodType<TPayload>
  buildBlenderPayload: (payload: TPayload) => Record<string, unknown>
  mapResult: (payload: TPayload, blenderResult: unknown) => unknown
}

type CreatePrimitiveInput = z.infer<typeof CreatePrimitiveInputSchema>
type TransformObjectInput = z.infer<typeof TransformObjectInputSchema>
type ImportAssetInput = z.infer<typeof ImportAssetInputSchema>

const toolRegistry = new Map<string, ToolDefinition>()

function normalizePrimitiveType(
  type: z.infer<typeof PrimitiveTypeSchema>
): 'box' | 'sphere' | 'cylinder' {
  return type === 'cube' ? 'box' : type
}

function stableVectorHash(...vectors: Vector3[]): string {
  return vectors
    .flat()
    .map((value) => Math.round(value * 1000).toString(36).replace('-', 'm'))
    .join('_')
}

function normalizePosition(
  payload: Pick<CreatePrimitiveInput, 'location' | 'position'>
): Vector3 {
  return (payload.location || payload.position || [0, 0, 0]) as Vector3
}

function normalizeTransformPosition(
  payload: Pick<TransformObjectInput, 'location' | 'position'>
): Vector3 | undefined {
  return (payload.position || payload.location) as Vector3 | undefined
}

function registerTool<TPayload>(definition: ToolDefinition<TPayload>): void {
  toolRegistry.set(definition.name, definition as ToolDefinition)
}

registerTool<CreatePrimitiveInput>({
  name: 'create_primitive',
  description: 'Create a primitive object in Blender.',
  inputSchema: CreatePrimitiveInputSchema,
  buildBlenderPayload: (payload) => ({
    type: payload.primitiveType || payload.type,
    location: normalizePosition(payload),
    rotation: payload.rotation,
    scale: payload.scale,
    id: payload.id,
    name: payload.name,
  }),
  mapResult: (payload, blenderResult) => {
    const position = normalizePosition(payload)
    const scale = payload.scale as Vector3
    const primitiveType = normalizePrimitiveType(
      (payload.primitiveType || payload.type)!
    )
    const objectId =
      payload.id ||
      `obj_${primitiveType}_${stableVectorHash(position, scale)}`
    const name = payload.name || `${primitiveType}_${objectId}`

    return {
      objectId,
      objectType: primitiveType,
      name,
      blender: blenderResult,
    }
  },
})

registerTool<TransformObjectInput>({
  name: 'transform_object',
  description: 'Transform an existing Blender object.',
  inputSchema: TransformObjectInputSchema,
  buildBlenderPayload: (payload) => ({
    objectId: payload.objectId,
    position: normalizeTransformPosition(payload),
    rotation: payload.rotation,
    scale: payload.scale,
  }),
  mapResult: (payload, blenderResult) => ({
    objectId: payload.objectId,
    transformed: true,
    blender: blenderResult,
  }),
})

registerTool<ImportAssetInput>({
  name: 'import_asset',
  description: 'Import an asset into Blender.',
  inputSchema: ImportAssetInputSchema,
  buildBlenderPayload: (payload) => ({
    query: payload.query,
    objectId: payload.objectId,
    source: payload.source,
    location: payload.location,
    rotation: payload.rotation,
    scale: payload.scale,
  }),
  mapResult: (payload, blenderResult) => ({
    objectId:
      payload.objectId ||
      `asset_${payload.query.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`,
    query: payload.query,
    imported: true,
    blender: blenderResult,
  }),
})

type ExecutePlanInput = z.infer<typeof GenerationPlanSchema>

const ExecutePlanInputSchema = GenerationPlanSchema.extend({
  jobId: z.string().optional(),
  outputDir: z.string().optional(),
})

type ExecutePlanPayload = z.infer<typeof ExecutePlanInputSchema>

registerTool<ExecutePlanPayload>({
  name: 'execute_plan',
  description: 'Execute a complete GenerationPlan in Blender, creating scene objects and exporting.',
  inputSchema: ExecutePlanInputSchema,
  buildBlenderPayload: (payload) => ({
    tool: 'execute_plan',
    plan: {
      id: payload.id,
      projectId: payload.projectId,
      title: payload.title,
      description: payload.description,
      objects: payload.objects,
      lights: payload.lights,
      camera: payload.camera,
      units: payload.units,
      scale: payload.scale,
      outputFormat: payload.outputFormat,
      qualityLevel: payload.qualityLevel,
      constraints: payload.constraints,
      tags: payload.tags,
    },
    jobId: payload.jobId,
    outputDir: payload.outputDir,
  }),
  mapResult: (payload, blenderResult) => {
    const result = blenderResult as Record<string, unknown> | null

    return {
      success: result?.success === true,
      createdObjects: typeof result?.created_objects === 'number' ? result.created_objects : 0,
      logs: Array.isArray(result?.logs) ? result.logs : [],
      errors: Array.isArray(result?.errors) ? result.errors : [],
      outputFile: typeof result?.output_file === 'string' ? result.output_file : undefined,
      artifacts: Array.isArray(result?.artifacts)
        ? (result.artifacts as Array<{ format: string; path: string; size?: number }>)
        : [],
      blender: result,
    }
  },
})

const ExportSceneInputSchema = z.object({
  jobId: z.string().optional(),
  formats: z.array(z.enum(['glb', 'fbx', 'stl'])).optional().default(['glb']),
  outputDir: z.string().optional(),
})

type ExportSceneInput = z.infer<typeof ExportSceneInputSchema>

registerTool<ExportSceneInput>({
  name: 'export_scene',
  description: 'Export the current Blender scene to GLB, FBX, or STL format.',
  inputSchema: ExportSceneInputSchema,
  buildBlenderPayload: (payload) => ({
    tool: 'export_scene',
    formats: payload.formats,
    outputDir: payload.outputDir,
    jobId: payload.jobId,
  }),
  mapResult: (payload, blenderResult) => {
    const result = blenderResult as Record<string, unknown> | null

    return {
      success: result?.success === true,
      exports: Array.isArray(result?.exports)
        ? (result.exports as Array<{ format: string; path: string; size?: number }>)
        : [],
      logs: Array.isArray(result?.logs) ? result.logs : [],
      errors: Array.isArray(result?.errors) ? result.errors : [],
      blender: result,
    }
  },
})

export { registerTool }

export function listTools(): Array<{ name: string; description: string }> {
  return Array.from(toolRegistry.values()).map((tool) => ({
    name: tool.name,
    description: tool.description,
  }))
}

export async function executeTool(
  toolName: string,
  payload: unknown
): Promise<ToolExecutionResult> {
  if (!toolRegistry.has(toolName)) {
    throw new Error(`Unknown MCP tool: ${toolName}`)
  }

  const tool = toolRegistry.get(toolName)!
  const validatedPayload = tool.inputSchema.parse(payload)
  const blenderPayload = tool.buildBlenderPayload(validatedPayload)

  console.log(
    '[mcp-tool] -> executing',
    JSON.stringify({ tool: toolName, payload: blenderPayload })
  )

  const blenderResponse = await callBlender(toolName, blenderPayload)
  const result = tool.mapResult(validatedPayload, blenderResponse.parsed)

  return {
    result,
    logs: [
      `Validated payload for ${toolName}`,
      `Sent ${toolName} to Blender`,
      `Blender raw response: ${blenderResponse.raw || '<empty>'}`,
    ],
  }
}
