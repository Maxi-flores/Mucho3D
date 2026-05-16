/**
 * Blender Socket Bridge
 * Communicates with Blender via Python socket on port 9100
 * Sends structured Python commands to execute generation plans
 */

import * as net from 'node:net'

const BLENDER_HOST = process.env.BLENDER_BRIDGE_HOST || '127.0.0.1'
const BLENDER_PORT = Number(process.env.BLENDER_BRIDGE_PORT || 9100)
const BLENDER_TIMEOUT_MS = Number(process.env.BLENDER_BRIDGE_TIMEOUT_MS || 30000)

export interface BlenderExecutionResult {
  success: boolean
  message: string
  logs: string[]
  errors: string[]
  output?: Record<string, unknown>
}

/**
 * Check if Blender is reachable on the socket port
 */
export async function isBlenderAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const timeout = setTimeout(() => {
      socket.destroy()
      resolve(false)
    }, 3000)

    socket.once('connect', () => {
      clearTimeout(timeout)
      socket.destroy()
      resolve(true)
    })

    socket.once('error', () => {
      clearTimeout(timeout)
      resolve(false)
    })

    socket.connect(BLENDER_PORT, BLENDER_HOST)
  })
}

/**
 * Execute a Blender Python command via socket
 * Blender should be started with: blender --background --python-socket 9100
 */
export async function executeBlenderCommand(
  pythonCode: string
): Promise<BlenderExecutionResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const chunks: Buffer[] = []
    let settled = false

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        socket.destroy()
        resolve({
          success: false,
          message: `Blender socket timeout after ${BLENDER_TIMEOUT_MS}ms. Is Blender running with --python-socket?`,
          logs: [],
          errors: [`Timeout connecting to Blender on ${BLENDER_HOST}:${BLENDER_PORT}`],
        })
      }
    }, BLENDER_TIMEOUT_MS)

    socket.once('connect', () => {
      console.log('[blender-socket] Connected to Blender, sending command')
      // Send Python code to Blender socket
      socket.write(pythonCode)
      socket.end()
    })

    socket.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    socket.once('error', (error) => {
      if (!settled) {
        settled = true
        clearTimeout(timeout)
        console.error(`[blender-socket] Connection error: ${error.message}`)
        resolve({
          success: false,
          message: `Failed to connect to Blender: ${error.message}`,
          logs: [],
          errors: [
            `Cannot reach Blender on ${BLENDER_HOST}:${BLENDER_PORT}`,
            'Start Blender with: blender --background --python-socket 9100',
          ],
        })
      }
    })

    socket.once('close', () => {
      if (!settled) {
        settled = true
        clearTimeout(timeout)

        const raw = Buffer.concat(chunks).toString('utf8').trim()

        // Try to parse JSON response from Blender
        if (raw.length === 0) {
          resolve({
            success: false,
            message: 'Blender sent empty response',
            logs: [],
            errors: ['No output from Blender execution'],
          })
          return
        }

        try {
          const result = JSON.parse(raw)
          resolve({
            success: result.success ?? false,
            message: result.message ?? 'Blender execution completed',
            logs: result.logs ?? [],
            errors: result.errors ?? [],
            output: result.output,
          })
        } catch {
          // Raw output is not JSON, treat as success with log
          resolve({
            success: true,
            message: 'Blender execution completed',
            logs: [raw],
            errors: [],
          })
        }
      }
    })

    console.log(`[blender-socket] Connecting to Blender on ${BLENDER_HOST}:${BLENDER_PORT}`)
    socket.connect(BLENDER_PORT, BLENDER_HOST)
  })
}

/**
 * Build Python code to execute a GenerationPlan in Blender
 */
