import { useFrame, useThree } from '@react-three/fiber'
import { useSceneStore } from '@/store'

/**
 * CameraTracker - Tracks camera position inside Canvas context
 * Updates sceneStore with camera data for FloatingHUD consumption
 * This component MUST be inside <Canvas> to use R3F hooks
 */
export function CameraTracker() {
  const { camera } = useThree()
  const setCameraPosition = useSceneStore((state) => state.setCameraPosition)

  useFrame(() => {
    // Update store with current camera position
    setCameraPosition([
      parseFloat(camera.position.x.toFixed(2)),
      parseFloat(camera.position.y.toFixed(2)),
      parseFloat(camera.position.z.toFixed(2)),
    ])
  })

  return null // Invisible component, just tracking camera
}
