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

# Navigate to frontend
cd "$(dirname "$0")/frontend" || exit 1

# Install dependencies if needed (first time only)
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Start frontend
echo "🎨 Starting GovTech Frontend..."
npm run dev
