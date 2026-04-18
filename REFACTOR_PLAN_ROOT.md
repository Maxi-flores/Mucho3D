# Mucho3D Root-Level Refactor Plan

## CRITICAL PRODUCT CORRECTION

This document outlines the systematic refactor to restore Mucho3D to its proper direction: **AI-assisted 3D project generation platform**, not a 3D webstore or dashboard-only app.

---

## Phase 1: Foundation Architecture (CRITICAL)

### 1.1 Routing Restructure
```
Current (WRONG):
/              → Home (public)
/dashboard     → Dashboard (should be app-level)
/shop          → Shop (REMOVE - wrong product)
/studio        → Studio (should be protected)

Target (CORRECT):
/                    → Home (public landing)
/auth/signin         → Sign-in page
/auth/callback       → OAuth callback
/app                 → Protected app shell (requires auth)
/app/dashboard       → Project dashboard/cockpit
/app/studio          → 3D workspace
/app/projects        → Project list
/app/projects/:id    → Project detail
/app/settings        → User settings
/*                   → 404 (NotFound)
```

### 1.2 Layout Hierarchy
```
PublicLayout
  - Header with logo, sign-in button
  - Content area
  - Footer
  - No authentication required

AuthLayout
  - Sign-in form
  - OAuth buttons
  - Centered, minimal UI

AppLayout
  - Top nav with user menu
  - Sidebar with nav
  - Content area
  - Requires authenticated session
  - Route guards
```

### 1.3 Authentication Architecture
```
Requirement: Firebase + SSO support

Components to create:
  - AuthProvider (context)
  - useAuth() hook
  - ProtectedRoute component
  - AuthGuard middleware
  - Session persistence
  - Loading states

Flow:
  1. App boots
  2. AuthProvider checks Firebase session
  3. If authenticated: show app
  4. If not: show landing/sign-in
  5. Protect /app/* routes
  6. Handle redirects intelligently
```

---

## Phase 2: Remove Misaligned Systems

### 2.1 Shop/Webstore Removal
DELETE:
- `src/pages/Shop.tsx`
- `src/store/shopStore.ts`
- `src/components/shop/*`
- All product catalog logic
- Shopping cart logic
- Ecommerce copy

KEEP (reframe):
- Dashboard analytics patterns (→ project analytics)
- Filtering/search patterns (→ project search)
- Card/grid patterns (→ project cards)

### 2.2 Remove "Integrated Shop" Messaging
UPDATE:
- Home page hero (remove shop reference)
- Feature list (remove shop, replace with project focus)
- Navigation (remove shop link)
- Dashboard (remove store analytics)

---

## Phase 3: Restore Public Front Page

### 3.1 Update Home Page
```
Current messaging (WRONG):
  "3D Printing Engineering OS"
  "Modeling tools, AI assistance, and marketplace"

Target messaging (CORRECT):
  "AI-Assisted 3D Generation Platform"
  "Describe your ideas. Generate 3D models instantly."
  "Powered by AI and professional 3D tools"

Features to highlight:
  1. AI-Driven Generation
     - Prompt-based 3D scene creation
     - Chat-driven workflow
     
  2. Professional Studio
     - Real-time 3D editing
     - Scene management
     
  3. Project Workspace
     - Version history
     - Asset library
     - Export & share
     
  4. Smart Automation
     - Structured generation planning
     - Deterministic execution
```

### 3.2 Front Page CTAs
- Primary: "Get Started" → /auth/signin (for new users) or /app/dashboard (for authenticated)
- Secondary: "Open Studio" → /app/studio (authenticated only)
- Header Button: Sign-in / User menu (authenticated)

---

## Phase 4: Data Model - Replace Local Demo with Real Persistence

### 4.1 Firestore Collections
```typescript
// users
{
  id: string (Firebase UID)
  email: string
  name: string
  avatar?: string
  createdAt: timestamp
  lastLoginAt: timestamp
  preferences: {
    theme: 'dark' | 'light'
    defaultWorkspace: string
  }
}

// workspaces (initially 1 per user)
{
  id: string
  userId: string
  name: string
  description?: string
  createdAt: timestamp
  updatedAt: timestamp
}

// projects
{
  id: string
  workspaceId: string
  userId: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  createdAt: timestamp
  updatedAt: timestamp
  metadata: {
    thumbnailUrl?: string
    tags: string[]
    version: number
  }
}

// scenes
{
  id: string
  projectId: string
  userId: string
  name: string
  data: { /* three.js scene data */ }
  status: 'draft' | 'finalized'
  createdAt: timestamp
  updatedAt: timestamp
}

// generations
{
  id: string
  projectId: string
  userId: string
  sceneId?: string
  prompt: string
  plan: { /* structured generation plan */ }
  status: 'pending' | 'executing' | 'success' | 'failed'
  result?: { /* generated scene data */ }
  logs: string[]
  executedAt?: timestamp
  createdAt: timestamp
}

// assets
{
  id: string
  projectId: string
  userId: string
  name: string
  type: 'model' | 'texture' | 'export'
  url: string (Firebase Storage)
  metadata: {}
  createdAt: timestamp
}

// promptSessions
{
  id: string
  projectId: string
  userId: string
  messages: { role: 'user' | 'assistant', content: string }[]
  contextScene?: string
  status: 'active' | 'completed'
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 4.2 Firestore Security Rules (Basic)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId
    }
    match /projects/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId
    }
    match /generations/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId
    }
    // ... similar for other collections
  }
}
```

