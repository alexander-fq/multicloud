# Middleware Guide

This document explains the middleware system in the GovTech Tramites Backend.

## Overview

Middleware are functions that execute in the request-response cycle, before the controller handles the request. They can:
- Modify request/response objects
- Validate input data
- Handle errors
- Log requests
- Apply security measures
- End the request-response cycle

## Middleware Structure

```
src/middleware/
├── index.js           # Central export point
├── errorHandler.js    # Error handling middleware
├── validator.js       # Request validation with Joi
├── requestLogger.js   # HTTP request logging
└── security.js        # CORS, Helmet, Rate limiting
```

## Middleware Types

### 1. Error Handler (`errorHandler.js`)

Centralized error handling for the entire application.

**Features:**
- Catches all errors from routes and middleware
- Formats error responses consistently
- Handles specific error types (validation, database, auth)
- Hides sensitive details in production
- Logs errors for debugging

**Components:**

#### `notFoundHandler(req, res, next)`
Catches requests to undefined routes.
```javascript
app.use(notFoundHandler); // Place before errorHandler
```

#### `errorHandler(err, req, res, next)`
Main error handler.
```javascript
app.use(errorHandler); // Place LAST in middleware chain
```

#### `asyncHandler(fn)`
Wraps async route handlers to catch promise rejections.
```javascript
router.get('/path', asyncHandler(async (req, res) => {
  const data = await someAsyncOperation();
  res.json(data);
}));
```

**Error Types Handled:**
- `ValidationError` - Joi/Mongoose validation (400)
- `SequelizeValidationError` - Database validation (400)
- `SequelizeUniqueConstraintError` - Duplicate entry (409)
- `SequelizeDatabaseError` - Database errors (500)
- `UnauthorizedError` - JWT auth errors (401)
- `EBADCSRFTOKEN` - CSRF token errors (403)

**Usage:**
```javascript
const { errorHandler, notFoundHandler } = require('./src/middleware');

// Place at the END of middleware chain
app.use(notFoundHandler);
app.use(errorHandler);
```

---

### 2. Validator (`validator.js`)

Request validation using Joi schemas.

**Features:**
- Declarative validation schemas
- Validates body, params, and query
- Custom error messages
- Type coercion and defaults
- Strips unknown fields

**Pre-configured Validators:**

```javascript
const { validators } = require('./src/middleware');

// POST /tramites
router.post('/', validators.createTramite, createTramite);

// PUT /tramites/:numeroTramite
router.put('/:numeroTramite',
  validators.updateTramiteParams,
  validators.updateTramite,
  updateTramite
);

// GET /tramites/numero/:numeroTramite
router.get('/numero/:numeroTramite',
  validators.getTramiteByNumero,
  getTramiteByNumero
);

// GET /tramites/dni/:dni
router.get('/dni/:dni',
  validators.getTramitesByDNI,
  getTramitesByDNI
);

// GET /tramites?page=1&limit=10
router.get('/',
  validators.getAllTramitesQuery,
  getAllTramites
);
```

**Available Validators:**
- `validators.createTramite` - Validates tramite creation body
- `validators.updateTramite` - Validates tramite update body
- `validators.updateTramiteParams` - Validates numeroTramite param
- `validators.getTramiteByNumero` - Validates numeroTramite param
- `validators.getTramitesByDNI` - Validates DNI param
- `validators.getAllTramitesQuery` - Validates query parameters

**Custom Validation:**
```javascript
const { validate, schemas } = require('./src/middleware');

// Create custom validator
const myValidator = validate(schemas.createTramite, 'body');

// Or create custom schema
const customSchema = Joi.object({
  email: Joi.string().email().required()
});

const emailValidator = validate(customSchema, 'body');
```

**Validation Schemas:**

All schemas are defined in `validator.js`:
- `schemas.createTramite` - Create tramite body
- `schemas.updateTramite` - Update tramite body
- `schemas.tramiteNumeroParam` - numeroTramite param
- `schemas.dniParam` - DNI param
- `schemas.tramiteQuery` - Query parameters

**Error Response:**
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "field": "dni",
      "message": "DNI must be exactly 8 digits"
    }
  ]
}
```

---

### 3. Request Logger (`requestLogger.js`)

Logs all HTTP requests with detailed information.

**Features:**
- Logs method, URL, status, duration
- Colorized output in development
- JSON format in production
- Tracks response time
- Logs user agent and IP
- Can skip certain paths

**Components:**

#### `requestLogger(req, res, next)`
Main logging middleware.

**Development Output:**
```
GET /api/v1/tramites 200 45ms
POST /api/v1/tramites 201 123ms
GET /api/v1/tramites/numero/TRAM-20260208-12345 404 12ms
```

**Production Output (JSON):**
```json
{
  "timestamp": "2026-02-08T12:00:00.000Z",
  "method": "GET",
  "url": "/api/v1/tramites",
  "status": 200,
  "duration": "45ms",
  "ip": "::1",
  "userAgent": "Mozilla/5.0..."
}
```

#### `skipPaths(paths)`
Creates logger that skips certain paths.

**Usage:**
```javascript
const { requestLogger, skipPaths } = require('./src/middleware');

