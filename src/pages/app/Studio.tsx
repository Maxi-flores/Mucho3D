import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Play, Pause, RotateCcw, Download, Save, MessageSquare } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Scene3D, EngineeringGrid, WireframeMesh, CameraController, Lights, FloatingHUD, CameraTracker } from '@/components/3d'
import { CommandPalette } from '@/components/ai'
import { ObjectInspector, ObjectList } from '@/components/studio'
import { Panel, Button, Badge } from '@/components/ui'
import { GenerationChat } from '@/features/chat/GenerationChat'
import { useSceneStore } from '@/store'
import { useUIStore } from '@/store'
import { useAuth } from '@/hooks'
import { saveScene } from '@/services/firestore'
import { fadeInUp } from '@/lib/animations'

export function Studio() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')
  const { user } = useAuth()
  const [showChat, setShowChat] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const showGrid = useSceneStore((state) => state.showGrid)
  const toggleGrid = useSceneStore((state) => state.toggleGrid)
  const showWireframe = useSceneStore((state) => state.showWireframe)
  const toggleWireframe = useSceneStore((state) => state.toggleWireframe)
  const showHUD = useSceneStore((state) => state.showHUD)
  const toggleHUD = useSceneStore((state) => state.toggleHUD)
  const isAnimating = useSceneStore((state) => state.isAnimating)
  const setIsAnimating = useSceneStore((state) => state.setIsAnimating)
  const exportAsJSON = useSceneStore((state) => state.exportAsJSON)
  const addToast = useUIStore((state) => state.addToast)
  const objects = useSceneStore((state) => state.objects)
  const camera = useSceneStore((state) => state.camera)
  const showWireframeValue = useSceneStore((state) => state.showWireframe)
  const showGridValue = useSceneStore((state) => state.showGrid)
  const ambientIntensity = useSceneStore((state) => state.ambientIntensity)

  const handleExport = () => {
    const json = exportAsJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scene-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast({
      type: 'success',
      title: 'Scene Exported',
      description: `Exported scene with ${objects.length} object(s)`,
    })
  }

  const handleSave = async () => {
    if (!user || !projectId) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Missing user or project context',
      })
      return
    }

    setIsSaving(true)
    try {
      await saveScene(projectId, user.id, objects, camera, {
        showGrid: showGridValue,
        showWireframe: showWireframeValue,
        ambientIntensity,
      })
      addToast({
        type: 'success',
        title: 'Scene Saved',
        description: `Saved scene with ${objects.length} object(s) to Firestore`,
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save scene'
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: errorMsg,
      })
    } finally {
      setIsSaving(false)
    }
  }

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
              3D Studio <span className="text-primary text-xl">V3</span>
            </h1>
            <p className="text-white/60">
              {projectId ? 'AI-assisted 3D workspace' : 'Professional 3D modeling and visualization workspace'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="success">
              <span className="status-online mr-2" />
              {objects.length} Object{objects.length !== 1 ? 's' : ''}
            </Badge>
            {projectId && (
              <Button
                variant={showChat ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-2"
              >
                <MessageSquare size={16} />
                {showChat ? 'Hide' : 'Chat'}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Main Studio Area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Sidebar - Object Management */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <ObjectList />
          </motion.div>

          {/* Center - 3D Viewport */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Panel
              title="3D Viewport"
              description="Interactive scene editor"
              headerAction={
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAnimating(!isAnimating)}
                    title={isAnimating ? 'Pause animation' : 'Play animation'}
                  >
                    {isAnimating ? <Pause size={16} /> : <Play size={16} />}
                  </Button>
                  <Button variant="ghost" size="sm" title="Reset camera">
                    <RotateCcw size={16} />
                  </Button>
                </div>
              }
            >
              <div className="h-[700px] rounded-lg overflow-hidden bg-background relative">
                <Scene3D>
                  <Lights />
                  {showGrid && <EngineeringGrid />}
                  <WireframeMesh type="torus" />
                  <CameraController />
                  <CameraTracker />
                </Scene3D>
                {showHUD && <FloatingHUD />}
              </div>
            </Panel>
          </motion.div>

          {/* Right Sidebar - Properties & Inspector */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="space-y-6">
              {/* Display Settings */}
              <Panel title="Display" description="View options">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg glass-panel hover:bg-surface-bright cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={toggleGrid}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-white">Engineering Grid</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg glass-panel hover:bg-surface-bright cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={showWireframe}
                      onChange={toggleWireframe}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-white">Wireframe Mode</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg glass-panel hover:bg-surface-bright cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={showHUD}
                      onChange={toggleHUD}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-white">Technical HUD</span>
                  </label>
                </div>
              </Panel>

              {/* Object Inspector */}
              <ObjectInspector />

              {/* Actions */}
              <Panel title="File Operations">
                <div className="space-y-2">
                  <Button
                    onClick={handleSave}
                    variant="primary"
                    size="sm"
                    className="w-full justify-start gap-2"
                    disabled={isSaving || !projectId}
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save to Firestore'}
                  </Button>
                  <Button
                    onClick={handleExport}
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start gap-2"
                  >
                    <Download size={16} />
                    Export as JSON
                  </Button>
                </div>
              </Panel>

              {/* Chat Panel */}
              {projectId && showChat && (
                <div className="h-[600px]">
                  <GenerationChat projectId={projectId} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Studio
