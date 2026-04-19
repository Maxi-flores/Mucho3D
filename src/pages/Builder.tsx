import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, RotateCcw, Code, Check, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button, Panel } from '@/components/ui'
import { generateScenePlan } from '@/services/ai/ollamaService'
import { parseScenePlan, ScenePlan } from '@/schema/scenePlan'
import { compilePlan } from '@/services/execution'
import { executeMcpToolCalls } from '@/services/mcp/mcpExecutionService'
import { MCPToolCall } from '@/services/mcp/toolRegistry'
import { getMcpBridgeStatus } from '@/services/mcpBridgeService'

type PipelineStage = 'idle' | 'planning' | 'validating' | 'executing' | 'complete' | 'error'

interface ExecutionResult {
  status: 'pending' | 'running' | 'complete' | 'error'
  duration: number
  outputFile?: string
  logs: string[]
  errors?: string[]
}

interface ToolTimelineEntry {
  requestId: string
  tool: string
  status: 'pending' | 'success' | 'error'
  duration?: number
  error?: string
}

const EXAMPLE_PROMPTS = [
  'Create a simple cube with blue color',
  'Build a scene with 3 spheres arranged in a triangle',
  'Generate a cylindrical tower with metallic material',
  'Create a scene with a plane and two boxes',
  'Build a procedural landscape with multiple objects',
]