---

## Phase 5: Core AI Pipeline Foundation

### 5.1 Ollama Integration
```typescript
// services/ollama.service.ts
- detectOllamaAvailability()
- requestStructuredPlan(prompt: string) → Promise<GenerationPlan>
- interpretUserIntent(prompt: string) → Promise<Intent>
- generateRevisionPatch(feedback: string, currentPlan: GenerationPlan) → Promise<Patch>

Flow:
  User prompt → Ollama → Structured JSON plan → Validation → Blender execution
```

### 5.2 Orchestration Layer
```typescript
// services/orchestrator.service.ts
- normalizePrompt(rawPrompt: string) → NormalizedPrompt
- requestPlan(prompt: NormalizedPrompt) → Promise<GenerationPlan>
- validatePlan(plan: GenerationPlan) → ValidationResult
- executePlan(plan: GenerationPlan) → Promise<ExecutionResult>
- pollExecutionStatus(generationId: string) → Promise<ExecutionStatus>

Responsibility:
  - Call Ollama for planning
  - Validate output against schema
  - Route to Blender execution
  - Track status and logs
```

### 5.3 Schema & Validation
```typescript
// packages/schema/generation.schema.ts
Using Zod:

const SceneObjectSchema = z.object({
  type: z.enum(['box', 'sphere', 'cylinder', 'cone', 'torus']),
  position: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  material?: z.string(),
})

const GenerationPlanSchema = z.object({
  objects: z.array(SceneObjectSchema),
  operations: z.array(z.object({
    type: z.enum(['create', 'modify', 'delete', 'group']),
    targetId?: z.string(),
    params: z.record(z.any()),
  })),
  metadata: z.object({
    intent: z.string(),
    confidence: z.number().min(0).max(1),
  }),
})
```

### 5.4 Blender Execution (Scaffolded)
```
/apps/blender-addon or /apps/blender-worker

For this phase:
- Create basic Blender execution pipeline structure
- Define safe operation set (create, scale, rotate, color, position)
- NO arbitrary model-generated Python execution
- Deterministic, typed operations only
- Return logs/results to orchestrator
```

---

## Phase 6: Chat-Driven Generation Interface

### 6.1 Operational Chat
The chat is NOT decorative. It becomes the generation interface.

```typescript
// components/ai/GenerationChat.tsx

Features:
- User types prompt
- Chat shows:
  * "Planning..." status
  * "Validating..." status
  * Structured plan preview (if valid)
  * "Executing..." status with logs
  * Result or error
  * Option to revise/regenerate

Capabilities:
- Create new scene from scratch
- Revise existing scene
- Show execution logs
- Attach result to project
- Save conversation
```

### 6.2 Integration Points
```
Studio (3D editor) ↔ Chat Interface
  - User edits 3D scene manually
  - OR uses chat to guide changes
  - Chat can read current scene context
  - Chat results update studio viewport
  
Projects Page ↔ Chat
  - Start new project with generation prompt
  - Chat shows project-specific context
  - Generations attach to project
  
Dashboard ↔ Chat
  - Dashboard shows recent generations
  - Dashboard shows active execution jobs
```

---

## Phase 7: Intelligent Routing & Guards

### 7.1 Route Protection
```typescript
// components/ProtectedRoute.tsx
- Check auth state
- Redirect to sign-in if not authenticated
- Show loading spinner during auth check
- Allow access if authenticated

// components/PublicRoute.tsx
- Render normally for unauthenticated users
- Optionally redirect authenticated users to /app/dashboard
```

### 7.2 Session Persistence
```
On page load:
1. Check Firebase auth state
2. Load user preferences from Firestore
3. Restore recent project context
4. Show appropriate landing/dashboard
```

### 7.3 Lazy Loading
```
Route-based code splitting:
- Chat component (lazy)
- Studio viewport (lazy)
- Project list (lazy)
- Settings (lazy)
- Dashboard (lazy)

Load only when route accessed
```

---

## Phase 8: Firebase & Auth Cleanup

### 8.1 Centralized Config
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  // ... other config
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
```

### 8.2 Auth Provider
```typescript
// providers/AuthProvider.tsx
- Wrap entire app
- Listen to Firebase auth state changes
- Provide user/session/loading state
- Handle sign-in/sign-out
- Persist session across refreshes
```

### 8.3 Reusable Hooks
```typescript
// hooks/useAuth.ts
- useAuth() → { user, loading, error, signIn, signOut }
- useProject(projectId) → { project, loading, error }
- useProjectList() → { projects, loading, error }
- useGeneration(generationId) → { generation, logs, status }
```

### 8.4 Service Layer
```typescript
// services/firestore.service.ts
- getUser(uid)
- getUserProjects(uid)
- createProject(uid, projectData)
- updateProject(projectId, updates)
- deleteProject(projectId)
- getProjectScenes(projectId)
- // ... etc

