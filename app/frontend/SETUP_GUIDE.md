# Frontend Setup Guide - GovTech Trámites

Complete guide for setting up the frontend development environment on WSL/Windows.

## 📋 Prerequisites Check

Before starting, verify you have:

### 1. Node.js and npm

```bash
node --version  # Should be v18+ (v20 recommended)
npm --version   # Should be v9+
```

If not installed, use NVM:

```bash
# Install NVM (if not installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node 20
nvm install 20
nvm use 20
```

### 2. Git

```bash
git --version  # Should output git version
```

### 3. Backend API Running

The frontend needs the backend API to be running:

```bash
# In backend directory
cd ../backend
npm run dev  # Should start on http://localhost:3000
```

Test backend:
```bash
curl http://localhost:3000/api/v1/health
# Should return: {"success":true,"message":"API is healthy"}
```

## 🚀 Quick Start

### Step 1: Navigate to Frontend Directory

```bash
cd "frontend"
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`. It may take 2-5 minutes.

Expected output:
```
added 532 packages in 3m
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Verify configuration
cat .env
```

Should show:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000
VITE_ENV=development
```

### Step 4: Start Development Server

```bash
npm run dev
```

Expected output:
```
VITE v5.1.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### Step 5: Open in Browser

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the GovTech Trámites homepage!

## 🛠️ Development Workflow

### Running the App

1. **Start Backend** (in one terminal):
   ```bash
   cd backend
   npm run dev  # Runs on port 3000
   ```

2. **Start Frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev  # Runs on port 5173
   ```

### Making Changes

1. Edit files in `src/` directory
2. Vite will automatically reload the browser (Hot Module Replacement)
3. Check browser console for errors
4. Check terminal for build errors

### Code Quality

Before committing:

```bash
# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Check for errors
npm run lint
```

## 📁 Project Tour

### Important Files

```
frontend/
├── src/
│   ├── main.jsx          # Entry point - starts React app
│   ├── App.jsx           # Main component with routes
│   ├── index.css         # Global styles + Tailwind imports
│   ├── api/
│   │   ├── client.js     # Axios HTTP client
│   │   └── tramites.js   # API endpoints for tramites
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx   # Main layout wrapper
│   │   │   ├── Navbar.jsx   # Top navigation
│   │   │   └── Footer.jsx   # Bottom footer
│   │   └── common/
│   │       ├── LoadingSpinner.jsx
│   │       ├── ErrorMessage.jsx
│   │       └── EmptyState.jsx
│   ├── pages/
│   │   ├── HomePage.jsx           # Dashboard (/)
│   │   ├── NewTramitePage.jsx     # Create tramite
│   │   ├── ConsultPage.jsx        # Search tramites
│   │   ├── AllTramitesPage.jsx    # Admin list
│   │   └── ...
│   └── utils/
│       ├── constants.js    # Enums, colors, config
│       ├── formatters.js   # Date, number formatting
│       └── validators.js   # Form validation
├── index.html         # HTML template
├── package.json       # Dependencies and scripts
├── vite.config.js     # Vite configuration
├── tailwind.config.js # TailwindCSS theme
└── .env               # Environment variables
```

### Adding a New Page

1. Create page component in `src/pages/`:
   ```jsx
   // src/pages/MyNewPage.jsx
   function MyNewPage() {
     return (
       <div className="max-w-4xl mx-auto px-6 py-12">
         <h1 className="text-3xl font-black mb-8">My New Page</h1>
         <p>Content here...</p>
       </div>
     );
   }
   export default MyNewPage;
   ```

2. Add route in `src/App.jsx`:
   ```jsx
   import MyNewPage from './pages/MyNewPage';

   <Route path="/my-page" element={<MyNewPage />} />
   ```

3. Add navigation link in `Navbar.jsx`:
   ```jsx
   <NavLink to="/my-page">My Page</NavLink>
   ```

### Adding a New Component

1. Create component file:
   ```jsx
   // src/components/common/MyComponent.jsx
   function MyComponent({ title, onClick }) {
     return (
       <button onClick={onClick} className="px-4 py-2 bg-primary text-white rounded">
         {title}
       </button>
     );
   }
   export default MyComponent;
   ```

2. Import and use:
   ```jsx
   import MyComponent from '../components/common/MyComponent';

   <MyComponent title="Click me" onClick={() => alert('Clicked!')} />
   ```

## 🎨 Styling Guide

### Using TailwindCSS

This project uses TailwindCSS for styling. No need for separate CSS files!

```jsx
// Instead of CSS classes:
<div className="container mx-auto px-4">
  <h1 className="text-3xl font-bold text-primary">Hello</h1>
  <p className="text-slate-600 dark:text-slate-400">Description</p>
