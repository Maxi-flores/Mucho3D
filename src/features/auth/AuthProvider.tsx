import { createContext, useState, useEffect, ReactNode } from 'react'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import {
  getFirebaseAuth,
} from '@/lib/firebase'
import { User } from '@/types'

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithMicrosoft: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// Convert Firebase User to app User type
const firebaseUserToAppUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
  avatar: firebaseUser.photoURL || undefined,
})

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const auth = getFirebaseAuth()

  // Initialize auth state from Firebase
  useEffect(() => {
    if (!auth) {
      // Firebase not configured, try localStorage demo
      const stored = localStorage.getItem('mucho3d-user')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setUser({
            id: parsed.id || 'demo-user',
            email: parsed.email || 'demo@example.com',
            name: parsed.name || 'Demo User',
          })
        } catch {
          // Invalid localStorage data, ignore
        }
      }
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUserToAppUser(firebaseUser))
        setError(null)
      } else {
        setUser(null)
      }
      setLoading(false)
    }, (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Auth state change error:', errorMessage)
      setError(errorMessage)
      setLoading(false)
    })

    return unsubscribe
  }, [auth])

  const signInWithEmail = async (email: string, password: string) => {
    setError(null)

    if (!auth) {
      // Demo mode: use localStorage
      const demoUser = {
        id: 'demo-' + Math.random().toString(36).slice(2, 9),
        email,
        name: email.split('@')[0],
      }
      localStorage.setItem('mucho3d-user', JSON.stringify(demoUser))
      setUser(demoUser)
      return
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      setUser(firebaseUserToAppUser(result.user))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      throw err
    }
  }

  const signInWithGoogle = async () => {
    setError(null)

    if (!auth) {
      // Demo mode: use localStorage
      const demoUser = {
        id: 'demo-' + Math.random().toString(36).slice(2, 9),
        email: 'demo@gmail.com',
        name: 'Demo User',
      }
      localStorage.setItem('mucho3d-user', JSON.stringify(demoUser))
      setUser(demoUser)
      return
    }

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      setUser(firebaseUserToAppUser(result.user))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      throw err
    }
  }

  const signInWithMicrosoft = async () => {
    setError(null)

    if (!auth) {
      // Demo mode: use localStorage
      const demoUser = {
        id: 'demo-' + Math.random().toString(36).slice(2, 9),
        email: 'demo@microsoft.com',
        name: 'Demo User',
      }
      localStorage.setItem('mucho3d-user', JSON.stringify(demoUser))
      setUser(demoUser)
      return
    }

    try {
      const provider = new OAuthProvider('microsoft.com')
      provider.setCustomParameters({
        prompt: 'consent',
      })
      const result = await signInWithPopup(auth, provider)
      setUser(firebaseUserToAppUser(result.user))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      throw err
    }
  }

  const signOut = async () => {
    setError(null)

    if (!auth) {
      // Demo mode: clear localStorage
      localStorage.removeItem('mucho3d-user')
      setUser(null)
      return
    }

    try {
      await firebaseSignOut(auth)
      setUser(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      throw err
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithEmail,
    signInWithGoogle,
    signInWithMicrosoft,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
