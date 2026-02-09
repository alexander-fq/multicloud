# Getting Started

Quick start guide for running the GovTech Tramites Backend API.

## Prerequisites

- Node.js 18+ (you have Node 20 installed ✓)
- Podman (or Docker) for PostgreSQL
- WSL 2 (if on Windows)

## Quick Start

### 1. Start PostgreSQL

```bash
# Make sure Podman machine is running
podman machine start

# Start PostgreSQL container
podman start tramites-postgres

# OR if container doesn't exist yet:
podman run -d \
  --name tramites-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=tramites_db \
  -p 5432:5432 \
  postgres:14-alpine

# Verify it's running
podman ps
```

### 2. Configure Environment

The `.env` file is already configured. Verify it contains:

```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tramites_db
DB_USER=postgres
DB_PASSWORD=postgres123
```

### 3. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

You should see:
```
======================================================================
[Server] GovTech Tramites API
[Server] Environment: development
[Server] Server running on http://0.0.0.0:3000
[Server] API Base URL: http://0.0.0.0:3000/api/v1
[Server] Health Check: http://0.0.0.0:3000/api/v1/health
======================================================================
```

### 4. Test the API

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Get API info
curl http://localhost:3000/api/v1

# List tramites
curl http://localhost:3000/api/v1/tramites

# Create a tramite
curl -X POST http://localhost:3000/api/v1/tramites \
  -H "Content-Type: application/json" \
  -d '{
    "dni": "12345678",
    "nombreCiudadano": "Juan Pérez García",
    "tipoTramite": "DNI",
    "documentosPendientes": ["Foto", "Pago de tasa"]
  }'
```

## Available Endpoints

### Base Endpoints

- `GET /` - API welcome message
- `GET /api/v1` - API information
- `GET /api/v1/health` - Health check

### Tramite Endpoints

- `GET /api/v1/tramites` - List all tramites (paginated)
- `GET /api/v1/tramites/estadisticas` - Get statistics
- `GET /api/v1/tramites/numero/:numeroTramite` - Get by procedure number
- `GET /api/v1/tramites/dni/:dni` - Get by DNI
- `POST /api/v1/tramites` - Create new tramite
- `PUT /api/v1/tramites/:numeroTramite` - Update tramite

See [API_REFERENCE.md](./API_REFERENCE.md) for detailed documentation.

## npm Scripts

```bash
npm start        # Start production server
npm run dev      # Start development server with nodemon
npm test         # Run tests with coverage
npm run lint     # Check code quality
npm run lint:fix # Fix linting issues automatically
```

## Troubleshooting

### Port 3000 already in use

```bash
# Find what's using the port
lsof -i :3000
# or on Windows
netstat -ano | findstr :3000

# Kill the process or change PORT in .env
PORT=3001 npm start
```

### PostgreSQL not running

```bash
# Check Podman machine
podman machine list

# Start machine if stopped
podman machine start

# Check containers
podman ps -a

# Start PostgreSQL container
podman start tramites-postgres
```

### Database connection error

```bash
# Test connection to PostgreSQL
podman exec tramites-postgres pg_isready -U postgres

# Check logs
podman logs tramites-postgres

# Verify .env configuration
cat .env
```

### Module not found errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

1. **Start PostgreSQL** (only once)
   ```bash
   podman start tramites-postgres
   ```

2. **Start dev server** (auto-reloads on file changes)
   ```bash
   npm run dev
   ```

3. **Make changes** to code

4. **Test manually** with curl or Postman

5. **Check logs** in the terminal

6. **Stop server** with Ctrl+C

## Production Deployment

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md) (to be created).

Key differences for production:
- Set `NODE_ENV=production`
- Use strong passwords
- Enable SSL for database
- Configure proper CORS origins
- Use process manager (PM2, systemd)
- Set up monitoring and logging

## Next Steps

- Read [API_REFERENCE.md](./API_REFERENCE.md) for complete API documentation
- Read [MIDDLEWARE_GUIDE.md](./MIDDLEWARE_GUIDE.md) to understand middleware
- Read [ROUTES_GUIDE.md](./ROUTES_GUIDE.md) to understand routing
- See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database details

## Need Help?

- Check the logs in the terminal
- Look for error messages in the output
- Verify PostgreSQL is running
- Check .env configuration
- Review the documentation files
