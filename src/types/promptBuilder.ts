export type TargetPlatform = 'blender' | 'houdini' | 'unity' | 'multi'
export type ObjectType = 'character' | 'prop' | 'environment' | 'architecture' | 'vehicle' | 'abstract' | 'procedural'
export type StylePreset = 'realistic' | 'stylized' | 'low-poly' | 'cinematic' | 'game-ready' | 'vfx-ready'
export type ExportFormat = 'glb' | 'fbx' | 'obj' | 'usd' | 'abc'
export type TopologyQuality = 'low' | 'medium' | 'high' | 'subdiv'
export type MaterialType = 'pbr' | 'simple' | 'procedural'
export type TextureResolution = '512' | '1024' | '2048' | '4096'

export interface GeometryConfig {
  scale: string
  topologyQuality: TopologyQuality
  bevels: boolean
  modifiers: string[]
  proceduralDetail: string
}

export interface MaterialConfig {
  type: MaterialType
  textureResolution: TextureResolution
  uvRequired: boolean
  shaderNotes: string
}

export interface AnimationConfig {
  required: boolean
  rigging: boolean
  notes: string
}

export interface PromptSpec {
  id: string
  title: string
  userIntent: string
  targetPlatform: TargetPlatform
  objectType: ObjectType
  style: StylePreset
  geometry: GeometryConfig
  materials: MaterialConfig
  animation: AnimationConfig
  exportFormat: ExportFormat
  constraints: string
  generatedPrompt: string
  platformVariants: {
    blender?: string
    houdini?: string
    unity?: string
  }
  createdAt: string
  updatedAt: string
}

export function createEmptySpec(): PromptSpec {
  const now = new Date().toISOString()
  return {
    id: `spec-${Date.now()}`,
    title: 'Untitled Prompt',
    userIntent: '',
    targetPlatform: 'blender',
    objectType: 'prop',
    style: 'realistic',
    geometry: {
      scale: '1.0',
      topologyQuality: 'medium',
      bevels: false,
      modifiers: [],
      proceduralDetail: 'medium',
    },
    materials: {
      type: 'pbr',
      textureResolution: '2048',
      uvRequired: true,
      shaderNotes: '',
    },
    animation: {
      required: false,
      rigging: false,
      notes: '',
    },
    exportFormat: 'glb',
    constraints: '',
    generatedPrompt: '',
    platformVariants: {},
    createdAt: now,
    updatedAt: now,
  }
}
