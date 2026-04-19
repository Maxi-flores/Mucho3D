import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Circle, Plus } from 'lucide-react'
import { useStudioStore } from '@/store/studioStore'
import { NODE_TYPE_CONFIG, NodeType, SUGGESTED_TAGS } from '@/types/studio'
import { Button } from '@/components/ui'

interface StudioLeftPanelProps {
  onAddNode?: (type: NodeType) => void
  onSelectNode?: (nodeId: string) => void
}

export function StudioLeftPanel({ onAddNode, onSelectNode }: StudioLeftPanelProps) {
  const nodes = useStudioStore((state) => state.nodes)
  const selectedNodeId = useStudioStore((state) => state.selectedNodeId)
  const filterTags = useStudioStore((state) => state.filterTags)

  const selectNode = useStudioStore((state) => state.selectNode)
  const toggleFilterTag = useStudioStore((state) => state.toggleFilterTag)

  const [expandedTypes, setExpandedTypes] = useState<NodeType[]>([
    'CONCEPT',
    'OBJECT',
    'MATERIAL',
    'LIGHT',
    'CAMERA',
  ])

  const nodeTypes: NodeType[] = ['CONCEPT', 'OBJECT', 'MATERIAL', 'LIGHT', 'CAMERA', 'CONSTRAINT', 'NOTE']

  // Count nodes by type
  const nodesByType = nodeTypes.reduce(
    (acc, type) => {
      acc[type] = nodes.filter((n) => n.type === type)
      return acc
    },
    {} as Record<NodeType, typeof nodes>
  )

  // Get all tags across all nodes
  const allTags = Array.from(new Set(nodes.flatMap((n) => n.tags))).sort()

  const toggleTypeExpanded = (type: NodeType) => {
    setExpandedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleNodeClick = (nodeId: string) => {
    selectNode(nodeId)
    onSelectNode?.(nodeId)
  }

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 flex flex-col overflow-hidden bg-black/30 border-r border-white/10"
    >
      {/* Node tree section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          <h2 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Nodes</h2>

          {nodeTypes.map((type) => {
            const typeNodes = nodesByType[type]
            const isExpanded = expandedTypes.includes(type)
            const config = NODE_TYPE_CONFIG[type]

            return (
              <div key={type}>
                <button
                  onClick={() => toggleTypeExpanded(type)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors text-xs"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  />
                  <div
                    className="w-2 h-2 rounded"
                    style={{ backgroundColor: config.bg }}
                  />
                  <span className="text-white/70 font-medium">{config.label}</span>
                  <span className="ml-auto text-white/40 text-[10px]">({typeNodes.length})</span>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 pl-6 py-1">
                        {typeNodes.map((node) => (
                          <button
                            key={node.id}
                            onClick={() => handleNodeClick(node.id)}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all ${
                              selectedNodeId === node.id
                                ? 'bg-white/20 text-white'
                                : 'text-white/70 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Circle
                                className={`w-2 h-2 flex-shrink-0 ${
                                  node.status === 'locked'
                                    ? 'fill-green-400 text-green-400'
                                    : node.status === 'reviewed'
                                      ? 'fill-blue-400 text-blue-400'
                                      : 'fill-gray-400 text-gray-400'
                                }`}
                              />
                              <span className="truncate">{node.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tag filter section */}
      <div className="border-t border-white/10 p-4">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-3">Tags</h3>

        {allTags.length === 0 ? (
          <p className="text-xs text-white/40">No tags used yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const isActive = filterTags.includes(tag)
              const count = nodes.filter((n) => n.tags.includes(tag)).length

              return (
                <button
                  key={tag}
                  onClick={() => toggleFilterTag(tag)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    isActive
                      ? 'bg-primary/30 text-primary border border-primary/50'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {tag}
                  <span className="opacity-60 ml-1">({count})</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Suggested tags */}
        {allTags.length < SUGGESTED_TAGS.length && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-[10px] text-white/40 mb-2">Suggestions:</p>
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_TAGS.filter((tag) => !allTags.includes(tag))
                .slice(0, 5)
                .map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/30">
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick add buttons */}
      <div className="border-t border-white/10 p-3 space-y-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAddNode?.('CONCEPT')}
          className="w-full justify-start gap-2 text-xs"
        >
          <Plus className="w-3 h-3" />
          Concept
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAddNode?.('OBJECT')}
          className="w-full justify-start gap-2 text-xs"
        >
          <Plus className="w-3 h-3" />
          Object
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAddNode?.('NOTE')}
          className="w-full justify-start gap-2 text-xs"
        >
          <Plus className="w-3 h-3" />
          Note
        </Button>
      </div>
    </motion.div>
  )
}
