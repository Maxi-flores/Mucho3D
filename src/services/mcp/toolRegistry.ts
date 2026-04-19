import { z } from 'zod'

export const MCP_TOOL_VERSION = '1.0' as const

const SafeNumberSchema = z.number().finite().safe().min(-1000).max(1000)
export const Vector3Schema = z.tuple([SafeNumberSchema, SafeNumberSchema, SafeNumberSchema])
export const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)
export const ObjectIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/)
export const FilenameSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_.-]+$/)

const PrimitiveTypeSchema = z.enum(['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane'])

export const CreatePrimitiveInputSchema = z.object({
  id: ObjectIdSchema,
  name: z.string().min(1).max(100),
  primitiveType: PrimitiveTypeSchema,
  position: Vector3Schema.default([0, 0, 0]),
  rotation: Vector3Schema.default([0, 0, 0]),
  scale: Vector3Schema.default([1, 1, 1]),
  color: ColorSchema.default('#FFFFFF'),
  segments: z.number().int().min(3).max(128).optional(),
}).strict()

export const CreatePrimitiveOutputSchema = z.object({
  objectId: ObjectIdSchema,
  objectType: PrimitiveTypeSchema,
  name: z.string().min(1).max(100),
}).strict()

export const TransformObjectInputSchema = z.object({
  objectId: ObjectIdSchema,
  position: Vector3Schema.optional(),
  rotation: Vector3Schema.optional(),
  scale: Vector3Schema.optional(),
}).strict().refine(
  (value) => Boolean(value.position || value.rotation || value.scale),
  'At least one transform field is required'
)

export const TransformObjectOutputSchema = z.object({
  objectId: ObjectIdSchema,
  transformed: z.boolean(),
}).strict()

export const ApplyMaterialInputSchema = z.object({
  objectId: ObjectIdSchema,
  color: ColorSchema.optional(),
  metallic: z.number().finite().safe().min(0).max(1).default(0),
  roughness: z.number().finite().safe().min(0).max(1).default(0.5),
  emissive: ColorSchema.optional(),
}).strict()

export const ApplyMaterialOutputSchema = z.object({
  objectId: ObjectIdSchema,
  materialApplied: z.boolean(),
}).strict()

export const ExportSceneInputSchema = z.object({
  format: z.enum(['glb', 'fbx']),
  filename: FilenameSchema,
  includeHidden: z.boolean().default(false),
}).strict()

export const ExportSceneOutputSchema = z.object({
  format: z.enum(['glb', 'fbx']),
  url: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
}).strict()

export const TOOL_NAMES = [
  'create_primitive',
  'transform_object',
  'apply_material',
  'export_scene',
] as const

export type MCPToolName = typeof TOOL_NAMES[number]

export type MCPToolDefinition<TInput = unknown, TOutput = unknown> = {
  name: MCPToolName
  version: typeof MCP_TOOL_VERSION
  description: string
  blenderOperation: string
  inputSchema: z.ZodType<TInput>
  outputSchema: z.ZodType<TOutput>
}

export const toolRegistry = {
  create_primitive: {
    name: 'create_primitive',
    version: MCP_TOOL_VERSION,
    description: 'Create one whitelisted primitive mesh.',
    blenderOperation: 'bpy.ops.mesh.primitive_*_add',
    inputSchema: CreatePrimitiveInputSchema,
    outputSchema: CreatePrimitiveOutputSchema,
  },
  transform_object: {
    name: 'transform_object',
    version: MCP_TOOL_VERSION,
    description: 'Apply validated object transform values.',
    blenderOperation: 'object.location / object.rotation_euler / object.scale',
    inputSchema: TransformObjectInputSchema,
    outputSchema: TransformObjectOutputSchema,
  },
  apply_material: {
    name: 'apply_material',
    version: MCP_TOOL_VERSION,
    description: 'Apply bounded material values to an existing object.',
    blenderOperation: 'bpy.data.materials.new + principled BSDF values',
    inputSchema: ApplyMaterialInputSchema,
    outputSchema: ApplyMaterialOutputSchema,
  },
  export_scene: {
    name: 'export_scene',
    version: MCP_TOOL_VERSION,
    description: 'Export the validated scene to an approved format.',
    blenderOperation: 'bpy.ops.export_scene.gltf / bpy.ops.export_scene.fbx',
    inputSchema: ExportSceneInputSchema,
    outputSchema: ExportSceneOutputSchema,
  },
} satisfies Record<MCPToolName, MCPToolDefinition>

export const MCPToolCallSchema = z.object({
  tool: z.enum(TOOL_NAMES),
  version: z.literal(MCP_TOOL_VERSION),
  requestId: z.string().uuid(),
  payload: z.unknown(),
}).strict().superRefine((call, ctx) => {
  const definition = toolRegistry[call.tool]
  const payloadResult = definition.inputSchema.safeParse(call.payload)
  if (!payloadResult.success) {
    for (const issue of payloadResult.error.issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', ...issue.path],
        message: issue.message,
      })
    }
  }
})

export const MCPToolCallResultSchema = z.object({
  success: z.boolean(),
  result: z.unknown().nullable(),
  logs: z.array(z.string()),
  error: z.string().nullable(),
}).strict()

export type MCPToolCall = z.infer<typeof MCPToolCallSchema>
export type MCPToolCallResult = z.infer<typeof MCPToolCallResultSchema>

export function getToolDefinition(tool: string): MCPToolDefinition | null {
  return Object.prototype.hasOwnProperty.call(toolRegistry, tool)
    ? toolRegistry[tool as MCPToolName]
    : null
}

export function validateToolCall(call: unknown): MCPToolCall {
  return MCPToolCallSchema.parse(call)
}

export function validateToolOutput(tool: MCPToolName, result: unknown): unknown {
  return toolRegistry[tool].outputSchema.parse(result)
}

export function summarizeToolPayload(call: MCPToolCall): Record<string, unknown> {
  if (call.tool === 'create_primitive') {
    const payload = call.payload as z.infer<typeof CreatePrimitiveInputSchema>
    return { id: payload.id, primitiveType: payload.primitiveType, name: payload.name }
  }

  if (call.tool === 'transform_object' || call.tool === 'apply_material') {
    const payload = call.payload as { objectId: string }
    return { objectId: payload.objectId }
  }

  if (call.tool === 'export_scene') {
    const payload = call.payload as z.infer<typeof ExportSceneInputSchema>
    return { format: payload.format, filename: payload.filename }
  }

  return {}
}
