import { useEffect, useState, useRef, useCallback } from 'react'
import { GenerationJob } from '@/types/generation'

interface JobStatusMessage {
  type: 'subscribed' | 'status'
  jobId?: string
  job?: GenerationJob
  timestamp?: string
}

const WS_URL = import.meta.env.VITE_PROXY_API_URL?.replace('http', 'ws') || 'ws://localhost:8787'

/**
 * Hook for real-time job status updates via WebSocket
 * Automatically connects, subscribes, and cleans up
 */
export function useJobStatusRealtime(
  jobId: string | null,
  onStatusChange?: (job: GenerationJob) => void
): {
  job: GenerationJob | null
  isConnected: boolean
  error: string | null
} {
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const handleMessage = useCallback(
    (data: JobStatusMessage) => {
      if (data.type === 'status' && data.job) {
        setJob(data.job)
        onStatusChange?.(data.job)
      } else if (data.type === 'subscribed') {
        console.log(`[WebSocket] Subscribed to job ${data.jobId}`)
        setError(null)
      }
    },
    [onStatusChange]
  )

  useEffect(() => {
    if (!jobId) return

    try {
      const ws = new WebSocket(`${WS_URL}/ws/jobs`)

      ws.onopen = () => {
        console.log('[WebSocket] Connected')
        setIsConnected(true)
        setError(null)

        // Subscribe to job
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            jobId,
          })
        )
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data) as JobStatusMessage
          handleMessage(message)
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err)
        }
      }

      ws.onerror = (event: Event) => {
        console.error('[WebSocket] Error:', event)
        setError('WebSocket connection error')
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        setIsConnected(false)
      }

      wsRef.current = ws

      return () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'unsubscribe',
              jobId,
            })
          )
          wsRef.current.close()
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect'
      console.error('[WebSocket] Connection failed:', errorMsg)
      setError(errorMsg)
      setIsConnected(false)
    }
  }, [jobId, handleMessage])

  return { job, isConnected, error }
}
