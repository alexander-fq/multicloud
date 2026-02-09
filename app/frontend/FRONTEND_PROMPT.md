# Frontend Design Prompt - GovTech Tramites System

## Project Context

You are building a **Frontend Web Application** for a Government Procedures Consultation System (Sistema de Consulta de Trámites GovTech). This system allows citizens to:
- Register new government procedures (tramites)
- Check the status of their procedures
- View required pending documents
- See statistics about procedure processing times

## Backend API Already Built

The backend is a **Node.js + Express + PostgreSQL** REST API running on `http://localhost:3000`

### Available API Endpoints

#### Base Endpoints
- `GET /api/v1` - API information
- `GET /api/v1/health` - Health check

#### Tramite Endpoints

**1. List All Tramites (with pagination and filters)**
```http
GET /api/v1/tramites?page=1&limit=10&estado=PENDIENTE&tipoTramite=DNI&dni=12345678

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "numeroTramite": "TRAM-20260208-00001",
      "dni": "12345678",
      "nombreCiudadano": "Juan Pérez García",
      "tipoTramite": "DNI",
      "estado": "PENDIENTE",
      "documentosPendientes": ["Foto", "Pago de tasa"],
      "observaciones": "Falta presentar foto actualizada",
      "fechaInicio": "2026-02-08T10:30:00Z",
      "fechaEstimadaFinalizacion": "2026-02-15T10:30:00Z",
      "created_at": "2026-02-08T10:30:00Z",
      "updated_at": "2026-02-08T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**2. Get Statistics**
```http
GET /api/v1/tramites/estadisticas

Response:
{
  "success": true,
  "data": {
    "total": 150,
    "porEstado": {
      "PENDIENTE": 45,
      "EN_PROCESO": 60,
      "COMPLETADO": 30,
      "RECHAZADO": 10,
      "CANCELADO": 5
    },
    "porTipo": {
      "DNI": 50,
      "PASAPORTE": 30,
      "LICENCIA_CONDUCIR": 40,
      "PARTIDA_NACIMIENTO": 20,
      "CERTIFICADO_ANTECEDENTES": 10
    },
    "tiempoPromedioCompletado": 7.5
  }
}
```

**3. Get Tramite by Number**
```http
GET /api/v1/tramites/numero/TRAM-20260208-00001

Response: Single tramite object or 404 error
```

**4. Get Tramites by DNI**
```http
GET /api/v1/tramites/dni/12345678

Response: Array of tramites for that citizen
```

**5. Create New Tramite**
```http
POST /api/v1/tramites
Content-Type: application/json

{
  "dni": "12345678",
  "nombreCiudadano": "Juan Pérez García",
  "tipoTramite": "DNI",
  "documentosPendientes": ["Foto", "Pago de tasa"],
  "observaciones": "Renovación de DNI por vencimiento",
  "fechaEstimadaFinalizacion": "2026-02-15"
}

Response: Created tramite object with auto-generated numeroTramite
```

**6. Update Tramite**
```http
PUT /api/v1/tramites/TRAM-20260208-00001
Content-Type: application/json

{
  "estado": "EN_PROCESO",
  "documentosPendientes": ["Pago de tasa"],
  "observaciones": "Foto recibida correctamente"
}

