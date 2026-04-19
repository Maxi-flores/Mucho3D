import { Router, Request, Response } from 'express'

export const chatRouter = Router()

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  stream?: boolean
  temperature?: number
  top_p?: number
  top_k?: number
}

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, model = 'qwen2.5-coder:latest', stream = false, temperature = 0.3, top_p = 0.9, top_k = 40 } = req.body as ChatRequest

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'messages array required' })
      return
    }

    const ollamaUrl = req.app.locals.ollamaUrl
    const ollamaEndpoint = `${ollamaUrl}/api/chat`

    const ollamaRequest = {
      model,
      messages,
      stream,
      temperature,
      top_p,
      top_k,
    }

    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const response = await fetch(ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ollamaRequest),
      })

      if (!response.ok) {
        res.status(response.status).json({ error: `Ollama error: ${response.statusText}` })
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        res.status(500).json({ error: 'No response body' })
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.trim()) {
              try {
                const json = JSON.parse(line)
                res.write(`data: ${JSON.stringify(json)}\n\n`)
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }

        res.write('data: [DONE]\n\n')
        res.end()
      } catch (err) {
        res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
        res.end()
      }
    } else {
      // Non-streaming response
      const response = await fetch(ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ollamaRequest),
      })

      if (!response.ok) {
        res.status(response.status).json({ error: `Ollama error: ${response.statusText}` })
        return
      }

      const data = await response.json()
      res.json(data)
    }
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Chat request failed' })
  }
})
