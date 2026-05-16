# Mucho3D Dependency Audit & Installation Guide

## Overview
This document provides a complete audit of all dependencies across the Mucho3D project and installation commands for each service.

---

## Root Frontend (React + Vite)

**Location:** `/package.json`

### Installation
```bash
npm install
```

### Dependencies
```json
{
  "@react-three/drei": "^9.105.6",
  "@react-three/fiber": "^8.16.6",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "firebase": "^12.12.0",
  "framer-motion": "^11.2.10",
  "lucide-react": "^0.378.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.23.1",
  "tailwind-merge": "^2.3.0",
  "three": "^0.163.0",
  "uuid": "^14.0.0",
  "zod": "^4.3.6",
  "zustand": "^4.5.2"
}
```

### Dev Dependencies
```json
{
  "@types/react": "^18.3.3",
  "@types/react-dom": "^18.3.0",
  "@types/three": "^0.163.0",
  "@typescript-eslint/eslint-plugin": "^7.10.0",
  "@typescript-eslint/parser": "^7.10.0",
  "@vitejs/plugin-react": "^4.3.0",
  "autoprefixer": "^10.4.19",
  "eslint": "^8.57.0",
  "eslint-plugin-react-hooks": "^4.6.2",
  "eslint-plugin-react-refresh": "^0.4.7",
  "postcss": "^8.4.38",
  "tailwindcss": "^3.4.3",
  "typescript": "^5.4.5",
  "vite": "^5.2.11"
}
```

---

## Proxy Server (Express)

**Location:** `/proxy-server/package.json`

### Installation
```bash
cd proxy-server
npm install
```

### Dependencies
```json
{
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.18.2",
  "zod": "^4.3.6"
}
```

### Dev Dependencies
```json
{
  "@types/cors": "^2.8.19",
  "@types/express": "^4.17.21",
  "@types/node": "^20.10.0",
  "tsx": "^4.7.0",
  "typescript": "^5.4.5"
}
```

---

## MCP Bridge (Express + Tool Registry)

**Location:** `/mcp-bridge/package.json`

### Installation
```bash
cd mcp-bridge
npm install
```

### Dependencies
```json
{
  "cors": "^2.8.5",
  "express": "^4.19.2",
  "zod": "^4.3.6"
}
```

### Dev Dependencies
```json
{
  "@types/cors": "^2.8.17",
  "@types/express": "^4.17.0",
  "@types/node": "^20.0.0",
  "tsx": "^4.0.0",
  "typescript": "^5.0.0"
}
```

---

## Blender Worker (FastAPI + Python)

**Location:** `/apps/blender-worker/requirements.txt`

### Installation
```bash
cd apps/blender-worker
pip install -r requirements.txt
```

### Dependencies
```txt
fastapi>=0.110,<1
uvicorn[standard]>=0.27,<1
pydantic>=2.6,<3
```

### Note
Blender Worker requires **Blender 3.0+** to be installed with Python 3.10+ and `bpy` module available.

---

## WhatsApp Gateway (Express + WhatsApp Web.js)

**Location:** `/apps/whatsapp-gateway/package.json`

### Installation
```bash
cd apps/whatsapp-gateway
npm install
```

### Dependencies
```json
{
  "whatsapp-web.js": "^1.23.0",
  "qrcode-terminal": "^0.12.0",
  "express": "^4.18.2",
  "dotenv": "^16.4.5",
  "zod": "^4.3.6"
}
```

### Dev Dependencies
```json
{
  "@types/express": "^4.17.21",
  "@types/node": "^20.10.0",
  "@types/qrcode-terminal": "^0.12.2",
  "tsx": "^4.7.0",
  "typescript": "^5.4.5"
}
```

---

## Complete Installation Script

