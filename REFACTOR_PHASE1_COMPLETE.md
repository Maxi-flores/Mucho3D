# Mucho3D Root Refactor - Phase 1: Foundation Complete ✅

## What's Been Completed (Phase 1)

### ✅ Critical Routing Restructure
- New router hierarchy implemented
- Routes properly organized (public → auth → protected app)
- Legacy redirects in place for backward compatibility
- Lazy loading set up for route components

**File:** `src/router.tsx`

**New Route Structure:**
```
/                    → Public landing page
/auth/signin         → Sign-in page
/auth/callback       → OAuth callback (placeholder)
/app/*               → Protected app shell (requires auth)
/app/dashboard       → Main workspace dashboard
/app/studio          → 3D editor
/app/projects        → Project list
/app/projects/:id    → Project detail
/app/settings        → User settings
/health              → Health check endpoint
/*                   → 404 Not Found
```

### ✅ Authentication Guard Infrastructure
- `ProtectedRoute.tsx` component created
  - Checks auth state
  - Redirects unauthenticated users to signin
  - Uses localStorage for demo auth (will integrate Firebase)
  - Shows loading state during auth check

- `AuthLoadingScreen.tsx` component created
  - Smooth loading UI during auth verification
  - Uses Mucho3D design system

### ✅ Public Landing Page Restored
- `Home.tsx` completely refactored
  - Restored proper product messaging (AI-assisted 3D generation, NOT webstore)
  - New hero: "Describe Your Ideas. Generate 3D."
  - Removed "shop" references
  - Added "How It Works" section (Chat → Plan → Execute → Export)
  - Feature list now focuses on AI, workspace, determinism, revision, privacy, local-first
  - Smart CTA: shows different buttons for authenticated vs. unauthenticated users
  - Positioned correctly as public entry point (not dashboard replacement)

### ✅ New App Page Structure Created
All created as functional stubs ready for integration:

1. **`src/pages/auth/SignIn.tsx`**
   - Email/password form
   - OAuth placeholder buttons (Google, Microsoft)
   - Demo sign-in functionality using localStorage
   - Routes to `/app/dashboard` on success
   - TODO: Integrate with Firebase Auth

2. **`src/pages/app/Projects.tsx`**
   - Project list view
   - Search placeholder
   - "New Project" button
   - Project cards with metadata
   - TODO: Connect to Firestore `useProjects()` hook

3. **`src/pages/app/ProjectDetail.tsx`**
   - Project workspace shell
   - Tabs for Overview, Scenes, Generations, Assets, Logs
   - TODO: Connect to Firestore project data
   - TODO: Integrate with chat generation interface

4. **`src/pages/app/Settings.tsx`**
   - User account information
   - Integration settings (Ollama, Blender status)
   - User preferences
   - Sign-out button
   - TODO: Connect to Firebase user profile

### ✅ Removed Webstore Framing
- Routing removes `/shop` (redirects to home)
- No new shop pages created
- Home page messaging fixed to remove shop references

---

## What Remains (Phase 2-4)

### Phase 2: Page Migration & Refactoring

**Files to migrate and refactor:**

1. **Move and Refactor Dashboard**
   - Source: `src/pages/Dashboard.tsx` → `src/pages/app/Dashboard.tsx`
   - Change from demo/store analytics to project analytics
   - Show: recent projects, active generations, latest exports
   - Remove: store products, shopping analytics
   - Add: "New Project" CTA, generation status, execution jobs

2. **Move and Refactor Studio**
   - Source: `src/pages/Studio.tsx` → `src/pages/app/Studio.tsx`
   - Keep: 3D viewport, scene controls, inspector
   - Add: Project context (which project is this for?)
   - Add: Chat integration for AI generation
   - Connect: "Generate with AI" button opens chat
   - Refactor: Remove shop references from topbar navigation

3. **Create AppLayout Component**
   - Wraps all `/app/*` routes
   - Contains:
     - Top navigation with user menu
     - Sidebar with project/app navigation
     - Breadcrumbs
     - Content area
   - Replace current DashboardLayout usage

