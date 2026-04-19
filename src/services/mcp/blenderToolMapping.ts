import { MCPToolName } from './toolRegistry'

export interface BlenderToolMapping {
  tool: MCPToolName
  blenderOperation: string
  notes: string
}

export const BLENDER_TOOL_MAPPINGS: Record<MCPToolName, BlenderToolMapping> = {
  create_primitive: {
    tool: 'create_primitive',
    blenderOperation: 'bpy.ops.mesh.primitive_cube_add / sphere_add / cylinder_add / cone_add / torus_add / plane_add',
    notes: 'Primitive type is selected from a whitelist. No Python source is accepted from AI output.',
  },
  transform_object: {
    tool: 'transform_object',
    blenderOperation: 'object.location, object.rotation_euler, object.scale',
    notes: 'Only finite bounded vector values are accepted.',
  },
  apply_material: {
    tool: 'apply_material',
    blenderOperation: 'bpy.data.materials.new and Principled BSDF scalar/color values',
    notes: 'Color and scalar material fields are schema validated before dispatch.',
  },
  export_scene: {
    tool: 'export_scene',
    blenderOperation: 'bpy.ops.export_scene.gltf / bpy.ops.export_scene.fbx',
    notes: 'Export format and filename are constrained.',
  },
}