### For Unix/Linux/macOS:
```bash
#!/bin/bash

echo "🚀 Installing Mucho3D Dependencies..."

# Root (Frontend)
echo "📦 Installing frontend dependencies..."
npm install

# Proxy Server
echo "📦 Installing proxy-server dependencies..."
cd proxy-server && npm install && cd ..

# MCP Bridge
echo "📦 Installing mcp-bridge dependencies..."
cd mcp-bridge && npm install && cd ..

# Blender Worker
echo "🐍 Installing blender-worker dependencies..."
cd apps/blender-worker && pip install -r requirements.txt && cd ../..

# WhatsApp Gateway
echo "📱 Installing whatsapp-gateway dependencies..."
cd apps/whatsapp-gateway && npm install && cd ../..

echo "✅ All dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Copy .env.template to .env and configure your environment"
echo "2. Start Ollama server: ollama serve"
echo "3. Run services using docker-compose or individual npm/python commands"
```

### For Windows (PowerShell):
```powershell
# Save as install-deps.ps1

Write-Host "🚀 Installing Mucho3D Dependencies..." -ForegroundColor Green

# Root (Frontend)
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
npm install

# Proxy Server
Write-Host "📦 Installing proxy-server dependencies..." -ForegroundColor Cyan
Set-Location proxy-server
npm install
Set-Location ..

# MCP Bridge
Write-Host "📦 Installing mcp-bridge dependencies..." -ForegroundColor Cyan
Set-Location mcp-bridge
npm install
Set-Location ..

# Blender Worker
Write-Host "🐍 Installing blender-worker dependencies..." -ForegroundColor Cyan
Set-Location apps/blender-worker
pip install -r requirements.txt
Set-Location ../..

# WhatsApp Gateway
Write-Host "📱 Installing whatsapp-gateway dependencies..." -ForegroundColor Cyan
Set-Location apps/whatsapp-gateway
npm install
Set-Location ../..

Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy .env.template to .env and configure your environment"
Write-Host "2. Start Ollama server: ollama serve"
Write-Host "3. Run services using docker-compose or individual npm/python commands"
```

---

## System Requirements

### Node.js & npm
- **Node.js:** >= 18.0.0
- **npm:** >= 9.0.0

### Python
- **Python:** >= 3.10
- **pip:** Latest version

### Blender
- **Blender:** >= 3.0 (with Python API enabled)

### Ollama (AI)
- **Ollama:** Latest version
- Install from: https://ollama.ai

### Docker (Optional)
- **Docker:** >= 20.10
- **Docker Compose:** >= 2.0

---

## Package Manager Quick Reference

| Service | Package Manager | Install Command | Dev Command | Build Command |
|---------|----------------|-----------------|-------------|---------------|
| Frontend | npm | `npm install` | `npm run dev` | `npm run build` |
| Proxy Server | npm | `npm install` | `npm run dev` | `npm run build` |
| MCP Bridge | npm | `npm install` | `npm run dev` | - |
| Blender Worker | pip | `pip install -r requirements.txt` | `uvicorn server:app --reload` | - |
| WhatsApp Gateway | npm | `npm install` | `npm run dev` | `npm run build` |

---

## Troubleshooting

### npm install fails
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and package-lock.json, then reinstall
- Ensure Node.js >= 18.0.0

### pip install fails
- Upgrade pip: `pip install --upgrade pip`
- Use virtual environment: `python -m venv venv && source venv/bin/activate`
- Install build tools if needed

### Blender Worker issues
- Ensure Blender is installed and `bpy` module is available
- Run inside Blender's Python: `blender --background --python server.py`

### WhatsApp Gateway issues
- Install Chromium dependencies for puppeteer
- On Linux: `sudo apt-get install -y chromium-browser`
- Clear .wwebjs_auth folder if authentication fails

---

## Version Summary

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI Framework |
| Three.js | 0.163.0 | 3D Rendering |
| Express | 4.18.2+ | HTTP Server |
| FastAPI | 0.110+ | Python HTTP Server |
| Firebase | 12.12.0 | Database & Auth |
| Zod | 4.3.6 | Schema Validation |
| TypeScript | 5.4.5 | Type Safety |
| Vite | 5.2.11 | Build Tool |
| whatsapp-web.js | 1.23.0 | WhatsApp Integration |
