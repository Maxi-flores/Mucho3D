import { OrbitControls } from '@react-three/drei'
import { SCENE_CONFIG } from '@/lib/constants'

export function CameraController() {
  return (
    <OrbitControls
      enableDamping={SCENE_CONFIG.controls.enableDamping}
      dampingFactor={SCENE_CONFIG.controls.dampingFactor}
      minDistance={SCENE_CONFIG.controls.minDistance}
      maxDistance={SCENE_CONFIG.controls.maxDistance}
      maxPolarAngle={SCENE_CONFIG.controls.maxPolarAngle}
      makeDefault
    />
  )
}
