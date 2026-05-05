import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  createJob,
  getJob,
  updateJobStatus,
  appendJobLog,
  appendJobError,
  completeJob,
  cancelJob,
  listJobs,
} from '../services/jobService'

export const blenderJobsRouter = Router()

const BLENDER_MODE = process.env.BLENDER_MODE || 'local'

/**
 * POST /api/blender/jobs
 * Create a new generation job
 */
blenderJobsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId, userId, prompt, plan } = req.body

    if (!projectId || !userId || !prompt) {
      res.status(400).json({ error: 'Missing required fields: projectId, userId, prompt' })
      return
    }

    const jobId = uuidv4()
    const job = createJob(jobId, projectId, userId, prompt, plan)

    // In mock mode, simulate quick completion
    if (BLENDER_MODE === 'mock') {
      simulateMockExecution(jobId)
    } else {
      // In local mode, queue for actual Blender execution
      // TODO: implement real Blender execution
      appendJobLog(jobId, 'Queued for Blender execution').catch(error => {
        console.error('[blenderJobs] Failed to log job queued:', error)
      })
    }

    res.json({
      job,
      jobId,
    })
  } catch (error) {
    console.error('[blenderJobs] Error creating job:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create job',
    })
  }
})

/**
 * GET /api/blender/jobs/:jobId
 * Get job status and details
 */
blenderJobsRouter.get('/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    const job = await getJob(jobId)

    if (!job) {
      res.status(404).json({ error: 'Job not found' })
      return
    }

    const isComplete = job.status === 'complete' || job.status === 'failed' || job.status === 'cancelled'

    const progress = {
      stage: job.status,
      percentage:
        job.status === 'queued'
          ? 0
          : job.status === 'planning'
            ? 20
            : job.status === 'validating'
              ? 40
              : job.status === 'sending_to_blender'
                ? 50
                : job.status === 'executing_blender'
                  ? 75
                  : job.status === 'exporting'
                    ? 90
                    : 100,
    }

    res.json({
      job,
      isComplete,
      progress,
    })
  } catch (error) {
    console.error('[blenderJobs] Error fetching job:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch job',
    })
  }
})

/**
 * POST /api/blender/jobs/:jobId/cancel
 * Cancel a job if possible
 */
blenderJobsRouter.post('/:jobId/cancel', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    const job = await cancelJob(jobId)

    if (!job) {
      res.status(404).json({ error: 'Job not found' })
      return
    }

    res.json({ job })
  } catch (error) {
    console.error('[blenderJobs] Error cancelling job:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to cancel job',
    })
  }
})

/**
 * Simulate mock execution for testing (runs in background)
 */
function simulateMockExecution(jobId: string) {
  const delays = [
    { status: 'planning' as const, ms: 500 },
    { status: 'validating' as const, ms: 500 },
    { status: 'sending_to_blender' as const, ms: 500 },
    { status: 'executing_blender' as const, ms: 2000 },
    { status: 'exporting' as const, ms: 1000 },
  ]

  let delaySum = 0

  delays.forEach(({ status, ms }) => {
    delaySum += ms
    setTimeout(async () => {
      try {
        await updateJobStatus(jobId, status)
        await appendJobLog(jobId, `Stage: ${status}`)
      } catch (error) {
        console.error(`[mock] Failed to update status for ${jobId}:`, error)
      }
    }, delaySum)
  })

  // Completion
  setTimeout(async () => {
    try {
      const mockArtifacts = [
        {
          id: uuidv4(),
          jobId,
          format: 'glb',
          filename: 'scene.glb',
          size: Math.floor(Math.random() * 5000000) + 100000,
          createdAt: new Date().toISOString(),
        },
      ]

      await completeJob(jobId, mockArtifacts)
      await appendJobLog(jobId, 'Mock execution complete')
    } catch (error) {
      console.error(`[mock] Failed to complete job ${jobId}:`, error)
    }
  }, delaySum + 500)
}