Response: Updated tramite object
```

### Data Types

**TipoTramite (Procedure Types):**
- DNI
- PASAPORTE
- LICENCIA_CONDUCIR
- PARTIDA_NACIMIENTO
- CERTIFICADO_ANTECEDENTES
- OTROS

**EstadoTramite (Status):**
- PENDIENTE (gray/yellow)
- EN_PROCESO (blue)
- COMPLETADO (green)
- RECHAZADO (red)
- CANCELADO (dark gray)

### Validation Rules
- **dni**: Exactly 8 digits
- **nombreCiudadano**: 3-200 characters, letters and spaces
- **tipoTramite**: Must be one of the enum values
- **documentosPendientes**: Array of strings, max 20 items
- **observaciones**: Optional, max 500 characters
- **fechaEstimadaFinalizacion**: Must be in the future

---

## Frontend Requirements

### Technology Stack (Recommended)

**Option A - Modern React:**
- React 18+ with Hooks
- React Router v6 for navigation
- Axios for API calls
- TailwindCSS or Material-UI for styling
- React Query or SWR for data fetching and caching
- React Hook Form for form management
- Chart.js or Recharts for statistics visualization

**Option B - Next.js:**
- Next.js 14+ with App Router
- Server Components for performance
- Same libraries as Option A

**Option C - Vue.js:**
- Vue 3 with Composition API
- Vue Router
- Pinia for state management
- Vuetify or PrimeVue for UI components

### Required Pages/Views

#### 1. Home/Dashboard Page (`/`)
**Purpose:** Overview of the system with quick statistics

**Components:**
- Welcome banner with system name "GovTech Trámites"
- Statistics cards showing:
  - Total tramites
  - Tramites by status (with color-coded badges)
  - Average completion time
- Quick action buttons:
  - "Registrar Nuevo Trámite"
  - "Consultar mis Trámites"
- Recent tramites list (last 5-10)
- Chart/graph showing tramites by type (pie or bar chart)
- Chart showing tramites trend over time

**Design:**
- Clean, government-official look (blue and white colors)
- Professional but accessible
- Responsive grid layout
- Icons for each statistic

#### 2. New Tramite Page (`/tramites/nuevo`)
**Purpose:** Register a new government procedure

**Form Fields:**
- DNI (8 digits, numeric input with validation)
- Nombre Ciudadano (text input)
- Tipo de Trámite (dropdown/select with all options)
- Documentos Pendientes (multi-select or dynamic list)
- Observaciones (textarea, optional)
- Fecha Estimada de Finalización (date picker, default +7 days)

**Features:**
- Real-time validation with error messages
- Clear button to reset form
- Submit button that creates the tramite
- Success message with generated numeroTramite
- Redirect or option to view created tramite

**UX Details:**
- Disable submit while processing
- Show loading spinner during submission
- Display error messages from API
- Confirm before clearing form

#### 3. Search/Consult Page (`/tramites/consultar`)
**Purpose:** Citizens check their procedure status

**Components:**
- Search form with two options:
  - By Numero de Trámite (input field)
  - By DNI (shows all tramites for that citizen)
- Search results display:
  - If single tramite: Full details card
  - If multiple: List of cards with summary
- Each tramite card shows:
  - Numero de Trámite (large, prominent)
  - Citizen name and DNI
  - Tipo de Trámite with icon
  - Estado with color-coded badge
  - Documentos Pendientes (with checklist/badges)
  - Progress indicator (percentage based on status)
  - Dates (inicio, estimada finalización)
  - Observaciones
  - Action button to view full details

**Features:**
- Auto-search on Enter key
- Clear search results
- Empty state message when no results
- Error handling for invalid searches

#### 4. All Tramites Page (`/tramites`)
**Purpose:** Administrative view of all procedures

**Components:**
- Filters section:
  - Estado (multi-select checkboxes)
  - Tipo de Trámite (multi-select checkboxes)
  - DNI search (text input)
  - Date range picker (inicio/finalización)
  - Apply/Clear filters buttons
- Results table or card grid:
  - Columns: Numero, DNI, Ciudadano, Tipo, Estado, Fecha Inicio, Acciones
  - Sortable columns
  - Click row to view details
  - Action buttons: View, Edit, (Delete optional)
- Pagination controls:
  - Previous/Next buttons
  - Page numbers (1, 2, 3...)
  - Items per page selector (10, 25, 50, 100)
  - Total count display
- Export button (CSV/Excel - optional)

**Features:**
- Preserve filters in URL query params
- Loading skeleton while fetching
- Auto-refresh option (every 30 seconds)
- Bulk actions (optional)

#### 5. Tramite Details Page (`/tramites/:numeroTramite`)
**Purpose:** Full view of a single procedure

**Components:**
- Header with numeroTramite and current estado
- Citizen information section
- Procedure details section
- Timeline/history section (if tracking updates)
- Documentos Pendientes section:
  - List with checkboxes (read-only or editable)
  - Ability to mark as received
- Observaciones section
- Edit button (goes to edit page)
- Back button

**Design:**
- Clean card-based layout
- Color-coded status banner at top
- Print-friendly version
- Share/copy link button

#### 6. Edit Tramite Page (`/tramites/:numeroTramite/editar`)
**Purpose:** Update existing procedure

**Form Fields:**
- Estado (dropdown)
- Documentos Pendientes (editable list)
- Observaciones (textarea)
- Fecha Estimada Finalización (date picker)
- Read-only: numeroTramite, dni, nombreCiudadano, tipoTramite

**Features:**
- Pre-filled with current data
- Validation
- Cancel button (goes back without saving)
- Save button with confirmation
- Success/error feedback

#### 7. Statistics/Reports Page (`/estadisticas`) - Optional
**Purpose:** Visualize procedure metrics

**Components:**
- Overall statistics cards
- Charts:
  - Tramites by status (pie chart)
  - Tramites by type (bar chart)
  - Completion time distribution (histogram)
  - Trend over time (line chart)
- Date range selector for filtering
- Export report button

---

## Design System & UI/UX Guidelines

### Color Palette (Government Theme)
- **Primary:** #1e40af (blue-800) - Main actions, headers
- **Secondary:** #6366f1 (indigo-500) - Accents
- **Success:** #10b981 (green-500) - Completed status
- **Warning:** #f59e0b (amber-500) - Pending status
- **Error:** #ef4444 (red-500) - Rejected status
- **Info:** #3b82f6 (blue-500) - In process status
- **Neutral:** #6b7280 (gray-500) - Cancelled status
- **Background:** #f9fafb (gray-50)
- **Text:** #111827 (gray-900)

### Typography
- **Headings:** Sans-serif, bold (Inter, Roboto, or system fonts)
- **Body:** Sans-serif, regular weight
- **Sizes:**
  - H1: 2.5rem (40px)
  - H2: 2rem (32px)
  - H3: 1.5rem (24px)
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)

### Status Badges
```
PENDIENTE     → Yellow badge with warning icon
EN_PROCESO    → Blue badge with clock/spinner icon
COMPLETADO    → Green badge with checkmark icon
RECHAZADO     → Red badge with X icon
CANCELADO     → Gray badge with cancel icon
```

### Icons (Recommended: Heroicons, Lucide, or Font Awesome)
- DNI → ID card icon
- PASAPORTE → Passport icon
- LICENCIA_CONDUCIR → Car/driver icon
- PARTIDA_NACIMIENTO → Document/certificate icon
- CERTIFICADO_ANTECEDENTES → Shield/check icon

### Responsive Breakpoints
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: > 1024px (3+ columns)

### Components to Build

**Reusable Components:**
1. **TramiteCard** - Display tramite summary
2. **StatusBadge** - Color-coded status indicator
3. **LoadingSpinner** - For async operations
4. **ErrorMessage** - Display API errors
5. **SuccessMessage** - Confirmation messages
6. **Pagination** - Reusable pagination controls
7. **SearchBar** - Search input with icon
8. **FilterPanel** - Collapsible filter section
9. **StatCard** - Statistics display card
10. **FormField** - Consistent form input wrapper
11. **Modal/Dialog** - Confirmations, details
12. **Navbar** - Navigation with links
13. **Footer** - Credits, links
14. **EmptyState** - No results message

---

## User Flows

### Flow 1: Citizen Registers New Tramite
1. Navigate to home page
2. Click "Registrar Nuevo Trámite"
3. Fill form with their information
4. Submit form
5. See success message with numeroTramite
6. Receive numeroTramite to track their procedure
7. Option to view their tramite details

### Flow 2: Citizen Checks Tramite Status
1. Navigate to "Consultar Trámites"
2. Enter their numeroTramite or DNI
3. Click search
4. View tramite details:
   - Current status
   - Pending documents
   - Estimated completion date
   - Any observations/notes
5. Know what documents they still need to submit

### Flow 3: Admin Reviews All Tramites
1. Navigate to "Todos los Trámites"
2. Apply filters (status, type, date)
3. Browse paginated results
4. Click a tramite to view full details
5. Click "Editar" to update status
6. Update status, remove completed documents, add observations
7. Save changes
8. Return to list

### Flow 4: Admin Views Dashboard
1. Navigate to home
2. See overall statistics at a glance
3. Identify bottlenecks (too many pending, rejected)
4. Click on a statistic to filter tramites by that status
5. Navigate to detailed statistics page for deeper analysis

---

## API Integration Guidelines

### Setup Axios Instance
```javascript
// src/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || 'Error de conexión';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
```

### API Service Layer
```javascript
// src/api/tramites.js
import apiClient from './client';

