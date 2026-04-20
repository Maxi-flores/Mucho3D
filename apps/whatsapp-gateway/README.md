# Mucho3D WhatsApp Gateway

WhatsApp integration for Mucho3D that allows users to create 3D scenes by sending messages through WhatsApp.

## Features

- 🔐 QR code authentication for WhatsApp Web
- 📱 Natural language prompt processing
- 🎨 Automatic scene generation via proxy server
- ✅ Status confirmations sent back to users
- 🔄 Persistent session storage

## Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Running instance of `proxy-server` and `mcp-bridge`

### Installation

```bash
cd apps/whatsapp-gateway
npm install
```

### Configuration

Create a `.env` file:

```env
WHATSAPP_GATEWAY_PORT=8791
PROXY_SERVER_URL=http://localhost:8787
WHATSAPP_ADMIN_PHONE=1234567890@c.us
```

### Running

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## First Time Setup

1. Start the gateway: `npm run dev`
2. A QR code will appear in the terminal
3. Open WhatsApp on your phone
4. Go to Settings > Linked Devices > Link a Device
5. Scan the QR code
6. The gateway will authenticate and be ready

## Usage

Users can send messages to the connected WhatsApp number:

```
create a red cube
```

Or with command prefix:
```
/mucho3d create a blue sphere and a green cylinder
```

The gateway will:
1. Acknowledge the message
2. Forward the prompt to the proxy server
3. Generate a 3D scene plan using AI
4. Execute the plan through the MCP bridge
5. Send back a confirmation with a link to view the scene

## Architecture

```
WhatsApp Message
    ↓
WhatsApp Gateway (this service)
    ↓
Proxy Server (/api/whatsapp/generate)
    ↓
AI Plan Generation + MCP Bridge Execution
    ↓
Response back to WhatsApp
```

## API Endpoints

- `GET /health` - Health check
- `GET /status` - WhatsApp connection status

## Session Storage

The gateway stores WhatsApp session data in `./.wwebjs_auth` to avoid re-authentication on restart. This directory is created automatically.

## Troubleshooting

**QR code not scanning:**
- Ensure your phone has a stable internet connection
- Make sure the QR code is not expired (regenerates automatically)

**Messages not being processed:**
- Check that proxy server is running on the configured URL
- Verify MCP bridge is properly configured
- Check console logs for errors

**Gateway disconnects:**
- This is normal if WhatsApp detects unusual activity
- Restart the gateway and re-scan the QR code