export function buildGenerationPlanPython(plan: Record<string, unknown>): string {
  // Escape the plan JSON for safe inclusion in Python string
  const planJson = JSON.stringify(plan).replace(/"/g, '\\"').replace(/\n/g, '\\n')

  return `
import json
import sys
import bpy
import math
from pathlib import Path

# Parse the generation plan
plan_json = """${planJson}"""
plan = json.loads(plan_json)

# Create output for response
result = {
    'success': True,
    'message': 'Plan executed',
    'created_objects': [],
    'logs': [],
    'errors': [],
    'output': {}
}

try:
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    result['logs'].append('Cleared scene')

    # Create objects from plan
    for obj_spec in plan.get('objects', []):
        try:
            obj_type = obj_spec.get('type', 'box')
            name = obj_spec.get('name', obj_spec.get('id', 'Object'))
            position = tuple(obj_spec.get('position', [0, 0, 0]))
            rotation = tuple(obj_spec.get('rotation', [0, 0, 0]))
            scale = tuple(obj_spec.get('scale', [1, 1, 1]))
            color = obj_spec.get('color')

            # Create primitive
            if obj_type == 'box' or obj_type == 'cube':
                bpy.ops.mesh.primitive_cube_add(location=position, scale=scale)
            elif obj_type == 'sphere':
                bpy.ops.mesh.primitive_uv_sphere_add(location=position, scale=scale)
            elif obj_type == 'cylinder':
                bpy.ops.mesh.primitive_cylinder_add(location=position, scale=scale)
            elif obj_type == 'cone':
                bpy.ops.mesh.primitive_cone_add(location=position, scale=scale)
            elif obj_type == 'torus':
                bpy.ops.mesh.primitive_torus_add(location=position, scale=scale)
            elif obj_type == 'plane':
                bpy.ops.mesh.primitive_plane_add(location=position, scale=scale)
            else:
                result['errors'].append(f"Unknown type: {obj_type}")
                continue

            # Get active object and apply transforms
            obj = bpy.context.active_object
            obj.name = name
            obj.rotation_euler = [math.radians(r) for r in rotation]

            # Apply color if specified
            if color:
                try:
                    color_hex = color.lstrip('#')
                    r = int(color_hex[0:2], 16) / 255.0
                    g = int(color_hex[2:4], 16) / 255.0
                    b = int(color_hex[4:6], 16) / 255.0

                    mat = bpy.data.materials.new(name=f"{name}_Material")
                    mat.use_nodes = True
                    for node in mat.node_tree.nodes:
                        if node.type == 'PRINCIPLED_BSDF':
                            node.inputs['Base Color'].default_value = (r, g, b, 1.0)

                    if obj.data.materials:
                        obj.data.materials[0] = mat
                    else:
                        obj.data.materials.append(mat)
                except:
                    result['errors'].append(f"Failed to apply color to {name}")

            result['created_objects'].append(obj_spec.get('id', name))
            result['logs'].append(f"Created {obj_type}: {name}")

        except Exception as e:
            result['errors'].append(f"Failed to create object: {str(e)}")

    # Create lights
    for light_spec in plan.get('lights', []):
        try:
            light_type = light_spec.get('type', 'POINT')
            light_type_map = {
                'directional': 'SUN',
                'point': 'POINT',
                'spot': 'SPOT'
            }
            bpy.ops.object.light_add(
                type=light_type_map.get(light_type, 'POINT'),
                location=tuple(light_spec.get('position', [0, 0, 0]))
            )
            light = bpy.context.active_object
            light.name = light_spec.get('name', 'Light')
            if 'intensity' in light_spec:
                light.data.energy = light_spec['intensity']
            result['logs'].append(f"Created light: {light.name}")
        except Exception as e:
            result['errors'].append(f"Failed to create light: {str(e)}")

    # Create camera
    if 'camera' in plan:
        try:
            bpy.ops.object.camera_add(location=tuple(plan['camera'].get('position', [0, 0, 0])))
            cam = bpy.context.active_object
            cam.name = plan['camera'].get('name', 'Camera')
            result['logs'].append("Created camera")
        except Exception as e:
            result['errors'].append(f"Failed to create camera: {str(e)}")

    result['success'] = len(result['errors']) == 0
    result['message'] = f"Created {len(result['created_objects'])} objects"

except Exception as e:
    result['success'] = False
    result['message'] = f"Plan execution failed: {str(e)}"
    result['errors'].append(str(e))

# Send result back as JSON
print(json.dumps(result))
`
}

/**
 * Build Python code to export scene to file
 */
export function buildExportScenePython(
  format: string,
  outputPath: string
): string {
  const exportFormat = format.toLowerCase()
  let exportCommand = ''

  if (exportFormat === 'glb' || exportFormat === 'gltf') {
    exportCommand = `bpy.ops.export_scene.gltf(
      filepath="${outputPath}",
      export_format='GLTF_SEPARATE' if '${exportFormat}' == 'gltf' else 'GLB',
      export_image_format='AUTO'
    )`
  } else if (exportFormat === 'fbx') {
    exportCommand = `bpy.ops.export_scene.fbx(
      filepath="${outputPath}",
      use_mesh_modifiers=True,
      use_custom_properties=True
    )`
  } else if (exportFormat === 'obj') {
    exportCommand = `bpy.ops.export_scene.obj(
      filepath="${outputPath}",
      use_materials=True,
      use_mesh_modifiers=True
    )`
  } else if (exportFormat === 'stl') {
    exportCommand = `bpy.ops.export_mesh.stl(
      filepath="${outputPath}",
      use_mesh_modifiers=True
    )`
  } else {
    return `
import json
result = {
    'success': False,
    'message': 'Unsupported export format: ${exportFormat}',
    'errors': ['Supported: glb, gltf, fbx, obj, stl']
}
print(json.dumps(result))
`
  }

  return `
import json
import bpy
import os

result = {
    'success': False,
    'message': '',
    'logs': [],
    'errors': [],
    'output_file': None
}

try:
    # Ensure output directory exists
    output_dir = os.path.dirname("${outputPath}")
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    # Export scene
    ${exportCommand}

    # Verify file was created
    if os.path.exists("${outputPath}"):
        file_size = os.path.getsize("${outputPath}")
        result['success'] = True
        result['message'] = f"Exported to ${outputPath} ({file_size} bytes)"
        result['output_file'] = "${outputPath}"
        result['logs'].append(f"Export successful: {file_size} bytes")
    else:
        result['errors'].append("Export file was not created")

except Exception as e:
    result['message'] = f"Export failed: {str(e)}"
    result['errors'].append(str(e))

print(json.dumps(result))
`
}
