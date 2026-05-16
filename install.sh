#!/bin/bash

# Mucho3D Complete Installation Script
# This script installs all dependencies for all services

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           Mucho3D V3 - Complete Installation                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old. Please upgrade to >= 18.0.0"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm -v) detected"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python >= 3.10"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✅ Python $PYTHON_VERSION detected"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed"
    exit 1
fi
echo "✅ pip3 detected"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Frontend (Root)
echo "📦 [1/5] Installing Frontend dependencies..."
npm install --legacy-peer-deps
echo "✅ Frontend dependencies installed"
echo ""

# 2. Proxy Server
echo "📦 [2/5] Installing Proxy Server dependencies..."
cd proxy-server
npm install
cd ..
echo "✅ Proxy Server dependencies installed"
echo ""

# 3. MCP Bridge
echo "📦 [3/5] Installing MCP Bridge dependencies..."
cd mcp-bridge
npm install
cd ..
echo "✅ MCP Bridge dependencies installed"
echo ""

# 4. Blender Worker
echo "🐍 [4/5] Installing Blender Worker dependencies..."
cd apps/blender-worker
pip3 install -r requirements.txt
cd ../..
echo "✅ Blender Worker dependencies installed"
echo ""

# 5. WhatsApp Gateway
echo "📱 [5/5] Installing WhatsApp Gateway dependencies..."
cd apps/whatsapp-gateway
npm install
cd ../..
echo "✅ WhatsApp Gateway dependencies installed"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Installation Complete! ✨"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment:"
echo "   cp .env.template .env"
echo "   # Edit .env with your Firebase and service URLs"
echo ""
echo "2. Install Ollama (AI engine):"
echo "   Visit: https://ollama.ai"
echo "   Run: ollama pull llama2"
echo ""
echo "3. Start services:"
echo ""
echo "   Option A - Docker Compose (recommended):"
echo "   docker-compose up"
echo ""
echo "   Option B - Individual services:"
echo "   # Terminal 1 - Blender Worker"
echo "   cd apps/blender-worker && uvicorn server:app --port 8788"
echo ""
echo "   # Terminal 2 - MCP Bridge"
echo "   cd mcp-bridge && npm run dev"
echo ""
echo "   # Terminal 3 - Proxy Server"
echo "   cd proxy-server && npm run dev"
echo ""
echo "   # Terminal 4 - WhatsApp Gateway (optional)"
echo "   cd apps/whatsapp-gateway && npm run dev"
echo ""
echo "   # Terminal 5 - Frontend"
echo "   npm run dev"
echo ""
echo "4. Access the application:"
echo "   Web UI: http://localhost:5173"
echo "   API: http://localhost:8787"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