</div>
```

### Custom Colors

Available in `tailwind.config.js`:

```js
bg-primary              // GovTech blue (#1e3fae)
bg-background-light     // Light mode background
bg-background-dark      // Dark mode background
text-success            // Green
text-warning            // Yellow
text-error              // Red
text-info               // Blue
```

### Icons

Uses Material Symbols from Google Fonts:

```jsx
<span className="material-symbols-outlined">search</span>
<span className="material-symbols-outlined">add_circle</span>
<span className="material-symbols-outlined">check_circle</span>
```

[Browse all icons](https://fonts.google.com/icons)

## 🔌 API Integration

### Making API Calls

Use the pre-configured API client:

```jsx
import { tramitesAPI } from '../api/tramites';

// In your component
async function fetchTramites() {
  try {
    const response = await tramitesAPI.getAll({ page: 1, limit: 10 });
    console.log(response.data); // Array of tramites
    console.log(response.pagination); // Pagination info
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Using React Query

For better data management:

```jsx
import { useQuery } from '@tanstack/react-query';
import { tramitesAPI } from '../api/tramites';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tramites'],
    queryFn: () => tramitesAPI.getAll({ page: 1, limit: 10 })
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      {data.data.map(tramite => (
        <div key={tramite.id}>{tramite.numeroTramite}</div>
      ))}
    </div>
  );
}
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Create test file next to component:

```jsx
// MyComponent.test.jsx
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders component', () => {
  render(<MyComponent title="Test" />);
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

## 🐛 Common Issues

### Issue: "Cannot find module"

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Port 5173 already in use"

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.js
```

### Issue: "CORS error when calling API"

1. Verify backend is running
2. Check backend CORS configuration in `backend/src/middleware/security.js`
3. Verify `VITE_API_URL` in `.env` is correct

### Issue: "Module not found: Can't resolve 'sonner'"

```bash
# Install missing dependency
npm install sonner
```

### Issue: Hot reload not working

1. Check Vite dev server is running
2. Try restarting dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache

## 📦 Building for Production

### Build

```bash
npm run build
```

Output will be in `dist/` folder.

### Preview Build

```bash
npm run preview
```

Opens production build at `http://localhost:4173`

### Deploy

#### Option 1: Vercel (Recommended)

```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

#### Option 2: Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

## 🔧 Advanced Configuration

### Environment Variables

Create `.env.local` for local overrides (not committed to Git):

```env
VITE_API_URL=http://192.168.1.100:3000/api/v1  # Custom API URL
VITE_ENABLE_STATISTICS=false                    # Disable features
```

### Path Aliases

Already configured in `vite.config.js`:

```jsx
// Instead of: import Foo from '../../../components/Foo'
import Foo from '@components/Foo';

// Available aliases:
// @/           → src/
// @components/ → src/components/
// @pages/      → src/pages/
// @api/        → src/api/
// @utils/      → src/utils/
```

## ✅ Checklist for Team Members

- [ ] Node.js 20 installed
- [ ] npm 9+ installed
- [ ] Git configured
- [ ] Backend API running
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `.env` file created and configured
- [ ] Dev server starts successfully (`npm run dev`)
- [ ] Can access app in browser at `http://localhost:5173`
- [ ] Linter and formatter work (`npm run lint`, `npm run format`)
- [ ] Can make changes and see hot reload

## 📚 Next Steps

1. Review [FRONTEND_PROMPT.md](../FRONTEND_PROMPT.md) for full feature list
2. Check [README.md](./README.md) for detailed documentation
3. Explore existing components in `src/components/`
4. Start implementing pages based on HTML mockups in `stitch/`
5. Refer to [Backend API Reference](../backend/API_REFERENCE.md)

## 💬 Getting Help

- Check browser console for errors (F12)
- Check terminal for build errors
- Review error messages carefully
- Search error messages on Stack Overflow
- Ask team members

---

Happy coding! 🎉
