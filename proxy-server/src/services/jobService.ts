/**
 * In-memory job store for generation jobs
 * In production, this would be backed by a database or message queue
 */

export interface GenerationJob {
  id: string
  projectId: string
  userId: string
  status: 'queued' | 'planning' | 'validating' | 'sending_to_blender' | 'executing_blender' | 'exporting' | 'complete' | 'failed' | 'cancelled'
  prompt: string
  plan?: unknown
  blenderJobId?: string
  startedAt?: string
  completedAt?: string
  duration?: number
  artifacts: Array<{
    id: string
    jobId: string
    format: string
    filename: string
    url?: string
    size?: number
    createdAt: string
  }>
  errors: string[]
  logs: string[]
  createdAt: string
  updatedAt: string
}

// In-memory store - replace with database in production
const jobs = new Map<string, GenerationJob>()

export function createJob(
  jobId: string,
  projectId: string,
  userId: string,
  prompt: string,
  plan?: unknown
): GenerationJob {
  const now = new Date().toISOString()

  const job: GenerationJob = {
    id: jobId,
    projectId,
    userId,
    status: 'queued',
    prompt,
    plan,
    artifacts: [],
    errors: [],
    logs: ['Job created'],
    createdAt: now,
    updatedAt: now,
  }

  jobs.set(jobId, job)
  console.log(`[JobService] Created job ${jobId} for project ${projectId}`)

  return job
}

export function getJob(jobId: string): GenerationJob | null {
  return jobs.get(jobId) || null
}

export function updateJobStatus(
  jobId: string,
  status: GenerationJob['status'],
  updates?: Partial<GenerationJob>
): GenerationJob | null {
  const job = jobs.get(jobId)
  if (!job) return null

  const now = new Date().toISOString()

  const updated: GenerationJob = {
    ...job,
    ...updates,
    status,
    updatedAt: now,
  }

  jobs.set(jobId, updated)
  console.log(`[JobService] Updated job ${jobId} status to ${status}`)

  return updated
}

export function appendJobLog(jobId: string, message: string): GenerationJob | null {
  const job = jobs.get(jobId)
  if (!job) return null

  const now = new Date().toISOString()

  const updated: GenerationJob = {
    ...job,
    logs: [...job.logs, `[${new Date(now).toLocaleTimeString()}] ${message}`],
    updatedAt: now,
  }

  jobs.set(jobId, updated)
  console.log(`[JobService] ${jobId}: ${message}`)

  return updated
}

export function appendJobError(jobId: string, error: string): GenerationJob | null {
  const job = jobs.get(jobId)
  if (!job) return null

  const now = new Date().toISOString()

  const updated: GenerationJob = {
    ...job,
    errors: [...job.errors, error],
    updatedAt: now,
  }

  jobs.set(jobId, updated)
  console.error(`[JobService] ${jobId}: ${error}`)

  return updated
}

export function completeJob(
  jobId: string,
  artifacts: GenerationJob['artifacts'],
  errors?: string[]
): GenerationJob | null {
  const job = jobs.get(jobId)
  if (!job) return null

  const now = new Date().toISOString()
  const duration = new Date(now).getTime() - new Date(job.createdAt).getTime()

  const updated: GenerationJob = {
    ...job,
    status: errors && errors.length > 0 ? 'failed' : 'complete',
    artifacts,
    errors: errors || job.errors,
    completedAt: now,
    duration,
    updatedAt: now,
  }

  jobs.set(jobId, updated)
  console.log(`[JobService] Completed job ${jobId} with ${artifacts.length} artifacts`)

  return updated
}

export function cancelJob(jobId: string): GenerationJob | null {
  const job = jobs.get(jobId)
  if (!job) return null

  if (job.status === 'complete' || job.status === 'cancelled' || job.status === 'failed') {
    return job
  }

  const now = new Date().toISOString()

  const updated: GenerationJob = {
    ...job,
    status: 'cancelled',
    updatedAt: now,
  }

  jobs.set(jobId, updated)
  console.log(`[JobService] Cancelled job ${jobId}`)

  return updated
}

export function listJobs(projectId?: string): GenerationJob[] {
  const jobArray = Array.from(jobs.values())
  if (projectId) {
    return jobArray.filter(j => j.projectId === projectId)
  }
  return jobArray
}
