#!/bin/bash
# Script to start PostgreSQL using Podman
# Run with: ./podman-start.sh

echo "Starting PostgreSQL with Podman..."

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo "Error: Podman is not installed"
    echo "Please install Podman Desktop from: https://podman-desktop.io/downloads"
    exit 1
fi

# Start PostgreSQL container
podman run -d \
  --name tramites-postgres \
  --restart unless-stopped \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=tramites_db \
  -p 5432:5432 \
  -v tramites-postgres-data:/var/lib/postgresql/data \
  postgres:14-alpine

echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if container is running
if podman ps | grep -q tramites-postgres; then
    echo "✓ PostgreSQL is running on port 5432"
    echo ""
    echo "Connection details:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: tramites_db"
    echo "  User: postgres"
    echo "  Password: postgres123"
    echo ""
    echo "To stop: podman stop tramites-postgres"
    echo "To remove: podman rm tramites-postgres"
    echo "To view logs: podman logs tramites-postgres"
else
    echo "✗ Failed to start PostgreSQL"
    podman logs tramites-postgres
    exit 1
fi
