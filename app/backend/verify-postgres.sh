#!/bin/bash
# Script to verify PostgreSQL is accessible
# Run with: bash verify-postgres.sh

echo "Checking PostgreSQL connection..."
echo ""

# Check if PostgreSQL port is accessible
if command -v nc &> /dev/null; then
    if nc -z localhost 5432 2>/dev/null; then
        echo "✓ PostgreSQL port 5432 is accessible"
    else
        echo "✗ PostgreSQL port 5432 is NOT accessible"
        echo "  Make sure PostgreSQL container is running"
        exit 1
    fi
else
    echo "⚠ netcat (nc) not installed, skipping port check"
fi

echo ""
echo "Testing connection from Node.js..."
echo ""

# Load NVM if available
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Run the connection test
node test-db-connection.js
