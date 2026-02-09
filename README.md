# 🏛️ GovTech Trámites

Full-stack government procedures consultation system built with Node.js, React, and PostgreSQL.

## 📊 Project Status

| Component | Status | Progress |
|-----------|--------|----------|
| **Backend API** | ✅ Complete | 100% |
| **Database** | ✅ Complete | 100% |
| **Frontend Structure** | ✅ Complete | 100% |
| **Frontend Pages** | 🔄 In Progress | 30% |
| **Documentation** | ✅ Complete | 100% |

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Podman Desktop (PostgreSQL)
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd "AWS Cloud"
```

### 2. Start Backend

```bash
cd backend

# Start PostgreSQL container
podman start tramites-postgres

# Install dependencies
npm install

# Start server
npm run dev  # → http://localhost:3000
```

### 3. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev  # → http://localhost:5173
```

### 4. Open in Browser

Navigate to `http://localhost:5173` and start developing!

## 📁 Project Structure

```
AWS Cloud/
├── backend/          # Node.js + Express + PostgreSQL API
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── models/       # Sequelize models
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Express middleware
│   │   ├── app.js        # Express app
│   │   └── server.js     # Entry point
│   ├── tests/            # Test files
│   ├── .env              # Environment variables
│   └── package.json      # Dependencies
│
├── frontend/         # React + Vite + TailwindCSS
│   ├── stitch/           # HTML mockups (reference)
│   ├── src/
│   │   ├── api/          # API client & services
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── utils/        # Utilities & constants
│   │   ├── App.jsx       # Main app
│   │   └── main.jsx      # Entry point
│   ├── .env              # Environment variables
│   └── package.json      # Dependencies
│
└── docs/             # Documentation
```

## 🔌 API Endpoints

Base URL: `http://localhost:3000/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/tramites` | List tramites (paginated) |
| GET | `/tramites/numero/:numero` | Get by number |
| GET | `/tramites/dni/:dni` | Get by DNI |
| POST | `/tramites` | Create tramite |
| PUT | `/tramites/:numero` | Update tramite |
| GET | `/tramites/estadisticas` | Get statistics |

See [backend/API_REFERENCE.md](backend/API_REFERENCE.md) for details.

## 🎨 Tech Stack

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express 4.18
- **Database:** PostgreSQL 14 (Podman)
- **ORM:** Sequelize 6.35
- **Validation:** Joi
- **Security:** Helmet, CORS, Rate limiting

### Frontend
- **Library:** React 18
- **Build Tool:** Vite 5
- **Styling:** TailwindCSS 3.4
- **Routing:** React Router v6
- **Data Fetching:** TanStack Query
- **Forms:** React Hook Form
- **HTTP Client:** Axios
- **Charts:** Recharts

## 📚 Documentation

### Getting Started
- 📖 [Backend Getting Started](backend/GETTING_STARTED.md)
- 📖 [Frontend Setup Guide](frontend/SETUP_GUIDE.md)

### API Documentation
- 📖 [API Reference](backend/API_REFERENCE.md)
- 📖 [Routes Guide](backend/ROUTES_GUIDE.md)
- 📖 [Middleware Guide](backend/MIDDLEWARE_GUIDE.md)

### Frontend Documentation
- 📖 [Frontend README](frontend/README.md)
- 📖 [Migration Guide](frontend/MIGRATION_GUIDE.md) (HTML → React)
- 📖 [Frontend Prompt](FRONTEND_PROMPT.md) (Design spec)

### Project Overview
- 📖 [Project Summary](PROJECT_SUMMARY.md)

## 🛠️ Development

### Backend Commands

```bash
cd backend

npm start        # Production server
npm run dev      # Development with auto-reload
npm test         # Run tests
npm run lint     # Check code quality
npm run lint:fix # Fix linting issues
```

### Frontend Commands

```bash
cd frontend

npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Check code quality
npm run format   # Format code with Prettier
npm test         # Run tests
```

## 🌐 Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tramites_db
DB_USER=postgres
DB_PASSWORD=postgres123
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000
VITE_ENV=development
```

## 🧪 Testing

### Backend

```bash
cd backend
npm test  # Runs all test files
```

Test files:
- `test-tramite-model.js` - Model tests
- `test-controller.js` - Controller tests
- `test-middleware.js` - Middleware tests
- `test-app.js` - Integration tests

### Frontend

```bash
cd frontend
npm test  # Runs Vitest
```

## 🔐 Security Features

- ✅ Rate limiting (100 req/15min general, 10/hour create)
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Input validation (Joi schemas)
- ✅ SQL injection protection (Sequelize ORM)
- ✅ Error handling (no sensitive data exposure)

## 🎯 Roadmap

### ✅ Phase 1: Core Backend (Complete)
- [x] Project setup
- [x] Database configuration
- [x] Data model
- [x] Controllers
- [x] Routes
- [x] Middleware
- [x] Application assembly

### ✅ Phase 2: Frontend Structure (Complete)
- [x] React + Vite setup
- [x] Folder structure
- [x] API integration layer
- [x] Core components
- [x] Routing
- [x] Documentation

### 🔄 Phase 3: Frontend Implementation (In Progress)
- [ ] Dashboard page with statistics
- [ ] New tramite form
- [ ] Search/consult page
- [ ] Tramite list with filters
- [ ] Tramite details page
- [ ] Edit tramite page
- [ ] Statistics/charts page

### 📝 Phase 4: Enhancement (TODO)
- [ ] Authentication & authorization
- [ ] File upload
- [ ] Email notifications
- [ ] Audit logging
- [ ] Dark mode toggle
- [ ] PWA support
- [ ] Multi-language (i18n)

### 🚀 Phase 5: Deployment (TODO)
- [ ] Production build optimization
- [ ] CI/CD pipeline
- [ ] Cloud deployment (AWS/GCP/Oracle)
- [ ] Monitoring & logging
- [ ] Performance optimization

## 🤝 Contributing

### Git Workflow

1. Create feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. Push and create Pull Request:
   ```bash
   git push origin feature/your-feature
   ```

### Coding Standards

- **Backend:** Follow ESLint rules, use async/await
- **Frontend:** Follow React best practices, use functional components
- **Formatting:** Run Prettier before committing
- **Commits:** Use conventional commit messages

## 📞 Support & Help

- **Backend issues:** Check [GETTING_STARTED.md](backend/GETTING_STARTED.md)
- **Frontend issues:** Check [SETUP_GUIDE.md](frontend/SETUP_GUIDE.md)
- **API questions:** See [API_REFERENCE.md](backend/API_REFERENCE.md)
- **General questions:** Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

## 👥 Team

GovTech Development Team

## 📄 License

MIT License - See LICENSE file for details

---

Built with ❤️ using Node.js, React, PostgreSQL, and TailwindCSS
