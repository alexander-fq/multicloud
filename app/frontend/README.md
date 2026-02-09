# GovTech Trámites - Frontend

Modern React frontend application for the GovTech government procedures consultation system.

## 🚀 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Recharts** - Charts and visualizations
- **Lucide Icons** - Icon library
- **Sonner** - Toast notifications
- **date-fns** - Date formatting

## 📋 Prerequisites

- Node.js 18+ (currently using Node 20)
- npm 9+
- Backend API running on `http://localhost:3000`

## ⚙️ Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update `.env` if needed:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000
VITE_ENV=development
```

### 3. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API client and services
│   │   ├── client.js   # Axios instance with interceptors
│   │   └── tramites.js # Tramites API endpoints
│   ├── components/     # React components
│   │   ├── common/     # Reusable UI components
│   │   ├── tramites/   # Tramite-specific components
│   │   ├── dashboard/  # Dashboard components
│   │   ├── pagination/ # Pagination components
│   │   └── layout/     # Layout components (Navbar, Footer)
│   ├── pages/          # Page components (routes)
│   │   ├── HomePage.jsx
│   │   ├── NewTramitePage.jsx
│   │   ├── ConsultPage.jsx
│   │   ├── AllTramitesPage.jsx
│   │   ├── TramiteDetailsPage.jsx
│   │   ├── EditTramitePage.jsx
│   │   └── StatisticsPage.jsx
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   │   ├── constants.js   # Enums and constants
│   │   ├── formatters.js  # Date, number formatters
│   │   └── validators.js  # Form validation
│   ├── App.jsx         # Main app component with routes
│   ├── main.jsx        # React entry point
│   └── index.css       # Global styles + Tailwind
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # TailwindCSS configuration
├── postcss.config.js   # PostCSS configuration
├── .eslintrc.cjs       # ESLint configuration
├── .prettierrc         # Prettier configuration
├── .env                # Environment variables
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## 🛠️ Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 🎨 Design System

### Colors (from Stitch mockups)

```js
primary: '#1e3fae'          // GovTech blue
background-light: '#f6f6f8' // Light mode background
background-dark: '#121520'  // Dark mode background
success: '#10b981'          // Green for COMPLETADO
warning: '#f59e0b'          // Yellow for PENDIENTE
error: '#ef4444'            // Red for RECHAZADO
info: '#3b82f6'             // Blue for EN_PROCESO
neutral: '#6b7280'          // Gray for CANCELADO
```

### Typography

- **Font Family:** Public Sans (matching Stitch design)
- **H1:** 40px (2.5rem), font-black
- **H2:** 32px (2rem), font-bold
- **H3:** 24px (1.5rem), font-semibold
- **Body:** 16px (1rem), font-normal
- **Small:** 14px (0.875rem)

### Status Badges

Each tramite status has a unique color and icon:

- **PENDIENTE** - Yellow badge with `schedule` icon
- **EN_PROCESO** - Blue badge with `autorenew` icon
- **COMPLETADO** - Green badge with `check_circle` icon
- **RECHAZADO** - Red badge with `cancel` icon
- **CANCELADO** - Gray badge with `block` icon

## 🔌 API Integration

The frontend connects to the backend API at `http://localhost:3000/api/v1`.

### API Endpoints Used

- `GET /tramites` - List all tramites (with pagination/filters)
- `GET /tramites/numero/:numeroTramite` - Get tramite by number
- `GET /tramites/dni/:dni` - Get tramites by DNI
- `POST /tramites` - Create new tramite
- `PUT /tramites/:numeroTramite` - Update tramite
- `GET /tramites/estadisticas` - Get statistics
- `GET /health` - Health check

See `src/api/tramites.js` for full API service implementation.

## 📄 Pages/Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `HomePage` | Dashboard with statistics and quick actions |
| `/tramites` | `AllTramitesPage` | Administrative list of all tramites |
| `/tramites/nuevo` | `NewTramitePage` | Create new tramite form |
| `/tramites/consultar` | `ConsultPage` | Search tramites by number or DNI |
| `/tramites/:numeroTramite` | `TramiteDetailsPage` | View tramite details |
| `/tramites/:numeroTramite/editar` | `EditTramitePage` | Edit tramite form |
| `/estadisticas` | `StatisticsPage` | Charts and reports |

## 🧩 Key Components

### Layout Components
- **`Layout`** - Main layout wrapper with Navbar and Footer
- **`Navbar`** - Top navigation bar with logo and menu
- **`Footer`** - Bottom footer with links

### Common Components
- **`LoadingSpinner`** - Loading indicator
- **`ErrorMessage`** - Error display with retry button
- **`EmptyState`** - Empty state placeholder
- **`StatusBadge`** - Color-coded status badges

### Tramite Components
- **`TramiteCard`** - Display tramite summary card
- **`TramiteForm`** - Create/edit tramite form
- **`TramiteDetails`** - Full tramite details view
- **`TramiteList`** - List of tramites with pagination
- **`FilterPanel`** - Filters for tramite list

(Note: Some components are stubs and will be implemented)

## 🚧 Development Status

### ✅ Completed
- [x] Project setup and configuration
- [x] Folder structure
- [x] API client with interceptors
- [x] Routing setup
- [x] Layout components (Navbar, Footer)
- [x] Basic pages (stubs)
- [x] Utility functions (constants, formatters, validators)
- [x] Loading and error states
- [x] Status badge component
- [x] Environment configuration

### 🔄 In Progress
- [ ] Form components with validation
- [ ] Tramite list with filters and pagination
- [ ] Statistics dashboard with charts
- [ ] Search functionality

### 📝 TODO
- [ ] Complete all page implementations
- [ ] Add comprehensive form validation
- [ ] Implement charts with Recharts
- [ ] Add dark mode toggle
- [ ] Add print functionality
- [ ] Add export to CSV
- [ ] Write unit tests
- [ ] Add E2E tests with Playwright
- [ ] Optimize performance
- [ ] Add accessibility features (WCAG 2.1)
- [ ] Add PWA support

## 🐛 Troubleshooting

### Port 5173 already in use

```bash
# Kill process using port
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.js
```

### API connection errors

1. Verify backend is running on `http://localhost:3000`
2. Check `.env` has correct `VITE_API_URL`
3. Check browser console for CORS errors

### Module not found errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Contributing

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

### Code Style

- Use Prettier for formatting: `npm run format`
- Follow ESLint rules: `npm run lint:fix`
- Use TypeScript-style JSDoc comments
- Keep components small and focused
- Use functional components with hooks

### Naming Conventions

- Components: PascalCase (`TramiteCard.jsx`)
- Utilities: camelCase (`formatters.js`)
- Constants: UPPER_SNAKE_CASE (`TIPO_TRAMITE`)
- CSS classes: TailwindCSS utilities

## 📦 Building for Production

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

The build output will be in the `dist/` folder.

## 🚀 Deployment

See deployment guides:
- AWS S3 + CloudFront
- Vercel (easiest)
- Netlify
- GitHub Pages

Example Vercel deployment:

```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)
- [TanStack Query](https://tanstack.com/query/latest)
- [Backend API Reference](../backend/API_REFERENCE.md)

## 📄 License

MIT License - See LICENSE file for details

## 👥 Team

GovTech Development Team

---

Built with ❤️ using React + Vite + TailwindCSS
