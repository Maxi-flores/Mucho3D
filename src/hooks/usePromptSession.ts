import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  createSession,
  appendMessage,
  createGeneration,
} from '@/services/firestore'
import { orchestrateGeneration } from '@/services/ai/generationOrchestrator'
import { StoredMessage, GenerationDoc } from '@/types/firebase'

interface UsePromptSessionReturn {
  sessionId: string | null
  messages: StoredMessage[]
  isGenerating: boolean
  error: string | null
  sendPrompt: (prompt: string) => Promise<GenerationDoc | null>
  initializeSession: (projectId: string) => Promise<void>
}

export function usePromptSession(projectId: string | undefined): UsePromptSessionReturn {
  const { user } = useAuth()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<StoredMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeSession = useCallback(async (projId: string) => {
    if (!user) {
      setError('Must be logged in')
      return
    }

    try {
      setError(null)
      const session = await createSession(projId, user.id)
      setSessionId(session.id)
      setMessages([])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create session'
      setError(errorMsg)
    }
  }, [user])

  const sendPrompt = useCallback(async (prompt: string): Promise<GenerationDoc | null> => {
    if (!user || !projectId) {
      setError('Missing user or project')
      return null
    }

    // Create session if needed
    let sid = sessionId
    if (!sid) {
      const session = await createSession(projectId, user.id)
      sid = session.id
      setSessionId(sid)
    }

    try {
      setError(null)
      setIsGenerating(true)

      // Add user message to session
      const userMessage: StoredMessage = {
        id: 'msg-' + Date.now(),
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      }

      await appendMessage(sid, userMessage)
      setMessages((prev) => [...prev, userMessage])

      // Create generation record (status: pending)
      const generation = await createGeneration(projectId, user.id, prompt, sid)

      // Add initial assistant response while generating
      const assistantMessage: StoredMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: 'Planning your 3D generation...',
        timestamp: new Date(),
        metadata: { generationId: generation.id, status: 'pending' },
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Call real orchestrator to generate and validate plan
      const result = await orchestrateGeneration(projectId, user.id, prompt, sid)

      if (result.success && result.plan) {
        // Plan generated successfully
        const successMessage: StoredMessage = {
          id: 'msg-' + (Date.now() + 2),
          role: 'assistant',
          content: `Generated ${result.plan.objects.length} object(s) with ${result.plan.operations.length} operation(s). Complexity: ${result.plan.metadata?.estimatedComplexity || 'unknown'}`,
          timestamp: new Date(),
          metadata: {
            generationId: generation.id,
            status: 'complete',
            plan: result.plan,
            duration: result.durationMs,
          },
        }
        setMessages((prev) => [...prev, successMessage])
      } else {
        // Plan generation failed
        const errorMessage: StoredMessage = {
          id: 'msg-' + (Date.now() + 2),
          role: 'assistant',
          content: `Generation failed: ${result.error || 'Unknown error'}`,
          timestamp: new Date(),
          metadata: {
            generationId: generation.id,
            status: 'error',
            error: result.error,
          },
        }
        setMessages((prev) => [...prev, errorMessage])
      }

      setIsGenerating(false)

      return generation
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send prompt'
      setError(errorMsg)
      setIsGenerating(false)
      return null
    }
  }, [user, projectId, sessionId])

  return {
    sessionId,
    messages,
    isGenerating,
    error,
    sendPrompt,
    initializeSession,
  }
}
