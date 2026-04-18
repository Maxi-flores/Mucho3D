import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

interface SceneMetrics {
  fps: number
  triangles: number
  drawCalls: number
  memory: number
}

/**
 * Hook for managing 3D scene state and performance metrics
 */
export function use3DScene() {
  const [metrics, setMetrics] = useState<SceneMetrics>({
    fps: 60,
    triangles: 0,
    drawCalls: 0,
    memory: 0,
  })

  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  // Update FPS counter
  useEffect(() => {
    const updateFPS = () => {
      const currentTime = performance.now()
      const delta = currentTime - lastTime.current

      if (delta >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / delta)
        setMetrics((prev) => ({ ...prev, fps }))
        frameCount.current = 0
        lastTime.current = currentTime
      }
    }

    const interval = setInterval(updateFPS, 100)

    return () => clearInterval(interval)
  }, [])

  return {
    metrics,
    setMetrics,
    incrementFrameCount: () => {
      frameCount.current++
    },
  }
}

/**
 * Hook for animating a mesh rotation
 */
export function useRotation(speed: number = 1) {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * speed * 0.5
      meshRef.current.rotation.y += delta * speed * 0.8
    }
  })

  return meshRef
}

/**
 * Hook for managing mesh hover state
 */
export function useHover() {
  const [hovered, setHovered] = useState(false)

  return {
    hovered,
    onPointerOver: () => setHovered(true),
    onPointerOut: () => setHovered(false),
  }
}

/**
 * Hook for managing scene object selection
 */
export function useSelection() {
  const [selected, setSelected] = useState(false)

  return {
    selected,
    onClick: () => setSelected(!selected),
    setSelected,
  }
}
