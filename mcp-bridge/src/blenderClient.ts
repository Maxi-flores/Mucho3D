export interface BlenderWorkerResult {
  success: boolean
  result: unknown
  logs: string[]
  error: string | null
  snapshot?: {
    filename: string
    path: string
    base64: string
    format: string
    width: number
    height: number
    size: number
    timestamp: number
  }
}

const BLENDER_WORKER_URL = process.env.BLENDER_WORKER_URL || 'http://localhost:7860'
const BLENDER_TIMEOUT_MS = Number(process.env.BLENDER_WORKER_TIMEOUT_MS || 30000)

export async function executeInBlender(
  tool: string,
  payload: unknown
): Promise<BlenderWorkerResult> {
  const response = await fetch(`${BLENDER_WORKER_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, payload }),
    signal: AbortSignal.timeout(BLENDER_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Blender worker failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as Partial<BlenderWorkerResult>
  return {
    success: Boolean(data.success),
    result: data.result ?? null,
    logs: Array.isArray(data.logs) ? data.logs : [],
    error: typeof data.error === 'string' ? data.error : null,
  }
}
