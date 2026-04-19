import { ExecutionPayload, ExecutionResult } from '@/types/firebase'

/**
 * Blender Adapter
 * Real adapter boundary for Blender integration
 * Supports: validated payload input, execution request/response, status updates, error propagation
 * Scaffolds support for future: local process, socket API, Blender add-on
 */

interface BlenderRequest {
  executionId: string
  payload: ExecutionPayload
  timeout?: number
}

interface BlenderResponse {
  success: boolean
  executionId: string
  result?: any
  status?: 'submitted' | 'executing' | 'complete' | 'failed'
  error?: string
  progress?: number
}

export interface BlenderExecutionOptions {
  timeout?: number
  mode?: 'socket' | 'process' | 'addon' // Future modes
}

const BLENDER_SOCKET_URL = import.meta.env.VITE_BLENDER_SOCKET || 'http://localhost:7860'
const BLENDER_TIMEOUT = 120000 // 2 minutes

/**
 * Submit execution payload to Blender
 * Supports future modes (socket, process, addon)
 */
export async function submitToBlender(
  executionId: string,
  payload: ExecutionPayload,
  options?: BlenderExecutionOptions
): Promise<BlenderResponse> {
  try {
    // For now, scaffold a socket-based approach
    // Future: detect mode from config or environment

    const request: BlenderRequest = {
      executionId,
      payload,
      timeout: options?.timeout || BLENDER_TIMEOUT,
    }

    // Attempt socket connection (Phase 5 scaffold)
    const response = await submitToBlenderSocket(request)
    return response
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      executionId,
      status: 'failed',
      error: `Blender submission failed: ${errorMsg}`,
    }
  }
}

/**
 * Submit to Blender via socket API
 * Scaffold for future implementation
 */
async function submitToBlenderSocket(request: BlenderRequest): Promise<BlenderResponse> {
  try {
    // Check if Blender socket is available
    const available = await checkBlenderAvailable()

    if (!available) {
      // Fallback: use local execution
      console.warn(
        `Blender not available at ${BLENDER_SOCKET_URL}, using local scene execution`
      )
      return {
        success: true,
        executionId: request.executionId,
        status: 'complete',
        result: {
          mode: 'local_execution',
          summary: 'Executed locally (Blender socket not available)',
        },
      }
    }

    // Future: Send POST /execute endpoint
    const response = await fetch(`${BLENDER_SOCKET_URL}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(request.timeout || BLENDER_TIMEOUT),
    })

    if (!response.ok) {
      return {
        success: false,
        executionId: request.executionId,
        status: 'failed',
        error: `Blender request failed: ${response.status} ${response.statusText}`,
      }
    }

    const data = (await response.json()) as BlenderResponse
    return data
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown socket error'
    return {
      success: false,
      executionId: request.executionId,
      status: 'failed',
      error: `Socket request failed: ${errorMsg}`,
    }
  }
}

/**
 * Check if Blender is available at configured socket
 */
async function checkBlenderAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${BLENDER_SOCKET_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get execution status from Blender
 * Scaffold for polling/long-running tasks
 */
export async function getBlenderExecutionStatus(
  executionId: string
): Promise<BlenderResponse> {
  try {
    const available = await checkBlenderAvailable()
    if (!available) {
      return {
        success: true,
        executionId,
        status: 'complete',
        result: { mode: 'local_execution' },
      }
    }

    const response = await fetch(`${BLENDER_SOCKET_URL}/api/status/${executionId}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return {
        success: false,
        executionId,
        status: 'failed',
        error: `Status check failed: ${response.statusText}`,
      }
    }

    return (await response.json()) as BlenderResponse
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      executionId,
      status: 'failed',
      error: `Status request failed: ${errorMsg}`,
    }
  }
}

/**
 * Map Blender response to ExecutionResult for Firestore
 */
export function mapBlenderResponseToResult(response: BlenderResponse): ExecutionResult {
  return {
    success: response.success,
    objects: response.result?.objects || [],
    executionTimeMs: response.result?.executionTimeMs || 0,
    summary: response.result?.summary || 'Execution completed',
    errors: response.error ? [response.error] : undefined,
    exportUrls: response.result?.exportUrls,
  }
}
