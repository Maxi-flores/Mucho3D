import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase'
import { GenerationDoc } from '@/types/firebase'

const db = getFirebaseDb()

/**
 * Create a new generation record
 * Called when user submits a prompt in chat
 */
export async function createGeneration(
  projectId: string,
  userId: string,
  prompt: string,
  sessionId?: string
): Promise<GenerationDoc> {
  if (!isFirebaseConfigured() || !db) {
    // Demo fallback
    const id = 'gen-' + Math.random().toString(36).slice(2, 9)
    return {
      id,
      projectId,
      userId,
      sessionId,
      prompt,
      structuredPlan: null,
      status: 'pending',
      errorMessage: null,
      outputSceneId: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
  }

  const generationsCollection = collection(db, 'generations')
  const docRef = await addDoc(generationsCollection, {
    projectId,
    userId,
    sessionId: sessionId || null,
    prompt,
    structuredPlan: null,
    status: 'pending',
    errorMessage: null,
    outputSceneId: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  const docSnap = await getDoc(docRef)
  return { id: docRef.id, ...docSnap.data() } as GenerationDoc
}

/**
 * Update generation status (e.g., pending → running → complete)
 */
export async function updateGenerationStatus(
  generationId: string,
  status: GenerationDoc['status'],
  structuredPlan?: Record<string, unknown>
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  const genRef = doc(db, 'generations', generationId)
  await updateDoc(genRef, {
    status,
    ...(structuredPlan && { structuredPlan }),
    updatedAt: Timestamp.now(),
  })
}

/**
 * Update generation with output (after execution completes)
 */
export async function updateGenerationOutput(
  generationId: string,
  outputSceneId?: string,
  outputAssetUrl?: string,
  executionTimeMs?: number
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  const genRef = doc(db, 'generations', generationId)
  await updateDoc(genRef, {
    status: 'complete',
    ...(outputSceneId && { outputSceneId }),
    ...(outputAssetUrl && { outputAssetUrl }),
    ...(executionTimeMs && { executionTimeMs }),
    updatedAt: Timestamp.now(),
  })
}

/**
 * Update generation error state
 */
export async function updateGenerationError(
  generationId: string,
  errorMessage: string
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  const genRef = doc(db, 'generations', generationId)
  await updateDoc(genRef, {
    status: 'error',
    errorMessage,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Get all generations for a project
 */
export async function getProjectGenerations(projectId: string): Promise<GenerationDoc[]> {
  if (!isFirebaseConfigured() || !db) {
    return []
  }

  const generationsCollection = collection(db, 'generations')
  const q = query(
    generationsCollection,
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GenerationDoc[]
}

/**
 * Get a single generation by ID
 */
export async function getGeneration(generationId: string): Promise<GenerationDoc | null> {
  if (!isFirebaseConfigured() || !db) {
    return null
  }

  const genRef = doc(db, 'generations', generationId)
  const docSnap = await getDoc(genRef)

  if (!docSnap.exists()) {
    return null
  }

  return { id: docSnap.id, ...docSnap.data() } as GenerationDoc
}

/**
 * Subscribe to a generation's changes (real-time status updates)
 * Used for showing "Pending → Running → Complete" transitions
 */
export function subscribeToGeneration(
  generationId: string,
  callback: (generation: GenerationDoc) => void
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) {
    // Demo: never call callback
    return () => {}
  }

  const genRef = doc(db, 'generations', generationId)

  return onSnapshot(genRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()
      callback({ id: docSnap.id, ...data } as GenerationDoc)
    }
  })
}
