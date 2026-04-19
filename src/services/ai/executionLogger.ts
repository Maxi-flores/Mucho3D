import { Timestamp } from 'firebase/firestore'
import { doc, updateDoc, arrayUnion, getFirestore } from 'firebase/firestore'
import { isFirebaseConfigured } from '@/lib/firebase'

/**
 * Execution Logger Service
 * Logs all steps of the generation pipeline to executionLogs collection
 * Creates a detailed trace for debugging and monitoring
 */

export type LogSeverity = 'debug' | 'info' | 'warning' | 'error'

export interface ExecutionLogEntry {
  timestamp: Timestamp
  phase: string
  message: string
  payload?: Record<string, unknown>
  severity: LogSeverity
}

/**
 * Add a log entry to a generation's execution log
 * If Firebase not configured, logs to console instead
 */
export async function addExecutionLog(
  generationId: string,
  _projectId: string,
  _userId: string,
  phase: string,
  message: string,
  payload?: Record<string, unknown>,
  severity: LogSeverity = 'info'
): Promise<void> {
  if (!isFirebaseConfigured()) {
    // Demo: log to console
    console.log(`[${severity.toUpperCase()}] ${phase}: ${message}`, payload)
    return
  }

  try {
    const db = getFirestore()
    const logRef = doc(db, 'executionLogs', generationId)

    const entry: ExecutionLogEntry = {
      timestamp: Timestamp.now(),
      phase,
      message,
      payload: payload || {},
      severity,
    }

    // Append to steps array
    await updateDoc(logRef, {
      steps: arrayUnion(entry),
    })
  } catch (err) {
    // Gracefully handle logging errors
    console.error('Failed to log execution step:', err)
  }
}

/**
 * Log multiple entries at once
 */
export async function addExecutionLogs(
  generationId: string,
  _projectId: string,
  _userId: string,
  entries: Array<{
    phase: string
    message: string
    payload?: Record<string, unknown>
    severity?: LogSeverity
  }>
): Promise<void> {
  for (const entry of entries) {
    await addExecutionLog(
      generationId,
      _projectId,
      _userId,
      entry.phase,
      entry.message,
      entry.payload,
      entry.severity || 'info'
    )
  }
}

/**
 * Structured log for execution errors
 */
export async function logExecutionError(
  generationId: string,
  projectId: string,
  userId: string,
  phase: string,
  error: Error | string,
  context?: Record<string, unknown>
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  await addExecutionLog(
    generationId,
    projectId,
    userId,
    phase,
    message,
    {
      ...context,
      stack: stack?.substring(0, 500), // Limit stack trace
    },
    'error'
  )
}
