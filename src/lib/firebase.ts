import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return Boolean(import.meta.env.VITE_FIREBASE_API_KEY)
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

// Initialize Firebase only if configuration is available
if (isFirebaseConfigured()) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }

  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)

  // Set up Firestore persistence (browser only)
  if (typeof window !== 'undefined') {
    // Firestore defaults to offline persistence on the web
  }
}

// Export instances - may be null if Firebase not configured
export const getFirebaseApp = (): FirebaseApp | null => app
export const getFirebaseAuth = (): Auth | null => auth
export const getFirebaseDb = (): Firestore | null => db
export const getFirebaseStorage = (): FirebaseStorage | null => storage

// For convenient imports when Firebase is guaranteed to be configured
export const firebaseApp = app as FirebaseApp
export const firebaseAuth = auth as Auth
export const firebaseDb = db as Firestore
export const firebaseStorage = storage as FirebaseStorage
