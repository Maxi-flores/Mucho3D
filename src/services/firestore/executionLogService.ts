import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase'
import { ExecutionLogDoc, ExecutionStep } from '@/types/firebase'

const db = getFirebaseDb()

/**
 * Create an execution log for a generation
 * Called when Blender/execution starts (Phase 4)
 */
export async function createExecutionLog(
  generationId: string,
  projectId: string,
  userId: string
): Promise<ExecutionLogDoc> {
  if (!isFirebaseConfigured() || !db) {
    // Demo fallback
    const id = 'log-' + Math.random().toString(36).slice(2, 9)
    return {
      id,
      generationId,
      projectId,
      userId,
      steps: [],
      errors: [],
      outputSummary: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
  }

  const logsCollection = collection(db, 'executionLogs')
  const docRef = await addDoc(logsCollection, {
    generationId,
    projectId,
    userId,
    steps: [],
    errors: [],
    outputSummary: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  const docSnap = await getDoc(docRef)
  return { id: docRef.id, ...docSnap.data() } as ExecutionLogDoc
}

/**
 * Add a step to an execution log
 * Called as Blender executes operations
 */
export async function addExecutionStep(
  logId: string,
  step: ExecutionStep
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  const logRef = doc(db, 'executionLogs', logId)
  await updateDoc(logRef, {
    steps: arrayUnion(step),
  })
}

/**
 * Add an error to an execution log
 */
export async function addExecutionError(
  logId: string,
  errorMessage: string
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  const logRef = doc(db, 'executionLogs', logId)
  await updateDoc(logRef, {
    errors: arrayUnion(errorMessage),
  })
}

/**
 * Complete an execution log with summary
 */
export async function completeExecutionLog(
  logId: string,
  outputSummary: string
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  const logRef = doc(db, 'executionLogs', logId)
  await updateDoc(logRef, {
    outputSummary,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Get an execution log by ID
 */
export async function getExecutionLog(logId: string): Promise<ExecutionLogDoc | null> {
  if (!isFirebaseConfigured() || !db) {
    return null
  }

  const logRef = doc(db, 'executionLogs', logId)
  const docSnap = await getDoc(logRef)

  if (!docSnap.exists()) {
    return null
  }

  return { id: docSnap.id, ...docSnap.data() } as ExecutionLogDoc
}
