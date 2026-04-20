import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { Panel } from '@/components/ui'
import { SnapshotCard } from './SnapshotCard'
import { useSceneStore } from '@/store'
import { subscribeToProjectSnapshots } from '@/services/firestore'
import type { SnapshotDoc } from '@/services/firestore'

interface SnapshotGalleryProps {
  projectId: string
  onSnapshotClick?: (snapshot: SnapshotDoc) => void
}

export function SnapshotGallery({ projectId, onSnapshotClick }: SnapshotGalleryProps) {
  const snapshots = useSceneStore((state) => state.snapshots)
  const isLoadingSnapshots = useSceneStore((state) => state.isLoadingSnapshots)
  const setSnapshots = useSceneStore((state) => state.setSnapshots)
  const setIsLoadingSnapshots = useSceneStore((state) => state.setIsLoadingSnapshots)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) {
      return
    }

    // Set loading state
    setIsLoadingSnapshots(true)
    setError(null)

    // Subscribe to real-time snapshot updates
    const unsubscribe = subscribeToProjectSnapshots(projectId, (updatedSnapshots) => {
      setSnapshots(updatedSnapshots)
      setIsLoadingSnapshots(false)
    })

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [projectId, setSnapshots, setIsLoadingSnapshots])

  // Loading state
  if (isLoadingSnapshots && snapshots.length === 0) {
    return (
      <Panel title="Snapshot History" description="3D render captures">
        <div className="flex flex-col items-center justify-center py-12 text-white/60">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">Loading snapshots...</p>
        </div>
      </Panel>
    )
  }

  // Error state
  if (error) {
    return (
      <Panel title="Snapshot History" description="3D render captures">
        <div className="flex flex-col items-center justify-center py-12 text-red-400">
          <AlertCircle className="w-8 h-8 mb-3" />
          <p className="text-sm">{error}</p>
        </div>
      </Panel>
    )
  }

  // Empty state
  if (snapshots.length === 0) {
    return (
      <Panel title="Snapshot History" description="3D render captures">
        <div className="flex flex-col items-center justify-center py-12 text-white/40">
          <ImageIcon className="w-12 h-12 mb-3" />
          <p className="text-sm font-medium mb-1">No snapshots yet</p>
          <p className="text-xs text-center max-w-xs">
            Snapshots will appear here automatically when 3D objects are created
          </p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel
      title="Snapshot History"
      description={`${snapshots.length} snapshot${snapshots.length !== 1 ? 's' : ''}`}
      headerAction={
        isLoadingSnapshots && snapshots.length > 0 ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : null
      }
    >
      <div className="space-y-4">
        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {snapshots.map((snapshot, index) => (
              <motion.div
                key={snapshot.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.2,
                  delay: index < 6 ? index * 0.05 : 0,
                }}
                layout
              >
                <SnapshotCard
                  snapshot={snapshot}
                  onClick={() => onSnapshotClick?.(snapshot)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Info footer */}
        {snapshots.length > 0 && (
          <div className="pt-4 border-t border-white/5">
            <p className="text-xs text-white/40 text-center">
              {isLoadingSnapshots ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Syncing with Firestore...
                </span>
              ) : (
                'Real-time sync active'
              )}
            </p>
          </div>
        )}
      </div>
    </Panel>
  )
}
