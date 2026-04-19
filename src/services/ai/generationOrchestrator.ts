import {
  updateGenerationStatus,
  updateGenerationError,
  createGeneration,
  updateGenerationExecutionPayload,
  updateGenerationExecutionResult,
  saveScene,
} from '@/services/firestore'
import { addExecutionLog } from './executionLogger'
import { generateScenePlan, generateDemoScenePlan, isOllamaAvailable } from './ollamaService'
import { parseScenePlan, ScenePlan } from '@/schema/scenePlan'
import { GenerationDoc } from '@/types/firebase'
import {
  compilePlan,
  executePayload,
  submitToBlender,
  mapBlenderResponseToResult,
  mapExecutionResultToSceneData,
} from '@/services/execution'

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
 * 4. Compile plan to execution payload
 * 5. Execute in Blender (or local fallback)
 * 6. Save scene and result, update generation
 * 7. Update to complete or error
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
    await updateGenerationStatus(generation.id, 'planning')
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
    const planningTimeMs = Date.now() - startTime

    // Update generation with structured plan
    await updateGenerationStatus(generation.id, 'planning', plan)
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

    // Step 4: Compile plan to execution payload
    await addExecutionLog(
      generation.id,
      projectId,
      userId,
      'compilation_start',
      'Compiling scene plan to execution instructions',
      {},
      'info'
    )

    const compileResult = compilePlan(plan)
    if (!compileResult.success) {
      const error = compileResult.error || 'Compilation failed'
      await updateGenerationError(generation.id, error)
      await addExecutionLog(
        generation.id,
        projectId,
        userId,
        'compilation_error',
        error,
        {},
        'error'
      )
      return {
        success: false,
        generation,
        plan,
        error,
        durationMs: Date.now() - startTime,
      }
    }

    const payload = compileResult.payload!
    await updateGenerationExecutionPayload(generation.id, payload, planningTimeMs)
    await addExecutionLog(
      generation.id,
      projectId,
      userId,
      'compilation_success',
      'Scene plan compiled to execution payload',
      { instructionCount: payload.instructions.length },
      'info'
    )

    // Step 5: Execute payload (local or Blender)
    await updateGenerationStatus(generation.id, 'executing')
    await addExecutionLog(
      generation.id,
      projectId,
      userId,
      'execution_start',
      'Starting scene execution',
      {},
      'info'
    )

    const executionStartTime = Date.now()

    // Try Blender first, fall back to local execution if unavailable
    const blenderResponse = await submitToBlender(generation.id, payload)
    let executionResult = blenderResponse.success
      ? mapBlenderResponseToResult(blenderResponse)
      : await executePayload(payload)

    const executionTimeMs = Date.now() - executionStartTime
    executionResult.executionTimeMs = executionTimeMs

    if (!executionResult.success) {
      const error = executionResult.errors?.[0] || 'Execution failed'
      await updateGenerationError(generation.id, error)
      await addExecutionLog(
        generation.id,
        projectId,
        userId,
        'execution_error',
        error,
        { errors: executionResult.errors },
        'error'
      )
      return {
        success: false,
        generation,
        plan,
        error,
        durationMs: Date.now() - startTime,
      }
    }

    // Step 6: Save scene and result
    const sceneData = mapExecutionResultToSceneData(
      executionResult,
      projectId,
      userId,
      generation.id
    )

    const savedScene = await saveScene(sceneData)

    await updateGenerationExecutionResult(
      generation.id,
      executionResult,
      savedScene.id,
      executionTimeMs
    )

    await addExecutionLog(
      generation.id,
      projectId,
      userId,
      'execution_success',
      'Scene executed and saved',
      {
        objectCount: executionResult.objects.length,
        sceneId: savedScene.id,
        executionTimeMs,
      },
      'info'
    )

    // Step 7: Return success with complete data
    const totalTimeMs = Date.now() - startTime
    const updatedGeneration: GenerationDoc = {
      ...generation,
      structuredPlan: plan,
      executionPayload: payload,
      executionResult: executionResult,
      status: 'complete',
      outputSceneId: savedScene.id,
      planningTimeMs,
      executionTimeMs,
      totalTimeMs,
      updatedAt: generation.updatedAt,
    }

    return {
      success: true,
      generation: updatedGeneration,
      plan,
      durationMs: totalTimeMs,
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
