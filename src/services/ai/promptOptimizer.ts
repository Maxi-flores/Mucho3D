import { PromptSpec } from '@/types/promptBuilder'
import { chat } from './ollamaService'

export function buildPromptFromSpec(spec: PromptSpec): {
  main: string
  blender?: string
  houdini?: string
  unity?: string
} {
  const { userIntent, objectType, style, geometry, materials, animation, exportFormat, constraints } = spec

  // Main generic prompt
  const main = assemblePrompt({
    intent: userIntent,
    type: objectType,
    style,
    geometry,
    materials,
    animation,
    format: exportFormat,
    constraints,
    platform: 'generic',
  })

  // Platform-specific variants
  const result: {
    main: string
    blender?: string
    houdini?: string
    unity?: string
  } = { main }

  if (spec.targetPlatform === 'blender' || spec.targetPlatform === 'multi') {
    result.blender = assemblePrompt({
      intent: userIntent,
      type: objectType,
      style,
      geometry,
      materials,
      animation,
      format: exportFormat,
      constraints,
      platform: 'blender',
    })
  }

  if (spec.targetPlatform === 'houdini' || spec.targetPlatform === 'multi') {
    result.houdini = assemblePrompt({
      intent: userIntent,
      type: objectType,
      style,
      geometry,
      materials,
      animation,
      format: exportFormat,
      constraints,
      platform: 'houdini',
    })
  }

  if (spec.targetPlatform === 'unity' || spec.targetPlatform === 'multi') {
    result.unity = assemblePrompt({
      intent: userIntent,
      type: objectType,
      style,
      geometry,
      materials,
      animation,
      format: exportFormat,
      constraints,
      platform: 'unity',
    })
  }

  return result
}

interface AssembleParams {
  intent: string
  type: string
  style: string
  geometry: any
  materials: any
  animation: any
  format: string
  constraints: string
  platform: string
}

function assemblePrompt(params: AssembleParams): string {
  const {
    intent,
    type,
    style,
    geometry,
    materials,
    animation,
    format,
    constraints,
    platform,
  } = params

  let prompt = ''

  // Platform-specific intro
  if (platform === 'blender') {
    prompt = `Create a 3D ${type} in Blender for ${intent}.\n`
  } else if (platform === 'houdini') {
    prompt = `Design a procedural ${type} in Houdini for ${intent}.\n`
  } else if (platform === 'unity') {
    prompt = `Build a game-ready ${type} for Unity, ${intent}.\n`
  } else {
    prompt = `Create a 3D ${type} for ${intent}.\n`
  }

  // Style
  prompt += `Style: ${style}\n`

  // Geometry
  prompt += `Geometry: ${geometry.topologyQuality} topology, scale ${geometry.scale}`
  if (geometry.bevels) prompt += ', with beveled edges'
  if (geometry.modifiers?.length > 0) prompt += `, modifiers: ${geometry.modifiers.join(', ')}`
  prompt += `.\n`

  // Materials
  prompt += `Materials: ${materials.type}`
  if (materials.type !== 'procedural') {
    prompt += ` with ${materials.textureResolution} textures`
  }
  if (materials.uvRequired) prompt += ', UVs unwrapped'
  if (materials.shaderNotes) prompt += `. ${materials.shaderNotes}`
  prompt += `.\n`

  // Animation
  if (animation.required) {
    prompt += `Animation: Include ${animation.rigging ? 'rigged' : 'animated'} motion${animation.notes ? `. ${animation.notes}` : ''}\n`
  }

  // Export
  prompt += `Export format: ${format.toUpperCase()}\n`

  // Platform-specific requirements
  if (platform === 'blender') {
    prompt += `Blender requirements: Clean topology, proper materials setup, optimized for rendering.\n`
  } else if (platform === 'houdini') {
    prompt += `Houdini requirements: Procedural design, parameter-driven, suitable for iteration and variation.\n`
  } else if (platform === 'unity') {
    prompt += `Unity requirements: Optimized polygon count, compatible materials, game engine ready.\n`
  }

  // Constraints/negative prompt
  if (constraints) {
    prompt += `Avoid: ${constraints}\n`
  }

  return prompt.trim()
}

export async function optimizePromptWithAI(spec: PromptSpec, signal?: AbortSignal): Promise<string> {
  const userMessage = `Create a production-ready ${spec.targetPlatform} prompt based on this intent and specifications:
Intent: ${spec.userIntent}
Object type: ${spec.objectType}
Style: ${spec.style}
Geometry quality: ${spec.geometry.topologyQuality}
Materials: ${spec.materials.type} with ${spec.materials.textureResolution} textures
Export format: ${spec.exportFormat}
Constraints: ${spec.constraints || 'none specified'}

Generate a clear, actionable prompt.`

  try {
    const response = await chat(
      [{ role: 'user', content: userMessage }],
      undefined,
      signal
    )

    if (!response.success || response.data?.type !== 'text') {
      throw new Error('AI optimization failed')
    }

    return response.data.message
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error during optimization'
    throw new Error(`Failed to optimize prompt with AI: ${errorMsg}`)
  }
}
