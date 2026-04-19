import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, RotateCcw, ChevronDown, Settings, Zap, AlertCircle, Check } from 'lucide-react'
import { DashboardLayout } from '@/components/layout'
import { Button, Panel } from '@/components/ui'
import { chatStream, getAvailableModels, isOllamaAvailable } from '@/services/ai/ollamaService'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type ConnectionStatus = 'checking' | 'online' | 'offline'

const STARTER_PROMPTS = [
  'Explain TypeScript generics in simple terms',
  'Write a React hook for fetching data',
  'How does OAuth 2.0 work?',
  'Explain the Promises API',
  'Best practices for REST API design',
]

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking')
  const [models, setModels] = useState<string[]>(['qwen2.5-coder:latest'])
  const [selectedModel, setSelectedModel] = useState('qwen2.5-coder:latest')
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful AI assistant. Provide clear, concise answers.'
  )
  const [showSystemPrompt, setShowSystemPrompt] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Check Ollama availability on mount
  useEffect(() => {
    const checkHealth = async () => {
      setConnectionStatus('checking')
      const available = await isOllamaAvailable()
      setConnectionStatus(available ? 'online' : 'offline')

      if (available) {
        const availableModels = await getAvailableModels()
        setModels(availableModels)
        setSelectedModel(availableModels[0] || 'qwen2.5-coder:latest')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming || connectionStatus === 'offline') return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsStreaming(true)

    // Add assistant placeholder
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      abortControllerRef.current = new AbortController()

      const chatMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
      }))
      chatMessages.push({ role: 'user', content: userMessage.content })

      let fullResponse = ''

      for await (const chunk of chatStream(chatMessages, selectedModel, abortControllerRef.current.signal)) {
        fullResponse += chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1].content = fullResponse
          return updated
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to get response'
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1].content = `Error: ${errorMsg}`
        return updated
      })
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
    }
  }

  const handleReset = () => {
    setMessages([])
    handleStop()
    setInputValue('')
  }

  const handleStarterPrompt = (prompt: string) => {
    setInputValue(prompt)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
        {/* Header with controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Ollama Chat</h1>
            <p className="text-white/60 text-sm">AI-powered chat with real-time streaming</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/10">
              {connectionStatus === 'checking' && (
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              )}
              {connectionStatus === 'online' && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              {connectionStatus === 'offline' && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-white/70 capitalize">
                {connectionStatus === 'checking' ? 'Checking...' : connectionStatus}
              </span>
            </div>

            {/* Model Selector */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                disabled={isStreaming}
                className="px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-sm appearance-none pr-8 cursor-pointer disabled:opacity-50"
              >
                {models.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>

            {/* Control buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={messages.length === 0 || isStreaming}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* System Prompt Editor */}
        <AnimatePresence>
          {showSystemPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Panel className="p-4 bg-black/30">
                <label className="block text-xs font-semibold text-white/70 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  disabled={isStreaming}
                  className="w-full h-24 px-3 py-2 rounded bg-black/50 border border-white/20 text-white text-sm resize-none focus:outline-none focus:border-white/40 disabled:opacity-50"
                  placeholder="System prompt for the AI..."
                />
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Diagnostics Panel */}
        <AnimatePresence>
          {showDiagnostics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Panel className="p-4 bg-black/30">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-white/50">Status</p>
                    <p className="text-white font-mono mt-1">{connectionStatus}</p>
                  </div>
                  <div>
                    <p className="text-white/50">Selected Model</p>
                    <p className="text-white font-mono mt-1 truncate">{selectedModel}</p>
                  </div>
                  <div>
                    <p className="text-white/50">Messages</p>
                    <p className="text-white font-mono mt-1">{messages.length}</p>
                  </div>
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Container */}
        <Panel className="flex-1 overflow-y-auto flex flex-col gap-4 p-4 bg-black/20">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">Start a conversation</h2>
                <p className="text-white/60 text-sm">
                  Ask anything and get real-time streaming responses
                </p>
              </div>

              {connectionStatus === 'offline' && (
                <div className="w-full max-w-md px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-400">
                    Ollama is offline. Check that it's running at localhost:11434
                  </p>
                </div>
              )}

              <div className="w-full max-w-2xl">
                <p className="text-xs text-white/50 mb-3 text-center">Starter prompts</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleStarterPrompt(prompt)}
                      disabled={connectionStatus === 'offline'}
                      className="px-4 py-2 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-left text-sm text-white/80 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={`${message.timestamp}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary/20 border border-primary/40 text-white'
                          : 'bg-black/40 border border-white/10 text-white/90'
                      }`}
                    >
                      <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </>
          )}
        </Panel>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isStreaming || connectionStatus === 'offline'}
            placeholder={
              connectionStatus === 'offline'
                ? 'Ollama is offline...'
                : isStreaming
                  ? 'Waiting for response...'
                  : 'Type your message...'
            }
            className="flex-1 px-4 py-3 rounded-lg bg-black/40 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 disabled:opacity-50"
          />

          {isStreaming ? (
            <Button
              onClick={handleStop}
              className="gap-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-400"
            >
              Stop
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || connectionStatus === 'offline'}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
