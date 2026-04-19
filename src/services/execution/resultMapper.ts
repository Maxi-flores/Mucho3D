import { SceneObject, CameraState } from '@/types'
import { ExecutionResult, SceneDoc } from '@/types/firebase'
import { Timestamp } from 'firebase/firestore'

/**
 * Result Mapper
 * Transforms execution output into app scene data suitable for persistence and Studio rendering
 */

export function mapExecutionResultToSceneData(
  result: ExecutionResult,
  projectId: string,
  userId: string,
  generationId: string
): SceneDoc {
  // Use execution result objects, or create default camera
  const objects = result.objects || []

  // Calculate camera bounds from objects
  const camera = calculateCameraForObjects(objects)

  const now = Timestamp.now()

  return {
    id: `scene-gen-${generationId}`,
    projectId,
    userId,
    version: 1,
    objects,
    camera,
    settings: {
      showGrid: true,
      showWireframe: false,
      ambientIntensity: 0.5,
    },
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Calculate camera position and target to frame all objects
 */
function calculateCameraForObjects(objects: SceneObject[]): CameraState {
  if (objects.length === 0) {
    return {
      position: [5, 5, 5],
      target: [0, 0, 0],
      fov: 75,
      zoom: 1,
    }
  }

  // Calculate bounding box
  let minX = Infinity,
    maxX = -Infinity
  let minY = Infinity,
    maxY = -Infinity
  let minZ = Infinity,
    maxZ = -Infinity

  for (const obj of objects) {
    const x = obj.position[0]
    const y = obj.position[1]
    const z = obj.position[2]
    const sx = (obj.scale[0] || 1) * 0.5
    const sy = (obj.scale[1] || 1) * 0.5
    const sz = (obj.scale[2] || 1) * 0.5

    minX = Math.min(minX, x - sx)
    maxX = Math.max(maxX, x + sx)
    minY = Math.min(minY, y - sy)
    maxY = Math.max(maxY, y + sy)
    minZ = Math.min(minZ, z - sz)
    maxZ = Math.max(maxZ, z + sz)
  }

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const centerZ = (minZ + maxZ) / 2

  const sizeX = maxX - minX
  const sizeY = maxY - minY
  const sizeZ = maxZ - minZ
  const maxSize = Math.max(sizeX, sizeY, sizeZ)

  // Position camera at distance = maxSize * 1.5, looking at center
  const distance = Math.max(maxSize * 1.5, 5)

  return {
    position: [centerX + distance, centerY + distance * 0.5, centerZ + distance],
    target: [centerX, centerY, centerZ],
    fov: 75,
    zoom: 1,
  }
}

/**
 * Create scene metadata for generation record
 */
export function createGenerationResultMetadata(
  sceneId: string,
  result: ExecutionResult,
  executionTimeMs: number
) {
  return {
    sceneId,
    objectCount: result.objects?.length || 0,
    executionTimeMs,
    hasExports: !!(result.exportUrls && Object.keys(result.exportUrls).length > 0),
    exportTypes: result.exportUrls ? Object.keys(result.exportUrls) : [],
    summary: result.summary,
  }
}
