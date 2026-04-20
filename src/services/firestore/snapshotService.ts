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
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase'

const db = getFirebaseDb()

export interface SnapshotDoc {
  id: string
  projectId: string
  generationId?: string
  sceneId?: string
  userId: string
  filename: string
  base64Data?: string
  fileUrl?: string
  filePath?: string
  format: string
  width: number
  height: number
  size: number
  timestamp: number
  metadata?: {
    tool?: string
    objectId?: string
    objectType?: string
    source?: string
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

/**
 * Save a snapshot to Firestore
 * Called by Blender Worker after capturing a snapshot
 */
export async function saveSnapshot(snapshotData: {
  projectId: string
  generationId?: string
  sceneId?: string
  userId: string
  filename: string
  base64Data?: string
  fileUrl?: string
  filePath?: string
  format: string
  width: number
  height: number
  size: number
  timestamp: number
  metadata?: {
    tool?: string
    objectId?: string
    objectType?: string
    source?: string
  }
}): Promise<SnapshotDoc> {
  if (!isFirebaseConfigured() || !db) {
    // Demo fallback
    const id = 'snapshot-' + Math.random().toString(36).slice(2, 9)
    return {
      id,
      ...snapshotData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
  }

  const snapshotsCollection = collection(db, 'snapshots')
  const docRef = await addDoc(snapshotsCollection, {
    ...snapshotData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  const docSnap = await getDoc(docRef)
  return { id: docRef.id, ...docSnap.data() } as SnapshotDoc
}

/**
 * Get all snapshots for a project
 */
export async function getProjectSnapshots(projectId: string): Promise<SnapshotDoc[]> {
  if (!isFirebaseConfigured() || !db) {
    return []
  }

  const snapshotsCollection = collection(db, 'snapshots')
  const q = query(
    snapshotsCollection,
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SnapshotDoc[]
}

/**
 * Get snapshots for a specific generation
 */
export async function getGenerationSnapshots(generationId: string): Promise<SnapshotDoc[]> {
  if (!isFirebaseConfigured() || !db) {
    return []
  }

  const snapshotsCollection = collection(db, 'snapshots')
  const q = query(
    snapshotsCollection,
    where('generationId', '==', generationId),
    orderBy('createdAt', 'desc')
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SnapshotDoc[]
}

/**
 * Get snapshots for a specific scene
 */
export async function getSceneSnapshots(sceneId: string): Promise<SnapshotDoc[]> {
  if (!isFirebaseConfigured() || !db) {
    return []
  }

  const snapshotsCollection = collection(db, 'snapshots')
  const q = query(
    snapshotsCollection,
    where('sceneId', '==', sceneId),
    orderBy('createdAt', 'desc')
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SnapshotDoc[]
}

/**
 * Get a single snapshot by ID
 */
export async function getSnapshot(snapshotId: string): Promise<SnapshotDoc | null> {
  if (!isFirebaseConfigured() || !db) {
    return null
  }

  const snapshotRef = doc(db, 'snapshots', snapshotId)
  const docSnap = await getDoc(snapshotRef)

  if (!docSnap.exists()) {
    return null
  }

  return { id: docSnap.id, ...docSnap.data() } as SnapshotDoc
}

/**
 * Update snapshot metadata
 */
export async function updateSnapshot(
  snapshotId: string,
  updates: Partial<Omit<SnapshotDoc, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  const snapshotRef = doc(db, 'snapshots', snapshotId)
  await updateDoc(snapshotRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Subscribe to project snapshots (real-time updates)
 * Used for showing new snapshots as they are generated
 */
export function subscribeToProjectSnapshots(
  projectId: string,
  callback: (snapshots: SnapshotDoc[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured() || !db) {
    // Demo: never call callback
    return () => {}
  }

  const snapshotsCollection = collection(db, 'snapshots')
  const q = query(
    snapshotsCollection,
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (querySnapshot) => {
    const snapshots = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SnapshotDoc[]
    callback(snapshots)
  })
}

/**
 * Delete a snapshot
 */
export async function deleteSnapshot(snapshotId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  const snapshotRef = doc(db, 'snapshots', snapshotId)
  await updateDoc(snapshotRef, {
    deleted: true,
    updatedAt: Timestamp.now(),
  })
}
