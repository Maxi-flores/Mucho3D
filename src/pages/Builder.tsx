import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  RotateCcw,
  Check,
  AlertCircle,
  Copy,
  Save,
  Zap,
  Box,
  ChevronDown,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button, Panel, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { usePromptBuilderStore } from '@/store/promptBuilderStore'
import { useUIStore } from '@/store/uiStore'
import { PRESETS } from '@/data/presets'
import { generateScenePlan } from '@/services/ai/ollamaService'
import { parseScenePlan } from '@/schema/scenePlan'
import { compilePlan } from '@/services/execution'
import { executeMcpToolCalls } from '@/services/mcp/mcpExecutionService'
import {
  TargetPlatform,
  ObjectType,
  StylePreset,
  ExportFormat,
  TopologyQuality,
  MaterialType,
  TextureResolution,
} from '@/types/promptBuilder'

const OBJECT_TYPES: ObjectType[] = [
  'character',
  'prop',
  'environment',
  'architecture',
  'vehicle',
  'abstract',
  'procedural',
]
const STYLES: StylePreset[] = [
  'realistic',
  'stylized',
  'low-poly',
  'cinematic',
  'game-ready',
  'vfx-ready',
]
const PLATFORMS: TargetPlatform[] = ['blender', 'houdini', 'unity', 'multi']
const EXPORT_FORMATS: ExportFormat[] = ['glb', 'fbx', 'obj', 'usd', 'abc']
const TOPOLOGY_OPTIONS: TopologyQuality[] = ['low', 'medium', 'high', 'subdiv']
const TEXTURE_RESOLUTIONS: TextureResolution[] = ['512', '1024', '2048', '4096']
const MATERIAL_TYPES: MaterialType[] = ['pbr', 'simple', 'procedural']

type BlenderPipelineStage =
  | 'idle'
  | 'planning'
  | 'validating'
  | 'executing'
  | 'complete'
  | 'error'

const CHECKLIST_ITEMS: Record<string, string[]> = {
  blender: [
    'Clean topology with appropriate subdivision',
    'Materials properly assigned and named',
    'UVs unwrapped and seams hidden',
    'Normals baked and smooth shading applied',
    'Origin point centered or at pivot',
    'Object naming convention followed',
    'Textures linked or baked',
    'Lighting setup complete',
    'Render settings optimized',
  ],
  houdini: [
    'Geometry fully procedural and parameter-driven',
    'Attributes properly named and semantic',
    'VEX scripts optimized and commented',
    'Node network organized in subnets',
    'HDAs created for reusability',
    'Simulation stable and convergent',
    'Export USD with proper hierarchy',
    'Documentation of parameters complete',
    'Version control metadata preserved',
  ],
  unity: [
    'Polygon count within budget (< 50k for characters)',
    'Materials compatible with URP/HDRP',
    'Colliders and rigidbodies assigned',
    'LOD groups created if needed',
    'Scale and unit conventions matched',
    'Prefab hierarchy organized',
    'Serialization settings correct',
    'Import settings optimized',
    'Performance tested on target device',
  ],
}

