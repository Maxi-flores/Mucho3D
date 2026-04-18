import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSceneStore } from '@/store'
import { fadeInUp } from '@/lib/animations'
import { Badge } from '@/components/ui'

/**
 * FloatingHUD - Technical heads-up display for 3D scene
 *
 * IMPORTANT: This component uses NO R3F hooks.
 * Camera position is updated by CameraTracker component inside Canvas.
 * FPS and stats are read from Zustand store.
 */
export function FloatingHUD() {
  const showHUD = useSceneStore((state) => state.showHUD)
  const stats = useSceneStore((state) => state.stats)
  const cameraPosition = useSceneStore((state) => state.cameraPosition)
  const [fps, setFps] = useState(60)

  // Calculate FPS using requestAnimationFrame
  useEffect(() => {
    let lastTime = performance.now()
    let frames = 0

    const calculateFPS = () => {
      frames++
      const currentTime = performance.now()
      const delta = currentTime - lastTime

      if (delta >= 1000) {
        setFps(Math.round((frames * 1000) / delta))
        frames = 0
        lastTime = currentTime
      }

      requestAnimationFrame(calculateFPS)
    }

    const animationId = requestAnimationFrame(calculateFPS)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <AnimatePresence>
      {showHUD && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed top-20 right-6 z-40 space-y-3 pointer-events-none"
        >
          {/* FPS Counter */}
          <div className="glass-panel px-4 py-2 rounded-lg">
            <div className="engineering-text">FPS</div>
            <div className="text-2xl font-bold text-primary font-mono">
              {fps}
            </div>
          </div>

          {/* Camera Position */}
          <div className="glass-panel px-4 py-3 rounded-lg space-y-2">
            <div className="engineering-text">Camera Position</div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-white/60">X:</span>
                <span className="text-primary">{cameraPosition[0]}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/60">Y:</span>
                <span className="text-primary">{cameraPosition[1]}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/60">Z:</span>
                <span className="text-primary">{cameraPosition[2]}</span>
              </div>
            </div>
          </div>

          {/* Scene Stats */}
          <div className="glass-panel px-4 py-3 rounded-lg space-y-2">
            <div className="engineering-text">Scene Stats</div>
            <div className="space-y-1">
              <Badge variant="primary" size="sm">
                Triangles: {stats.triangles || 0}
              </Badge>
              <Badge variant="primary" size="sm">
                Draw Calls: {stats.drawCalls || 0}
              </Badge>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="glass-panel px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="status-online" />
              <span className="text-xs font-mono text-white/80">
                Rendering
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