4. **Update Navigation Structure**
   - Remove shop link
   - Add projects link
   - Add settings link
   - Add sign-out button

### Phase 3: Authentication & Data Integration

**1. Firebase Configuration**
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // ... rest of config
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

**2. Auth Provider**
```typescript
// providers/AuthProvider.tsx
import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

**3. Update ProtectedRoute to use Firebase**
```typescript
// components/ProtectedRoute.tsx
export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <AuthLoadingScreen />
  if (!user) return <Navigate to="/auth/signin" replace />

  return <Outlet />
}
```

**4. Create Firestore Service Layer**
```typescript
// services/firestore.service.ts
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const firestoreService = {
  async getUser(uid: string) {
    const doc = await getDoc(doc(db, 'users', uid))
    return doc.data()
  },

  async getUserProjects(uid: string) {
    const q = query(collection(db, 'projects'), where('userId', '==', uid))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data())
  },

  async createProject(uid: string, projectData: any) {
    // ... create project
  },

  // ... etc
}
```

**5. Create Data Hooks**
```typescript
// hooks/useProjects.ts
import { useAuth } from '@/features/auth'
import { firestoreService } from '@/services/firestore.service'
import { useEffect, useState } from 'react'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    
    const load = async () => {
      try {
        const data = await firestoreService.getUserProjects(user.uid)
        setProjects(data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  return { projects, loading, error }
}
```

### Phase 4: AI Pipeline Foundation

**1. Ollama Integration Service**
```typescript
// services/ollama.service.ts
const OLLAMA_BASE_URL = process.env.REACT_APP_OLLAMA_URL || 'http://localhost:11434'

export const ollamaService = {
  async checkAvailability() {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  },

  async requestStructuredPlan(prompt: string) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama2', // or other available model
        prompt: `Generate a structured 3D scene plan for: ${prompt}. Return valid JSON.`,
        stream: false,
      }),
    })
    const data = await response.json()
    return JSON.parse(data.response)
  },
}
```

**2. Orchestrator Service**
```typescript
// services/orchestrator.service.ts
import { ollamaService } from './ollama.service'
import { GenerationPlanSchema } from '@/types/schema'

export const orchestratorService = {
  async generateScene(prompt: string) {
    // 1. Request plan from Ollama
    const plan = await ollamaService.requestStructuredPlan(prompt)

    // 2. Validate against schema
    const validation = GenerationPlanSchema.safeParse(plan)
    if (!validation.success) {
      throw new Error(`Invalid plan: ${validation.error}`)
    }

    // 3. Execute plan (would call Blender here)
    // return executionResult
  },
}
```

**3. Schema Validation (Zod)**
```typescript
// types/schema.ts
import { z } from 'zod'