export function Builder() {
  const [prompt, setPrompt] = useState('')
  const [stage, setStage] = useState<PipelineStage>('idle')
  const [plan, setPlan] = useState<ScenePlan | null>(null)
  const [toolCalls, setToolCalls] = useState<MCPToolCall[]>([])
  const [toolTimeline, setToolTimeline] = useState<ToolTimelineEntry[]>([])
  const [showPlanJson, setShowPlanJson] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [execution, setExecution] = useState<ExecutionResult>({
    status: 'pending',
    duration: 0,
    logs: [],
  })
  const [mcpHealth, setMcpHealth] = useState<'checking' | 'healthy' | 'unhealthy'>('checking')
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Check MCP health on mount
  useEffect(() => {
    const checkMcpHealth = async () => {
      try {
        const data = await getMcpBridgeStatus()
        setMcpHealth(data.reachable ? 'healthy' : 'unhealthy')
      } catch {
        setMcpHealth('unhealthy')
      }
    }

    checkMcpHealth()
    const interval = setInterval(checkMcpHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return

    setIsLoading(true)
    setStage('planning')
    setPlan(null)
    setToolCalls([])
    setToolTimeline([])
    setValidationErrors([])
    setExecution({ status: 'pending', duration: 0, logs: [] })

    try {
      abortControllerRef.current = new AbortController()

      // Step 1: Generate plan
      const result = await generateScenePlan(prompt)

      if (!result.success) {
        setStage('error')
        setExecution(prev => ({
          ...prev,
          status: 'error',
          errors: [result.error || 'Failed to generate plan'],
          logs: result.rawResponse ? [result.rawResponse] : [],
        }))
        return
      }

      const parseResult = result.jsonResponse
        ? parseScenePlan(result.jsonResponse)
        : { success: false, error: 'No plan JSON returned' }

      if (!parseResult.success || !parseResult.data) {
        setStage('error')
        setValidationErrors([parseResult.error || 'Invalid scene plan'])
        setExecution(prev => ({
          ...prev,
          status: 'error',
          errors: [parseResult.error || 'Invalid scene plan'],
          logs: result.rawResponse ? [result.rawResponse] : [],
        }))
        return
      }

      const planData = parseResult.data
      setPlan(planData)
      setExecution(prev => ({
        ...prev,
        logs: result.rawResponse ? [result.rawResponse] : [],
      }))

      // Step 2: Validate
      setStage('validating')
      const compileResult = compilePlan(planData)

      if (!compileResult.success || !compileResult.payload) {
        const error = compileResult.error || 'Failed to compile MCP tool calls'
        setValidationErrors([error])
        setStage('error')
        return
      }

      const compiledToolCalls = compileResult.payload.toolCalls
      setToolCalls(compiledToolCalls)
      setToolTimeline(compiledToolCalls.map((call) => ({
        requestId: call.requestId,
        tool: call.tool,
        status: 'pending',
      })))

      // Step 3: Execute
      setStage('executing')
      const startTime = Date.now()

      const executionResult = await executeMcpToolCalls(compileResult.payload, {
        generationId: 'builder-preview',
        projectId: 'builder-preview',
        userId: 'builder-preview',
        allowJsFallback: false,
      })

      const duration = Date.now() - startTime
      const errors = executionResult.errors || []
      setToolTimeline((prev) => prev.map((entry) => ({
        ...entry,
        status: errors.length > 0 ? 'error' : 'success',
        duration,
        error: errors[0],
      })))
      setExecution(prev => ({
        ...prev,
        status: executionResult.success ? 'complete' : 'error',
        duration,
        errors: executionResult.errors,
        logs: [
          ...prev.logs,
          executionResult.summary || `MCP execution completed in ${duration}ms`,
        ],
      }))

      setStage(executionResult.success ? 'complete' : 'error')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setStage('error')
      setExecution(prev => ({
        ...prev,
        status: 'error',
        errors: [errorMsg],
      }))
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleReset = () => {
    setPrompt('')
    setStage('idle')
    setPlan(null)
    setToolCalls([])
    setToolTimeline([])
    setValidationErrors([])
    setExecution({ status: 'pending', duration: 0, logs: [] })
  }

  const handleExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt)
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">3D Builder</h1>
            <p className="text-white/60 text-sm">AI-to-Blender generation pipeline</p>
          </div>

          <div className="flex items-center gap-3">
            {/* MCP Health */}
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
                MCP: {mcpHealth === 'checking' ? 'Checking...' : mcpHealth}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={stage === 'idle' || isLoading}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Left: Input and Pipeline */}
          <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
            {/* Prompt Input */}
            <Panel className="p-4 bg-black/20">
              <label className="block text-xs font-semibold text-white/70 mb-2">
                Describe your scene
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                disabled={isLoading}
                placeholder="e.g., 'Create a scene with three spheres and a plane...'"
                className="w-full h-20 px-3 py-2 rounded bg-black/50 border border-white/20 text-white text-sm resize-none focus:outline-none focus:border-white/40 disabled:opacity-50 mb-3"
              />

              {stage === 'idle' && (
                <div className="mb-3">
                  <p className="text-xs text-white/50 mb-2">Examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => handleExamplePrompt(ex)}
                        className="px-2 py-1 text-xs rounded bg-black/40 hover:bg-black/60 border border-white/10 text-white/70 hover:text-white transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {isLoading ? (
                  <Button
                    onClick={handleStop}
                    className="flex-1 gap-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400"
                  >
                    Stop
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim()}
                    className="flex-1 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Generate
                  </Button>
                )}
              </div>
            </Panel>

            {/* Pipeline Stages */}
            <Panel className="flex-1 p-4 bg-black/20 overflow-y-auto">
              <h2 className="text-sm font-semibold text-white mb-3">Pipeline</h2>

              <div className="space-y-3">
                {/* Planning Stage */}
                <div
                  className={`p-3 rounded-lg border ${
                    stage === 'planning'
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : stage === 'complete' || ['validating', 'executing', 'complete', 'error'].includes(stage)
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {stage === 'planning' && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    {['validating', 'executing', 'complete'].includes(stage) && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {stage === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    {!['planning', 'validating', 'executing', 'complete', 'error'].includes(stage) && (
                      <div className="w-2 h-2 rounded-full bg-white/30" />
                    )}
                    <span className="text-sm font-medium text-white">Planning</span>
                  </div>
                  {stage === 'planning' && (
                    <p className="text-xs text-white/60 ml-4">Generating scene plan from prompt...</p>
                  )}
                </div>

                {/* Validation Stage */}
                <div
                  className={`p-3 rounded-lg border ${
                    stage === 'validating'
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : stage === 'complete' || ['executing', 'complete'].includes(stage)
                        ? 'bg-green-500/10 border-green-500/50'
                        : stage === 'error' && validationErrors.length > 0
                          ? 'bg-red-500/10 border-red-500/50'
                          : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {stage === 'validating' && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    {(stage === 'executing' || stage === 'complete') && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {stage === 'error' && validationErrors.length > 0 && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    {!['validating', 'executing', 'complete', 'error'].includes(stage) && (
                      <div className="w-2 h-2 rounded-full bg-white/30" />
                    )}
                    <span className="text-sm font-medium text-white">Validation</span>
                  </div>
                  {validationErrors.length > 0 && (
                    <div className="ml-4 mt-2 space-y-1">
                      {validationErrors.map((error, i) => (
                        <p key={i} className="text-xs text-red-400">
                          • {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Execution Stage */}
                <div
                  className={`p-3 rounded-lg border ${
                    stage === 'executing'
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : stage === 'complete'
                        ? 'bg-green-500/10 border-green-500/50'
                        : execution.status === 'error'
                          ? 'bg-red-500/10 border-red-500/50'
                          : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {stage === 'executing' && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                    {stage === 'complete' && <Check className="w-4 h-4 text-green-500" />}
                    {execution.status === 'error' && stage === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    {!['executing', 'complete'].includes(stage) && execution.status !== 'error' && (
                      <div className="w-2 h-2 rounded-full bg-white/30" />
                    )}
                    <span className="text-sm font-medium text-white">Execution</span>
                  </div>
                  {stage === 'executing' && (
                    <p className="text-xs text-white/60 ml-4">Executing validated MCP tool calls...</p>
                  )}
                </div>

                {toolTimeline.length > 0 && (
                  <div className="p-3 rounded-lg border bg-black/40 border-white/10">
                    <p className="text-sm font-medium text-white mb-2">Tool Timeline</p>
                    <div className="space-y-2">
                      {toolTimeline.map((entry) => (
                        <div key={entry.requestId} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-white/70">{entry.tool}</span>
                          <span
                            className={
                              entry.status === 'success'
                                ? 'text-green-400'
                                : entry.status === 'error'
                                  ? 'text-red-400'
                                  : 'text-yellow-400'
                            }
                          >
                            {entry.status}
                            {entry.duration ? ` (${entry.duration}ms)` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* Right: Preview and Results */}
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Plan Preview */}
            {plan && (
              <Panel className="flex-1 p-4 bg-black/20 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Plan Preview</h3>
                  <button
                    onClick={() => setShowPlanJson(!showPlanJson)}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    <Code className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                {showPlanJson ? (
                  <pre className="text-xs bg-black/50 p-2 rounded border border-white/10 text-white/70 overflow-auto max-h-64">
                    {JSON.stringify(plan, null, 2)}
                  </pre>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-white/50">Intent</p>
                      <p className="text-white">{plan.intent}</p>
                    </div>
                    <div>
                      <p className="text-white/50">Objects</p>
                      <p className="text-white">{plan.objects.length} objects</p>
                    </div>
                    <div>
                      <p className="text-white/50">MCP Tool Calls</p>
                      <p className="text-white">{toolCalls.length} validated calls</p>
                    </div>
                    {plan.metadata?.estimatedComplexity && (
                      <div>
                        <p className="text-white/50">Complexity</p>
                        <p className="text-white">{plan.metadata.estimatedComplexity}</p>
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            )}

            {/* Execution Results */}
            {stage !== 'idle' && (
              <Panel className="flex-1 p-4 bg-black/20 overflow-y-auto">
                <h3 className="text-sm font-semibold text-white mb-3">Results</h3>

                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-white/50">Status</p>
                    <p className={execution.status === 'error' ? 'text-red-400' : execution.status === 'complete' ? 'text-green-400' : 'text-white'}>
                      {execution.status}
                    </p>
                  </div>

                  {execution.duration > 0 && (
                    <div>
                      <p className="text-white/50">Duration</p>
                      <p className="text-white">{execution.duration}ms</p>
                    </div>
                  )}

                  {execution.errors && execution.errors.length > 0 && (
                    <div>
                      <p className="text-white/50">Errors</p>
                      <div className="space-y-1 mt-1">
                        {execution.errors.map((err, i) => (
                          <p key={i} className="text-red-400">
                            • {err}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {execution.logs.length > 0 && (
                    <div>
                      <p className="text-white/50 mb-1">Logs</p>
                      <div className="bg-black/50 p-2 rounded border border-white/10 max-h-32 overflow-y-auto">
                        {execution.logs.map((log, i) => (
                          <p key={i} className="text-white/60 whitespace-pre-wrap break-words">
                            {log.substring(0, 200)}
                            {log.length > 200 ? '...' : ''}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
