import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Zap, Eye, Clock } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { useStudioStore } from '@/store/studioStore'

interface StudioHeaderProps {
  projectId: string
  projectName: string
  projectStatus: string
  projectTags: string[]
  isDirty: boolean
  isSaving: boolean
  lastSaved?: Date
  nodeCount: number
  onSaveNow?: () => void
  onExecutePipeline?: () => void
  onViewScene?: () => void
}

export function StudioHeader({
  projectName,
  projectStatus,
  projectTags,
  isDirty,
  isSaving,
  lastSaved,
  nodeCount,
  onSaveNow,
  onExecutePipeline,
  onViewScene,
}: StudioHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(projectName)

  const nodes = useStudioStore((state) => state.nodes)

  // Check if project is ready to execute
  const hasObjects = nodes.some((n) => n.type === 'OBJECT' && (n.status === 'reviewed' || n.status === 'locked'))

  const getSaveStateColor = () => {
    if (isSaving) return 'text-yellow-400'
    if (isDirty) return 'text-orange-400'
    return 'text-green-400'
  }

  const getSaveStateText = () => {
    if (isSaving) return 'Saving…'
    if (isDirty) return 'Unsaved changes'
    if (lastSaved) {
      const secondsAgo = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      if (secondsAgo < 60) return `Saved ${secondsAgo}s ago`
      const minutesAgo = Math.floor(secondsAgo / 60)
      if (minutesAgo < 60) return `Saved ${minutesAgo}m ago`
      return `Saved ${Math.floor(minutesAgo / 60)}h ago`
    }
    return 'Saved'
  }

  return (
    <div className="px-6 py-4 border-b border-white/10 bg-black/40">
      <div className="flex items-center justify-between gap-6">
        {/* Left: Project name and metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {isEditingName ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingName(false)
                  if (e.key === 'Escape') {
                    setEditName(projectName)
                    setIsEditingName(false)
                  }
                }}
                className="px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-lg font-bold focus:outline-none focus:border-white/40 w-64"
              />
            ) : (
              <h1
                onClick={() => setIsEditingName(true)}
                className="text-2xl font-bold text-white cursor-pointer hover:text-white/80 transition-colors"
              >
                {projectName}
              </h1>
            )}

            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">{projectStatus}</Badge>

            <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/50">{nodeCount} nodes</Badge>
          </div>

          {/* Tags */}
          {projectTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {projectTags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-1 text-xs bg-black/40 border border-white/10 rounded text-white/70">
                  {tag}
                </span>
              ))}
              {projectTags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-black/40 border border-white/10 rounded text-white/70">
                  +{projectTags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-3">
          {/* Save state */}
          <motion.div
            className={`flex items-center gap-1 text-xs font-medium ${getSaveStateColor()}`}
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ repeat: isSaving ? Infinity : 0, duration: 1 }}
          >
            <Clock className="w-4 h-4" />
            {getSaveStateText()}
          </motion.div>

          {/* Save now button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onSaveNow}
            disabled={!isDirty || isSaving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
          </Button>

          {/* View scene button */}
          <Button size="sm" variant="ghost" onClick={onViewScene} className="gap-2">
            <Eye className="w-4 h-4" />
            View 3D
          </Button>

          {/* Execute pipeline button */}
          <Button
            size="sm"
            onClick={onExecutePipeline}
            disabled={!hasObjects}
            className="gap-2 bg-primary/80 hover:bg-primary disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Execute
          </Button>
        </div>
      </div>
    </div>
  )
}
