import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase'
import { User } from '@/types'
import { UserDoc } from '@/types/firebase'

const db = getFirebaseDb()

const demoUserDocs = new Map<string, UserDoc>()

const defaultPreferences: NonNullable<UserDoc['preferences']> = {
  darkMode: true,
  autoSaveProjects: true,
}

export async function upsertUserProfile(user: User): Promise<UserDoc> {
  const now = Timestamp.now()

  if (!isFirebaseConfigured() || !db) {
    const existing = demoUserDocs.get(user.id)
    const profile: UserDoc = {
      uid: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || null,
      preferences: existing?.preferences || defaultPreferences,
      integrations: existing?.integrations || { mcpBridgeEnabled: false },
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }
    demoUserDocs.set(user.id, profile)
    return profile
  }

  const userRef = doc(db, 'users', user.id)
  const existing = await getDoc(userRef)
  const profile: UserDoc = {
    uid: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null,
    preferences: (existing.data() as UserDoc | undefined)?.preferences || defaultPreferences,
    integrations: (existing.data() as UserDoc | undefined)?.integrations || {
      mcpBridgeEnabled: false,
    },
    createdAt: existing.exists()
      ? ((existing.data() as UserDoc).createdAt || now)
      : now,
    updatedAt: now,
  }

  await setDoc(userRef, profile, { merge: true })
  return profile
}

export async function getUserProfile(userId: string): Promise<UserDoc | null> {
  if (!isFirebaseConfigured() || !db) {
    return demoUserDocs.get(userId) || null
  }

  const userRef = doc(db, 'users', userId)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return null
  return userSnap.data() as UserDoc
}

export async function updateUserProfile(
  userId: string,
  data: Partial<Omit<UserDoc, 'uid' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    const existing = demoUserDocs.get(userId)
    if (!existing) return
    demoUserDocs.set(userId, {
      ...existing,
      ...data,
      preferences: { ...defaultPreferences, ...existing.preferences, ...data.preferences },
      integrations: { ...existing.integrations, ...data.integrations },
      updatedAt: Timestamp.now(),
    })
    return
  }

  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}
