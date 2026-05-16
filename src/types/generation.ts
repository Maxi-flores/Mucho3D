/**
 * Structured generation contract for 3D scene execution
 * Defines the intermediate representation between Studio nodes and Blender execution
 */

export type GenerationJobStatus =
  | 'queued'
  | 'planning'
  | 'validating'
  | 'sending_to_blender'
  | 'executing_blender'
  | 'exporting'
  | 'complete'
  | 'failed'
  | 'cancelled'

export type ExportFormat = 'glb' | 'fbx' | 'stl'
export type PrimitiveType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane'
export type QualityLevel = 'low' | 'medium' | 'high'
export type LightType = 'directional' | 'point' | 'spot'

/**
 * A single 3D primitive object with transforms and properties
 */
export interface BlenderObject {
  id: string
  name: string
  type: PrimitiveType
  position: [number, number, number]
  rotation: [number, number, number] // in degrees
  scale: [number, number, number]
  color?: string // hex #RRGGBB
  material?: {
    metallic: number // 0-1
    roughness: number // 0-1
    emissive?: [number, number, number]
  }
  modifiers?: Array<{
    type: 'bevel' | 'subdivision' | 'solidify' | 'array'
    params: Record<string, unknown>
  }>
}

/**
 * Lighting configuration
 */
export interface BlenderLight {
  id: string
  name: string
  type: LightType
  position: [number, number, number]
  rotation?: [number, number, number]
  intensity: number // 0-5
  color?: string // hex
  energy?: number
}

/**
 * Camera definition
 */
export interface BlenderCamera {
  id: string
  name: string
  position: [number, number, number]
  target: [number, number, number]
  fov?: number // field of view
}

/**
 * Structured scene plan generated from nodes
 * This is the intermediate representation sent to Blender
 */
export interface GenerationPlan {
  id: string // plan ID
  projectId: string
  title: string
  description: string

  // Scene structure
  objects: BlenderObject[]
  lights?: BlenderLight[]
  camera?: BlenderCamera

  // Scene properties
  units: 'meters' | 'centimeters' | 'inches'
  scale: number
  backgroundColor?: string

  // Export settings
  outputFormat: ExportFormat
  qualityLevel: QualityLevel

  // Metadata
  constraints: string[] // from CONSTRAINT nodes
  tags: string[]
  createdAt: string // ISO timestamp
}

/**
 * Represents a queued/executing generation job
 */
export interface GenerationJob {
  id: string
  projectId: string
  userId: string
  status: GenerationJobStatus

  // Input
  prompt: string // original user prompt
  plan?: GenerationPlan // if successfully planned

  // Execution
  blenderJobId?: string // job ID from Blender MCP bridge
  startedAt?: string // ISO timestamp
  completedAt?: string // ISO timestamp
  duration?: number // milliseconds

  // Output
  artifacts: ExportArtifact[]

  // Errors
  errors: string[]
  logs: string[]

  // Metadata
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

/**
 * Exported artifact (GLB, FBX, STL, etc.)
 */
export interface ExportArtifact {
  id: string
  jobId: string
  format: ExportFormat
  filename: string
  url?: string // signed download URL
  size?: number // bytes
  createdAt: string // ISO timestamp
  metadata?: {
    polyCount?: number
    vertexCount?: number
    hasAnimations?: boolean
  }
}

/**
 * Response from job creation endpoint
 */
export interface CreateJobResponse {
  job: GenerationJob
  jobId: string
}

/**
 * Response from job status endpoint
 */
export interface JobStatusResponse {
  job: GenerationJob
  isComplete: boolean
  progress?: {
    stage: GenerationJobStatus
    percentage: number
  }
}
