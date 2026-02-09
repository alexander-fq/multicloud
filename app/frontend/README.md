# GovTech Cloud Migration Platform - Frontend

Modern React frontend for the multi-cloud migration platform.

## Stack

- **React 18** - UI library
- **Vite** - Build tool & dev server
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS
- **Axios** - HTTP client

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Platform overview & stats |
| `/architecture` | ArchitecturePage | Architecture details & patterns |
| `/migration` | MigrationPage | Migration tools (scan, plan) |
| `/health` | HealthPage | Real-time system health monitoring |

## Features

### Home Page
- Platform overview
- Current provider status
- Active services display
- Key features showcase
- Statistics dashboard

### Architecture Page
- Architecture layers visualization
- Design patterns explanation
- Code examples
- Architecture diagram
- Benefits list

### Migration Page
- Infrastructure scanner
- Migration plan creator
- Provider selector (AWS, OCI, GCP, Azure)
- Step-by-step migration guide
- Rollback strategy display
- Supported providers grid

### Health Page
- Overall system health
- Database health & connection pool stats
- Cloud provider credentials status
- Real-time monitoring (auto-refresh 30s)
- Individual service checks

## API Integration

All API calls are in `src/services/api.js`:

```javascript
// Health
getHealth()
getDatabaseHealth()
getCloudHealth()

// Info
getPlatformInfo()
getProviderInfo()
getArchitectureInfo()

// Migration
scanInfrastructure()
createMigrationPlan(from, to)
getProviders()
```

## Configuration

Create `.env` file:

```bash
VITE_API_URL=http://localhost:3000
```

## Development

```bash
# Dev server with hot reload
npm run dev

# Backend must be running on port 3000
# Or configure VITE_API_URL
```

## Build

```bash
# Production build
npm run build

# Output in dist/
# Serve with any static file server
```

## Design System

### Colors
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Danger**: Red (#ef4444)

### Components
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.card` - Content card
- `.badge` - Status badge
- `.badge-success` - Success badge
- `.badge-warning` - Warning badge
- `.badge-info` - Info badge

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Navbar.jsx          # Navigation bar
│   ├── pages/
│   │   ├── HomePage.jsx         # Landing page
│   │   ├── ArchitecturePage.jsx # Architecture details
│   │   ├── MigrationPage.jsx    # Migration tools
│   │   └── HealthPage.jsx       # Health monitoring
│   ├── services/
│   │   └── api.js               # API client
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

## Features Showcase

### Real-time Updates
Health page auto-refreshes every 30 seconds

### Responsive Design
Works on mobile, tablet, and desktop

### Loading States
Spinners and disabled states during API calls

### Error Handling
Try-catch blocks with console error logging

### Clean UI
Modern, professional design with TailwindCSS

## Backend API

Frontend expects backend running on `http://localhost:3000` with these endpoints:

- `GET /api/health`
- `GET /api/health/database`
- `GET /api/health/cloud`
- `GET /api/info`
- `GET /api/info/provider`
- `GET /api/info/architecture`
- `POST /api/migration/scan`
- `POST /api/migration/plan`
- `GET /api/migration/providers`

## Demo Ready

This frontend is ready for live demo:
1. Start backend: `cd ../backend && npm start`
2. Start frontend: `npm run dev`
3. Open: `http://localhost:5173`
4. Show all 4 pages to judges

## Hackathon Highlights

- ✅ Clean, modern UI
- ✅ Real API integration
- ✅ Live data display
- ✅ Interactive migration tools
- ✅ Professional design
- ✅ Responsive layout
- ✅ Production-ready code

Built for the hackathon. Ready to impress. 🚀
