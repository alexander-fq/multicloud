# Using Podman with this Project

This guide explains how to use Podman instead of Docker for local development.

## Prerequisites

- Podman Desktop installed (https://podman-desktop.io/downloads)
- Podman CLI available in PATH

## Quick Start

### Option 1: Using provided scripts (Easiest)

```bash
# Make scripts executable (first time only)
chmod +x podman-start.sh podman-stop.sh

# Start PostgreSQL
./podman-start.sh

# Stop PostgreSQL
./podman-stop.sh
```

### Option 2: Using Podman commands directly

```bash
# Start PostgreSQL
podman run -d \
  --name tramites-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=tramites_db \
  -p 5432:5432 \
  -v tramites-postgres-data:/var/lib/postgresql/data \
  postgres:14-alpine

# Check status
podman ps

# View logs
podman logs tramites-postgres

# Stop container
podman stop tramites-postgres

# Remove container
podman rm tramites-postgres

# Remove volume (deletes all data)
podman volume rm tramites-postgres-data
```

### Option 3: Using docker-compose.yml with Podman

```bash
# Podman supports docker-compose syntax
podman-compose up -d postgres

# Or with native compose support (Podman 4.0+)
podman compose up -d postgres

# Stop
podman-compose down
# or
podman compose down
```

## Common Commands

```bash
# List running containers
podman ps

# List all containers (including stopped)
podman ps -a

# View container logs
podman logs tramites-postgres
podman logs -f tramites-postgres  # Follow logs

# Execute command in container
podman exec -it tramites-postgres psql -U postgres -d tramites_db

# Inspect container
podman inspect tramites-postgres

# View resource usage
podman stats tramites-postgres

# List volumes
podman volume ls

# Remove all stopped containers
podman container prune

# Remove unused volumes
podman volume prune
```

## Connecting to PostgreSQL

Once PostgreSQL is running, use these connection details:

```
Host: localhost
Port: 5432
Database: tramites_db
User: postgres
Password: postgres123
```

## Testing the Connection

```bash
# Load NVM (if using Node via NVM)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Run connection test
node test-db-connection.js
```

Expected output:
```
============================================================
DATABASE CONNECTION TEST
============================================================

[TEST] Testing database connection...
[DB] Connection established successfully (attempt 1/3)
[DB] Database: tramites_db@localhost:5432
[DB] SSL: disabled

[TEST] ✓ All tests passed!
============================================================
```

## Troubleshooting

### Podman machine not running

```bash
podman machine start
```

### Port 5432 already in use

```bash
# Check what's using the port
lsof -i :5432
# or on Windows
netstat -ano | findstr :5432

# Stop the conflicting service or use a different port
podman run -d --name tramites-postgres -p 5433:5432 ...
# Then update .env file: DB_PORT=5433
```

### Container starts but stops immediately

```bash
# View logs to see the error
podman logs tramites-postgres
```

### Permission denied errors

```bash
# On Windows, run as Administrator
# On Linux/WSL, ensure your user is in the podman group
```

## Differences from Docker

1. **No daemon**: Podman doesn't require a background daemon
2. **Rootless**: Runs without root privileges by default
3. **Pod support**: Can group containers into pods (Kubernetes-compatible)
4. **Command compatibility**: Most Docker commands work with Podman by replacing `docker` with `podman`

## Creating a Docker alias for Podman

If you want to use `docker` commands with Podman:

```bash
# Linux/WSL - Add to ~/.bashrc
alias docker=podman
alias docker-compose=podman-compose

# Windows PowerShell - Add to profile
Set-Alias -Name docker -Value podman
```
