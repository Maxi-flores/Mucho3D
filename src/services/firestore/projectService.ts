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
} from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase'
import { ProjectDoc } from '@/types/firebase'
import { StudioNode, StudioViewport } from '@/types/studio'

const db = getFirebaseDb()
const demoProjects = new Map<string, ProjectDoc>()

const defaultStudioViewport: StudioViewport = { x: 0, y: 0, zoom: 1 }

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
    const project: ProjectDoc = {
      id,
      userId,
      name,
      description: description || '',
      status: 'active',
      studioNodes: [],
      studioViewport: defaultStudioViewport,
      projectTags: [],
      targetFormat: 'glb',
      complexityEstimate: 'low',
      referenceLinks: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    demoProjects.set(id, project)
    return project
  }

  const projectsCollection = collection(db, 'projects')
  const docRef = await addDoc(projectsCollection, {
    userId,
    name,
    description: description || '',
    status: 'active',
    studioNodes: [],
    studioViewport: defaultStudioViewport,
    projectTags: [],
    targetFormat: 'glb',
    complexityEstimate: 'low',
    referenceLinks: [],
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
    return Array.from(demoProjects.values())
      .filter((project) => project.userId === userId && project.status === 'active')
      .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis())
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
    return demoProjects.get(projectId) || null
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
    const existing = demoProjects.get(projectId)
    if (existing) {
      demoProjects.set(projectId, {
        ...existing,
        ...data,
        updatedAt: Timestamp.now(),
      })
    }
    return
  }

  const projectRef = doc(db, 'projects', projectId)
  await updateDoc(projectRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

/**
 * Save Project Studio node graph state
 */
export async function saveProjectStudio(
  projectId: string,
  studioNodes: StudioNode[],
  studioViewport: StudioViewport
): Promise<void> {
  await updateProject(projectId, {
    studioNodes,
    studioViewport,
  })
}

/**
 * Archive (soft delete) a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    const existing = demoProjects.get(projectId)
    if (existing) {
      demoProjects.set(projectId, {
        ...existing,
        status: 'archived',
        updatedAt: Timestamp.now(),
      })
    }
    return
  }

  const projectRef = doc(db, 'projects', projectId)
  await updateDoc(projectRef, {
    status: 'archived',
    updatedAt: Timestamp.now(),
  })
}
