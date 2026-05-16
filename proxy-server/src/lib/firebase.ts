import admin from 'firebase-admin'

// Initialize Firebase Admin SDK
// Expects GOOGLE_APPLICATION_CREDENTIALS env var to point to service account key JSON
// OR individual env vars: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL

const isConfigured = () => {
  return (
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    (process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL)
  )
}

let db: admin.firestore.Firestore | null = null

export function initializeFirebase() {
  if (!isConfigured()) {
    console.warn(
      '[Firebase] Configuration not found. Firestore operations will be unavailable.'
    )
    return null
  }

  try {
    if (!admin.apps.length) {
      // Initialize from credential if not already done
      if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        })
      } else {
        // Use GOOGLE_APPLICATION_CREDENTIALS env var
        admin.initializeApp()
      }
    }

    db = admin.firestore()
    console.log('[Firebase] Initialized successfully')
    return db
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error)
    return null
  }
}

export function getFirestore(): admin.firestore.Firestore {
  if (!db) {
    throw new Error('[Firebase] Firestore not initialized. Call initializeFirebase() first.')
  }
  return db
}

export function isFirebaseAvailable(): boolean {
  return db !== null
}

export const generationsCollection = 'generations'
export const projectsCollection = 'projects'
export const usersCollection = 'users'
