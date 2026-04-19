import { Router, Request, Response } from 'express'

export const planRouter = Router()

const SCENE_PLANNER_SYSTEM_PROMPT = `You are a 3D scene planning AI for Mucho3D. Convert user prompts into a structured deterministic scene plan.

Output ONLY valid JSON in this exact format:
{
  "schemaVersion": "1.0",
  "intent": "short restatement of the user request",
  "objects": [
    {
      "id": "object_1",
      "name": "Object name",
      "primitive": {
        "type": "box|sphere|cylinder|cone|torus|plane",
        "position": [0, 0, 0],
        "scale": [1, 1, 1],
        "rotation": [0, 0, 0],
        "color": "#RRGGBB",
        "segments": 32
      }
    }
  ],
  "operations": [
    { "type": "transform", "targetId": "object_1", "position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1] },
    { "type": "apply_material", "targetId": "object_1", "metallic": 0, "roughness": 0.5 },
    { "type": "apply_color", "targetId": "object_1", "color": "#RRGGBB" },
    { "type": "export_glb", "targetId": "scene", "filename": "scene.glb" }
  ],
  "constraints": {
    "maxExecutionTimeMs": 30000,
    "requireDeterminism": true,
    "allowUserInteraction": false
  },
  "metadata": {
    "confidence": 0.8,
    "estimatedComplexity": "simple|moderate|complex",
    "notes": "short note"
  }
}

Constraints:
1. ALL numeric values must be safe (not NaN, Infinity)
2. Position/scale in range [-1000, 1000]
3. Colors must be valid hex (#RRGGBB)
4. Only use whitelisted operation types listed above
5. NO prose, NO explanations, ONLY JSON
6. If prompt is ambiguous, use reasonable defaults
7. Always include at least one object`

planRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { prompt, model = 'qwen2.5-coder:latest' } = req.body

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'prompt string required' })
      return
    }

    const ollamaUrl = req.app.locals.ollamaUrl
    const ollamaEndpoint = `${ollamaUrl}/api/generate`

    const ollamaRequest = {
      model,
      system: SCENE_PLANNER_SYSTEM_PROMPT,
      prompt: `User request: "${prompt}"\n\nGenerate scene plan JSON:`,
      stream: false,
      temperature: 0.3,
      top_p: 0.9,
    }

    const response = await fetch(ollamaEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaRequest),
    })

    if (!response.ok) {
      res.status(response.status).json({ error: `Ollama error: ${response.statusText}` })
      return
    }

    const data = await response.json() as { response: string }
    const raw = data.response

    // Extract JSON from response (handle preamble)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.status(400).json({ error: 'No valid JSON in Ollama response', raw: raw.substring(0, 200) })
      return
    }

    const jsonStr = jsonMatch[0]
    const plan = JSON.parse(jsonStr)

    // Basic validation. Full schema validation happens in the frontend compiler.
    if (!plan.objects || !Array.isArray(plan.objects)) {
      res.status(400).json({ error: 'Plan missing objects array' })
      return
    }

    res.json({ success: true, plan, rawResponse: raw })
  } catch (error) {
    console.error('Plan error:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Plan generation failed' })
  }
})
