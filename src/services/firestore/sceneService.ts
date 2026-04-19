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
  limit,
  Timestamp,
} from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase'
import { SceneDoc, SceneSettings } from '@/types/firebase'
import { SceneObject, CameraState } from '@/types'

const db = getFirebaseDb()

/**
 * Save or create a scene for a project
 */
export async function saveScene(
  projectId: string,
  userId: string,
  objects: SceneObject[],
  camera: CameraState,
  settings: SceneSettings
): Promise<SceneDoc> {
  if (!isFirebaseConfigured() || !db) {
    // Demo fallback
    const id = 'scene-' + Math.random().toString(36).slice(2, 9)
    return {
      id,
      projectId,
      userId,
      version: 1,
      objects,
      camera,
      settings,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
  }

  // Get latest version of this project's scene
  const existing = await getProjectScene(projectId)

  if (existing) {
    // Update existing scene
    const sceneRef = doc(db, 'scenes', existing.id)
    await updateDoc(sceneRef, {
      objects,
      camera,
      settings,
      version: existing.version + 1,
      updatedAt: Timestamp.now(),
    })

    const docSnap = await getDoc(sceneRef)
    return { id: existing.id, ...docSnap.data() } as SceneDoc
  } else {
    // Create new scene
    const scenesCollection = collection(db, 'scenes')
    const docRef = await addDoc(scenesCollection, {
      projectId,
      userId,
      version: 1,
      objects,
      camera,
      settings,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    const docSnap = await getDoc(docRef)
    return { id: docRef.id, ...docSnap.data() } as SceneDoc
  }
}

/**
 * Get the latest scene for a project
 */
export async function getProjectScene(projectId: string): Promise<SceneDoc | null> {
  if (!isFirebaseConfigured() || !db) {
    return null
  }

  const scenesCollection = collection(db, 'scenes')
  const q = query(
    scenesCollection,
    where('projectId', '==', projectId),
    orderBy('updatedAt', 'desc'),
    limit(1)
  )

  const querySnapshot = await getDocs(q)

  if (querySnapshot.empty) {
    return null
  }

  const doc = querySnapshot.docs[0]
  return { id: doc.id, ...doc.data() } as SceneDoc
}

/**
 * Get all versions of a scene (for history)
 */
export async function getSceneVersions(projectId: string): Promise<SceneDoc[]> {
  if (!isFirebaseConfigured() || !db) {
    return []
  }

  const scenesCollection = collection(db, 'scenes')
  const q = query(
    scenesCollection,
    where('projectId', '==', projectId),
    orderBy('version', 'desc')
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SceneDoc[]
}

/**
 * Update a specific scene version
 */
export async function updateScene(
  sceneId: string,
  objects: SceneObject[],
  camera: CameraState,
  settings?: SceneSettings
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    return
  }

  const sceneRef = doc(db, 'scenes', sceneId)
  await updateDoc(sceneRef, {
    objects,
    camera,
    ...(settings && { settings }),
    updatedAt: Timestamp.now(),
  })
}