// Log all requests
app.use(requestLogger);

// Or skip certain paths
app.use(skipPaths(['/health', '/metrics']));
```

---

### 4. Security (`security.js`)

Security configuration for CORS, Helmet, and Rate Limiting.

**Components:**

#### `corsOptions`
CORS configuration.

```javascript
const cors = require('cors');
const { corsOptions } = require('./src/middleware');

app.use(cors(corsOptions));
```

**Configuration:**
- Allows configured origins (from `.env`)
- Allows all origins in development
- Credentials enabled
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-Requested-With

**Environment Variables:**
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://myapp.com
```

#### `helmetOptions`
Helmet security headers configuration.

```javascript
const helmet = require('helmet');
const { helmetOptions } = require('./src/middleware');

app.use(helmet(helmetOptions));
```

**Headers Set:**
- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- And more...

#### `apiLimiter`
General API rate limiter.

```javascript
const { apiLimiter } = require('./src/middleware');

app.use('/api', apiLimiter);
```

**Configuration:**
- Window: 15 minutes (configurable)
- Max requests: 100 per window (configurable)
- Returns rate limit info in headers
- Skips trusted IPs

**Environment Variables:**
```bash
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
TRUSTED_IPS=127.0.0.1,::1
```

#### `createLimiter`
Stricter rate limiter for creation endpoints.

```javascript
const { createLimiter } = require('./src/middleware');

router.post('/tramites', createLimiter, createTramite);
```

**Configuration:**
- Window: 1 hour
- Max requests: 10 per window

#### `authLimiter`
Very strict limiter for authentication endpoints.

```javascript
const { authLimiter } = require('./src/middleware');

router.post('/login', authLimiter, login);
```

**Configuration:**
- Window: 15 minutes
- Max requests: 5 per window
- Skips successful requests

---

## Middleware Order

Middleware **order matters**! Apply middleware in this sequence:

```javascript
// 1. Security headers
app.use(helmet(helmetOptions));

// 2. CORS
app.use(cors(corsOptions));

// 3. Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Compression
app.use(compression());

// 5. Request logging
app.use(requestLogger);

// 6. Rate limiting
app.use('/api', apiLimiter);

// 7. Routes
app.use('/api/v1', apiRoutes);

// 8. Not found handler (after all routes)
app.use(notFoundHandler);

// 9. Error handler (LAST)
app.use(errorHandler);
```

## Usage Examples

### Example 1: Protected Route with Validation

```javascript
const { validators, createLimiter } = require('./src/middleware');

router.post('/tramites',
  createLimiter,                    // Rate limit
  validators.createTramite,         // Validate body
  createTramite                     // Controller
);
```

### Example 2: Route with Multiple Validations

```javascript
router.put('/:numeroTramite',
  validators.updateTramiteParams,   // Validate param
  validators.updateTramite,         // Validate body
  updateTramite                     // Controller
);
```

### Example 3: Async Route with Error Handling

```javascript
const { asyncHandler } = require('./src/middleware');

router.get('/data', asyncHandler(async (req, res) => {
  const data = await fetchDataFromAPI();  // If this throws, error handler catches it
  res.json({ success: true, data });
}));
```

### Example 4: Custom Error in Controller

```javascript
async function createTramite(req, res, next) {
  try {
    // ... logic ...
    if (!valid) {
      const error = new Error('Invalid data');
      error.status = 400;
      throw error;  // Caught by error handler
    }
    res.json({ success: true, data });
  } catch (error) {
    next(error);  // Pass to error handler
  }
}
```

## Testing Middleware

Run the test suite:
```bash
node test-middleware.js
```

Tests include:
- Validation schema tests
- Error handler function tests
- Middleware loading tests
- Validation middleware factory tests

## Best Practices

1. **Always validate input** - Use validators on all routes that accept data
2. **Use async handler** - Wrap async route handlers with `asyncHandler`
3. **Order matters** - Apply middleware in the correct order
4. **Use next(error)** - Always pass errors to next() in controllers
5. **Set appropriate status** - Set error.status before throwing
6. **Rate limit sensitive routes** - Use stricter limiters for auth/create endpoints
7. **Log everything** - Use request logger for all routes
8. **Secure by default** - Always use Helmet and CORS

## Environment Variables

Middleware respects these environment variables:

```bash
# General
NODE_ENV=development|production

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://myapp.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
TRUSTED_IPS=127.0.0.1,::1
```

## Related Documentation

- [src/middleware/errorHandler.js](./src/middleware/errorHandler.js) - Error handling
- [src/middleware/validator.js](./src/middleware/validator.js) - Validation schemas
- [src/middleware/requestLogger.js](./src/middleware/requestLogger.js) - Request logging
- [src/middleware/security.js](./src/middleware/security.js) - Security config
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
