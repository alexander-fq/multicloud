# Routes Guide

This document explains the routing system in the GovTech Tramites Backend.

## Architecture

The routing system follows a modular architecture:

```
src/routes/
├── index.js           # Main router - mounts all route modules
└── tramiteRoutes.js   # Tramite-specific routes
```

## Route Hierarchy

```
app.js
  └── /api/v1 (from src/routes/index.js)
      ├── / (API info)
      ├── /health (health check)
      └── /tramites (from src/routes/tramiteRoutes.js)
          ├── GET    /
          ├── GET    /estadisticas
          ├── GET    /numero/:numeroTramite
          ├── GET    /dni/:dni
          ├── POST   /
          └── PUT    /:numeroTramite
```

## Complete Endpoint List

### Base Endpoints

**GET /api/v1**
- Description: API information and available endpoints
- Returns: API metadata

**GET /api/v1/health**
- Description: Health check endpoint
- Returns: Server status and uptime

### Tramite Endpoints

**GET /api/v1/tramites**
- Description: List all tramites (paginated)
- Query Parameters:
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `estado` (optional): Filter by status
  - `tipoTramite` (optional): Filter by type
  - `dni` (optional): Filter by DNI
- Controller: `getAllTramites`

**GET /api/v1/tramites/estadisticas**
- Description: Get tramites statistics
- Controller: `getEstadisticas`

**GET /api/v1/tramites/numero/:numeroTramite**
- Description: Get specific tramite by number
- URL Parameters:
  - `numeroTramite`: Procedure number (format: TRAM-YYYYMMDD-XXXXX)
- Controller: `getTramiteByNumero`

**GET /api/v1/tramites/dni/:dni**
- Description: Get all tramites for a specific DNI
- URL Parameters:
  - `dni`: Citizen DNI (8 digits)
- Controller: `getTramitesByDNI`

**POST /api/v1/tramites**
- Description: Create new tramite
- Body: JSON with tramite data
- Controller: `createTramite`

**PUT /api/v1/tramites/:numeroTramite**
- Description: Update existing tramite
- URL Parameters:
  - `numeroTramite`: Procedure number
- Body: JSON with fields to update
- Controller: `updateTramite`

## RESTful Conventions

This API follows REST conventions:

| HTTP Method | CRUD Operation | Idempotent |
|-------------|----------------|------------|
| GET         | Read           | Yes        |
| POST        | Create         | No         |
| PUT         | Update         | Yes        |
| DELETE      | Delete         | Yes        |

## Route Ordering

Routes are defined in a specific order to prevent conflicts:

1. **Specific routes first**: `/estadisticas` comes before `/:numeroTramite`
2. **Static before dynamic**: Routes with hardcoded paths before parameterized routes
3. **Longer paths first**: More specific paths before more general ones

### Example of Correct Ordering

```javascript
router.get('/estadisticas', getEstadisticas);           // Specific - comes first
router.get('/numero/:numeroTramite', getTramiteByNumero); // Dynamic - comes after
router.get('/:numeroTramite', updateTramite);            // Most generic - last
```

### Why Order Matters

If routes were in the wrong order:
- `GET /tramites/estadisticas` would match `/:numeroTramite` with "estadisticas" as the parameter
- The statistics endpoint would never be reached

## Adding New Routes

To add new routes:

### 1. For Tramite-related routes

Edit `src/routes/tramiteRoutes.js`:

```javascript
// Add new controller import
const { newController } = require('../controllers/tramiteController');

// Add new route (mind the order!)
router.get('/new-endpoint', newController);
```

### 2. For New Resource Types

Create a new route file:

```bash
# Create new route file
touch src/routes/newResourceRoutes.js
```

```javascript
// src/routes/newResourceRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/newResourceController');

router.get('/', controller.getAll);
router.post('/', controller.create);

module.exports = router;
```

Mount it in `src/routes/index.js`:

```javascript
const newResourceRoutes = require('./newResourceRoutes');
router.use('/new-resource', newResourceRoutes);
```

## Testing Routes

### Manual Testing

Use curl or any HTTP client:

```bash
# Get API info
curl http://localhost:3000/api/v1

# Health check
curl http://localhost:3000/api/v1/health

# List tramites
curl http://localhost:3000/api/v1/tramites

# Get specific tramite
curl http://localhost:3000/api/v1/tramites/numero/TRAM-20260208-12345

# Create tramite
curl -X POST http://localhost:3000/api/v1/tramites \
  -H "Content-Type: application/json" \
  -d '{"dni":"12345678","nombreCiudadano":"Juan Pérez","tipoTramite":"DNI"}'
```

### Automated Testing

Run the verification script:

```bash
node verify-routes.js
```

## Middleware

Routes can have middleware applied at different levels:

### Global Middleware (app.js)
- Applies to all routes
- Example: body parser, CORS, helmet

### Router-level Middleware (routes/index.js)
- Applies to all routes in /api/v1
- Example: authentication, logging

### Route-specific Middleware
- Applies to specific routes
- Example: validation, authorization

Example:
```javascript
router.post('/',
  validationMiddleware,  // Route-specific
  createTramite
);
```

## Versioning

The API uses URL versioning with `/api/v1` prefix.

To create a new version:

1. Create `src/routes/v2/index.js`
2. Copy route files to v2 directory
3. Make changes to v2 routes
4. Mount in app.js: `app.use('/api/v2', v2Routes)`

Both versions can coexist:
- `/api/v1/tramites` - Old version
- `/api/v2/tramites` - New version

## Best Practices

1. **Use plural nouns**: `/tramites` not `/tramite`
2. **Use lowercase**: `/tramites` not `/Tramites`
3. **Use hyphens for multi-word**: `/pending-tramites` not `/pendingTramites`
4. **Be consistent**: Follow the same pattern across all routes
5. **Version your API**: Use `/api/v1` prefix
6. **Document your routes**: Add JSDoc comments
7. **Order matters**: Specific routes before parameterized routes
8. **Keep it RESTful**: Map HTTP methods to CRUD operations

## Common Pitfalls

### 1. Route Order
❌ **Wrong:**
```javascript
router.get('/:id', getById);
router.get('/statistics', getStatistics);  // Never reached!
```

✅ **Correct:**
```javascript
router.get('/statistics', getStatistics);
router.get('/:id', getById);
```

### 2. Plural vs Singular
❌ **Wrong:**
```javascript
router.get('/tramite', getAllTramites);  // Resource name should be plural
```

✅ **Correct:**
```javascript
router.get('/tramites', getAllTramites);
```

### 3. Verb in URL
❌ **Wrong:**
```javascript
router.get('/getTramites', getAllTramites);  // No verbs in URLs
```

✅ **Correct:**
```javascript
router.get('/tramites', getAllTramites);  // Use HTTP methods for verbs
```

## Related Documentation

- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API documentation
- [src/controllers/tramiteController.js](./src/controllers/tramiteController.js) - Controller implementations
- [src/routes/tramiteRoutes.js](./src/routes/tramiteRoutes.js) - Route definitions
