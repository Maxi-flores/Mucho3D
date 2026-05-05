/**
 * Blender execution service
 * Handles both mock and real Blender execution for GenerationPlans
 */

import { GenerationJob } from '../services/jobService'
import { appendJobLog, appendJobError, updateJobStatus, completeJob } from '../services/jobService'
import { callMCPTool } from './mcpBridgeClient'

// GenerationPlan type would need to be imported from shared types
// For now, use the interface from jobService module
export interface GenerationPlan {
  id: string
  projectId: string
  title: string
  description: string
  objects: Array<{
    id: string
    name: string
    type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane'
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
    color?: string
    material?: {
      metallic: number
      roughness: number
      emissive?: [number, number, number]
    }
    modifiers?: Array<{
      type: 'bevel' | 'subdivision' | 'solidify' | 'array'
      params: Record<string, unknown>
    }>
  }>
  lights?: Array<{
    id: string
    name: string
    type: 'directional' | 'point' | 'spot'
    position: [number, number, number]
    rotation?: [number, number, number]
    intensity: number
    color?: string
    energy?: number
  }>
  camera?: {
    id: string
    name: string
    position: [number, number, number]
    target: [number, number, number]
    fov?: number
  }
  units?: string
  scale?: number
  outputFormat?: 'glb' | 'fbx' | 'stl'
  qualityLevel?: 'low' | 'medium' | 'high'
  constraints?: string[]
  tags?: string[]
  createdAt?: string
}

const BLENDER_MODE = process.env.BLENDER_MODE || 'mock'
const JOB_TIMEOUT_MS = Number(process.env.JOB_TIMEOUT_MS || 300000)

interface ExecutionProgress {
  stage: GenerationJob['status']
  percentage: number
}

/**
 * Execute a generation plan in Blender (local mode)
 * Calls the MCP bridge to execute the scene creation
 */
