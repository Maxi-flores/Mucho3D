import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import { chat, ChatServiceResponse, getAvailableModels, isOllamaAvailable } from '@/services/ai/ollamaService'
import { ChatMessage } from '@/types'

export type ChatMode = 'chat' | 'studio' | 'dashboard'

interface ChatInterfaceProps {
  className?: string
  initialMode?: ChatMode
  title?: string
}

const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen3:8b'

function getContextPrompt(mode: ChatMode): string {
  if (mode === 'studio') {
    return 'You are inside a 3D modeling studio. Focus on scene creation.'
  }

  if (mode === 'dashboard') {
    return 'You are inside a project dashboard. Focus on management and data.'
  }

  return 'You are a general AI assistant.'
}

function createMessage(role: ChatMessage['role'], content: string, metadata?: Record<string, unknown>): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: new Date(),
    metadata,
  }
}

export function ChatInterface({
  className,
  initialMode = 'chat',
  title = 'Mucho3D Assistant',
}: ChatInterfaceProps) {
  const [mode, setMode] = useState<ChatMode>(initialMode)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [models, setModels] = useState<string[]>([DEFAULT_MODEL])
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkHealth = async () => {
      setConnectionStatus('checking')
      const available = await isOllamaAvailable()
      setConnectionStatus(available ? 'online' : 'offline')

      if (available) {
        const nextModels = await getAvailableModels()
        setModels(nextModels)
        setSelectedModel((current: string) => nextModels.includes(current) ? current : (nextModels[0] || DEFAULT_MODEL))
      }
    }

    checkHealth()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const handleSend = async () => {
    if (!input.trim() || isThinking || connectionStatus === 'offline') return

    const userMessage = createMessage('user', input.trim(), { mode })
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsThinking(true)
    setError(null)

    try {
      const contextualMessages = [
        {
          role: 'system',
          content: getContextPrompt(mode),
        },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: userMessage.role,
          content: userMessage.content,
        },
      ]

      const response = await chat(contextualMessages, selectedModel)
      const responseData: ChatServiceResponse | undefined = response.data

      if (!response.success || !responseData) {
        throw new Error(response.error || 'Chat request failed')
      }

      if (responseData.type === 'tool_result') {
        setMessages((prev) => [
          ...prev,
          createMessage(
            'assistant',
            `Executed: ${responseData.tool}`,
            {
              type: responseData.type,
              tool: responseData.tool,
              result: responseData.result,
              logs: responseData.logs,
            }
          ),
        ])
        return
      }

      if (responseData.type === 'text') {
        setMessages((prev) => [
          ...prev,
          createMessage('assistant', responseData.message, { type: responseData.type }),
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        createMessage('assistant', JSON.stringify(responseData), { type: 'unknown' }),
      ])
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to get response'
      setError(message)
      setMessages((prev) => [
        ...prev,
        createMessage('assistant', `Error: ${message}`, { type: 'error' }),
      ])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className={cn('flex flex-col h-full min-h-[420px] rounded-lg border border-white/10 bg-black/20', className)}>
      <div className="border-b border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-white/50">
              {connectionStatus === 'offline' ? 'Assistant offline' : 'Ready'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-medium',
              connectionStatus === 'online' ? 'text-green-400' : connectionStatus === 'offline' ? 'text-red-400' : 'text-yellow-400'
            )}>
              {connectionStatus === 'checking' ? 'Checking...' : connectionStatus}
            </span>
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              disabled={isThinking || connectionStatus !== 'online'}
              className="rounded border border-white/20 bg-black/40 px-2 py-1 text-xs text-white"
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          {(['chat', 'studio', 'dashboard'] as const).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              onClick={() => setMode(nextMode)}
              className={cn(
                'rounded px-3 py-1.5 text-sm transition-colors',
                mode === nextMode
                  ? 'bg-primary/20 text-white border border-primary/40'
                  : 'bg-black/30 text-white/60 border border-white/10 hover:text-white'
              )}
            >
              {nextMode[0].toUpperCase() + nextMode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && !isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full min-h-[240px] items-center justify-center text-center"
            >
              <div>
                <p className="text-white/70">Start a conversation</p>
                <p className="mt-2 text-sm text-white/40">{getContextPrompt(mode)}</p>
              </div>
            </motion.div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap break-words',
                  message.role === 'user'
                    ? 'bg-primary/20 border border-primary/40 text-white'
                    : 'bg-black/40 border border-white/10 text-white/90'
                )}
              >
                {message.content}
              </div>
            </motion.div>
          ))}

          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/70 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Thinking...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSend()
              }
            }}
            disabled={isThinking || connectionStatus === 'offline'}
            placeholder={connectionStatus === 'offline' ? 'Assistant offline...' : 'Type your message...'}
            className="flex-1 rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 disabled:opacity-50"
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!input.trim() || isThinking || connectionStatus === 'offline'}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
