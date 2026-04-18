import { useSceneStore } from '@/store'

export function Lights() {
  const ambientIntensity = useSceneStore((state) => state.ambientIntensity)

  return (
    <>
      {/* Ambient light for overall scene illumination */}
      <ambientLight intensity={ambientIntensity} />

      {/* Directional light (like sun) with blue tint */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        color="#00A3FF"
        castShadow
      />

      {/* Point light for accent */}
      <pointLight
        position={[-10, 5, -5]}
        intensity={0.5}
        color="#00A3FF"
        distance={50}
      />

      {/* Additional fill light */}
      <pointLight
        position={[5, -5, 10]}
        intensity={0.3}
        color="#ffffff"
        distance={30}
      />
    </>
  )
}
