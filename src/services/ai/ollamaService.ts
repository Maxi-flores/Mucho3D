import { SCENE_PLANNER_SYSTEM_PROMPT, extractJsonFromResponse } from './prompts/scenePlannerPrompt'

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_MODEL = 'mistral'

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
 * Check if Ollama is available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get list of available models
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`)
    if (!response.ok) {
      return []
    }
    const data = await response.json() as { models?: Array<{ name: string }> }
    return data.models?.map((m) => m.name) || []
  } catch {
    return []
  }
}

/**
 * Generate scene plan using Ollama
 * Calls Ollama with strict system prompt to generate JSON plan
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
    // Check Ollama availability
    const available = await isOllamaAvailable()
    if (!available) {
      return {
        success: false,
        error: 'Ollama is not available. Make sure Ollama is running at ' + OLLAMA_URL,
      }
    }

    // Request scene plan from Ollama
    const request: OllamaGenerateRequest = {
      model: DEFAULT_MODEL,
      system: SCENE_PLANNER_SYSTEM_PROMPT,
      prompt: `User request: "${prompt}"\n\nGenerate a 3D scene plan in JSON format.`,
      stream: false,
      temperature: 0.3, // Lower temperature = more deterministic
      top_p: 0.9,
    }

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Ollama request failed: ${response.status} ${response.statusText}`,
        duration: Date.now() - startTime,
      }
    }

    const data = (await response.json()) as OllamaGenerateResponse
    const duration = Date.now() - startTime

    // Extract JSON from response
    const jsonResult = extractJsonFromResponse(data.response)

    if (!jsonResult.success) {
      return {
        success: false,
        rawResponse: data.response,
        error: jsonResult.error,
        duration,
      }
    }

    return {
      success: true,
      rawResponse: data.response,
      jsonResponse: jsonResult.json,
      duration,
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      error: `Ollama service error: ${error}`,
      duration: Date.now() - startTime,
    }
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
