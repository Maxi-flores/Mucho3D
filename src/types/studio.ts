import { Timestamp } from 'firebase/firestore'

export type NodeType = 'CONCEPT' | 'OBJECT' | 'MATERIAL' | 'LIGHT' | 'CAMERA' | 'CONSTRAINT' | 'NOTE'
export type NodeStatus = 'draft' | 'reviewed' | 'locked'

export interface Position {
  x: number
  y: number
}

export interface StudioNode {
  id: string
  type: NodeType
  label: string
  description: string
  tags: string[]
  status: NodeStatus
  position: Position
  linkedTo: string[]
  color?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface StudioViewport {
  x: number
  y: number
  zoom: number
}

export interface ProjectStudioData {
  studioNodes: StudioNode[]
  studioViewport: StudioViewport
  projectTags: string[]
  targetFormat: 'glb' | 'fbx'
  complexityEstimate: 'low' | 'medium' | 'high'
  referenceLinks: string[]
}

export const NODE_TYPE_CONFIG: Record<NodeType, { bg: string; text: string; label: string }> = {
  CONCEPT: { bg: '#7c3aed', text: '#ede9fe', label: 'Concept' },
  OBJECT: { bg: '#1d4ed8', text: '#dbeafe', label: 'Object' },
  MATERIAL: { bg: '#b45309', text: '#fef3c7', label: 'Material' },
  LIGHT: { bg: '#ca8a04', text: '#fefce8', label: 'Light' },
  CAMERA: { bg: '#0f766e', text: '#ccfbf1', label: 'Camera' },
  CONSTRAINT: { bg: '#b91c1c', text: '#fee2e2', label: 'Constraint' },
  NOTE: { bg: '#374151', text: '#f3f4f6', label: 'Note' },
}

export const SUGGESTED_TAGS = [
  'furniture',
  'low-poly',
  'hero-object',
  'export-ready',
  'wip',
  'organic',
  'mechanical',
  'environment',
  'character',
  'prop',
]
