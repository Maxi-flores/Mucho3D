import { ScenePlan } from '@/schema/scenePlan'
import { ExecutionPayload } from '@/types/firebase'

/**
 * Plan Compiler
 * Converts validated scene plans into deterministic execution instructions
 * Only allows whitelisted operations - unknown ops fail safely
 */

interface CompileResult {
  success: boolean
  payload?: ExecutionPayload
  error?: string
}

const WHITELISTED_OPERATIONS = new Set([
  'create_primitive',
  'transform',
  'apply_material',
  'apply_color',
  'boolean_union',
  'boolean_difference',
  'boolean_intersection',
  'mirror',
  'group',
  'export_glb',
])

export function compilePlan(plan: ScenePlan): CompileResult {
  try {
    // Validate plan structure
    if (!plan.objects || plan.objects.length === 0) {
      return {
        success: false,
        error: 'Plan has no objects to create',
      }
    }

    const instructions: ExecutionPayload['instructions'] = []

    // Step 1: Create all primitives in order
    for (const obj of plan.objects) {
      instructions.push({
        type: 'create_primitive',
        targetId: obj.id,
        params: {
          id: obj.id,
          name: obj.name,
          primitive: obj.primitive,
        },
      })
    }

    // Step 2: Apply operations in order
    if (plan.operations && plan.operations.length > 0) {
      for (const op of plan.operations) {
        const opAny = op as any
        // Validate operation type
        if (!WHITELISTED_OPERATIONS.has(opAny.type)) {
          return {
            success: false,
            error: `Unknown operation type: ${opAny.type}. Allowed: ${Array.from(WHITELISTED_OPERATIONS).join(', ')}`,
          }
        }

        // Validate operation has required fields
        if (!('targetId' in opAny)) {
          return {
            success: false,
            error: `Operation ${opAny.type} missing required field: targetId`,
          }
        }

        instructions.push({
          type: opAny.type,
          targetId: opAny.targetId,
          params: {
            // Pass all operation-specific params, type is known to be whitelisted
            ...Object.fromEntries(
              Object.entries(opAny).filter(([key]) => key !== 'type' && key !== 'targetId')
            ),
          },
        })
      }
    }

    return {
      success: true,
      payload: {
        instructions,
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