Centralized access patterns
```

---

## Phase 9: Refactor Existing V3 Components

### 9.1 Keep & Reuse
- Command palette (adapt for new workflow)
- Scene controls (keep as-is)
- Modern UI system (keep design tokens)
- 3D viewport/studio (adapt for new chat integration)
- Object inspector (useful for manual editing)

### 9.2 Refactor
- Dashboard (remove store analytics → show project/generation analytics)
- Studio (remove ecommerce framing → focus on project context)
- Navigation (remove shop → add projects, settings)

### 9.3 Remove
- Shop page
- Shopping cart logic
- Product catalog
- Ecommerce messaging

---

## New File Structure

```
src/
├── layouts/
│   ├── PublicLayout.tsx
│   ├── AuthLayout.tsx
│   └── AppLayout.tsx
│
├── pages/
│   ├── Home.tsx (refactored)
│   ├── auth/
│   │   ├── SignIn.tsx (new)
│   │   └── Callback.tsx (new)
│   ├── app/
│   │   ├── Dashboard.tsx (refactored)
│   │   ├── Studio.tsx (refactored)
│   │   ├── Projects.tsx (new)
│   │   ├── ProjectDetail.tsx (new)
│   │   └── Settings.tsx (new)
│   └── NotFound.tsx (keep)
│
├── features/
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── types.ts
│   │
│   ├── projects/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── hooks/
│   │   │   ├── useProject.ts
│   │   │   └── useProjects.ts
│   │   └── types.ts
│   │
│   ├── studio/
│   │   ├── Studio.tsx
│   │   ├── ObjectInspector.tsx
│   │   ├── ViewportControls.tsx
│   │   └── types.ts
│   │
│   ├── chat/
│   │   ├── GenerationChat.tsx (renamed from CommandPalette)
│   │   ├── ChatMessage.tsx
│   │   ├── hooks/
│   │   │   └── useGeneration.ts
│   │   └── types.ts
│   │
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── StatsPanel.tsx
│   │   ├── RecentProjects.tsx
│   │   ├── ActiveGenerations.tsx
│   │   └── types.ts
│   │
│   └── settings/
│       ├── Settings.tsx
│       ├── AccountSettings.tsx
│       ├── IntegrationSettings.tsx
│       └── types.ts
│
├── services/
│   ├── firebase.ts
│   ├── firestore.service.ts
│   ├── auth.service.ts
│   ├── ollama.service.ts
│   ├── orchestrator.service.ts
│   └── blender.service.ts
│
├── hooks/
│   ├── useAuth.ts
│   ├── useProject.ts
│   ├── useProjects.ts
│   ├── useGeneration.ts
│   └── useLocalStorage.ts (keep)
│
├── components/
│   ├── ProtectedRoute.tsx (new)
│   ├── loading/
│   │   └── AuthLoadingScreen.tsx
│   ├── 3d/
│   │   └── (keep existing)
│   └── ui/
│       └── (keep existing)
│
├── store/
│   ├── uiStore.ts (keep)
│   ├── sceneStore.ts (refactor - remove demo data)
│   └── (remove shopStore.ts, aiStore.ts)
│
├── types/
│   ├── index.ts (keep core types)
│   ├── auth.ts (new)
│   ├── project.ts (new)
│   ├── generation.ts (new)
│   └── schema.ts (new - move from packages)
│
├── lib/
│   ├── firebase.ts (new)
│   ├── constants.ts (update - remove products)
│   └── (keep existing)
│
├── router.tsx (refactor completely)
└── App.tsx (update)

packages/
├── schema/
│   ├── generation.schema.ts (new)
│   └── types.ts (new)
└── types/
    └── index.ts (shared types)

apps/
├── blender-addon/ (scaffold)
└── blender-worker/ (scaffold)
```

---

## Implementation Sequence

### Week 1: Foundation
1. Set up Firebase config and auth provider
2. Create routing structure
3. Create layout components
4. Implement route guards

### Week 2: Data Model
1. Set up Firestore collections
2. Create service layer
3. Create data hooks
4. Migrate demo data to real model

### Week 3: AI Pipeline
1. Set up Ollama integration
2. Create orchestrator service
3. Create schema and validation
4. Scaffold Blender execution

### Week 4: Integration & Polish
1. Implement chat-driven generation
2. Refactor dashboard and studio
3. Remove webstore
4. Test end-to-end workflows

---

## Success Metrics

- ✅ Public front page restored and repositioned
- ✅ Proper routing hierarchy with guards
- ✅ Firebase auth + Firestore integration
- ✅ Real project persistence
- ✅ AI pipeline foundation in place
- ✅ Chat is operational, not decorative
- ✅ No webstore code remaining
- ✅ Architecture supports true end-to-end AI→3D workflow

---

## Non-Negotiables

- Do NOT keep ecommerce framing
- Do NOT build UI without core system alignment
- Do NOT scatter Firebase logic
- Do NOT implement unsafe Blender execution
- Do NOT leave AI as "future only"
- The system MUST support real data persistence
- Routes MUST be properly protected
- Auth MUST work across page refreshes
