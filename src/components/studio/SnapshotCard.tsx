import { motion } from 'framer-motion'
import { Clock, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui'
import type { SnapshotDoc } from '@/services/firestore'
import { format } from 'date-fns'

interface SnapshotCardProps {
  snapshot: SnapshotDoc
  onClick?: () => void
}

export function SnapshotCard({ snapshot, onClick }: SnapshotCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatTimestamp = (timestamp: number) => {
    try {
      const date = new Date(timestamp)
      return format(date, 'MMM d, yyyy h:mm a')
    } catch {
      return 'Unknown date'
    }
  }

  const getImageSrc = () => {
    if (snapshot.fileUrl) {
      return snapshot.fileUrl
    } else if (snapshot.base64Data) {
      return `data:image/${snapshot.format || 'png'};base64,${snapshot.base64Data}`
    }
    return null
  }

  const imageSrc = getImageSrc()

  return (
    <Card
      variant="glass"
      hoverable
      onClick={onClick}
      className="overflow-hidden cursor-pointer group"
    >
      {/* Snapshot Image */}
      <div className="relative aspect-video bg-black/50 rounded-lg overflow-hidden mb-3">
        {imageSrc ? (
          <>
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}
            {imageError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs">Failed to load image</span>
              </div>
            ) : (
              <motion.img
                src={imageSrc}
                alt={snapshot.filename}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                } group-hover:scale-105`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoaded ? 1 : 0 }}
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-xs">No image available</span>
          </div>
        )}

        {/* Overlay badge */}
        {snapshot.metadata?.source && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs text-white/80 font-medium">
              {snapshot.metadata.source}
            </span>
          </div>
        )}
      </div>

      {/* Snapshot Info */}
      <div className="space-y-2">
        {/* Metadata */}
        {snapshot.metadata && (
          <div className="space-y-1">
            {snapshot.metadata.objectType && (
              <p className="text-sm text-white/90 font-medium capitalize">
                {snapshot.metadata.objectType}
              </p>
            )}
            {snapshot.metadata.tool && (
              <p className="text-xs text-white/60">
                Tool: {snapshot.metadata.tool}
              </p>
            )}
          </div>
        )}

        {/* Filename */}
        <p className="text-xs text-white/50 truncate" title={snapshot.filename}>
          {snapshot.filename}
        </p>

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-white/40">
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(snapshot.timestamp)}</span>
        </div>

        {/* Dimensions */}
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span>
            {snapshot.width} × {snapshot.height}
          </span>
          <span>•</span>
          <span>{(snapshot.size / 1024).toFixed(1)} KB</span>
        </div>
      </div>
    </Card>
  )
}
