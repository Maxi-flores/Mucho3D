import { callMCPTool } from './mcpClient'
import { Constraints, parseConstraints } from './constraintParser'
import {
  ChatMessage,
  PlanStep,
  SceneObjectState,
  SceneState,
  generatePlan,
  replan,
} from './plannerService'

export interface AgentState {
  sessionId: string
  goal: string
  plan: PlanStep[]
  currentStep: number
  constraints: Constraints
  scene: SceneState
  messages: ChatMessage[]
  constraintsChanged: boolean
  updatedAt: string
}

export interface AgentTurnResponse {
  type: 'tool_result' | 'text'
  tool?: string
  result?: unknown
  logs?: string[]
  message?: string
  sessionId: string
}

const sessionStore = new Map<string, AgentState>()

function createEmptyState(sessionId: string): AgentState {
  return {
    sessionId,
    goal: '',
    plan: [],
    currentStep: 0,
    constraints: {},
    scene: { objects: [] },
    messages: [],
    constraintsChanged: false,
    updatedAt: new Date().toISOString(),
  }
}

function getState(sessionId: string): AgentState {
  const existing = sessionStore.get(sessionId)
  if (existing) return existing

  const created = createEmptyState(sessionId)
  sessionStore.set(sessionId, created)
  return created
}

function isContinueMessage(input: string): boolean {
  return /^(continue|next|go on|proceed)$/i.test(input.trim())
}

function updateSceneState(
  scene: SceneState,
  tool: string,
  result: unknown
): void {
  if (!result || typeof result !== 'object') return

  const value = result as Record<string, unknown>
  if (tool === 'create_primitive' || tool === 'import_asset') {
    const location = extractLocation(value)
    const objectId = typeof value.objectId === 'string' ? value.objectId : null
    const objectType =
      typeof value.objectType === 'string'
        ? value.objectType
        : typeof value.query === 'string'
        ? value.query
        : null

    if (!objectId || !objectType || !location) return

    const nextObject: SceneObjectState = {
      id: objectId,
      type: objectType,
      location,
      scale: extractScale(value) || undefined,
    }

    const existingIndex = scene.objects.findIndex((object) => object.id === objectId)
    if (existingIndex >= 0) scene.objects[existingIndex] = nextObject
    else scene.objects.push(nextObject)
    return
  }

  if (tool === 'transform_object') {
    const objectId = typeof value.objectId === 'string' ? value.objectId : null
    if (!objectId) return

    const existing = scene.objects.find((object) => object.id === objectId)
    if (!existing) return

    const location = extractLocation(value)
    const scale = extractScale(value)

    if (location) existing.location = location
    if (scale) existing.scale = scale
  }
}

function extractLocation(value: Record<string, unknown>): [number, number, number] | null {
  const direct = value.location
  if (Array.isArray(direct) && direct.length === 3 && direct.every((item) => typeof item === 'number')) {
    return direct as [number, number, number]
  }

  const object = value.object
  if (object && typeof object === 'object') {
    const nested = (object as Record<string, unknown>).position || (object as Record<string, unknown>).location
    if (Array.isArray(nested) && nested.length === 3 && nested.every((item) => typeof item === 'number')) {
      return nested as [number, number, number]
    }
  }

  const blender = value.blender
  if (blender && typeof blender === 'object') {
    return extractLocation(blender as Record<string, unknown>)
  }

  return null
}

function extractScale(value: Record<string, unknown>): [number, number, number] | null {
  const direct = value.scale
  if (Array.isArray(direct) && direct.length === 3 && direct.every((item) => typeof item === 'number')) {
    return direct as [number, number, number]
  }

  const object = value.object
  if (object && typeof object === 'object') {
    const nested = (object as Record<string, unknown>).scale
    if (Array.isArray(nested) && nested.length === 3 && nested.every((item) => typeof item === 'number')) {
      return nested as [number, number, number]
    }
  }

  const blender = value.blender
  if (blender && typeof blender === 'object') {
    return extractScale(blender as Record<string, unknown>)
  }

  return null
}

function mergeConstraints(
  current: Constraints,
  incoming: Constraints
): Constraints {
  return {
    ...current,
    ...incoming,
  }
}

async function ensurePlan(
  state: AgentState,
  ollamaUrl: string
): Promise<void> {
  if (state.constraintsChanged || state.plan.length === 0) {
    console.log('[proxy] -> replanning agent state')
    state.plan = await replan(ollamaUrl, {
      goal: state.goal,
      scene: state.scene,
      constraints: state.constraints,
      messages: state.messages,
    })
    state.currentStep = 0
    state.constraintsChanged = false
    state.updatedAt = new Date().toISOString()
  }
}

export async function runAgentTurn(options: {
  sessionId: string
  userInput: string
  messages: ChatMessage[]
  ollamaUrl: string
  mcpEndpoint: string
}): Promise<AgentTurnResponse> {
  const state = getState(options.sessionId)
  const parsed = parseConstraints(options.userInput)
  const continueMessage = isContinueMessage(options.userInput)

  state.messages = options.messages

  if (!continueMessage && !parsed.isCorrection) {
    state.goal = options.userInput
    state.constraints = parsed.constraints
    state.scene = state.scene || { objects: [] }
    state.plan = await generatePlan(options.ollamaUrl, {
      goal: state.goal,
      scene: state.scene,
      constraints: state.constraints,
      messages: state.messages,
    })
    state.currentStep = 0
    state.constraintsChanged = false
    state.updatedAt = new Date().toISOString()
  } else if (parsed.isCorrection) {
    state.constraints = mergeConstraints(state.constraints, parsed.constraints)
    state.constraintsChanged = true
    state.updatedAt = new Date().toISOString()
  }

  await ensurePlan(state, options.ollamaUrl)

  if (state.currentStep >= state.plan.length) {
    return {
      type: 'text',
      message: 'Plan complete.',
      sessionId: state.sessionId,
    }
  }

  const step = state.plan[state.currentStep]
  console.log('[proxy] -> executing agent step', step)
  const execution = await callMCPTool(options.mcpEndpoint, step.tool, step.payload)
  updateSceneState(state.scene, step.tool, execution.result)
  state.currentStep += 1
  state.updatedAt = new Date().toISOString()

  return {
    type: 'tool_result',
    tool: step.tool,
    result: execution.result,
    logs: [
      `Agent goal: ${state.goal}`,
      `Executed step ${state.currentStep}/${state.plan.length}: ${step.description}`,
      ...(execution.logs || []),
    ],
    sessionId: state.sessionId,
  }
}
