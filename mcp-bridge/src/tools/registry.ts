import { z } from 'zod'
import { callBlender } from '../blenderClient'

const Vector3Schema = z.tuple([
  z.number().finite().safe().min(-1000).max(1000),
  z.number().finite().safe().min(-1000).max(1000),
  z.number().finite().safe().min(-1000).max(1000),
])

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
