import { StudioNode } from '@/types/studio'

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
