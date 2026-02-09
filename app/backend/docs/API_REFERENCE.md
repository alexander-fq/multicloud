# API Reference - Tramites Backend

Base URL: `http://localhost:3000/api/v1`

## Response Format

All endpoints return JSON with the following standard format:

```json
{
  "success": boolean,
  "data": any,
  "message": string (optional),
  "pagination": object (optional),
  "error": string (only in development mode)
}
```

## Endpoints

### 1. Get All Tramites

Get paginated list of tramites with optional filters.

**Endpoint:** `GET /tramites`

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page
- `estado` (optional) - Filter by status (PENDIENTE, EN_PROCESO, OBSERVADO, APROBADO, RECHAZADO, FINALIZADO)
- `tipoTramite` (optional) - Filter by type (DNI, PASAPORTE, LICENCIA, CERTIFICADO, REGISTRO)
- `dni` (optional) - Filter by DNI (8 digits)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "numeroTramite": "TRAM-20260208-12345",
      "dni": "12345678",
      "nombreCiudadano": "Juan Pérez",
      "tipoTramite": "DNI",
      "estado": "PENDIENTE",
      "fechaInicio": "2026-02-08",
      "fechaEstimadaFinalizacion": "2026-03-10",
      "documentosPendientes": ["Foto", "Pago"],
      "proximoPaso": "Revisar documentos",
      "observaciones": null,
      "oficinaAsignada": "Oficina Central"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid filter values
- `500 Internal Server Error` - Server error

**Examples:**
```bash
# Get first page
GET /tramites

# Get page 2 with 20 items per page
GET /tramites?page=2&limit=20

# Filter by status
GET /tramites?estado=PENDIENTE

# Filter by DNI
GET /tramites?dni=12345678

# Combined filters
GET /tramites?estado=EN_PROCESO&tipoTramite=DNI&page=1&limit=10
```

---

### 2. Get Tramite by Number

Get a specific tramite by its procedure number.

**Endpoint:** `GET /tramites/numero/:numeroTramite`

**URL Parameters:**
- `numeroTramite` (required) - Procedure number (format: TRAM-YYYYMMDD-XXXXX)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "numeroTramite": "TRAM-20260208-12345",
    "dni": "12345678",
    "nombreCiudadano": "Juan Pérez",
    "tipoTramite": "DNI",
    "estado": "PENDIENTE",
    "fechaInicio": "2026-02-08",
    "fechaEstimadaFinalizacion": "2026-03-10",
    "documentosPendientes": ["Foto", "Pago"],
    "proximoPaso": "Revisar documentos",
    "observaciones": null,
    "oficinaAsignada": "Oficina Central",
    "createdAt": "2026-02-08T12:00:00Z",
    "updatedAt": "2026-02-08T12:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid procedure number format
- `404 Not Found` - Tramite not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
GET /tramites/numero/TRAM-20260208-12345
```

---

### 3. Get Tramites by DNI

Get all tramites for a specific citizen DNI.

**Endpoint:** `GET /tramites/dni/:dni`

**URL Parameters:**
- `dni` (required) - Citizen DNI (8 digits)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "numeroTramite": "TRAM-20260208-12345",
      "dni": "12345678",
      "nombreCiudadano": "Juan Pérez",
      "tipoTramite": "DNI",
      "estado": "PENDIENTE",
      ...
    },
    {
      "id": "uuid",
      "numeroTramite": "TRAM-20260205-67890",
      "dni": "12345678",
      "nombreCiudadano": "Juan Pérez",
      "tipoTramite": "PASAPORTE",
      "estado": "APROBADO",
      ...
    }
  ],
  "count": 2
}
```

**Error Responses:**
- `400 Bad Request` - Invalid DNI format
- `500 Internal Server Error` - Server error

**Example:**
```bash
GET /tramites/dni/12345678
```

---

### 4. Create Tramite

Create a new tramite.

**Endpoint:** `POST /tramites`

