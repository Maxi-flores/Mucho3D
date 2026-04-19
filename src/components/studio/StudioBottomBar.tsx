import { Check, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { useStudioStore } from '@/store/studioStore'

type PipelineStep = 'concept' | 'structure' | 'validated' | 'executing' | 'complete'

interface StudioBottomBarProps {
  currentStep: PipelineStep
  isExecuting: boolean
  executionError?: string
  onExecute?: () => void
}

export function StudioBottomBar({
  currentStep,
  isExecuting,
  executionError,
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
    </div>
  )
}
