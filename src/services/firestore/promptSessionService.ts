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
import { PromptSessionDoc, StoredMessage } from '@/types/firebase'

const db = getFirebaseDb()

/**
 * Create a new prompt session for a project
 */
export async function createSession(
  projectId: string,
  userId: string
): Promise<PromptSessionDoc> {
  if (!isFirebaseConfigured() || !db) {
    // Demo fallback
    const id = 'session-' + Math.random().toString(36).slice(2, 9)
    return {
      id,
      projectId,
      userId,
      messages: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
  }

  const sessionsCollection = collection(db, 'promptSessions')
  const docRef = await addDoc(sessionsCollection, {
    projectId,
    userId,
    messages: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  const docSnap = await getDoc(docRef)
  return { id: docRef.id, ...docSnap.data() } as PromptSessionDoc
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<PromptSessionDoc | null> {
  if (!isFirebaseConfigured() || !db) {
    return null
  }

  const sessionRef = doc(db, 'promptSessions', sessionId)
  const docSnap = await getDoc(sessionRef)

  if (!docSnap.exists()) {
    return null
  }

  return { id: docSnap.id, ...docSnap.data() } as PromptSessionDoc
}

/**
 * Append a message to a session
 */
export async function appendMessage(
  sessionId: string,
  message: StoredMessage
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  const sessionRef = doc(db, 'promptSessions', sessionId)
  await updateDoc(sessionRef, {
    messages: arrayUnion(message),
    updatedAt: Timestamp.now(),
  })
}

/**
 * Create a session and add initial message
 */
export async function createSessionWithMessage(
  projectId: string,
  userId: string,
  initialMessage: StoredMessage
): Promise<PromptSessionDoc> {
  const session = await createSession(projectId, userId)
  await appendMessage(session.id, initialMessage)
  return session
}
