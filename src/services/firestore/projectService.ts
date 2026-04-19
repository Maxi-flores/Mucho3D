import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase'
import { ProjectDoc } from '@/types/firebase'

const db = getFirebaseDb()

/**
 * Create a new project
 */
export async function createProject(
  userId: string,
  name: string,
  description?: string
): Promise<ProjectDoc> {
  if (!isFirebaseConfigured() || !db) {
    // Demo fallback: return mock project
    const id = 'proj-' + Math.random().toString(36).slice(2, 9)
    return {
      id,
      userId,
      name,
      description: description || '',
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
  }

  const projectsCollection = collection(db, 'projects')
  const docRef = await addDoc(projectsCollection, {
    userId,
    name,
    description: description || '',
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })

  const docSnap = await getDoc(docRef)
  return { id: docRef.id, ...docSnap.data() } as ProjectDoc
}

/**
 * Get all projects for a user
 */
export async function getUserProjects(userId: string): Promise<ProjectDoc[]> {
  if (!isFirebaseConfigured() || !db) {
    // Demo fallback: return empty array
    return []
  }

  const projectsCollection = collection(db, 'projects')
  const q = query(
    projectsCollection,
    where('userId', '==', userId),
    where('status', '==', 'active'),
    orderBy('updatedAt', 'desc')
  )

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ProjectDoc[]
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string): Promise<ProjectDoc | null> {
  if (!isFirebaseConfigured() || !db) {
    return null
  }

  const projectRef = doc(db, 'projects', projectId)
  const docSnap = await getDoc(projectRef)

  if (!docSnap.exists()) {
    return null
  }

  return { id: docSnap.id, ...docSnap.data() } as ProjectDoc
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  data: Partial<Omit<ProjectDoc, 'id' | 'createdAt'>>
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    // Demo fallback: no-op
    return
  }

  const projectRef = doc(db, 'projects', projectId)
  await updateDoc(projectRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Archive (soft delete) a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    // Demo fallback: no-op
    return
  }

  const projectRef = doc(db, 'projects', projectId)
  await updateDoc(projectRef, {
    status: 'archived',
    updatedAt: Timestamp.now(),
  })
}
