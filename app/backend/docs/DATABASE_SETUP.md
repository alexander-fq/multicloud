# Database Setup Guide

## PostgreSQL with Podman

This project uses PostgreSQL 14 running in a Podman container for development.

### Prerequisites

- Podman Desktop for Windows installed
- WSL 2 enabled and updated

### Quick Start

#### Option 1: Using Podman commands (Current setup)

```bash
# Ensure Podman is in PATH (already configured in ~/.bashrc)
source ~/.bashrc

# Verify Podman is running
podman machine list

# If machine is not running:
podman machine start

# Start PostgreSQL (if not already running)
podman run -d \
  --name tramites-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=tramites_db \
  -p 5432:5432 \
  postgres:14-alpine

# Verify PostgreSQL is running
podman ps
```

#### Option 2: Using the provided scripts

```bash
# Start PostgreSQL
./podman-start.sh

# Stop PostgreSQL
./podman-stop.sh
```

### Connection Details

```
Host: localhost
Port: 5432
Database: tramites_db
Username: postgres
Password: postgres123
```

These credentials are stored in `.env` file.

### Testing the Connection

```bash
# Run the test script
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

[TEST] Connection pool status:
{
  "size": 1,
  "available": 1,
  "using": 0,
  "waiting": 0
}

[TEST] ✓ All tests passed!
============================================================
```

### Managing the PostgreSQL Container

#### View logs
```bash
podman logs tramites-postgres

# Follow logs in real-time
podman logs -f tramites-postgres
```

#### Stop the container
```bash
podman stop tramites-postgres
```

#### Start an existing container
```bash
podman start tramites-postgres
```

#### Remove the container
```bash
podman stop tramites-postgres
podman rm tramites-postgres
```

#### Remove the data (WARNING: This deletes all data!)
```bash
podman volume rm tramites-postgres-data
```

#### Connect to PostgreSQL directly
```bash
# Using psql inside the container
podman exec -it tramites-postgres psql -U postgres -d tramites_db

# Inside psql:
\l              # List databases
\dt             # List tables
\d table_name   # Describe table
\q              # Quit
```

### Container Statistics
```bash
podman stats tramites-postgres
```

### Troubleshooting

#### Podman machine not running
```bash
podman machine list
podman machine start
```

#### Port 5432 already in use
```bash
# Find what's using the port
netstat -ano | findstr :5432

# Either stop the conflicting service or use a different port
podman run -d --name tramites-postgres -p 5433:5432 ...
# Then update DB_PORT=5433 in .env
```

#### Container won't start
```bash
# View detailed logs
podman logs tramites-postgres

# Check Podman machine status
podman machine list
```

#### Connection refused from Node.js
```bash
# 1. Verify container is running
podman ps

# 2. Check PostgreSQL logs
podman logs tramites-postgres --tail=20

# 3. Verify port mapping
podman port tramites-postgres

# 4. Test connection from command line
podman exec tramites-postgres pg_isready -U postgres
```

### Files Related to Database

- `src/config/database.js` - Sequelize configuration
- `.env` - Environment variables (not committed to git)
- `.env.example` - Template for environment variables
- `docker-compose.yml` - Alternative using docker-compose (also works with podman-compose)
- `test-db-connection.js` - Connection test script
- `DATABASE_SETUP.md` - This file
- `PODMAN.md` - Detailed Podman usage guide

### Next Steps

After PostgreSQL is running:
1. Continue with Step 3: Model creation
2. Run database migrations (when implemented)
3. Seed initial data (when implemented)
