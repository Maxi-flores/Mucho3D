import { Router, Request, Response } from 'express'
import { parseConstraints } from '../services/constraintParser'
import { generatePlan } from '../services/plannerService'

export const planRouter = Router()

planRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body as {
      prompt?: string
    }

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'prompt string required' })
      return
    }

    const { constraints } = parseConstraints(prompt)
    const ollamaUrl = req.app.locals.ollamaUrl as string
    const plan = await generatePlan(ollamaUrl, {
      goal: prompt,
      scene: { objects: [] },
      constraints,
      messages: [{ role: 'user', content: prompt }],
    })

    res.json({
      success: true,
      plan,
    })
  } catch (error) {
    console.error('Plan error:', error)
    res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Plan generation failed',
    })
  }
})
