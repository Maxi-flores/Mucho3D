import { z } from 'zod'

export const MCP_TOOL_VERSION = '1.0' as const

const SafeNumberSchema = z.number().finite().safe().min(-1000).max(1000)
const Vector3Schema = z.tuple([SafeNumberSchema, SafeNumberSchema, SafeNumberSchema])
const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)
const ObjectIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/)
const FilenameSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_.-]+$/)
const PrimitiveTypeSchema = z.enum(['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane'])

const CreatePrimitiveInputSchema = z.object({
  id: ObjectIdSchema,
  name: z.string().min(1).max(100),
  primitiveType: PrimitiveTypeSchema,
  position: Vector3Schema.default([0, 0, 0]),
  rotation: Vector3Schema.default([0, 0, 0]),
  scale: Vector3Schema.default([1, 1, 1]),
  color: ColorSchema.default('#FFFFFF'),
  segments: z.number().int().min(3).max(128).optional(),
}).strict()

const CreatePrimitiveOutputSchema = z.object({
  objectId: ObjectIdSchema,
  objectType: PrimitiveTypeSchema,
  name: z.string().min(1).max(100),
}).strict()

const TransformObjectInputSchema = z.object({
  objectId: ObjectIdSchema,
  position: Vector3Schema.optional(),
  rotation: Vector3Schema.optional(),
  scale: Vector3Schema.optional(),
}).strict().refine(
  (value) => Boolean(value.position || value.rotation || value.scale),
  'At least one transform field is required'
)

const TransformObjectOutputSchema = z.object({
  objectId: ObjectIdSchema,
  transformed: z.boolean(),
}).strict()

const ApplyMaterialInputSchema = z.object({
  objectId: ObjectIdSchema,
  color: ColorSchema.optional(),
  metallic: z.number().finite().safe().min(0).max(1).default(0),
  roughness: z.number().finite().safe().min(0).max(1).default(0.5),
  emissive: ColorSchema.optional(),
}).strict()

const ApplyMaterialOutputSchema = z.object({
  objectId: ObjectIdSchema,
  materialApplied: z.boolean(),
}).strict()

const ExportSceneInputSchema = z.object({
  format: z.enum(['glb', 'fbx']),
  filename: FilenameSchema,
  includeHidden: z.boolean().default(false),
}).strict()

const ExportSceneOutputSchema = z.object({
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

export const toolRegistry = {
  create_primitive: {
    inputSchema: CreatePrimitiveInputSchema,
    outputSchema: CreatePrimitiveOutputSchema,
  },
  transform_object: {
    inputSchema: TransformObjectInputSchema,
    outputSchema: TransformObjectOutputSchema,
  },
  apply_material: {
    inputSchema: ApplyMaterialInputSchema,
    outputSchema: ApplyMaterialOutputSchema,
  },
  export_scene: {
    inputSchema: ExportSceneInputSchema,
    outputSchema: ExportSceneOutputSchema,
  },
} satisfies Record<MCPToolName, { inputSchema: z.ZodTypeAny; outputSchema: z.ZodTypeAny }>

export const MCPToolCallSchema = z.object({
  tool: z.enum(TOOL_NAMES),
  version: z.literal(MCP_TOOL_VERSION),
  requestId: z.string().uuid(),
  payload: z.unknown(),
}).strict().superRefine((call, ctx) => {
  const result = toolRegistry[call.tool].inputSchema.safeParse(call.payload)
  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payload', ...issue.path],
        message: issue.message,
      })
    }
  }
})

export const MCPToolCallResponseSchema = z.object({
  success: z.boolean(),
  result: z.unknown().nullable(),
  logs: z.array(z.string()),
  error: z.string().nullable(),
}).strict()

export type MCPToolCall = z.infer<typeof MCPToolCallSchema>
export type MCPToolCallResponse = z.infer<typeof MCPToolCallResponseSchema>

export function validateToolCall(data: unknown): MCPToolCall {
  return MCPToolCallSchema.parse(data)
}

export function validateToolOutput(tool: MCPToolName, result: unknown): unknown {
  return toolRegistry[tool].outputSchema.parse(result)
}
