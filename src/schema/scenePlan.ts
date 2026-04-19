import { z } from 'zod'

/**
 * Scene Operation Types - Whitelist of allowed operations
 * Only these operations can be executed deterministically
 */
export const OPERATION_TYPES = [
  'create_primitive',
  'create_parametric_asset',
  'transform',
  'apply_material',
  'apply_color',
  'mirror',
  'boolean_union',
  'boolean_difference',
  'boolean_intersection',
  'group',
  'export_glb',
] as const

/**
 * Zod Schema for Scene Planning
 * Strict validation to prevent arbitrary code injection
 */

// Vector3 type
const Vector3Schema = z.tuple([
  z.number().safe().min(-1000).max(1000),
  z.number().safe().min(-1000).max(1000),
  z.number().safe().min(-1000).max(1000),
])

// RGBA Color
const ColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)

// Primitive object to create
const PrimitiveSchema = z.object({
  type: z.enum(['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']),
  position: Vector3Schema.default([0, 0, 0]),
  scale: Vector3Schema.default([1, 1, 1]),
  rotation: Vector3Schema.default([0, 0, 0]),
  color: ColorSchema.optional(),
  segments: z.number().int().min(3).max(128).optional(),
})

// Transform operation
const TransformOperationSchema = z.object({
  type: z.literal('transform'),
  targetId: z.string().min(1),
  position: Vector3Schema.optional(),
  scale: Vector3Schema.optional(),
  rotation: Vector3Schema.optional(),
})

// Material operation
const MaterialOperationSchema = z.object({
  type: z.literal('apply_material'),
  targetId: z.string().min(1),
  metallic: z.number().min(0).max(1).optional(),
  roughness: z.number().min(0).max(1).optional(),
  emissive: ColorSchema.optional(),
})

// Color operation
const ColorOperationSchema = z.object({
  type: z.literal('apply_color'),
  targetId: z.string().min(1),
  color: ColorSchema,
})

// Boolean operation
const BooleanOperationSchema = z.object({
  type: z.enum(['boolean_union', 'boolean_difference', 'boolean_intersection']),
  targetId: z.string().min(1),
  operandIds: z.array(z.string().min(1)).min(1),
})

// Export operation
const ExportOperationSchema = z.object({
  type: z.literal('export_glb'),
  targetId: z.string().min(1),
  filename: z.string().min(1).max(255),
})

// Union of all operations
const OperationSchema = z.union([
  TransformOperationSchema,
  MaterialOperationSchema,
  ColorOperationSchema,
  BooleanOperationSchema,
  ExportOperationSchema,
])

// Full Scene Plan Schema
export const ScenePlanSchema = z.object({
  schemaVersion: z.literal('1.0').default('1.0'),
  intent: z.string().min(1).max(500).describe('User intent/prompt'),

  // Objects to create
  objects: z.array(
    z.object({
      id: z.string().min(1).describe('Unique object ID'),
      name: z.string().min(1).max(100),
      primitive: PrimitiveSchema,
    })
  ).min(1).describe('Primitives to create'),

  // Operations to apply
  operations: z.array(OperationSchema)
    .default([])
    .describe('Transformations and operations'),

  // Constraints on execution
  constraints: z.object({
    maxExecutionTimeMs: z.number().int().min(100).max(60000).default(30000),
    requireDeterminism: z.boolean().default(true),
    allowUserInteraction: z.boolean().default(false),
  }).optional(),

  // Metadata
  metadata: z.object({
    confidence: z.number().min(0).max(1).describe('Model confidence in plan'),
    estimatedComplexity: z.enum(['simple', 'moderate', 'complex']).optional(),
    notes: z.string().max(500).optional(),
  }).optional(),
})

export type ScenePlan = z.infer<typeof ScenePlanSchema>
export type Operation = z.infer<typeof OperationSchema>
export type Primitive = z.infer<typeof PrimitiveSchema>

/**
 * Validate a scene plan
 * Returns { success, data, error }
 */
export function validateScenePlan(data: unknown) {
  return ScenePlanSchema.safeParse(data)
}

/**
 * Parse JSON string to scene plan with validation
 */
export function parseScenePlan(jsonStr: string): { success: boolean; data?: ScenePlan; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr)
    const result = validateScenePlan(parsed)
    if (!result.success) {
      return {
        success: false,
        error: `Validation failed: ${result.error.message}`,
      }
    }
    return { success: true, data: result.data }
  } catch (err) {
    return {
      success: false,
      error: `JSON parse error: ${err instanceof Error ? err.message : 'unknown error'}`,
    }
  }
}