export const GenerationPlanSchema = z.object({
  objects: z.array(z.object({
    type: z.enum(['box', 'sphere', 'cylinder', 'cone', 'torus']),
    position: z.tuple([z.number(), z.number(), z.number()]),
    scale: z.tuple([z.number(), z.number(), z.number()]),
    rotation: z.tuple([z.number(), z.number(), z.number()]),
    color: z.string().regex(/^#[0-9A-F]{6}$/i),
  })),
  operations: z.array(z.object({
    type: z.enum(['create', 'modify', 'delete', 'group']),
    targetId: z.string().optional(),
    params: z.record(z.any()),
  })),
  metadata: z.object({
    intent: z.string(),
    confidence: z.number().min(0).max(1),
  }),
})
```

**4. Operational Chat Component**
```typescript
// features/chat/GenerationChat.tsx
import { useState } from 'react'
import { orchestratorService } from '@/services/orchestrator.service'

export function GenerationChat() {
  const [messages, setMessages] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleSubmitPrompt(prompt: string) {
    setMessages(prev => [...prev, { role: 'user', content: prompt }])
    setIsGenerating(true)

    try {
      // Show planning status
      setMessages(prev => [...prev, { role: 'assistant', content: 'Planning...' }])

      // Get structured plan
      const result = await orchestratorService.generateScene(prompt)

      // Show execution result
      setMessages(prev => [...prev, { role: 'assistant', content: result.summary }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }])
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    // Chat UI here
  )
}
```

---

## Implementation Order (Recommended)

### Week 1: Pages & Routing (2-3 days)
- [ ] Move Dashboard.tsx to `src/pages/app/Dashboard.tsx` and refactor
- [ ] Move Studio.tsx to `src/pages/app/Studio.tsx` and refactor
- [ ] Create AppLayout component
- [ ] Update navigation components
- [ ] Test all /app/* routes work

### Week 1-2: Authentication (2-3 days)
- [ ] Set up Firebase project
- [ ] Create firebase.ts config
- [ ] Create AuthProvider
- [ ] Update ProtectedRoute to use Firebase
- [ ] Test auth flow end-to-end

### Week 2: Data Model (3-4 days)
- [ ] Create Firestore collections (users, projects, generations, scenes, assets)
- [ ] Create firestore.service.ts
- [ ] Create data hooks (useProjects, useProject, useGenerations)
- [ ] Update Projects.tsx to use real data
- [ ] Update ProjectDetail.tsx to use real data
- [ ] Test Firestore integration

### Week 3: AI Pipeline Foundation (4-5 days)
- [ ] Create ollama.service.ts
- [ ] Create orchestrator.service.ts
- [ ] Create schema validation with Zod
- [ ] Create GenerationChat component
- [ ] Integrate chat into Studio page
- [ ] Test end-to-end: prompt → plan → execution

### Week 4: Polish & Integration (2-3 days)
- [ ] Remove all shop/webstore code
- [ ] Update constants.ts (remove products)
- [ ] Clean up unused stores (shopStore, aiStore)
- [ ] Test all flows
- [ ] Documentation

---

## Critical Files Still Needing Work

### Remove (Webstore):
- `src/pages/Shop.tsx` ❌
- `src/store/shopStore.ts` ❌
- `src/components/shop/*` ❌
- All product-related code

### Move/Refactor:
- `src/pages/Dashboard.tsx` → `src/pages/app/Dashboard.tsx`
- `src/pages/Studio.tsx` → `src/pages/app/Studio.tsx`
- `src/components/layout/DashboardLayout.tsx` → Create `AppLayout.tsx`

### Create New:
- `src/features/auth/AuthProvider.tsx`
- `src/services/firebase.ts`
- `src/services/firestore.service.ts`
- `src/services/ollama.service.ts`
- `src/services/orchestrator.service.ts`
- `src/features/chat/GenerationChat.tsx`
- `src/hooks/useProjects.ts`
- `src/hooks/useProject.ts`
- `src/hooks/useGenerations.ts`

---

## Environment Variables Needed

```env
# Firebase
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Local Services
REACT_APP_OLLAMA_URL=http://localhost:11434
REACT_APP_BLENDER_SOCKET=http://localhost:7860
```

---

## Testing Checklist

- [ ] All routes load without 404 errors
- [ ] Unauthenticated users redirected to signin
- [ ] Authenticated users can access /app/* routes
- [ ] Sign-in flow works
- [ ] Sign-out clears session
- [ ] Projects load from Firestore
- [ ] Project detail page loads project data
- [ ] Chat component loads in Studio
- [ ] Ollama connection status shows
- [ ] Generation prompt → plan → execution flow works
- [ ] No console errors
- [ ] No shop/webstore code remaining

---

## Success Criteria

When Phase 1-4 complete:
- ✅ Public landing page restored and properly positioned
- ✅ Proper routing hierarchy with auth guards
- ✅ Firebase auth + Firestore integration
- ✅ Real project data persistence
- ✅ AI pipeline foundation (Ollama, schema, orchestrator)
- ✅ Operational chat in studio
- ✅ All webstore code removed
- ✅ Architecture supports true end-to-end workflow

---

## Next Steps

1. **Start Phase 2:** Move and refactor Dashboard and Studio
2. **Run the app:** `npm run dev`
3. **Test routing:** Navigate to `/auth/signin` and `/app/dashboard`
4. **Proceed to Phase 3:** Firebase setup and auth integration

The foundation is set. The remaining work is systematic integration and testing.