export async function executeBlenderPlan(
  jobId: string,
  plan: GenerationPlan
): Promise<void> {
  try {
    if (BLENDER_MODE === 'mock') {
      await executeMockBlenderPlan(jobId, plan)
    } else if (BLENDER_MODE === 'local') {
      await executeLocalBlenderPlan(jobId, plan)
    } else {
      throw new Error(`Unknown BLENDER_MODE: ${BLENDER_MODE}`)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error during execution'
    await appendJobError(jobId, errorMsg)
    await updateJobStatus(jobId, 'failed')
    throw error
  }
}

/**
 * Mock execution for testing (no Blender required)
 */
async function executeMockBlenderPlan(jobId: string, plan: GenerationPlan): Promise<void> {
  const stages: Array<{ status: GenerationJob['status']; ms: number }> = [
    { status: 'sending_to_blender', ms: 500 },
    { status: 'executing_blender', ms: 2000 },
    { status: 'exporting', ms: 1000 },
  ]

  let totalDelay = 0

  for (const { status, ms } of stages) {
    totalDelay += ms
    await new Promise(resolve => setTimeout(resolve, ms))
    await updateJobStatus(jobId, status)
    await appendJobLog(jobId, `Mock stage: ${status}`)
  }

  // Create mock artifact
  const mockArtifact = {
    id: `artifact_${jobId.slice(0, 8)}`,
    jobId,
    format: 'glb',
    filename: `${plan.title.replace(/\s+/g, '_')}.glb`,
    path: `/artifacts/jobs/${jobId}/scene.glb`,
    sizeBytes: Math.floor(Math.random() * 5000000) + 100000,
    createdAt: new Date().toISOString(),
  }

  await completeJob(jobId, [mockArtifact])
  await appendJobLog(jobId, `Mock execution completed with artifact: ${mockArtifact.filename}`)
}

/**
 * Real execution via MCP bridge
 */
async function executeLocalBlenderPlan(jobId: string, plan: GenerationPlan): Promise<void> {
  try {
    // Validate plan before sending to Blender
    await validatePlan(plan)
    await updateJobStatus(jobId, 'sending_to_blender')
    await appendJobLog(jobId, `Sending plan to Blender: ${plan.title}`)

    // Call MCP bridge to execute the plan
    const result = await callMCPTool('execute_plan', {
      plan,
      jobId,
      outputDir: `/artifacts/jobs/${jobId}`,
    })

    if (!result.success) {
      throw new Error(result.error || 'Blender execution failed')
    }

    // Update status during execution
    await updateJobStatus(jobId, 'executing_blender')
    const createdCount = result.createdObjects || 0
    await appendJobLog(jobId, `Blender execution started, created ${createdCount} objects`)

    // Add logs from execution
    const logs = (result.logs as string[] | undefined) || []
    for (const log of logs) {
      await appendJobLog(jobId, log)
    }

    // Handle any execution errors from result (if it's an object with errors property)
    const resultObj = result.result as Record<string, unknown> | undefined
    if (resultObj && Array.isArray(resultObj.errors)) {
      for (const error of resultObj.errors as string[]) {
        await appendJobError(jobId, error)
      }
    }

    // Export the scene
    await updateJobStatus(jobId, 'exporting')
    await appendJobLog(jobId, 'Exporting scene to GLB format')

    const exportResult = await callMCPTool('export_scene', {
      jobId,
      formats: [plan.outputFormat || 'glb'],
      outputDir: `/artifacts/jobs/${jobId}`,
    })

    if (!exportResult.success) {
      throw new Error(exportResult.error || 'Export failed')
    }

    // Build artifact metadata
    const exports = exportResult.exports || []
    const artifacts = buildArtifacts(jobId, exports)

    if (artifacts.length === 0) {
      throw new Error('No artifacts were generated')
    }

    // Complete the job
    await completeJob(jobId, artifacts)
    await appendJobLog(jobId, `Execution completed successfully with ${artifacts.length} artifact(s)`)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown Blender execution error'
    await appendJobError(jobId, errorMsg)
    await updateJobStatus(jobId, 'failed')
    throw error
  }
}

/**
 * Validate GenerationPlan before sending to Blender
 */
async function validatePlan(plan: GenerationPlan): Promise<void> {
  const errors: string[] = []

  // Check required fields
  if (!plan.objects || plan.objects.length === 0) {
    errors.push('Plan must contain at least one object')
  }

  // Check object count
  if (plan.objects && plan.objects.length > 100) {
    errors.push(`Too many objects: ${plan.objects.length} (max 100)`)
  }

  // Validate primitive types
  const validTypes = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']
  if (plan.objects) {
    for (const obj of plan.objects) {
      if (!validTypes.includes(obj.type)) {
        errors.push(`Invalid primitive type: ${obj.type}`)
      }

      // Check coordinate ranges
      for (const [i, coord] of obj.position.entries()) {
        if (!Number.isFinite(coord) || Math.abs(coord) > 1000) {
          errors.push(`Object ${obj.name} position[${i}] out of range: ${coord}`)
        }
      }

      // Check scale ranges
      for (const [i, scale] of obj.scale.entries()) {
        if (!Number.isFinite(scale) || scale < 0.01 || scale > 100) {
          errors.push(`Object ${obj.name} scale[${i}] out of range: ${scale}`)
        }
      }
    }
  }

  // Check light count
  if (plan.lights && plan.lights.length > 10) {
    errors.push(`Too many lights: ${plan.lights.length} (max 10)`)
  }

  // Check export format
  const validFormats = ['glb', 'fbx', 'stl']
  if (!validFormats.includes(plan.outputFormat || 'glb')) {
    errors.push(`Invalid export format: ${plan.outputFormat}`)
  }

  if (errors.length > 0) {
    throw new Error(`Plan validation failed: ${errors.join('; ')}`)
  }
}

/**
 * Build artifact metadata from export results
 */
function buildArtifacts(
  jobId: string,
  exports: Array<{ format: string; path: string; size?: number }>
): Array<{
  id: string
  jobId: string
  format: string
  filename: string
  path: string
  sizeBytes: number
  createdAt: string
}> {
  const now = new Date().toISOString()

  return exports.map((exp, idx) => ({
    id: `artifact_${jobId.slice(0, 8)}_${idx}`,
    jobId,
    format: exp.format,
    filename: `scene.${exp.format}`,
    path: exp.path,
    sizeBytes: exp.size || 0,
    createdAt: now,
  }))
}