export function Builder() {
  const store = usePromptBuilderStore()
  const { draft } = store
  const { addToast } = useUIStore()

  const [mcpHealth, setMcpHealth] = useState<'checking' | 'healthy' | 'unhealthy'>(
    'checking'
  )
  const [blenderAvailable, setBlenderAvailable] = useState<'checking' | 'available' | 'unavailable'>(
    'checking'
  )
  const [showBlenderPipeline, setShowBlenderPipeline] = useState(false)
  const [blenderStage, setBlenderStage] = useState<BlenderPipelineStage>('idle')
  const [blenderLogs, setBlenderLogs] = useState<string[]>([])
  const [showCollapsedSections, setShowCollapsedSections] = useState<
    Record<string, boolean>
  >({
    geometry: true,
    materials: true,
    animation: false,
    export: true,
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_PROXY_API_URL || 'http://localhost:8787'}/api/health`)
        const data = (await response.json()) as Record<string, unknown>
        setMcpHealth(data.mcpBridgeReachable ? 'healthy' : 'unhealthy')
        setBlenderAvailable(data.blenderReachable ? 'available' : 'unavailable')
      } catch {
        setMcpHealth('unhealthy')
        setBlenderAvailable('unavailable')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(draft.generatedPrompt || '')
      addToast({
        type: 'success',
        title: 'Copied!',
        description: 'Prompt copied to clipboard',
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed',
        description: 'Could not copy to clipboard',
      })
    }
  }

  const handleSavePrompt = () => {
    const finalSpec = {
      ...draft,
      title: draft.title || `Prompt ${new Date().toLocaleDateString()}`,
    }
    store.loadPreset(finalSpec)
    store.savePrompt()
    addToast({
      type: 'success',
      title: 'Saved!',
      description: 'Prompt saved to your library',
    })
  }

  const handleExecuteBlender = async () => {
    if (!draft.userIntent.trim()) return

    if (blenderAvailable !== 'available') {
      setShowBlenderPipeline(true)
      setBlenderStage('error')
      setBlenderLogs([
        'Blender is not available on socket port 9100',
        '',
        'Start Blender with the following command:',
        'blender --background --python-socket 9100',
        '',
        'Or with a specific Blender file:',
        'blender /path/to/file.blend --background --python-socket 9100',
      ])
      return
    }

    setShowBlenderPipeline(true)
    setBlenderStage('planning')
    setBlenderLogs([])
    abortControllerRef.current = new AbortController()

    try {
      const result = await generateScenePlan(draft.userIntent)

      if (!result.success) {
        setBlenderStage('error')
        setBlenderLogs([result.error || 'Failed to generate plan'])
        return
      }

      const parseResult = result.jsonResponse
        ? parseScenePlan(result.jsonResponse)
        : { success: false, error: 'No plan JSON returned' }

      if (!parseResult.success || !parseResult.data) {
        setBlenderStage('error')
        setBlenderLogs([parseResult.error || 'Invalid scene plan'])
        return
      }

      setBlenderStage('validating')
      const compileResult = compilePlan(parseResult.data)

      if (!compileResult.success || !compileResult.payload) {
        setBlenderStage('error')
        setBlenderLogs([compileResult.error || 'Failed to compile'])
        return
      }

      setBlenderStage('executing')
      const startTime = Date.now()

      const executionResult = await executeMcpToolCalls(compileResult.payload, {
        generationId: 'builder-preview',
        projectId: 'builder-preview',
        userId: 'builder-preview',
        allowJsFallback: false,
      })

      const duration = Date.now() - startTime
      setBlenderLogs([
        `Execution completed in ${duration}ms`,
        executionResult.summary || 'Success',
      ])
      setBlenderStage(executionResult.success ? 'complete' : 'error')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setBlenderStage('error')
      setBlenderLogs([errorMsg])
    }
  }

  const selectedChecklist = CHECKLIST_ITEMS[draft.targetPlatform] || CHECKLIST_ITEMS.blender

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Claude 3D Prompt Builder
            </h1>
            <p className="text-white/60 text-sm">
              Generate production-ready 3D prompts for Blender, Houdini & Unity
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/10">
              {mcpHealth === 'checking' && (
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              )}
              {mcpHealth === 'healthy' && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              {mcpHealth === 'unhealthy' && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-white/70 capitalize">
                MCP: {mcpHealth}
              </span>
            </div>

            {draft.targetPlatform === 'blender' && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/10">
                {blenderAvailable === 'checking' && (
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                )}
                {blenderAvailable === 'available' && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {blenderAvailable === 'unavailable' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-white/70 capitalize">
                  Blender: {blenderAvailable}
                </span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => store.clearDraft()}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Main Content - 3 Panel Layout */}
        <div className="flex-1 grid grid-cols-[280px_1fr_280px] gap-4 overflow-hidden">
          {/* LEFT PANEL: Controls */}
          <Panel className="overflow-y-auto bg-black/20 p-4">
            <h2 className="text-sm font-semibold text-white mb-4">Configuration</h2>

            {/* Platform Selector */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-white/70 mb-3">
                Target Platform
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      store.updateDraft({ targetPlatform: p })
                    }
                    className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                      draft.targetPlatform === p
                        ? 'bg-primary text-white shadow-glow'
                        : 'bg-black/40 text-white/60 hover:bg-black/60'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Object Type */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-white/70 mb-3">
                Object Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OBJECT_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => store.updateDraft({ objectType: t })}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      draft.objectType === t
                        ? 'bg-primary/20 border border-primary text-primary'
                        : 'bg-black/40 border border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-white/70 mb-3">
                Style
              </label>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => store.updateDraft({ style: s })}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      draft.style === s
                        ? 'bg-primary text-white'
                        : 'bg-black/40 text-white/60 hover:bg-black/60'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Sections */}
            {['geometry', 'materials', 'animation', 'export'].map((section) => (
              <div
                key={section}
                className="mb-4 border border-white/10 rounded-lg overflow-hidden bg-black/20"
              >
                <button
                  onClick={() =>
                    setShowCollapsedSections((s) => ({
                      ...s,
                      [section]: !s[section],
                    }))
                  }
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/40 transition-colors"
                >
                  <span className="text-xs font-semibold text-white capitalize">
                    {section}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/60 transition-transform ${
                      showCollapsedSections[section] ? '' : '-rotate-90'
                    }`}
                  />
                </button>

                {showCollapsedSections[section] && (
                  <div className="px-3 py-3 border-t border-white/10 space-y-3">
                    {section === 'geometry' && (
                      <>
                        <div>
                          <label className="block text-xs text-white/60 mb-1">
                            Scale
                          </label>
                          <input
                            type="text"
                            value={draft.geometry.scale}
                            onChange={(e) =>
                              store.updateDraft({
                                geometry: {
                                  ...draft.geometry,
                                  scale: e.target.value,
                                },
                              })
                            }
                            className="w-full px-2 py-1 text-xs bg-black/50 border border-white/20 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/60 mb-1">
                            Topology
                          </label>
                          <select
                            value={draft.geometry.topologyQuality}
                            onChange={(e) =>
                              store.updateDraft({
                                geometry: {
                                  ...draft.geometry,
                                  topologyQuality: e.target.value as TopologyQuality,
                                },
                              })
                            }
                            className="w-full px-2 py-1 text-xs bg-black/50 border border-white/20 rounded text-white"
                          >
                            {TOPOLOGY_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.geometry.bevels}
                            onChange={(e) =>
                              store.updateDraft({
                                geometry: {
                                  ...draft.geometry,
                                  bevels: e.target.checked,
                                },
                              })
                            }
                            className="rounded"
                          />
                          Bevels
                        </label>
                      </>
                    )}

                    {section === 'materials' && (
                      <>
                        <div>
                          <label className="block text-xs text-white/60 mb-1">
                            Type
                          </label>
                          <div className="flex gap-2">
                            {MATERIAL_TYPES.map((m) => (
                              <button
                                key={m}
                                onClick={() =>
                                  store.updateDraft({
                                    materials: {
                                      ...draft.materials,
                                      type: m,
                                    },
                                  })
                                }
                                className={`flex-1 px-2 py-1 text-xs rounded ${
                                  draft.materials.type === m
                                    ? 'bg-primary text-white'
                                    : 'bg-black/40 text-white/60'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-white/60 mb-1">
                            Texture Resolution
                          </label>
                          <select
                            value={draft.materials.textureResolution}
                            onChange={(e) =>
                              store.updateDraft({
                                materials: {
                                  ...draft.materials,
                                  textureResolution: e.target.value as TextureResolution,
                                },
                              })
                            }
                            className="w-full px-2 py-1 text-xs bg-black/50 border border-white/20 rounded text-white"
                          >
                            {TEXTURE_RESOLUTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}px
                              </option>
                            ))}
                          </select>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.materials.uvRequired}
                            onChange={(e) =>
                              store.updateDraft({
                                materials: {
                                  ...draft.materials,
                                  uvRequired: e.target.checked,
                                },
                              })
                            }
                            className="rounded"
                          />
                          UVs Required
                        </label>
                      </>
                    )}

                    {section === 'animation' && (
                      <>
                        <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.animation.required}
                            onChange={(e) =>
                              store.updateDraft({
                                animation: {
                                  ...draft.animation,
                                  required: e.target.checked,
                                },
                              })
                            }
                            className="rounded"
                          />
                          Animation Required
                        </label>
                        <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.animation.rigging}
                            onChange={(e) =>
                              store.updateDraft({
                                animation: {
                                  ...draft.animation,
                                  rigging: e.target.checked,
                                },
                              })
                            }
                            className="rounded"
                          />
                          Rigging
                        </label>
                      </>
                    )}

                    {section === 'export' && (
                      <div>
                        <label className="block text-xs text-white/60 mb-2">
                          Format
                        </label>
                        <div className="grid grid-cols-2 gap-1">
                          {EXPORT_FORMATS.map((f) => (
                            <button
                              key={f}
                              onClick={() =>
                                store.updateDraft({ exportFormat: f })
                              }
                              className={`px-2 py-1 text-xs rounded ${
                                draft.exportFormat === f
                                  ? 'bg-primary text-white'
                                  : 'bg-black/40 text-white/60'
                              }`}
                            >
                              {f.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Panel>

          {/* CENTER PANEL: Prompt Workspace */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* User Intent Input */}
            <Panel className="p-4 bg-black/20">
              <label className="block text-xs font-semibold text-white/70 mb-2">
                What do you want to create?
              </label>
              <textarea
                value={draft.userIntent}
                onChange={(e) => store.updateDraft({ userIntent: e.target.value })}
                placeholder="Describe your 3D asset: style, purpose, technical requirements..."
                className="w-full h-16 px-3 py-2 rounded bg-black/50 border border-white/20 text-white text-sm resize-none focus:outline-none focus:border-white/40"
              />
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => store.generatePrompt()}
                  className="flex-1 gap-2"
                  disabled={!draft.userIntent.trim()}
                >
                  <Send className="w-4 h-4" />
                  Generate
                </Button>
                <Button
                  onClick={() => store.optimizeWithAI()}
                  variant="secondary"
                  className="flex-1 gap-2"
                  disabled={!draft.userIntent.trim() || store.isOptimizing}
                >
                  <Zap className="w-4 h-4" />
                  Optimize with AI
                </Button>
              </div>
            </Panel>

            {/* Prompt Output Tabs */}
            {draft.generatedPrompt && (
              <Panel className="flex-1 p-4 bg-black/20 overflow-hidden flex flex-col">
                <Tabs defaultValue="main">
                  <TabsList>
                    <TabsTrigger value="main">Summary</TabsTrigger>
                    {draft.platformVariants.blender && (
                      <TabsTrigger value="blender">Blender</TabsTrigger>
                    )}
                    {draft.platformVariants.houdini && (
                      <TabsTrigger value="houdini">Houdini</TabsTrigger>
                    )}
                    {draft.platformVariants.unity && (
                      <TabsTrigger value="unity">Unity</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="main" className="flex-1 overflow-y-auto mt-3">
                    <pre className="text-xs bg-black/50 p-3 rounded border border-white/10 text-white/70 whitespace-pre-wrap break-words max-h-64">
                      {draft.generatedPrompt}
                    </pre>
                  </TabsContent>

                  {draft.platformVariants.blender && (
                    <TabsContent value="blender" className="flex-1 overflow-y-auto mt-3">
                      <pre className="text-xs bg-black/50 p-3 rounded border border-white/10 text-white/70 whitespace-pre-wrap break-words max-h-64">
                        {draft.platformVariants.blender}
                      </pre>
                    </TabsContent>
                  )}

                  {draft.platformVariants.houdini && (
                    <TabsContent value="houdini" className="flex-1 overflow-y-auto mt-3">
                      <pre className="text-xs bg-black/50 p-3 rounded border border-white/10 text-white/70 whitespace-pre-wrap break-words max-h-64">
                        {draft.platformVariants.houdini}
                      </pre>
                    </TabsContent>
                  )}

                  {draft.platformVariants.unity && (
                    <TabsContent value="unity" className="flex-1 overflow-y-auto mt-3">
                      <pre className="text-xs bg-black/50 p-3 rounded border border-white/10 text-white/70 whitespace-pre-wrap break-words max-h-64">
                        {draft.platformVariants.unity}
                      </pre>
                    </TabsContent>
                  )}
                </Tabs>
              </Panel>
            )}

            {/* Blender MCP Pipeline */}
            {draft.targetPlatform === 'blender' && (
              <Panel className="p-4 bg-black/20">
                <button
                  onClick={() => setShowBlenderPipeline(!showBlenderPipeline)}
                  className="flex items-center gap-2 text-sm font-semibold text-white hover:text-primary transition-colors mb-2"
                >
                  <Box className="w-4 h-4" />
                  Execute in Blender (MCP)
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showBlenderPipeline ? '' : '-rotate-90'
                    }`}
                  />
                </button>

                {showBlenderPipeline && (
                  <div className="mt-3 space-y-2">
                    <Button
                      onClick={handleExecuteBlender}
                      className="w-full gap-2"
                      disabled={blenderStage !== 'idle' || blenderAvailable !== 'available'}
                      title={blenderAvailable !== 'available' ? 'Blender is not available. Start Blender with: blender --background --python-socket 9100' : ''}
                    >
                      <Zap className="w-4 h-4" />
                      Execute Pipeline
                    </Button>

                    {blenderStage !== 'idle' && (
                      <div className="text-xs space-y-2">
                        <div className="p-2 rounded bg-black/50 border border-white/10">
                          <p className="text-white/60">
                            Status:{' '}
                            <span className="text-primary capitalize">
                              {blenderStage}
                            </span>
                          </p>
                        </div>
                        {blenderLogs.length > 0 && (
                          <div className="p-2 rounded bg-black/50 border border-white/10 max-h-32 overflow-y-auto">
                            {blenderLogs.map((log, i) => (
                              <p key={i} className="text-white/60">
                                {log}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            )}
          </div>

          {/* RIGHT PANEL: Actions & Checklist */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Action Buttons */}
            <Panel className="p-4 bg-black/20">
              <h3 className="text-sm font-semibold text-white mb-3">Actions</h3>
              <div className="space-y-2">
                <Button
                  onClick={handleCopyPrompt}
                  variant="secondary"
                  className="w-full gap-2 justify-center"
                  disabled={!draft.generatedPrompt}
                >
                  <Copy className="w-4 h-4" />
                  Copy Prompt
                </Button>
                <Button
                  onClick={handleSavePrompt}
                  variant="secondary"
                  className="w-full gap-2 justify-center"
                  disabled={!draft.generatedPrompt}
                >
                  <Save className="w-4 h-4" />
                  Save Prompt
                </Button>
              </div>
            </Panel>

            {/* Export Checklist */}
            <Panel className="flex-1 p-4 bg-black/20 overflow-y-auto">
              <h3 className="text-sm font-semibold text-white mb-3">
                Export Checklist ({draft.targetPlatform})
              </h3>
              <div className="space-y-2">
                {selectedChecklist.map((item, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-2 text-xs text-white/70 cursor-pointer hover:text-white/90"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 rounded"
                      defaultChecked={false}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </Panel>

            {/* Presets */}
            <Panel className="p-4 bg-black/20">
              <h3 className="text-sm font-semibold text-white mb-3">Presets</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(PRESETS).map(([id, preset]) => (
                  <button
                    key={id}
                    onClick={() => store.loadPreset(preset)}
                    className="w-full text-left px-2 py-1 text-xs rounded bg-black/40 hover:bg-black/60 text-white/70 hover:text-white transition-colors"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

