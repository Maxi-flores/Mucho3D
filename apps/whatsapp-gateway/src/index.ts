import { Client, LocalAuth, Message } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import express from 'express'
import { config } from 'dotenv'
import { z } from 'zod'

config()

const app = express()
app.use(express.json())

const PORT = parseInt(process.env.WHATSAPP_GATEWAY_PORT || '8791', 10)
const PROXY_SERVER_URL = process.env.PROXY_SERVER_URL || 'http://localhost:8787'
const ADMIN_PHONE = process.env.WHATSAPP_ADMIN_PHONE || '' // Format: 1234567890@c.us

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
})

// Track message states
const processingMessages = new Map<string, { prompt: string; timestamp: number }>()

// QR Code generation for initial setup
client.on('qr', (qr) => {
  console.log('📱 WhatsApp QR Code:')
  qrcode.generate(qr, { small: true })
  console.log('Scan the QR code above with WhatsApp to authenticate')
})

// Client ready
client.on('ready', () => {
  console.log('✅ WhatsApp Client is ready!')
  console.log(`📞 Admin phone: ${ADMIN_PHONE || 'Not configured'}`)
})

// Handle authentication
client.on('authenticated', () => {
  console.log('🔐 WhatsApp Client authenticated')
})

// Handle authentication failure
client.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp authentication failed:', msg)
})

// Handle disconnection
client.on('disconnected', (reason) => {
  console.log('📴 WhatsApp Client disconnected:', reason)
})

// Message handler
client.on('message', async (message: Message) => {
  try {
    // Get message details
    const chat = await message.getChat()
    const contact = await message.getContact()
    const messageBody = message.body.trim()

    // Ignore empty messages
    if (!messageBody) return

    // Ignore messages from self
    if (message.fromMe) return

    // Log incoming message
    console.log(`📨 Message from ${contact.pushname || contact.number}: ${messageBody}`)

    // Check if message starts with command prefix (optional)
    const commandPrefix = '/mucho3d'
    let prompt = messageBody

    // If command prefix is used, extract the prompt
    if (messageBody.toLowerCase().startsWith(commandPrefix)) {
      prompt = messageBody.slice(commandPrefix.length).trim()
      if (!prompt) {
        await message.reply('Please provide a prompt after the command. Example: /mucho3d create a red cube')
        return
      }
    }

    // Prevent duplicate processing
    const messageId = message.id._serialized
    if (processingMessages.has(messageId)) {
      console.log(`⏭️  Skipping duplicate message: ${messageId}`)
      return
    }

    // Mark as processing
    processingMessages.set(messageId, { prompt, timestamp: Date.now() })

    // Send acknowledgment
    await message.reply('🎨 Processing your 3D request...')

    // Forward to proxy server
    const response = await forwardToProxyServer(prompt, {
      source: 'whatsapp',
      userId: contact.id._serialized,
      userName: contact.pushname || contact.number,
      messageId: messageId
    })

    // Send response back to WhatsApp
    if (response.success) {
      let replyMessage = '✅ 3D Scene Generated!\n\n'

      if (response.plan) {
        replyMessage += `📋 Plan: ${response.plan.summary || 'Scene created'}\n`
      }

      if (response.result && response.result.objects) {
        replyMessage += `🎯 Objects created: ${response.result.objects.length}\n`
      }

      if (response.sceneUrl) {
        replyMessage += `\n🔗 View: ${response.sceneUrl}`
      }

      await message.reply(replyMessage)
    } else {
      await message.reply(`❌ Error: ${response.error || 'Failed to generate 3D scene'}`)
    }

    // Clean up processing state
    processingMessages.delete(messageId)

  } catch (error) {
    console.error('Error handling WhatsApp message:', error)
    try {
      await message.reply('❌ An error occurred while processing your request. Please try again.')
    } catch (replyError) {
      console.error('Failed to send error message:', replyError)
    }
  }
})

// Forward prompt to proxy server
async function forwardToProxyServer(prompt: string, metadata: {
  source: string
  userId: string
  userName: string
  messageId: string
}): Promise<{
  success: boolean
  plan?: any
  result?: any
  sceneUrl?: string
  error?: string
}> {
  try {
    const response = await fetch(`${PROXY_SERVER_URL}/api/whatsapp/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        metadata
      }),
      signal: AbortSignal.timeout(60000) // 60 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Proxy server error (${response.status}):`, errorText)
      return {
        success: false,
        error: `Server error: ${response.status}`
      }
    }

    const data = await response.json() as {
      success: boolean
      plan?: any
      result?: any
      sceneUrl?: string
      error?: string
    }

    return data

  } catch (error) {
    console.error('Failed to forward to proxy server:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// HTTP Health check endpoint
app.get('/health', (req, res) => {
  const isReady = client.info !== undefined
  res.json({
    ok: isReady,
    service: 'mucho3d-whatsapp-gateway',
    status: isReady ? 'ready' : 'initializing',
    timestamp: new Date().toISOString(),
    proxyServerUrl: PROXY_SERVER_URL
  })
})

// Status endpoint
app.get('/status', async (req, res) => {
  try {
    const state = await client.getState()
    const info = client.info

    res.json({
      connected: state === 'CONNECTED',
      state: state,
      info: info ? {
        pushname: info.pushname,
        platform: info.platform,
        phone: info.wid?.user
      } : null,
      processingCount: processingMessages.size
    })
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get status'
    })
  }
})

// Start WhatsApp client
console.log('🚀 Starting WhatsApp Gateway...')
client.initialize()

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🌐 WhatsApp Gateway HTTP server listening on http://localhost:${PORT}`)
  console.log(`🔗 Proxy server: ${PROXY_SERVER_URL}`)
})
