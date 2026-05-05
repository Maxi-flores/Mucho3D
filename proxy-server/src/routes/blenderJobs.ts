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
  GenerationJob,
} from '../services/jobService'
import { executeBlenderPlan, GenerationPlan } from '../services/blenderExecutor'

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

    // Start execution in background (don't wait for completion)
    executeBlenderPlan(jobId, plan as GenerationPlan).catch((error: Error) => {
      console.error(`[blenderJobs] Execution error for job ${jobId}:`, error.message)
    })

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

