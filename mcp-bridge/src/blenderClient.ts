import * as net from 'node:net'

export interface BlenderSocketResponse {
  raw: string
  parsed: unknown
}

export interface BlenderSocketRequest {
  tool: string
  payload: unknown
}

const BLENDER_HOST = process.env.BLENDER_BRIDGE_HOST || '127.0.0.1'
const BLENDER_PORT = Number(process.env.BLENDER_BRIDGE_PORT || 9100)
const BLENDER_TIMEOUT_MS = Number(process.env.BLENDER_BRIDGE_TIMEOUT_MS || 3000)

function unreachableError(): Error {
  return new Error(`Blender bridge not reachable on ${BLENDER_HOST}:${BLENDER_PORT}`)
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export async function callBlender(
  tool: string,
  payload: unknown
): Promise<BlenderSocketResponse> {
  const request: BlenderSocketRequest = { tool, payload }

  console.log(`[mcp] -> sending to Blender ${tool} ${safeStringify(payload)}`)

  return await new Promise<BlenderSocketResponse>((resolve, reject) => {
    const socket = new net.Socket()
    const chunks: Buffer[] = []
    let settled = false

    const finishReject = (error: Error): void => {
      if (settled) return
      settled = true
      reject(error)
    }

    const finishResolve = (value: BlenderSocketResponse): void => {
      if (settled) return
      settled = true
      resolve(value)
    }

    socket.setTimeout(BLENDER_TIMEOUT_MS)

    socket.once('connect', () => {
      socket.write(JSON.stringify(request))
      socket.end()
    })

    socket.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    socket.once('timeout', () => {
      console.error('[mcp] !! Blender timeout')
      socket.destroy()
      finishReject(unreachableError())
    })

    socket.once('error', (error: Error) => {
      console.error(`[mcp] !! Blender socket error ${error.message}`)
      finishReject(unreachableError())
    })

    socket.once('close', (hadError: boolean) => {
      if (settled || hadError) return

      const raw = Buffer.concat(chunks).toString('utf8').trim()
      let parsed: unknown = null

      if (raw.length > 0) {
        try {
          parsed = JSON.parse(raw)
        } catch {
          parsed = raw
        }
      }

      console.log(`[mcp] <- Blender response ${safeStringify(parsed ?? raw)}`)
      finishResolve({
        raw,
        parsed,
      })
    })

    socket.connect(BLENDER_PORT, BLENDER_HOST)
  })
}
