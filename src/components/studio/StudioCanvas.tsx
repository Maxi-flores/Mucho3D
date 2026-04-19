import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useStudioStore } from '@/store/studioStore'
import { NODE_TYPE_CONFIG } from '@/types/studio'
import { Button } from '@/components/ui'

const CANVAS_NODE_SIZE = 160

interface StudioCanvasProps {
  onContextMenu?: (e: React.MouseEvent, x: number, y: number) => void
}

export function StudioCanvas({ onContextMenu }: StudioCanvasProps) {
  const canvasRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)

  const nodes = useStudioStore((state) => state.nodes)
  const filterTags = useStudioStore((state) => state.filterTags)
  const selectedNodeId = useStudioStore((state) => state.selectedNodeId)
  const viewport = useStudioStore((state) => state.viewport)

  const updateNode = useStudioStore((state) => state.updateNode)
  const selectNode = useStudioStore((state) => state.selectNode)
  const panViewport = useStudioStore((state) => state.panViewport)
  const zoomViewport = useStudioStore((state) => state.zoomViewport)

  // Filter nodes by tags
  const visibleNodes =
    filterTags.length === 0
      ? nodes
      : nodes.filter((node) => filterTags.some((tag) => node.tags.includes(tag)))

  // Handle canvas pan with mouse drag (Spacebar + drag or middle mouse)
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.button === 1 || (e.button === 0 && e.shiftKey)) && e.target === canvasRef.current) {
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    },
    []
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && dragStart) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        panViewport(dx * 0.5, dy * 0.5)
        setDragStart({ x: e.clientX, y: e.clientY })
      }

      if (draggedNodeId) {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const x = (e.clientX - rect.left - viewport.x) / viewport.zoom
          const y = (e.clientY - rect.top - viewport.y) / viewport.zoom
          updateNode(draggedNodeId, { position: { x, y } })
        }
      }
    },
    [isDragging, dragStart, draggedNodeId, viewport, panViewport, updateNode]
  )

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
    setDraggedNodeId(null)
  }

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    selectNode(nodeId)
    setDraggedNodeId(nodeId)
  }

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      zoomViewport(viewport.zoom * delta)
    },
    [viewport.zoom, zoomViewport]
  )

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (e.target === canvasRef.current || e.target === containerRef.current) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left - viewport.x) / viewport.zoom
        const y = (e.clientY - rect.top - viewport.y) / viewport.zoom
        onContextMenu?.(e, x, y)
      }
    }
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleCanvasMouseMove as any)
    window.addEventListener('mouseup', handleCanvasMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleCanvasMouseMove as any)
      window.removeEventListener('mouseup', handleCanvasMouseUp)
    }
  }, [isDragging, dragStart, draggedNodeId, handleCanvasMouseMove])

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-gradient-to-br from-black via-black to-gray-900"
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
      onContextMenu={handleCanvasContextMenu}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, #666 0.5px, transparent 0.5px)',
          backgroundSize: '40px 40px',
          transform: `translate(${viewport.x}px, ${viewport.y}px)`,
        }}
      />

      {/* SVG for edges */}
      <svg
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        style={{
          pointerEvents: 'none',
        }}
      >
        {/* Draw edges between linked nodes */}
        {visibleNodes.map((node) =>
          node.linkedTo.map((linkedId) => {
            const linkedNode = nodes.find((n) => n.id === linkedId)
            if (!linkedNode) return null

            const x1 = node.position.x + CANVAS_NODE_SIZE / 2 + viewport.x
            const y1 = node.position.y + CANVAS_NODE_SIZE / 2 + viewport.y
            const x2 = linkedNode.position.x + CANVAS_NODE_SIZE / 2 + viewport.x
            const y2 = linkedNode.position.y + CANVAS_NODE_SIZE / 2 + viewport.y

            return (
              <line
                key={`edge-${node.id}-${linkedId}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#666"
                strokeWidth="1.5"
                opacity="0.6"
                pointerEvents="none"
              />
            )
          })
        )}
      </svg>

      {/* Canvas nodes */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          transition: draggedNodeId ? 'none' : 'transform 200ms ease',
        }}
        className="absolute top-0 left-0"
      >
        {visibleNodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-white/40 mb-4">Canvas is empty</p>
              <p className="text-white/30 text-sm">Right-click to add nodes or use toolbar</p>
            </div>
          </div>
        ) : (
          visibleNodes.map((node) => {
            const config = NODE_TYPE_CONFIG[node.type]
            const isSelected = node.id === selectedNodeId

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute"
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width: CANVAS_NODE_SIZE,
                  height: CANVAS_NODE_SIZE,
                  pointerEvents: 'auto',
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              >
                <div
                  className={`w-full h-full rounded-lg p-3 cursor-move transition-all border-2 ${
                    isSelected ? 'border-white shadow-lg shadow-white/50' : 'border-white/20'
                  }`}
                  style={{
                    backgroundColor: config.bg,
                    color: config.text,
                  }}
                >
                  {/* Status indicator */}
                  <div className="flex items-center gap-1 mb-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        node.status === 'locked'
                          ? 'bg-green-400'
                          : node.status === 'reviewed'
                            ? 'bg-blue-400'
                            : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-xs opacity-75">{config.label}</span>
                  </div>

                  {/* Label */}
                  <p className="text-xs font-semibold truncate mb-1">{node.label}</p>

                  {/* Tags */}
                  {node.tags.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mb-1">
                      {node.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[10px] opacity-60 truncate">
                          #{tag}
                        </span>
                      ))}
                      {node.tags.length > 2 && (
                        <span className="text-[10px] opacity-60">+{node.tags.length - 2}</span>
                      )}
                    </div>
                  )}

                  {/* Connected count */}
                  {node.linkedTo.length > 0 && (
                    <p className="text-[10px] opacity-50">→ {node.linkedTo.length}</p>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Floating toolbar */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 pointer-events-auto">
        <Button size="sm" className="gap-2" onClick={() => selectNode(null)}>
          <Plus className="w-4 h-4" />
          Add Node
        </Button>

        <div className="text-xs text-white/40 px-2 py-1 bg-black/40 rounded">
          {visibleNodes.length} node{visibleNodes.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-6 right-6 text-xs text-white/40 bg-black/40 px-2 py-1 rounded pointer-events-none">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  )
}