export const tramitesAPI = {
  getAll: (params) => apiClient.get('/tramites', { params }),
  getByNumero: (numeroTramite) => apiClient.get(`/tramites/numero/${numeroTramite}`),
  getByDNI: (dni) => apiClient.get(`/tramites/dni/${dni}`),
  create: (data) => apiClient.post('/tramites', data),
  update: (numeroTramite, data) => apiClient.put(`/tramites/${numeroTramite}`, data),
  getEstadisticas: () => apiClient.get('/tramites/estadisticas')
};
```

### Error Handling
- Display user-friendly error messages
- Handle network errors gracefully
- Show validation errors from backend
- Retry failed requests (optional)
- Log errors to console for debugging

### Loading States
- Show loading spinner during API calls
- Disable forms/buttons while submitting
- Use skeleton loaders for initial page load
- Provide feedback for all async operations

---

## Additional Features (Optional Enhancements)

### Nice to Have:
1. **Print Functionality** - Print tramite details as PDF
2. **Email Notifications** - Send numeroTramite to citizen's email
3. **Real-time Updates** - WebSocket for live status changes
4. **File Upload** - Upload required documents
5. **Comments/Notes** - Add internal notes to tramites
6. **Audit Log** - Track who changed what and when
7. **Multi-language** - Spanish/English toggle
8. **Dark Mode** - Theme switcher
9. **Accessibility** - WCAG 2.1 AA compliance
10. **PWA** - Installable web app with offline support
11. **QR Code** - Generate QR for numeroTramite
12. **Bulk Import** - CSV upload for multiple tramites

### Security Considerations:
- Sanitize user inputs
- Escape HTML in observaciones to prevent XSS
- Implement rate limiting on frontend
- Add CAPTCHA for public forms (optional)
- Add authentication/authorization (future enhancement)

---

## File Structure (React Example)

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── client.js
│   │   └── tramites.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   └── SuccessMessage.jsx
│   │   ├── tramites/
│   │   │   ├── TramiteCard.jsx
│   │   │   ├── TramiteForm.jsx
│   │   │   ├── TramiteDetails.jsx
│   │   │   ├── TramiteList.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── FilterPanel.jsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.jsx
│   │   │   └── Charts.jsx
│   │   └── pagination/
│   │       └── Pagination.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── NewTramitePage.jsx
│   │   ├── ConsultPage.jsx
│   │   ├── AllTramitesPage.jsx
│   │   ├── TramiteDetailsPage.jsx
│   │   ├── EditTramitePage.jsx
│   │   └── StatisticsPage.jsx
│   ├── hooks/
│   │   ├── useTramites.js
│   │   ├── useEstadisticas.js
│   │   └── usePagination.js
│   ├── utils/
│   │   ├── constants.js (TipoTramite, EstadoTramite enums)
│   │   ├── validators.js
│   │   └── formatters.js (date, status, etc.)
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── .env.example
├── package.json
└── README.md
```

