import { StudioNode } from '@/types/studio'
import { GenerationPlan, BlenderObject, BlenderLight, BlenderCamera, PrimitiveType, LightType } from '@/types/generation'
import { v4 as uuidv4 } from 'uuid'

/**
 * Compile a node graph into a structured prompt for the AI scene planner
 */
export function compileNodesToPrompt(nodes: StudioNode[], projectName: string): string {
  const concepts = nodes.filter(n => n.type === 'CONCEPT')
  const objects = nodes.filter(n => n.type === 'OBJECT')
  const materials = nodes.filter(n => n.type === 'MATERIAL')
  const lights = nodes.filter(n => n.type === 'LIGHT')
  const cameras = nodes.filter(n => n.type === 'CAMERA')
  const constraints = nodes.filter(n => n.type === 'CONSTRAINT')

  const sections: string[] = []

  sections.push(`Project: ${projectName}\n`)

  // Concept section
  if (concepts.length > 0) {
    sections.push('## Concept')
    concepts.forEach(node => {
      if (node.description) {
        sections.push(`- ${node.label}: ${node.description}`)
      } else {
        sections.push(`- ${node.label}`)
      }
    })
    sections.push('')
  }

  // Objects section
  if (objects.length > 0) {
    sections.push('## Objects to create')
    objects.forEach(node => {
      const linkedMaterials = materials
        .filter(m => m.linkedTo.includes(node.id))
        .map(m => m.label)
        .join(', ')

      let objectDesc = node.label
      if (node.description) {
        objectDesc += `: ${node.description}`
      }
      if (linkedMaterials) {
        objectDesc += ` [Materials: ${linkedMaterials}]`
      }
      sections.push(`- ${objectDesc}`)
    })
    sections.push('')
  }

  // Materials section
  if (materials.length > 0) {
    const unmappedMaterials = materials.filter(m => m.linkedTo.length === 0)
    if (unmappedMaterials.length > 0) {
      sections.push('## Materials')
      unmappedMaterials.forEach(node => {
        if (node.description) {
          sections.push(`- ${node.label}: ${node.description}`)
        } else {
          sections.push(`- ${node.label}`)
        }
      })
      sections.push('')
    }
  }

  // Lighting section
  if (lights.length > 0) {
    sections.push('## Lighting')
    lights.forEach(node => {
      if (node.description) {
        sections.push(`- ${node.label}: ${node.description}`)
      } else {
        sections.push(`- ${node.label}`)
      }
    })
    sections.push('')
  }

  // Camera section
  if (cameras.length > 0) {
    sections.push('## Camera / Shot')
    cameras.forEach(node => {
      if (node.description) {
        sections.push(`- ${node.label}: ${node.description}`)
      } else {
        sections.push(`- ${node.label}`)
      }
    })
    sections.push('')
  }

  // Constraints section
  if (constraints.length > 0) {
    sections.push('## Constraints & Rules')
    constraints.forEach(node => {
      if (node.description) {
        sections.push(`- ${node.label}: ${node.description}`)
      } else {
        sections.push(`- ${node.label}`)
      }
    })
    sections.push('')
  }

  sections.push('Create a 3D scene that satisfies all the above requirements.')

  return sections.join('\n')
}

/**
 * Check if a project is ready for execution
 */
export function isProjectReadyForExecution(nodes: StudioNode[]): {
  ready: boolean
  reason?: string
} {
  const hasObjects = nodes.some(n => n.type === 'OBJECT' && (n.status === 'reviewed' || n.status === 'locked'))
  const hasLighting = nodes.some(n => n.type === 'LIGHT' || n.type === 'CAMERA')
  const draftConstraints = nodes.filter(n => n.type === 'CONSTRAINT' && n.status === 'draft')

  if (!hasObjects) {
    return { ready: false, reason: 'At least one reviewed/locked OBJECT node required' }
  }

  if (!hasLighting) {
    return { ready: false, reason: 'At least one LIGHT or CAMERA node required' }
  }

  if (draftConstraints.length > 0) {
    return { ready: false, reason: `${draftConstraints.length} CONSTRAINT node(s) still in draft state` }
  }

  return { ready: true }
}

/**
 * Compile nodes into a structured GenerationPlan for Blender execution
 * This is the intermediate representation before sending to Blender
 */
