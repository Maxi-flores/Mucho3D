import { GenerationJob, GenerationPlan } from '@/types/generation'

const PROXY_API_URL = import.meta.env.VITE_PROXY_API_URL || 'http://localhost:8787'

/**
 * Create a new generation job
 */
export async function createGenerationJob(
  projectId: string,
  userId: string,
  prompt: string,
  plan?: GenerationPlan
): Promise<{ job: GenerationJob; jobId: string } | { error: string }> {
  try {
    const response = await fetch(`${PROXY_API_URL}/api/blender/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        userId,
        prompt,
        plan,
      }),
    })

    if (!response.ok) {
      return {
        error: `Failed to create job: ${response.status} ${response.statusText}`,
      }
    }

    return await response.json()
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    return { error: `Job creation failed: ${error}` }
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<{
  job: GenerationJob
  isComplete: boolean
  progress?: { stage: string; percentage: number }
} | null> {
  try {
    const response = await fetch(`${PROXY_API_URL}/api/blender/jobs/${jobId}`)

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (err) {
    console.error('Error fetching job status:', err)
    return null
  }
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<{ job: GenerationJob } | { error: string }> {
  try {
    const response = await fetch(`${PROXY_API_URL}/api/blender/jobs/${jobId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return {
        error: `Failed to cancel job: ${response.status} ${response.statusText}`,
      }
    }

    return await response.json()
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    return { error: `Cancel failed: ${error}` }
  }
}

/**
 * Poll job status until completion
 */
export async function pollJobUntilComplete(
  jobId: string,
  onStatusChange?: (status: string, percentage: number) => void,
  maxWaitMs: number = 600000 // 10 minutes
): Promise<GenerationJob | null> {
  const startTime = Date.now()
  const pollInterval = 1000 // 1 second

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getJobStatus(jobId)

    if (!result) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      continue
    }

    const { job, isComplete, progress } = result

    if (onStatusChange && progress) {
      onStatusChange(progress.stage, progress.percentage)
    }

    if (isComplete) {
      return job
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  return null
}
