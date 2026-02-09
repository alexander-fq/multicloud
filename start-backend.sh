#!/bin/bash

# Load NVM (more robust)
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  source "$NVM_DIR/nvm.sh"
  echo "✅ NVM loaded"
else
  echo "❌ NVM not found at $NVM_DIR/nvm.sh"
  exit 1
fi

# Use Node 20
echo "📦 Switching to Node 20..."
nvm use 20

# Navigate to backend
cd "$(dirname "$0")/backend" || exit 1

# Verify node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies (first time)..."
  npm install
fi

# Start backend
echo "🚀 Starting GovTech Backend API..."
npm run dev
