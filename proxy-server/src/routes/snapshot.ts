import { Router, Request, Response } from 'express'
import { z } from 'zod'

export const snapshotRouter = Router()

// Schema for snapshot upload request
const SnapshotUploadSchema = z.object({
  projectId: z.string(),
  generationId: z.string().optional(),
  sceneId: z.string().optional(),
  userId: z.string(),
  filename: z.string(),
  base64Data: z.string(),
  format: z.string(),
  width: z.number(),
  height: z.number(),
  size: z.number(),
  timestamp: z.number(),
  metadata: z.object({
    tool: z.string().optional(),
    objectId: z.string().optional(),
    objectType: z.string().optional(),
    source: z.string().optional(),
  }).optional(),
})

/**
 * Upload snapshot endpoint
 * Receives base64 snapshot data from Blender Worker or Frontend
 * Forwards to frontend for Firebase Storage upload
 */
snapshotRouter.post('/upload', async (req: Request, res: Response) => {
  try {
    const snapshotData = SnapshotUploadSchema.parse(req.body)

    console.log(`[Snapshot] Upload request for project ${snapshotData.projectId}`)

    // In this architecture, the frontend handles Firebase Storage upload
    // This endpoint simply validates and passes through the snapshot data
    // The frontend will call saveSnapshot() from snapshotService.ts which handles the upload

    res.json({
      success: true,
      snapshot: snapshotData,
      message: 'Snapshot data received. Frontend should upload to Firebase Storage.',
    })
  } catch (error) {
    console.error('[Snapshot] Upload error:', error)

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid snapshot data format',
        details: error.issues,
      })
      return
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
})

/**
 * Health check for snapshot service
 */
snapshotRouter.get('/status', (req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'snapshot-upload',
    timestamp: new Date().toISOString(),
  })
})
