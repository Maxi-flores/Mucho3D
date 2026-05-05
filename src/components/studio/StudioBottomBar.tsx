import { Check, ChevronRight, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { useStudioStore } from '@/store/studioStore'
import { GenerationJob } from '@/types/generation'

type PipelineStep = 'concept' | 'structure' | 'validated' | 'executing' | 'complete'

interface StudioBottomBarProps {
  currentStep: PipelineStep
  isExecuting: boolean
  executionError?: string
  executionProgress?: number
  currentJob?: GenerationJob | null
  onExecute?: () => void
}

export function StudioBottomBar({
  currentStep,
  isExecuting,
  executionError,
  executionProgress = 0,
  currentJob,
  onExecute,
}: StudioBottomBarProps) {
  const nodes = useStudioStore((state) => state.nodes)

  const steps: { id: PipelineStep; label: string }[] = [
    { id: 'concept', label: 'Concept' },
    { id: 'structure', label: 'Structure' },
    { id: 'validated', label: 'Validated' },
    { id: 'executing', label: 'Executing' },
    { id: 'complete', label: 'Complete' },
  ]

  const getStepStatus = (step: PipelineStep) => {
    const stepIndex = steps.findIndex((s) => s.id === step)
    const currentIndex = steps.findIndex((s) => s.id === currentStep)

    if (stepIndex < currentIndex || (stepIndex === currentIndex && currentStep === 'complete')) {
      return 'done'
    }
    if (stepIndex === currentIndex) {
      return 'active'
    }
    return 'pending'
  }

  // Check readiness
  const hasObjects = nodes.some((n) => n.type === 'OBJECT' && (n.status === 'reviewed' || n.status === 'locked'))
  const hasLighting = nodes.some((n) => n.type === 'LIGHT' || n.type === 'CAMERA')
  const draftConstraints = nodes.filter((n) => n.type === 'CONSTRAINT' && n.status === 'draft')
  const isReady = hasObjects && hasLighting && draftConstraints.length === 0

  return (
    <div className="border-t border-white/10 bg-black/40 px-6 py-4">
      <div className="flex items-center gap-8 mb-4">
        {/* Pipeline steps */}
        <div className="flex items-center gap-2 flex-1">
          {steps.map((step, idx) => {
            const status = getStepStatus(step.id)

            return (
              <div key={step.id} className="flex items-center gap-2">
                <motion.div
                  animate={{
                    backgroundColor:
                      status === 'done'
                        ? '#10b981'
                        : status === 'active'
                          ? '#3b82f6'
                          : '#6b7280',
                  }}
                  className="relative w-6 h-6 rounded-full flex items-center justify-center"
                >
                  {status === 'done' && <Check className="w-4 h-4 text-white" />}
                  {status === 'active' && (
                    <motion.div
                      animate={{ scale: [0.8, 1.2, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 rounded-full border-2 border-blue-500"
                    />
                  )}
                  {status === 'pending' && <div className="w-2 h-2 rounded-full bg-white/30" />}
                </motion.div>

                <span
                  className={`text-xs font-medium ${
                    status === 'active'
                      ? 'text-blue-400'
                      : status === 'done'
                        ? 'text-green-400'
                        : 'text-white/40'
                  }`}
                >
                  {step.label}
                </span>

                {idx < steps.length - 1 && (
                  <ChevronRight className={`w-4 h-4 mx-1 ${status === 'done' ? 'text-green-400' : 'text-white/20'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Execute button and status */}
        <div className="flex items-center gap-3">
          {isExecuting && (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent" />
            </motion.div>
          )}

          {executionError && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-500/10 border border-red-500/50">
              <span className="text-xs text-red-400">{executionError}</span>
            </div>
          )}

          <Button
            onClick={onExecute}
            disabled={!isReady || isExecuting}
            size="sm"
            className={isReady && !isExecuting ? '' : 'opacity-50 cursor-not-allowed'}
          >
            {isExecuting ? 'Executing...' : 'Execute Pipeline'}
          </Button>

          {!isReady && !isExecuting && (
            <div className="text-xs text-white/40 flex items-center gap-2">
              {!hasObjects && <span>Need OBJECT node</span>}
              {!hasLighting && <span>Need LIGHT/CAMERA</span>}
              {draftConstraints.length > 0 && <span>{draftConstraints.length} draft constraints</span>}
            </div>
          )}
        </div>
      </div>

      {/* Readiness indicator */}
      {currentStep === 'concept' && (
        <div className="text-xs text-white/40">
          <p>
            {isReady
              ? '✓ Project is ready for execution'
              : '○ Complete the requirements above to enable execution'}
          </p>
        </div>
      )}

      {/* Progress bar during execution */}
      {isExecuting && executionProgress > 0 && (
        <div className="mt-2">
          <div className="h-1 bg-black/40 rounded overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${executionProgress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
            />
          </div>
          <p className="text-xs text-white/50 mt-1">{Math.round(executionProgress)}% complete</p>
        </div>
      )}

      {/* Job artifacts display */}
      {currentJob && currentJob.artifacts && currentJob.artifacts.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-white/70">Generated Artifacts</p>
          <div className="flex flex-wrap gap-2">
            {currentJob.artifacts.map((artifact) => (
              <a
                key={artifact.id}
                href={artifact.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-green-500/10 border border-green-500/50 hover:bg-green-500/20 transition-colors"
              >
                <Download className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">
                  {artifact.filename} ({artifact.size ? `${(artifact.size / 1024).toFixed(1)}KB` : 'N/A'})
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Job logs */}
      {currentJob && currentJob.logs && currentJob.logs.length > 0 && currentStep === 'complete' && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-white/50 hover:text-white/70">
            Execution logs ({currentJob.logs.length})
          </summary>
          <div className="mt-1 p-2 rounded bg-black/40 max-h-32 overflow-y-auto font-mono text-[10px] text-white/40">
            {currentJob.logs.slice(-10).map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
