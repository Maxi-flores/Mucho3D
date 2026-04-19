import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useStudioStore } from '@/store/studioStore'
import { NODE_TYPE_CONFIG, NodeType } from '@/types/studio'
import { formatDistanceToNow } from 'date-fns'

interface StudioRightPanelProps {
  projectName: string
  projectDescription: string
  projectTags: string[]
  targetFormat: 'glb' | 'fbx'
  complexityEstimate: 'low' | 'medium' | 'high'
  referenceLinks: string[]
}

export function StudioRightPanel({
  projectName,
  projectDescription,
  projectTags,
  targetFormat,
  complexityEstimate,
  referenceLinks,
}: StudioRightPanelProps) {
  const nodes = useStudioStore((state) => state.nodes)
  const selectedNodeId = useStudioStore((state) => state.selectedNodeId)
  const updateNode = useStudioStore((state) => state.updateNode)
  const selectNode = useStudioStore((state) => state.selectNode)

  const [newTag, setNewTag] = useState('')

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const nodeTypes: NodeType[] = ['CONCEPT', 'OBJECT', 'MATERIAL', 'LIGHT', 'CAMERA', 'CONSTRAINT', 'NOTE']

  if (selectedNode) {
    // Node inspector view
    const config = NODE_TYPE_CONFIG[selectedNode.type]
    const linkedNodes = nodes.filter((n) => selectedNode.linkedTo.includes(n.id))

    return (
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 flex flex-col overflow-hidden bg-black/30 border-l border-white/10"
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div
                className="px-2 py-1 rounded text-xs font-semibold"
                style={{ backgroundColor: config.bg, color: config.text }}
              >
                {config.label}
              </div>
              <button
                onClick={() => selectNode(null)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Label */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Label</label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-white text-sm focus:outline-none focus:border-white/40"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Type</label>
              <select
                value={selectedNode.type}
                onChange={(e) => updateNode(selectedNode.id, { type: e.target.value as NodeType })}
                className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-white text-sm focus:outline-none focus:border-white/40"
              >
                {nodeTypes.map((type) => (
                  <option key={type} value={type}>
                    {NODE_TYPE_CONFIG[type].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Description</label>
              <textarea
                value={selectedNode.description}
                onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-white text-sm resize-none h-20 focus:outline-none focus:border-white/40"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedNode.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      updateNode(selectedNode.id, {
                        tags: selectedNode.tags.filter((t) => t !== tag),
                      })
                    }
                    className="px-2 py-0.5 text-xs rounded bg-primary/30 text-primary border border-primary/50 hover:bg-primary/50 transition-colors"
                  >
                    {tag} ✕
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newTag.trim()) {
                      updateNode(selectedNode.id, {
                        tags: [...selectedNode.tags, newTag.trim()],
                      })
                      setNewTag('')
                    }
                  }}
                  placeholder="Add tag..."
                  className="flex-1 px-2 py-1 rounded bg-black/40 border border-white/20 text-white text-xs focus:outline-none focus:border-white/40"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2">Status</label>
              <div className="flex gap-1">
                {(['draft', 'reviewed', 'locked'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateNode(selectedNode.id, { status })}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      selectedNode.status === status
                        ? 'bg-primary/40 text-primary border border-primary/50'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Linked nodes */}
            {linkedNodes.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Linked to</label>
                <div className="space-y-1">
                  {linkedNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => selectNode(node.id)}
                      className="w-full text-left px-2 py-1 rounded text-xs bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    >
                      {node.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-white/10 pt-3 text-xs text-white/40">
              <p>Created: {formatDistanceToNow(selectedNode.createdAt.toDate(), { addSuffix: true })}</p>
              <p>Updated: {formatDistanceToNow(selectedNode.updatedAt.toDate(), { addSuffix: true })}</p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Project metadata view
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 flex flex-col overflow-hidden bg-black/30 border-l border-white/10"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <h2 className="text-sm font-bold text-white mb-4">Project Info</h2>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Name</label>
            <input
              type="text"
              defaultValue={projectName}
              disabled
              className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-white/60 text-sm focus:outline-none focus:border-white/40 disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Description</label>
            <textarea
              defaultValue={projectDescription}
              disabled
              className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-white/60 text-sm resize-none h-20 focus:outline-none focus:border-white/40 disabled:opacity-50"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {projectTags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded bg-primary/30 text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Target format */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Output Format</label>
            <select
              defaultValue={targetFormat}
              disabled
              className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/20 text-white/60 text-sm focus:outline-none focus:border-white/40 disabled:opacity-50"
            >
              <option value="glb">GLB (Web optimized)</option>
              <option value="fbx">FBX (Blender compatible)</option>
            </select>
          </div>

          {/* Complexity */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-2">Complexity</label>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  disabled
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    complexityEstimate === level
                      ? 'bg-primary/40 text-primary border border-primary/50'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="border-t border-white/10 pt-3 space-y-1 text-xs text-white/40">
            <p>Total nodes: {nodes.length}</p>
            <p>Objects: {nodes.filter((n) => n.type === 'OBJECT').length}</p>
            <p>References: {referenceLinks.length}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
