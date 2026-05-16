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
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { getFirebaseDb, getFirebaseStorage, isFirebaseConfigured } from '@/lib/firebase'

const db = getFirebaseDb()
const storage = getFirebaseStorage()

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
 * Upload a snapshot image to Firebase Storage
 * @param base64Data - Base64 encoded image data (without data:image prefix)
 * @param filename - Name of the file
 * @param projectId - Project ID for organizing storage
 * @returns Download URL of the uploaded image
 */
async function uploadSnapshotToStorage(
  base64Data: string,
  filename: string,
  projectId: string
): Promise<string> {
  if (!isFirebaseConfigured() || !storage) {
    throw new Error('Firebase Storage is not configured')
  }

  // Create a reference to the storage location
  const storageRef = ref(storage, `snapshots/${projectId}/${filename}`)

  // Upload the base64 string to Firebase Storage
  // uploadString automatically handles the data:image/png;base64, prefix
  const snapshot = await uploadString(storageRef, base64Data, 'base64', {
    contentType: 'image/png',
  })

  // Get the download URL
  const downloadURL = await getDownloadURL(snapshot.ref)
  return downloadURL
}

/**
 * Save a snapshot to Firestore
 * Called by Blender Worker after capturing a snapshot
 * If base64Data is provided, uploads to Firebase Storage and saves downloadURL
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

  let downloadURL: string | undefined = snapshotData.fileUrl

  // If base64Data is provided and no fileUrl exists, upload to Storage
  if (snapshotData.base64Data && !snapshotData.fileUrl) {
    try {
      downloadURL = await uploadSnapshotToStorage(
        snapshotData.base64Data,
        snapshotData.filename,
        snapshotData.projectId
      )
    } catch (error) {
      console.error('Failed to upload snapshot to Storage:', error)
      // Continue saving to Firestore even if Storage upload fails
      // Fall back to base64Data if needed
    }
  }

  // Prepare the document data - exclude base64Data to save Firestore costs
  const docData = {
    projectId: snapshotData.projectId,
    generationId: snapshotData.generationId,
    sceneId: snapshotData.sceneId,
    userId: snapshotData.userId,
    filename: snapshotData.filename,
    fileUrl: downloadURL,
    filePath: snapshotData.filePath,
    format: snapshotData.format,
    width: snapshotData.width,
    height: snapshotData.height,
    size: snapshotData.size,
    timestamp: snapshotData.timestamp,
    metadata: snapshotData.metadata,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }

  const snapshotsCollection = collection(db, 'snapshots')
  const docRef = await addDoc(snapshotsCollection, docData)

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
