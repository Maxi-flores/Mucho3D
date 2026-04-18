import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useUIStore } from '@/store'
import type { Toast as ToastType } from '@/types'

const TOAST_DURATION = 3500

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
}

const bgMap = {
  success: 'bg-green-500/10 border-green-500/20',
  error: 'bg-red-500/10 border-red-500/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20',
  info: 'bg-blue-500/10 border-blue-500/20',
}

interface ToastItemProps {
  toast: ToastType
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const Icon = iconMap[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, toast.duration || TOAST_DURATION)

    return () => clearTimeout(timer)
  }, [toast, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', damping: 20 }}
      className={`${bgMap[toast.type]} border rounded-lg px-4 py-3 flex items-start gap-3 min-w-72 max-w-96 backdrop-blur-sm`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colorMap[toast.type]}`} />

      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-medium text-white text-sm">{toast.title}</div>
        )}
        {(toast.message || toast.description) && (
          <div className="text-white/70 text-sm mt-0.5">
            {toast.message || toast.description}
          </div>
        )}
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts)
  const removeToast = useUIStore((state) => state.removeToast)

  return (
    <div className="fixed top-6 right-6 z-50 pointer-events-none">
      <AnimatePresence mode="popLayout">
        <div className="flex flex-col gap-3 pointer-events-auto">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={removeToast}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  )
}
