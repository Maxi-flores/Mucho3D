import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { initializeFirebase, isFirebaseAvailable } from './lib/firebase'
import { chatRouter } from './routes/chat'
import { planRouter } from './routes/plan'
import { healthRouter } from './routes/health'
import { modelsRouter } from './routes/models'
import { mcpRouter } from './routes/mcp'
import { blenderJobsRouter } from './routes/blenderJobs'

config()

// Initialize Firebase for job persistence
initializeFirebase()

const app = express()
const PORT = parseInt(process.env.PORT || '8787', 10)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MCP_BRIDGE_URL = process.env.MCP_BRIDGE_URL || ''

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.text({ limit: '50mb' }))

// Make Ollama URL available to routes
app.locals.ollamaUrl = OLLAMA_URL
app.locals.mcpBridgeUrl = MCP_BRIDGE_URL

// Routes
app.use('/api/chat', chatRouter)
app.use('/api/generate-plan', planRouter)
app.use('/api/health', healthRouter)
app.use('/api/models', modelsRouter)
app.use('/api/mcp', mcpRouter)
app.use('/api/blender/jobs', blenderJobsRouter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'mucho3d-proxy',
    ollamaUrl: OLLAMA_URL,
    mcpBridgeUrl: MCP_BRIDGE_URL || null,
    firebaseAvailable: isFirebaseAvailable(),
  })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Mucho3D Proxy Server listening on http://localhost:${PORT}`)
  console.log(`📡 Ollama endpoint: ${OLLAMA_URL}`)
  console.log(`🔌 MCP bridge endpoint: ${MCP_BRIDGE_URL || 'not configured'}`)
})
