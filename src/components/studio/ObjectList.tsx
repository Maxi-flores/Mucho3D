import { motion } from 'framer-motion'
import { Eye, EyeOff, Trash2, Plus } from 'lucide-react'
import { useSceneStore } from '@/store'
import { Panel, Button } from '@/components/ui'
import { fadeInUp } from '@/lib/animations'

const OBJECT_TYPES = ['box', 'sphere', 'torus', 'cylinder', 'cone'] as const

export function ObjectList() {
  const objects = useSceneStore((state) => state.objects)
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  const selectObject = useSceneStore((state) => state.selectObject)
  const addObject = useSceneStore((state) => state.addObject)
  const updateObject = useSceneStore((state) => state.updateObject)
  const deleteObject = useSceneStore((state) => state.deleteObject)

  const handleAddObject = (type: typeof OBJECT_TYPES[number]) => {
    const newObject = {
      id: `obj-${Date.now()}`,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type as any,
      position: [0, 0, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      scale: [1, 1, 1] as [number, number, number],
      color: '#00A3FF',
      visible: true,
    }
    addObject(newObject)
    selectObject(newObject.id)
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Add Object */}
      <Panel title="Create" description="Add new object">
        <div className="space-y-2">
          {OBJECT_TYPES.map((type) => (
            <Button
              key={type}
              onClick={() => handleAddObject(type)}
              variant="secondary"
              size="sm"
              className="w-full justify-start capitalize"
            >
              <Plus size={14} className="mr-2" />
              {type}
            </Button>
          ))}
        </div>
      </Panel>

      {/* Objects List */}
      <Panel
        title="Objects"
        description={`${objects.length} object${objects.length !== 1 ? 's' : ''}`}
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {objects.length === 0 ? (
            <div className="text-white/50 text-sm py-4 text-center">
              No objects in scene
            </div>
          ) : (
            objects.map((obj) => (
              <motion.div
                key={obj.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => selectObject(obj.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedObjectId === obj.id
                    ? 'glass-panel ring-2 ring-primary'
                    : 'glass-panel hover:bg-surface-bright'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">
                      {obj.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-3 h-3 rounded-full border border-white/50"
                        style={{ backgroundColor: obj.color }}
                      />
                      <span className="text-xs text-white/50 capitalize">
                        {obj.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateObject(obj.id, { visible: !obj.visible })
                      }}
                      className="p-1.5 hover:bg-surface-bright rounded-lg transition-colors"
                      title={obj.visible ? 'Hide' : 'Show'}
                    >
                      {obj.visible ? (
                        <Eye size={14} className="text-white/60" />
                      ) : (
                        <EyeOff size={14} className="text-white/40" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteObject(obj.id)
                        selectObject(null)
                      }}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-400/60" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Panel>
    </motion.div>
  )
}
