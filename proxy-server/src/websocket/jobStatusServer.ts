import WebSocket, { WebSocketServer } from 'ws'
import { Server } from 'http'
import { GenerationJob } from '../services/jobService'

interface JobSubscription {
  jobId: string
  ws: WebSocket
}

interface JobStatusMessage {
  type: 'subscribe' | 'unsubscribe' | 'status'
  jobId?: string
  job?: GenerationJob
  timestamp?: string
}

// Track all active subscriptions
const subscriptions = new Map<string, Set<WebSocket>>()

/**
 * Initialize WebSocket server for real-time job status updates
 */
export function createJobStatusServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/jobs' })

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] Client connected')

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString()) as JobStatusMessage

        if (message.type === 'subscribe' && message.jobId) {
          subscribeToJob(message.jobId, ws)
        } else if (message.type === 'unsubscribe' && message.jobId) {
          unsubscribeFromJob(message.jobId, ws)
        }
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error)
      }
    })

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected')
      // Clean up subscriptions for this client
      subscriptions.forEach(sockets => {
        sockets.delete(ws)
      })
    })

    ws.on('error', (error: Error) => {
      console.error('[WebSocket] Error:', error)
    })
  })

  return wss
}

/**
 * Subscribe a WebSocket client to job status updates
 */
function subscribeToJob(jobId: string, ws: WebSocket) {
  if (!subscriptions.has(jobId)) {
    subscriptions.set(jobId, new Set())
  }

  const sockets = subscriptions.get(jobId)!
  sockets.add(ws)

  console.log(`[WebSocket] Client subscribed to job ${jobId} (${sockets.size} subscribers)`)

  // Send subscription confirmation
  ws.send(
    JSON.stringify({
      type: 'subscribed',
      jobId,
      timestamp: new Date().toISOString(),
    })
  )
}

/**
 * Unsubscribe a WebSocket client from job status updates
 */
function unsubscribeFromJob(jobId: string, ws: WebSocket) {
  const sockets = subscriptions.get(jobId)
  if (sockets) {
    sockets.delete(ws)
    if (sockets.size === 0) {
      subscriptions.delete(jobId)
    }
  }

  console.log(`[WebSocket] Client unsubscribed from job ${jobId}`)
}

/**
 * Broadcast job status update to all subscribed clients
 */
export function broadcastJobStatus(job: GenerationJob) {
  const sockets = subscriptions.get(job.id)
  if (!sockets || sockets.size === 0) return

  const message: JobStatusMessage = {
    type: 'status',
    jobId: job.id,
    job,
    timestamp: new Date().toISOString(),
  }

  const data = JSON.stringify(message)

  let deadSockets: WebSocket[] = []

  sockets.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data, (error: Error | undefined) => {
        if (error) {
          console.error('[WebSocket] Failed to send status update:', error)
          deadSockets.push(ws)
        }
      })
    } else {
      deadSockets.push(ws)
    }
  })

  // Clean up dead connections
  deadSockets.forEach(ws => sockets.delete(ws))
}

/**
 * Get subscriber count for a job
 */
export function getSubscriberCount(jobId: string): number {
  return subscriptions.get(jobId)?.size ?? 0
}

/**
 * Cleanup: close all connections
 */
export function closeJobStatusServer(wss: WebSocketServer) {
  console.log('[WebSocket] Closing server...')
  wss.clients.forEach((client: WebSocket) => {
    client.close()
  })
  wss.close()
}