export function compileNodesToGenerationPlanDraft(
  nodes: StudioNode[],
  projectId: string,
  projectName: string
): GenerationPlan {
  const objects: BlenderObject[] = []
  const lights: BlenderLight[] = []
  let camera: BlenderCamera | undefined

  const objectNodes = nodes.filter(n => n.type === 'OBJECT')
  const materialNodes = nodes.filter(n => n.type === 'MATERIAL')
  const lightNodes = nodes.filter(n => n.type === 'LIGHT')
  const cameraNodes = nodes.filter(n => n.type === 'CAMERA')
  const constraintNodes = nodes.filter(n => n.type === 'CONSTRAINT')

  // Map node description to primitive type
  const parsePrimitiveType = (label: string): PrimitiveType => {
    const lower = label.toLowerCase()
    if (lower.includes('sphere') || lower.includes('ball')) return 'sphere'
    if (lower.includes('cylinder')) return 'cylinder'
    if (lower.includes('cone')) return 'cone'
    if (lower.includes('torus') || lower.includes('donut')) return 'torus'
    if (lower.includes('plane') || lower.includes('flat')) return 'plane'
    return 'box' // default
  }

  // Create objects from OBJECT nodes
  objectNodes.forEach((node) => {
    const linkedMaterials = materialNodes.filter(m => m.linkedTo.includes(node.id))

    const obj: BlenderObject = {
      id: node.id,
      name: node.label,
      type: parsePrimitiveType(node.label),
      position: [
        node.position.x / 100, // normalize canvas coords to scene units
        node.position.y / 100,
        0,
      ],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: undefined,
    }

    // Apply linked material properties
    if (linkedMaterials.length > 0) {
      const material = linkedMaterials[0]
      obj.material = {
        metallic: material.description.toLowerCase().includes('metal') ? 0.8 : 0.2,
        roughness: material.description.toLowerCase().includes('rough') ? 0.8 : 0.3,
      }
    }

    objects.push(obj)
  })

  // Create lights from LIGHT nodes
  lightNodes.forEach((node) => {
    let lightType: LightType = 'directional'
    if (node.description.toLowerCase().includes('spot')) {
      lightType = 'spot'
    } else if (node.description.toLowerCase().includes('point')) {
      lightType = 'point'
    }

    const light: BlenderLight = {
      id: node.id,
      name: node.label,
      type: lightType,
      position: [node.position.x / 100, node.position.y / 100, 2],
      intensity: 2,
    }
    lights.push(light)
  })

  // Create camera from first CAMERA node
  if (cameraNodes.length > 0) {
    const cameraNode = cameraNodes[0]
    camera = {
      id: cameraNode.id,
      name: cameraNode.label,
      position: [3, 3, 3],
      target: [0, 0, 0],
      fov: 50,
    }
  }

  const constraints = constraintNodes.map(n => `${n.label}: ${n.description}`).filter(Boolean)

  return {
    id: uuidv4(),
    projectId,
    title: projectName,
    description: `Generated scene from ${projectName} node structure`,
    objects,
    lights: lights.length > 0 ? lights : undefined,
    camera,
    units: 'meters',
    scale: 1,
    outputFormat: 'glb',
    qualityLevel: 'medium',
    constraints,
    tags: Array.from(new Set(nodes.flatMap(n => n.tags))),
    createdAt: new Date().toISOString(),
  }
}

/**
 * Validate a GenerationPlan for execution safety
 */
export function validateGenerationPlan(plan: GenerationPlan): string[] {
  const errors: string[] = []

  if (!plan.objects || plan.objects.length === 0) {
    errors.push('Plan must include at least one object')
  }

  for (const obj of plan.objects || []) {
    if (!obj.id || !obj.name || !obj.type) {
      errors.push(`Invalid object: missing required fields`)
      continue
    }

    // Validate position/scale ranges
    for (const [idx, val] of obj.position.entries()) {
      if (!Number.isFinite(val) || Math.abs(val) > 1000) {
        errors.push(`Object ${obj.name} position[${idx}] out of range: ${val}`)
      }
    }

    for (const [idx, val] of obj.scale.entries()) {
      if (!Number.isFinite(val) || val < 0.01 || val > 100) {
        errors.push(`Object ${obj.name} scale[${idx}] out of range: ${val}`)
      }
    }
  }

  if (plan.camera) {
    if (!plan.camera.position || !plan.camera.target) {
      errors.push('Camera missing position or target')
    }
  }

  return errors
}
