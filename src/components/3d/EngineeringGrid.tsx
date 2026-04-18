import { Grid } from '@react-three/drei'
import { useSceneStore } from '@/store'
import { SCENE_CONFIG } from '@/lib/constants'

export function EngineeringGrid() {
  const showGrid = useSceneStore((state) => state.showGrid)

  if (!showGrid) return null

  return (
    <>
      {/* Main grid */}
      <Grid
        args={[SCENE_CONFIG.grid.size, SCENE_CONFIG.grid.size]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#00A3FF"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#0082CC"
        fadeDistance={SCENE_CONFIG.grid.fadeDistance}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      {/* XZ plane helper (subtle) */}
      <gridHelper
        args={[SCENE_CONFIG.grid.size, SCENE_CONFIG.grid.divisions]}
        position={[0, 0, 0]}
      />
    </>
  )
}
