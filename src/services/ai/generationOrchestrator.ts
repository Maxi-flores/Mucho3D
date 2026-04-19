import {
  updateGenerationStatus,
  updateGenerationError,
  createGeneration,
} from '@/services/firestore'
import { addExecutionLog } from './executionLogger'
import { generateScenePlan, generateDemoScenePlan, isOllamaAvailable } from './ollamaService'
import { parseScenePlan, ScenePlan } from '@/schema/scenePlan'
import { GenerationDoc } from '@/types/firebase'

/**
 * Generation Orchestrator
 * Coordinates the full pipeline:
 * prompt → planning → validation → execution → logging
 */

export interface OrchestrationResult {
  success: boolean
  generation?: GenerationDoc
  plan?: ScenePlan
  validationErrors?: string[]
  executionErrors?: string[]
  error?: string
  durationMs?: number
}

/**
 * Orchestrate a full generation from prompt to completion
 *
 * Flow:
 * 1. Create generation record (status: pending)
 * 2. Update to planning, call Ollama
 * 3. Extract and validate JSON
 * 4. Update to validated, log plan
 * 5. (Future) Execute in Blender
 * 6. Update to complete or error
 */
export async function orchestrateGeneration(
  projectId: string,
  userId: string,
  prompt: string,
  sessionId?: string
): Promise<OrchestrationResult> {
  const startTime = Date.now()

  try {
    // Step 1: Create generation record with status pending
    const generation = await createGeneration(projectId, userId, prompt, sessionId)
    await addExecutionLog(
      generation.id,
      projectId,
      userId,
      'created',
      'Generation record created',
      { prompt, sessionId },
      'info'
    )

    // Step 2: Update to planning and call Ollama
    await updateGenerationStatus(generation.id, 'running')
    await addExecutionLog(
      generation.id,
      projectId,
      userId,
      'ollama_request',
      'Requesting scene plan from Ollama',
      { prompt },
      'info'
    )

    // Check if Ollama is available, otherwise use demo
    const ollamaAvailable = await isOllamaAvailable()
    const ollamaResult = ollamaAvailable
      ? await generateScenePlan(prompt)
      : generateDemoScenePlan(prompt)

    if (!ollamaResult.success) {
      const error = ollamaResult.error || 'Unknown Ollama error'
      await updateGenerationError(generation.id, error)
      await addExecutionLog(
        generation.id,
        projectId,
        userId,
        'ollama_error',
        `Ollama request failed: ${error}`,
        {},
        'error'
      )
      return {
        success: false,
        generation,
        error: `Ollama planning failed: ${error}`,
        durationMs: Date.now() - startTime,
      }
    }

    if (!ollamaResult.jsonResponse) {
      const error = 'No JSON in Ollama response'
      await updateGenerationError(generation.id, error)
      await addExecutionLog(
        generation.id,
        projectId,
        userId,
        'json_extraction',
        error,
        { rawResponse: ollamaResult.rawResponse?.substring(0, 200) },
        'error'
      )
      return {
        success: false,
        generation,
        error,
        durationMs: Date.now() - startTime,
      }
    }

    await addExecutionLog(
      generation.id,
      projectId,
      userId,
      'ollama_success',
      'Received plan from Ollama',
      { planLength: ollamaResult.jsonResponse.length },
      'info'
    )

    // Step 3: Parse and validate plan
    const parseResult = parseScenePlan(ollamaResult.jsonResponse)

    if (!parseResult.success) {
      const error = parseResult.error || 'Invalid JSON plan'
      await updateGenerationError(generation.id, error)
      await addExecutionLog(
        generation.id,
        projectId,
        userId,
        'validation_parse_error',
        error,
        {},
        'error'
      )
      return {
        success: false,
        generation,
        error,
        durationMs: Date.now() - startTime,
      }
    }

    const plan = parseResult.data!

    // Update generation with structured plan
    await updateGenerationStatus(generation.id, 'complete', plan)
    await addExecutionLog(
      generation.id,
      projectId,
      userId,
      'validation_success',
      'Scene plan validated successfully',
      {
        objectCount: plan.objects.length,
        operationCount: plan.operations.length,
        complexity: plan.metadata?.estimatedComplexity,
      },
      'info'
    )

    // Step 4: Return success with plan
    const updatedGeneration: GenerationDoc = {
      ...generation,
      structuredPlan: plan,
      status: 'complete',
      updatedAt: generation.updatedAt,
    }

    return {
      success: true,
      generation: updatedGeneration,
      plan,
      durationMs: Date.now() - startTime,
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown orchestration error'
    return {
      success: false,
      error: `Orchestration failed: ${error}`,
      durationMs: Date.now() - startTime,
    }
  }
}

/**
 * For future Phase 5: Execute a validated plan in Blender
 * Stub for now
 */
export async function executeScenePlan(
  _generationId: string,
  _plan: ScenePlan
): Promise<{ success: boolean; outputUrl?: string; error?: string }> {
  // TODO: Phase 5 - Call Blender worker
  // For now, return success stub
  return {
    success: true,
    outputUrl: '/tmp/scene.glb', // Mock
  }
}
