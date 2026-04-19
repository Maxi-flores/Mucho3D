import { Timestamp } from 'firebase/firestore'
import { SceneObject, CameraState, ChatMessage } from './index'

// ============================================================================
// Users Collection: users/{uid}
// ============================================================================
export interface UserDoc {
  uid: string
  email: string
  name: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// Projects Collection: projects/{projectId}
// ============================================================================
export interface ProjectDoc {
  id: string
  userId: string
  name: string
  description?: string
  status: 'active' | 'archived'
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// Scenes Collection: scenes/{sceneId}
// ============================================================================
export interface SceneSettings {
  showGrid: boolean
  showWireframe: boolean
  ambientIntensity: number
}

export interface SceneDoc {
  id: string
  projectId: string
  userId: string
  version: number
  objects: SceneObject[]
  camera: CameraState
  settings: SceneSettings
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// Generations Collection: generations/{generationId}
// Core AI pipeline record — tracks prompt → plan → execution → output
// ============================================================================
export interface ExecutionPayload {
  instructions: Array<{
    type: string
    targetId?: string
    params?: Record<string, unknown>
  }>
  metadata?: Record<string, unknown>
}

export interface ExecutionResult {
  success: boolean
  objects: SceneObject[]
  executionTimeMs: number
  exportUrls?: {
    glb?: string
    fbx?: string
    preview?: string
  }
  summary?: string
  errors?: string[]
}

export interface GenerationDoc {
  id: string
  projectId: string
  userId: string
  sessionId?: string
  prompt: string
  structuredPlan?: Record<string, unknown> | null
  executionPayload?: ExecutionPayload | null
  executionResult?: ExecutionResult | null
  status: 'pending' | 'planning' | 'validated' | 'executing' | 'complete' | 'error'
  errorMessage?: string | null
  outputSceneId?: string | null
  outputAssetUrl?: string | null
  planningTimeMs?: number
  executionTimeMs?: number
  totalTimeMs?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// Prompt Sessions Collection: promptSessions/{sessionId}
// Groups prompt/response pairs for a conversation within a project
// ============================================================================
export interface StoredMessage extends ChatMessage {
  // Inherits: id, role, content, timestamp, metadata
  // metadata can include: { generationId, status }
}

export interface PromptSessionDoc {
  id: string
  projectId: string
  userId: string
  messages: StoredMessage[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// Execution Logs Collection: executionLogs/{logId}
// Detailed execution trace for a generation (used by Blender → Phase 4)
// ============================================================================
export interface ExecutionStep {
  timestamp: Timestamp
  action: string
  params?: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
}

export interface ExecutionLogDoc {
  id: string
  generationId: string
  projectId: string
  userId: string
  steps: ExecutionStep[]
  errors: string[]
  outputSummary?: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ============================================================================
// Firestore Document Converters (for type safety)
// ============================================================================

// Helper to strip Firestore document metadata
export const documentToObject = <T>(doc: any): T => {
  const { ...data } = doc
  return data as T
}
