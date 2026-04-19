import { motion } from 'framer-motion'
import { Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import { useSceneStore } from '@/store'
import { Panel, Button } from '@/components/ui'
import { fadeInUp } from '@/lib/animations'

export function ObjectInspector() {
  const selectedObjectId = useSceneStore((state) => state.selectedObjectId)
  const objects = useSceneStore((state) => state.objects)
  const updateObject = useSceneStore((state) => state.updateObject)
  const deleteObject = useSceneStore((state) => state.deleteObject)
  const duplicateObject = useSceneStore((state) => state.duplicateObject)

  const selectedObject = objects.find((obj) => obj.id === selectedObjectId)

  if (!selectedObject) {
    return (
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <Panel title="Properties" description="Select an object to edit">
          <div className="text-white/50 text-sm py-8 text-center">
            No object selected. Click on an object in the viewport to inspect it.
          </div>
        </Panel>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Object Info */}
      <Panel title="Object Info">
        <div className="space-y-4">
          <div>
            <label className="engineering-text mb-2 block text-xs">Name</label>
            <input
              type="text"
              value={selectedObject.name}
              onChange={(e) =>
                updateObject(selectedObject.id, { name: e.target.value })
              }
              className="input-base w-full py-2"
              placeholder="Object name"
            />
          </div>

          <div>
            <label className="engineering-text mb-2 block text-xs">Type</label>
            <div className="px-3 py-2 rounded-lg glass-panel text-white/70 text-sm capitalize">
              {selectedObject.type}
            </div>
          </div>

          <div>
            <label className="engineering-text mb-2 block text-xs">Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedObject.color}
                onChange={(e) =>
                  updateObject(selectedObject.id, { color: e.target.value })
                }
                className="w-12 h-10 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={selectedObject.color}
                onChange={(e) =>
                  updateObject(selectedObject.id, { color: e.target.value })
                }
                className="input-base flex-1 py-2 text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* Position */}
      <Panel title="Transform" description="Position, rotation, scale">
        <div className="space-y-4">
          <div>
            <label className="engineering-text mb-2 block text-xs">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                <div key={axis}>
                  <input
                    type="number"
                    value={selectedObject.position[idx]}
                    onChange={(e) => {
                      const newPos = [...selectedObject.position] as [number, number, number]
                      newPos[idx] = parseFloat(e.target.value) || 0
                      updateObject(selectedObject.id, { position: newPos })
                    }}
                    className="input-base w-full text-xs py-2"
                    placeholder={axis}
                    step="0.1"
                  />
                  <span className="text-xs text-white/50 mt-1 block">{axis}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="engineering-text mb-2 block text-xs">Rotation (Radians)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                <div key={axis}>
                  <input
                    type="number"
                    value={selectedObject.rotation[idx]}
                    onChange={(e) => {
                      const newRot = [...selectedObject.rotation] as [number, number, number]
                      newRot[idx] = parseFloat(e.target.value) || 0
                      updateObject(selectedObject.id, { rotation: newRot })
                    }}
                    className="input-base w-full text-xs py-2"
                    placeholder={axis}
                    step="0.1"
                  />
                  <span className="text-xs text-white/50 mt-1 block">{axis}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="engineering-text mb-2 block text-xs">Scale</label>
            <div className="grid grid-cols-3 gap-2">
              {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                <div key={axis}>
                  <input
                    type="number"
                    value={selectedObject.scale[idx]}
                    onChange={(e) => {
                      const newScale = [...selectedObject.scale] as [number, number, number]
                      newScale[idx] = parseFloat(e.target.value) || 1
                      updateObject(selectedObject.id, { scale: newScale })
                    }}
                    className="input-base w-full text-xs py-2"
                    placeholder={axis}
                    step="0.1"
                    min="0.1"
                  />
                  <span className="text-xs text-white/50 mt-1 block">{axis}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* Actions */}
      <Panel title="Actions">
        <div className="space-y-2">
          <Button
            onClick={() =>
              updateObject(selectedObject.id, { visible: !selectedObject.visible })
            }
            variant="secondary"
            size="sm"
            className="w-full justify-start gap-2"
          >
            {selectedObject.visible ? (
              <>
                <Eye size={16} />
                Hide Object
              </>
            ) : (
              <>
                <EyeOff size={16} />
                Show Object
              </>
            )}
          </Button>

          <Button
            onClick={() => duplicateObject(selectedObject.id)}
            variant="secondary"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Copy size={16} />
            Duplicate
          </Button>

          <Button
            onClick={() => deleteObject(selectedObject.id)}
            variant="danger"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Trash2 size={16} />
            Delete Object
          </Button>
        </div>
      </Panel>
    </motion.div>
  )
}
