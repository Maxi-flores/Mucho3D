import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSceneStore } from '@/store'
import type { Mesh } from 'three'

interface WireframeMeshProps {
  type?: 'sphere' | 'box' | 'torus' | 'cone'
}

export function WireframeMesh({ type = 'sphere' }: WireframeMeshProps) {
  const meshRef = useRef<Mesh>(null)
  const showWireframe = useSceneStore((state) => state.showWireframe)
  const isAnimating = useSceneStore((state) => state.isAnimating)
  const animationSpeed = useSceneStore((state) => state.animationSpeed)

  // Animate rotation
  useFrame((_, delta) => {
    if (meshRef.current && isAnimating) {
      meshRef.current.rotation.x += delta * animationSpeed * 0.5
      meshRef.current.rotation.y += delta * animationSpeed * 0.8
      meshRef.current.rotation.z += delta * animationSpeed * 0.3
    }
  })

  if (!showWireframe) return null

  const getGeometry = () => {
    switch (type) {
      case 'box':
        return <boxGeometry args={[2, 2, 2]} />
      case 'torus':
        return <torusGeometry args={[1.5, 0.5, 16, 100]} />
      case 'cone':
        return <coneGeometry args={[1.5, 2.5, 32]} />
      case 'sphere':
      default:
        return <sphereGeometry args={[1.5, 32, 32]} />
    }
  }

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {getGeometry()}
      <meshStandardMaterial
        color="#00A3FF"
        wireframe
        transparent
        opacity={0.8}
        emissive="#00A3FF"
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}
