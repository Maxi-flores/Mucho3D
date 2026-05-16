import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PromptSpec, createEmptySpec } from '@/types/promptBuilder'
import { buildPromptFromSpec } from '@/services/ai/promptOptimizer'
import { v4 as uuidv4 } from 'uuid'

interface PromptBuilderState {
  draft: PromptSpec
  savedPrompts: PromptSpec[]
  isGenerating: boolean
  isOptimizing: boolean

  updateDraft: (updates: Partial<PromptSpec>) => void
  generatePrompt: () => void
  optimizeWithAI: (signal?: AbortSignal) => Promise<void>
  savePrompt: () => void
  loadPreset: (presetId: PromptSpec) => void
  loadSaved: (id: string) => void
  clearDraft: () => void
  deletePrompt: (id: string) => void
}

export const usePromptBuilderStore = create<PromptBuilderState>()(
  persist(
    (set, get) => ({
      draft: createEmptySpec(),
      savedPrompts: [],
      isGenerating: false,
      isOptimizing: false,

      updateDraft: (updates) => {
        set((state) => ({
          draft: {
            ...state.draft,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        }))
        // Auto-generate prompt on change
        setTimeout(() => {
          const { generatePrompt } = get()
          generatePrompt()
        }, 100)
      },

      generatePrompt: () => {
        const { draft } = get()
        const variants = buildPromptFromSpec(draft)
        set({
          draft: {
            ...draft,
            generatedPrompt: variants.main,
            platformVariants: {
              blender: variants.blender,
              houdini: variants.houdini,
              unity: variants.unity,
            },
          },
        })
      },

      optimizeWithAI: async (signal?: AbortSignal) => {
        const { draft } = get()
        set({ isOptimizing: true })
        try {
          const { optimizePromptWithAI } = await import('@/services/ai/promptOptimizer')
          const optimized = await optimizePromptWithAI(draft, signal)
          set((state) => ({
            draft: {
              ...state.draft,
              generatedPrompt: optimized,
            },
          }))
        } catch (error) {
          console.error('Failed to optimize prompt:', error)
        } finally {
          set({ isOptimizing: false })
        }
      },

      savePrompt: () => {
        const { draft, savedPrompts } = get()
        const saved = {
          ...draft,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set({
          savedPrompts: [saved, ...savedPrompts].slice(0, 50), // Keep max 50
          draft: createEmptySpec(),
        })
      },

      loadPreset: (preset: PromptSpec) => {
        set({
          draft: {
            ...preset,
            id: createEmptySpec().id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })
        setTimeout(() => {
          const { generatePrompt } = get()
          generatePrompt()
        }, 0)
      },

      loadSaved: (id: string) => {
        const { savedPrompts } = get()
        const saved = savedPrompts.find((p) => p.id === id)
        if (saved) {
          set({
            draft: {
              ...saved,
              updatedAt: new Date().toISOString(),
            },
          })
          setTimeout(() => {
            const { generatePrompt } = get()
            generatePrompt()
          }, 0)
        }
      },

      clearDraft: () => {
        set({ draft: createEmptySpec() })
      },

      deletePrompt: (id: string) => {
        set((state) => ({
          savedPrompts: state.savedPrompts.filter((p) => p.id !== id),
        }))
      },
    }),
    {
      name: 'mucho3d-prompt-builder',
      version: 1,
    }
  )
)
