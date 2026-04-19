import { Router, Request, Response } from 'express'

export const modelsRouter = Router()

modelsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const ollamaUrl = req.app.locals.ollamaUrl
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      res.status(response.status).json({ error: `Ollama error: ${response.statusText}`, models: [] })
      return
    }

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Models error:', error)
    res.json({
      models: [
        { name: 'qwen2.5-coder:latest', size: 0, digest: '', modified_at: '' },
      ],
      error: error instanceof Error ? error.message : 'Could not fetch models',
    })
  }
})
