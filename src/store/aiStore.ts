import { create } from 'zustand'
import type { Command, ChatMessage } from '@/types'
import { SAMPLE_COMMANDS } from '@/lib/constants'

interface AIState {
  // Commands
  commands: Command[]
  filteredCommands: Command[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterCommands: (query: string) => void
  executeCommand: (commandId: string) => void

  // Chat
  messages: ChatMessage[]
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  isThinking: boolean
  setIsThinking: (isThinking: boolean) => void

  // Mode
  mode: 'command' | 'chat'
  setMode: (mode: 'command' | 'chat') => void

  // History
  commandHistory: string[]
  addToHistory: (command: string) => void
}

// Convert sample commands to full Command objects with actions
const createCommands = (): Command[] => {
  return SAMPLE_COMMANDS.map((cmd) => ({
    ...cmd,
    keywords: cmd.keywords ? [...cmd.keywords] : undefined,
    action: () => {
      console.log(`Executing command: ${cmd.label}`)
      // Command actions will be wired up to actual functionality
    },
  }))
}

export const useAIStore = create<AIState>((set, get) => ({
  // Commands
  commands: createCommands(),
  filteredCommands: createCommands(),
  searchQuery: '',
  setSearchQuery: (query) => {
    set({ searchQuery: query })
    get().filterCommands(query)
  },
  filterCommands: (query) => {
    const { commands } = get()
    if (!query.trim()) {
      set({ filteredCommands: commands })
      return
    }

    const lowerQuery = query.toLowerCase()
    const filtered = commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description?.toLowerCase().includes(lowerQuery) ||
        cmd.keywords?.some((keyword) =>
          keyword.toLowerCase().includes(lowerQuery)
        )
    )

    set({ filteredCommands: filtered })
  },
  executeCommand: (commandId) => {
    const { commands } = get()
    const command = commands.find((cmd) => cmd.id === commandId)
    if (command) {
      command.action()
      get().addToHistory(command.label)
    }
  },

  // Chat
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
  isThinking: false,
  setIsThinking: (isThinking) => set({ isThinking }),

  // Mode
  mode: 'command',
  setMode: (mode) => set({ mode }),

  // History
  commandHistory: [],
  addToHistory: (command) =>
    set((state) => ({
      commandHistory: [...state.commandHistory, command].slice(-50), // Keep last 50
    })),
}))
