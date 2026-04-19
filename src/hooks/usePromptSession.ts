import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  createSession,
  getSession,
  appendMessage,
  createGeneration,
  updateGenerationStatus,
} from '@/services/firestore'
import { PromptSessionDoc, StoredMessage, GenerationDoc } from '@/types/firebase'

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

      // TODO: Phase 4 — Call Ollama to generate structured plan
      // For now, simulate response after delay
      setTimeout(async () => {
        try {
          await updateGenerationStatus(
            generation.id,
            'complete',
            { intent: prompt, confidence: 0.8, objects: [] }
          )
        } catch (err) {
          console.error('Failed to update generation:', err)
        }
      }, 1500)

      // Add assistant response
      const assistantMessage: StoredMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: 'Planning your 3D generation...',
        timestamp: new Date(),
        metadata: { generationId: generation.id, status: 'pending' },
      }

      setMessages((prev) => [...prev, assistantMessage])
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