**Request Body:**
```json
{
  "dni": "12345678",                              // Required: 8 digits
  "nombreCiudadano": "Juan Pérez García",         // Required: 3-200 chars
  "tipoTramite": "DNI",                           // Required: DNI|PASAPORTE|LICENCIA|CERTIFICADO|REGISTRO
  "estado": "PENDIENTE",                          // Optional: defaults to PENDIENTE
  "fechaInicio": "2026-02-08",                    // Optional: defaults to today
  "fechaEstimadaFinalizacion": "2026-03-10",      // Optional: defaults to +30 days
  "documentosPendientes": ["Foto", "Pago"],       // Optional: array of strings
  "proximoPaso": "Revisar documentos",            // Optional: text
  "observaciones": "Trámite urgente",             // Optional: text
  "oficinaAsignada": "Oficina Central"            // Optional: string
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "numeroTramite": "TRAM-20260208-12345",  // Auto-generated
    "dni": "12345678",
    "nombreCiudadano": "Juan Pérez García",
    "tipoTramite": "DNI",
    "estado": "PENDIENTE",
    "fechaInicio": "2026-02-08",
    "fechaEstimadaFinalizacion": "2026-03-10",
    "documentosPendientes": ["Foto", "Pago"],
    "proximoPaso": "Revisar documentos",
    "observaciones": "Trámite urgente",
    "oficinaAsignada": "Oficina Central",
    "createdAt": "2026-02-08T12:00:00Z",
    "updatedAt": "2026-02-08T12:00:00Z"
  },
  "message": "Tramite created successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or validation errors
- `409 Conflict` - Duplicate entry
- `500 Internal Server Error` - Server error

**Validation Errors Example:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "dni",
      "message": "DNI must be exactly 8 digits"
    }
  ]
}
```

**Example:**
```bash
POST /tramites
Content-Type: application/json

{
  "dni": "12345678",
  "nombreCiudadano": "Juan Pérez García",
  "tipoTramite": "DNI",
  "documentosPendientes": ["Foto tamaño carnet", "Pago de tasa"]
}
```

---

### 5. Update Tramite

Update an existing tramite (partial update).

**Endpoint:** `PUT /tramites/:numeroTramite`

**URL Parameters:**
- `numeroTramite` (required) - Procedure number

**Request Body:** (All fields optional - partial update)
```json
{
  "estado": "EN_PROCESO",
  "proximoPaso": "Esperar aprobación",
  "observaciones": "Documentos recibidos correctamente",
  "documentosPendientes": [],
  "oficinaAsignada": "Oficina Centro"
}
```

**Note:** The following fields cannot be updated:
- `id`
- `numeroTramite`
- `createdAt`
- `updatedAt`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "numeroTramite": "TRAM-20260208-12345",
    "dni": "12345678",
    "nombreCiudadano": "Juan Pérez García",
    "tipoTramite": "DNI",
    "estado": "EN_PROCESO",                   // Updated
    "fechaInicio": "2026-02-08",
    "fechaEstimadaFinalizacion": "2026-03-10",
    "documentosPendientes": [],               // Updated
    "proximoPaso": "Esperar aprobación",      // Updated
    "observaciones": "Documentos recibidos",  // Updated
    "oficinaAsignada": "Oficina Centro",      // Updated
    "createdAt": "2026-02-08T12:00:00Z",
    "updatedAt": "2026-02-08T13:30:00Z"
  },
  "message": "Tramite updated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data or validation errors
- `404 Not Found` - Tramite not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
PUT /tramites/TRAM-20260208-12345
Content-Type: application/json

{
  "estado": "APROBADO",
  "observaciones": "Trámite aprobado correctamente"
}
```

---

### 6. Get Statistics

Get overall statistics of tramites.

**Endpoint:** `GET /tramites/estadisticas`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "porEstado": {
      "PENDIENTE": 45,
      "EN_PROCESO": 60,
      "OBSERVADO": 10,
      "APROBADO": 20,
      "RECHAZADO": 5,
      "FINALIZADO": 10
    },
    "porTipo": {
      "DNI": 80,
      "PASAPORTE": 30,
      "LICENCIA": 25,
      "CERTIFICADO": 10,
      "REGISTRO": 5
    }
  }
}
```

**Error Responses:**
- `500 Internal Server Error` - Server error

**Example:**
```bash
GET /tramites/estadisticas
```

---

## Data Types

### TipoTramite ENUM
- `DNI` - Documento Nacional de Identidad
- `PASAPORTE` - Passport
- `LICENCIA` - Driver's License
- `CERTIFICADO` - Certificate
- `REGISTRO` - Registration

### EstadoTramite ENUM
- `PENDIENTE` - Pending
- `EN_PROCESO` - In Process
- `OBSERVADO` - Observed (requires attention)
- `APROBADO` - Approved
- `RECHAZADO` - Rejected
- `FINALIZADO` - Finalized

## Error Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server error

## Development vs Production

In development mode (`NODE_ENV=development`), error responses include detailed error messages:

```json
{
  "success": false,
  "message": "Error creating tramite",
  "error": "Detailed error message here"
}
```

In production mode, error details are hidden for security.
