const PROXY_API_URL = import.meta.env.VITE_PROXY_API_URL || 'http://localhost:8787'
const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5-coder:latest'

/**
 * Ollama service for AI scene planning
 * Handles communication with local Ollama instance
 */

export interface OllamaGenerateRequest {
  model: string
  prompt: string
  system?: string
  stream?: boolean
  temperature?: number
  top_p?: number
  top_k?: number
}

export interface OllamaGenerateResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

/**
 * Check if Ollama is available via proxy
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${PROXY_API_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    const data = (await response.json()) as { ok?: boolean; ollamaReachable?: boolean }
    return data.ollamaReachable || data.ok || false
  } catch {
    return false
  }
}

/**
 * Get list of available models via proxy
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${PROXY_API_URL}/api/models`)
    if (!response.ok) {
      return [DEFAULT_MODEL]
    }
    const data = (await response.json()) as { models?: Array<{ name: string }> }
    return data.models?.map((m) => m.name) || [DEFAULT_MODEL]
  } catch {
    return [DEFAULT_MODEL]
  }
}

/**
 * Generate scene plan using proxy API
 * Calls proxy endpoint which forwards to Ollama
 */
export async function generateScenePlan(prompt: string): Promise<{
  success: boolean
  rawResponse?: string
  jsonResponse?: string
  error?: string
  duration?: number
}> {
  const startTime = Date.now()

  try {
    // Check Ollama availability via proxy
    const available = await isOllamaAvailable()
    if (!available) {
      return {
        success: false,
        error: `Ollama is not available. Make sure Ollama is running at ${OLLAMA_URL}`,
      }
    }

    // Request scene plan from proxy
    const response = await fetch(`${PROXY_API_URL}/api/generate-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: DEFAULT_MODEL,
      }),
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Proxy request failed: ${response.status} ${response.statusText}`,
        duration: Date.now() - startTime,
      }
    }

    const data = (await response.json()) as {
      success?: boolean
      plan?: Record<string, unknown>
      rawResponse?: string
      error?: string
    }
    const duration = Date.now() - startTime

    if (!data.success || !data.plan) {
      return {
        success: false,
        rawResponse: data.rawResponse,
        error: data.error || 'Failed to generate plan',
        duration,
      }
    }

    return {
      success: true,
      rawResponse: data.rawResponse,
      jsonResponse: JSON.stringify(data.plan),
      duration,
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      error: `Scene planning error: ${error}`,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Chat with Ollama via proxy (non-streaming)
 */
export async function chat(
  messages: Array<{ role: string; content: string }>,
  model: string = DEFAULT_MODEL,
  signal?: AbortSignal
): Promise<{
  success: boolean
  content?: string
  error?: string
}> {
  try {
    const response = await fetch(`${PROXY_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model,
        stream: false,
      }),
      signal,
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Chat request failed: ${response.status} ${response.statusText}`,
      }
    }

    const data = (await response.json()) as { message?: { content?: string } }
    return {
      success: true,
      content: data.message?.content || '',
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Chat request failed'
    return {
      success: false,
      error,
    }
  }
}

/**
 * Chat with Ollama via proxy (streaming)
 * Yields response chunks as they arrive
 */
export async function* chatStream(
  messages: Array<{ role: string; content: string }>,
  model: string = DEFAULT_MODEL,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  try {
    const response = await fetch(`${PROXY_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`Chat stream failed: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6)
          if (jsonStr === '[DONE]') return

          try {
            const json = JSON.parse(jsonStr) as { message?: { content?: string } }
            const content = json.message?.content || ''
            if (content) yield content
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Chat stream error'
    throw new Error(error)
  }
}

/**
 * Demo/fallback response when Ollama not configured
 * Returns a simple valid scene plan for testing
 */
export function generateDemoScenePlan(prompt: string): {
  success: boolean
  rawResponse?: string
  jsonResponse?: string
  error?: string
} {
  try {
    // Simple demo plan: create a box
    const plan = {
      schemaVersion: '1.0',
      intent: prompt,
      objects: [
        {
          id: 'obj_1',
          name: 'Generated Object',
          primitive: {
            type: 'box',
            position: [0, 0, 0],
            scale: [1, 1, 1],
            rotation: [0, 0, 0],
            color: '#00A3FF',
          },
        },
      ],
      operations: [],
      metadata: {
        confidence: 0.5,
        estimatedComplexity: 'simple',
        notes: 'Demo plan - Ollama not configured. Replace with real Ollama response.',
      },
    }

    const jsonStr = JSON.stringify(plan, null, 2)
    return {
      success: true,
      rawResponse: jsonStr,
      jsonResponse: jsonStr,
    }
  } catch (err) {
    return {
      success: false,
      error: `Demo plan generation failed: ${err instanceof Error ? err.message : 'unknown'}`,
    }
  }
}
