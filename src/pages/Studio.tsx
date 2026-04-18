import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Grid3x3, Eye, EyeOff } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Scene3D, EngineeringGrid, WireframeMesh, CameraController, Lights, FloatingHUD } from '@/components/3d'
import { CommandPalette } from '@/components/ai'
import { Panel, Button, Badge } from '@/components/ui'
import { useSceneStore } from '@/store'
import { fadeInUp } from '@/lib/animations'

export function Studio() {
  const showGrid = useSceneStore((state) => state.showGrid)
  const toggleGrid = useSceneStore((state) => state.toggleGrid)
  const showWireframe = useSceneStore((state) => state.showWireframe)
  const toggleWireframe = useSceneStore((state) => state.toggleWireframe)
  const showHUD = useSceneStore((state) => state.showHUD)
  const toggleHUD = useSceneStore((state) => state.toggleHUD)
  const isAnimating = useSceneStore((state) => state.isAnimating)
  const setIsAnimating = useSceneStore((state) => state.setIsAnimating)

  return (
    <DashboardLayout>
      <CommandPalette />

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              3D Studio
            </h1>
            <p className="text-white/60">
              Professional 3D modeling and visualization workspace
            </p>
          </div>
          <Badge variant="success">
            <span className="status-online mr-2" />
            Rendering at 60 FPS
          </Badge>
        </motion.div>

        {/* Main Studio Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Viewport - Takes 3 columns */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Panel
              title="Viewport"
              headerAction={
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAnimating(!isAnimating)}
                  >
                    {isAnimating ? <Pause size={16} /> : <Play size={16} />}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <RotateCcw size={16} />
                  </Button>
                </div>
              }
            >
              <div className="h-[600px] rounded-lg overflow-hidden bg-background relative">
                <Scene3D>
                  <Lights />
                  <EngineeringGrid />
                  <WireframeMesh type="torus" />
                  <CameraController />
                </Scene3D>
                <FloatingHUD />
              </div>
            </Panel>
          </motion.div>

          {/* Controls Sidebar - 1 column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Display Settings */}
            <Panel title="Display" description="View options">
              <div className="space-y-3">
                <button
                  onClick={toggleGrid}
                  className="w-full px-4 py-3 text-left rounded-lg glass-panel hover:bg-surface-bright transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Grid3x3 size={18} className="text-primary" />
                    <span className="font-medium text-white">Engineering Grid</span>
                  </div>
                  {showGrid ? (
                    <Eye size={16} className="text-primary" />
                  ) : (
                    <EyeOff size={16} className="text-white/40" />
                  )}
                </button>

                <button
                  onClick={toggleWireframe}
                  className="w-full px-4 py-3 text-left rounded-lg glass-panel hover:bg-surface-bright transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Grid3x3 size={18} className="text-primary" />
                    <span className="font-medium text-white">Wireframe Mesh</span>
                  </div>
                  {showWireframe ? (
                    <Eye size={16} className="text-primary" />
                  ) : (
                    <EyeOff size={16} className="text-white/40" />
                  )}
                </button>

                <button
                  onClick={toggleHUD}
                  className="w-full px-4 py-3 text-left rounded-lg glass-panel hover:bg-surface-bright transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Grid3x3 size={18} className="text-primary" />
                    <span className="font-medium text-white">Technical HUD</span>
                  </div>
                  {showHUD ? (
                    <Eye size={16} className="text-primary" />
                  ) : (
                    <EyeOff size={16} className="text-white/40" />
                  )}
                </button>
              </div>
            </Panel>

            {/* Object Properties */}
            <Panel title="Object" description="Transform">
              <div className="space-y-3">
                <div>
                  <label className="engineering-text mb-2 block">Position</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="X"
                      className="input-base text-xs py-2"
                      defaultValue="0"
                    />
                    <input
                      type="number"
                      placeholder="Y"
                      className="input-base text-xs py-2"
                      defaultValue="0"
                    />
                    <input
                      type="number"
                      placeholder="Z"
                      className="input-base text-xs py-2"
                      defaultValue="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="engineering-text mb-2 block">Rotation</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="X"
                      className="input-base text-xs py-2"
                      defaultValue="0"
                    />
                    <input
                      type="number"
                      placeholder="Y"
                      className="input-base text-xs py-2"
                      defaultValue="0"
                    />
                    <input
                      type="number"
                      placeholder="Z"
                      className="input-base text-xs py-2"
                      defaultValue="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="engineering-text mb-2 block">Scale</label>
                  <input
                    type="number"
                    placeholder="Uniform scale"
                    className="input-base text-xs py-2 w-full"
                    defaultValue="1"
                    step="0.1"
                  />
                </div>
              </div>
            </Panel>

            {/* Actions */}
            <Panel title="Actions">
              <div className="space-y-2">
                <Button variant="primary" size="sm" className="w-full">
                  Export Model
                </Button>
                <Button variant="secondary" size="sm" className="w-full">
                  Save Project
                </Button>
              </div>
            </Panel>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