---

## Environment Variables

```env
# .env.example
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_ENV=development
```

---

## Testing Checklist

### Functionality Testing:
- [ ] Create new tramite successfully
- [ ] Search by numeroTramite works
- [ ] Search by DNI works
- [ ] Pagination works correctly
- [ ] Filters apply correctly
- [ ] Edit tramite saves changes
- [ ] Statistics display correctly
- [ ] All validation rules work
- [ ] Error messages display properly
- [ ] Success messages display properly

### UI/UX Testing:
- [ ] Responsive on mobile (320px+)
- [ ] Responsive on tablet (768px+)
- [ ] Responsive on desktop (1024px+)
- [ ] All forms are keyboard accessible
- [ ] Status badges have correct colors
- [ ] Loading states appear
- [ ] Empty states appear when no data
- [ ] Navigation works smoothly
- [ ] Print functionality works (if implemented)

### Browser Testing:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## Deliverables

1. **Working Frontend Application** that connects to the backend API
2. **README.md** with setup instructions
3. **Screenshots** of main pages
4. **Environment configuration** example
5. **Brief user guide** (how citizens use the system)

---

## Success Criteria

The frontend is considered complete when:
1. ✅ All 6 main pages are implemented and functional
2. ✅ All API endpoints are successfully integrated
3. ✅ Forms validate correctly and show errors
4. ✅ Pagination works across all list views
5. ✅ Statistics and charts display real data
6. ✅ Application is responsive on all screen sizes
7. ✅ Error handling is robust and user-friendly
8. ✅ Loading states provide good UX
9. ✅ Design is clean, professional, and accessible
10. ✅ Code is well-organized and maintainable

---

## Notes

- **Focus on functionality first**, then polish the UI
- **Use the existing backend as-is** - it's production-ready
- **Follow REST best practices** for API integration
- **Prioritize user experience** - government systems should be simple and clear
- **Think about citizens** - many users may not be tech-savvy
- **Consider accessibility** - government services must be inclusive

---

Good luck building the GovTech Trámites Frontend! 🚀
