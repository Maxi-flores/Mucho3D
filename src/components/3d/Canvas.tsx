import { Canvas as R3FCanvas } from '@react-three/fiber'
import { Suspense, type ReactNode } from 'react'
import { SCENE_CONFIG } from '@/lib/constants'

interface CanvasProps {
  children: ReactNode
}

export function Canvas({ children }: CanvasProps) {
  return (
    <div className="w-full h-full relative">
      <R3FCanvas
        camera={{
          position: SCENE_CONFIG.camera.position,
          fov: SCENE_CONFIG.camera.fov,
          near: SCENE_CONFIG.camera.near,
          far: SCENE_CONFIG.camera.far,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]} // Device pixel ratio (1 for normal, 2 for retina)
        shadows
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#050505']} />
          {children}
        </Suspense>
      </R3FCanvas>

      {/* Loading overlay (shown during suspense) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="glass-panel px-6 py-4 rounded-xl flex items-center gap-3">
          <div className="loader-spinner" />
          <span className="font-mono text-sm text-white/80">
            Loading 3D Scene...
          </span>
        </div>
      </div>
    </div>
  )
}
