import { Constraints } from './constraintParser'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface SceneObjectState {
  id: string
  type: string
  location: [number, number, number]
  scale?: [number, number, number]
}

export interface SceneState {
  objects: SceneObjectState[]
}

export interface PlanStep {
  tool: string
  payload: Record<string, unknown>
  description: string
}

export interface PlannerContext {
  goal: string
  scene: SceneState
  constraints: Constraints
  messages: ChatMessage[]
}

const DEFAULT_PLANNER_MODEL =
  process.env.OLLAMA_PLANNER_MODEL || 'qwen2.5-coder:latest'

const PLANNER_SYSTEM_PROMPT = `You are a 3D planning engine for Mucho3D.

Return ONLY valid JSON as an array of ordered steps:
[
  {
    "tool": "create_primitive|transform_object|import_asset|apply_material",
    "payload": {},
    "description": "short step summary"
  }
]

Rules:
1. Always return an array
2. Never return prose
3. Use only the allowed tools
4. Steps must be spatially consistent
5. Respect constraints for size, mood, and style
6. Use import_asset for named furniture or decor when appropriate
7. Use transform_object for adjustments to existing objects
8. Use apply_material for mood or finish changes
9. Do not include markdown fences`

function extractJSONArray(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fencedMatch?.[1]) {
    const candidate = fencedMatch[1].trim()
    if (candidate.startsWith('[') && candidate.endsWith(']')) {
      return candidate
    }
  }

  const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
  return arrayMatch?.[0] ?? null
}

function validatePlan(value: unknown): PlanStep[] {
  if (!Array.isArray(value)) {
    throw new Error('Planner did not return an array')
  }

  return value.map((step) => {
    if (!step || typeof step !== 'object') {
      throw new Error('Planner step must be an object')
    }

    const record = step as Record<string, unknown>
    if (typeof record.tool !== 'string' || !record.tool) {
      throw new Error('Planner step missing tool')
    }
    if (!record.payload || typeof record.payload !== 'object' || Array.isArray(record.payload)) {
      throw new Error('Planner step missing payload')
    }

    return {
      tool: record.tool,
      payload: record.payload as Record<string, unknown>,
      description:
        typeof record.description === 'string' && record.description
          ? record.description
          : `Execute ${record.tool}`,
    }
  })
}

export async function generatePlan(
  ollamaUrl: string,
  context: PlannerContext
): Promise<PlanStep[]> {
  const planningInput = {
    goal: context.goal,
    scene: context.scene,
    constraints: context.constraints,
    messages: context.messages.slice(-8),
  }

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_PLANNER_MODEL,
      messages: [
        { role: 'system', content: PLANNER_SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(planningInput),
        },
      ],
      stream: false,
      options: {
        temperature: 0,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('[proxy] -> planner non-200 response', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    })
    throw new Error(`Planner error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as {
    message?: { content?: string }
  }
  const raw = typeof data.message?.content === 'string' ? data.message.content : ''
  const json = extractJSONArray(raw)

  if (!json) {
    throw new Error('Planner returned no JSON array')
  }

  return validatePlan(JSON.parse(json))
}

export async function replan(
  ollamaUrl: string,
  context: PlannerContext
): Promise<PlanStep[]> {
  return generatePlan(ollamaUrl, context)
}
