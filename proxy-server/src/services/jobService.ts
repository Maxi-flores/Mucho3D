/**
 * Generation job store with Firestore support
 * Supports both Firestore persistence and in-memory fallback
 */

import { isFirebaseAvailable, getFirestore, generationsCollection } from '../lib/firebase'

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

// In-memory fallback
const inMemoryJobs = new Map<string, GenerationJob>()

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

  // Persist to Firestore if available
  if (isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      db.collection(generationsCollection).doc(jobId).set(job)
      console.log(`[JobService] Created job ${jobId} in Firestore`)
    } catch (error) {
      console.error(`[JobService] Failed to create job in Firestore:`, error)
      // Fall through to in-memory
    }
  }

  // Always keep in in-memory store for fast access
  inMemoryJobs.set(jobId, job)
  console.log(`[JobService] Created job ${jobId} for project ${projectId}`)

  return job
}

export async function getJob(jobId: string): Promise<GenerationJob | null> {
  // Check in-memory first (faster)
  const cached = inMemoryJobs.get(jobId)
  if (cached) return cached

  // Try Firestore if available
  if (isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      const doc = await db.collection(generationsCollection).doc(jobId).get()
      if (doc.exists) {
        const job = doc.data() as GenerationJob
        // Cache in-memory for future access
        inMemoryJobs.set(jobId, job)
        return job
      }
    } catch (error) {
      console.error(`[JobService] Failed to fetch job from Firestore:`, error)
    }
  }

  return null
}

export async function updateJobStatus(
  jobId: string,
  status: GenerationJob['status'],
  updates?: Partial<GenerationJob>
): Promise<GenerationJob | null> {
  let job = inMemoryJobs.get(jobId)

  // Try Firestore if not in cache
  if (!job && isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      const doc = await db.collection(generationsCollection).doc(jobId).get()
      if (doc.exists) {
        job = doc.data() as GenerationJob
      }
    } catch (error) {
      console.error(`[JobService] Failed to fetch job for update:`, error)
    }
  }

  if (!job) return null

  const now = new Date().toISOString()

  const updated: GenerationJob = {
    ...job,
    ...updates,
    status,
    updatedAt: now,
  }

  // Update Firestore
  if (isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      await db.collection(generationsCollection).doc(jobId).update({
        status,
        updatedAt: now,
        ...updates,
      })
    } catch (error) {
      console.error(`[JobService] Failed to update job in Firestore:`, error)
    }
  }

  // Update in-memory cache
  inMemoryJobs.set(jobId, updated)
  console.log(`[JobService] Updated job ${jobId} status to ${status}`)

  return updated
}

export async function appendJobLog(jobId: string, message: string): Promise<GenerationJob | null> {
  let job = inMemoryJobs.get(jobId)

  if (!job && isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      const doc = await db.collection(generationsCollection).doc(jobId).get()
      if (doc.exists) {
        job = doc.data() as GenerationJob
      }
    } catch (error) {
      console.error(`[JobService] Failed to fetch job for log append:`, error)
    }
  }

  if (!job) return null

  const now = new Date().toISOString()
  const logEntry = `[${new Date(now).toLocaleTimeString()}] ${message}`

  const updated: GenerationJob = {
    ...job,
    logs: [...job.logs, logEntry],
    updatedAt: now,
  }

  // Update Firestore
  if (isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      await db.collection(generationsCollection).doc(jobId).update({
        logs: updated.logs,
        updatedAt: now,
      })
    } catch (error) {
      console.error(`[JobService] Failed to append log in Firestore:`, error)
    }
  }

  inMemoryJobs.set(jobId, updated)
  console.log(`[JobService] ${jobId}: ${message}`)

  return updated
}

export async function appendJobError(jobId: string, errorMsg: string): Promise<GenerationJob | null> {
  let job = inMemoryJobs.get(jobId)

  if (!job && isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      const doc = await db.collection(generationsCollection).doc(jobId).get()
      if (doc.exists) {
        job = doc.data() as GenerationJob
      }
    } catch (error) {
      console.error(`[JobService] Failed to fetch job for error append:`, error)
    }
  }

  if (!job) return null

  const now = new Date().toISOString()

  const updated: GenerationJob = {
    ...job,
    errors: [...job.errors, errorMsg],
    updatedAt: now,
  }

  // Update Firestore
  if (isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      await db.collection(generationsCollection).doc(jobId).update({
        errors: updated.errors,
        updatedAt: now,
      })
    } catch (error) {
      console.error(`[JobService] Failed to append error in Firestore:`, error)
    }
  }

  inMemoryJobs.set(jobId, updated)
  console.error(`[JobService] ${jobId}: ${errorMsg}`)

  return updated
}

export async function completeJob(
  jobId: string,
  artifacts: GenerationJob['artifacts'],
  errors?: string[]
): Promise<GenerationJob | null> {
  let job = inMemoryJobs.get(jobId)

  if (!job && isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      const doc = await db.collection(generationsCollection).doc(jobId).get()
      if (doc.exists) {
        job = doc.data() as GenerationJob
      }
    } catch (error) {
      console.error(`[JobService] Failed to fetch job for completion:`, error)
    }
  }

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

  // Update Firestore
  if (isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      await db.collection(generationsCollection).doc(jobId).update({
        status: updated.status,
        artifacts,
        errors: updated.errors,
        completedAt: now,
        duration,
        updatedAt: now,
      })
    } catch (error) {
      console.error(`[JobService] Failed to complete job in Firestore:`, error)
    }
  }

  inMemoryJobs.set(jobId, updated)
  console.log(`[JobService] Completed job ${jobId} with ${artifacts.length} artifacts`)

  return updated
}

export async function cancelJob(jobId: string): Promise<GenerationJob | null> {
  let job = inMemoryJobs.get(jobId)

  if (!job && isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      const doc = await db.collection(generationsCollection).doc(jobId).get()
      if (doc.exists) {
        job = doc.data() as GenerationJob
      }
    } catch (error) {
      console.error(`[JobService] Failed to fetch job for cancellation:`, error)
    }
  }

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

  // Update Firestore
  if (isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      await db.collection(generationsCollection).doc(jobId).update({
        status: 'cancelled',
        updatedAt: now,
      })
    } catch (error) {
      console.error(`[JobService] Failed to cancel job in Firestore:`, error)
    }
  }

  inMemoryJobs.set(jobId, updated)
  console.log(`[JobService] Cancelled job ${jobId}`)

  return updated
}

export async function listJobs(projectId?: string): Promise<GenerationJob[]> {
  // Try Firestore first for complete data
  if (isFirebaseAvailable()) {
    try {
      const db = getFirestore()
      let query: any = db.collection(generationsCollection)

      if (projectId) {
        query = query.where('projectId', '==', projectId)
      }

      const snapshot = await query.orderBy('createdAt', 'desc').limit(100).get()
      const jobs: GenerationJob[] = []

      snapshot.forEach((doc: any) => {
        jobs.push(doc.data() as GenerationJob)
      })

      return jobs
    } catch (error) {
      console.error(`[JobService] Failed to list jobs from Firestore:`, error)
      // Fall through to in-memory
    }
  }

  // Fallback to in-memory
  const jobArray = Array.from(inMemoryJobs.values())
  if (projectId) {
    return jobArray.filter(j => j.projectId === projectId)
  }
  return jobArray
}
