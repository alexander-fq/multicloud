# Migration Guide: HTML Mockups to React

Guide for converting Stitch HTML mockups to React components.

## 📊 Current Status

### Available Mockups in `stitch/`

| Page | HTML Code | Screenshot | Status |
|------|-----------|------------|--------|
| Dashboard Overview | ❌ No | ✅ Yes | 🔴 Not migrated |
| Register New Procedure | ❌ No | ✅ Yes | 🔴 Not migrated |
| Procedure Status Consultation | ❌ No | ✅ Yes | 🔴 Not migrated |
| Administrative Procedure List | ✅ Yes | ✅ Yes | 🟡 Stub only |
| Edit Procedure Details | ✅ Yes | ✅ Yes | 🟡 Stub only |

### Design System Extracted

- ✅ Colors: `#1e3fae` (primary), `#f6f6f8` (bg-light), `#121520` (bg-dark)
- ✅ Font: Public Sans
- ✅ Icons: Material Symbols Outlined
- ✅ Layout: Max-width 1440px, responsive grid

## 🔄 Migration Steps

### General Process

1. **Analyze HTML mockup**
   - Identify layout structure
   - Note color scheme and spacing
   - List interactive elements
   - Identify reusable components

2. **Create React component**
   - Convert HTML to JSX
   - Replace `class` with `className`
   - Extract reusable parts
   - Add state management
   - Integrate with API

3. **Add interactivity**
   - Replace static data with API calls
   - Add form validation
   - Add loading/error states
   - Add user feedback (toasts)

4. **Test and refine**
   - Test all user flows
   - Verify responsiveness
   - Check accessibility
   - Test with real backend data

### Example: Converting Administrative Procedure List

#### Original HTML (simplified)

```html
<div class="bg-white dark:bg-slate-900 rounded-xl border">
  <div class="p-5 border-b">
    <h2 class="font-bold">Filters</h2>
  </div>
  <div class="p-5">
    <select class="w-full rounded-lg border-slate-200">
      <option>All Statuses</option>
      <option>Pending Review</option>
    </select>
  </div>
</div>
```

#### React Component

```jsx
import { useState } from 'react';

function FilterPanel({ onFilterChange }) {
  const [status, setStatus] = useState('');

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    onFilterChange({ status: e.target.value });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
        <h2 className="font-bold text-slate-900 dark:text-white">Filtros</h2>
      </div>
      <div className="p-5">
        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
          Estado del Trámite
        </label>
        <select
          value={status}
          onChange={handleStatusChange}
          className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:border-primary focus:ring-primary"
        >
          <option value="">Todos los Estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROCESO">En Proceso</option>
          <option value="COMPLETADO">Completado</option>
          <option value="RECHAZADO">Rechazado</option>
        </select>
      </div>
    </div>
  );
}

export default FilterPanel;
```

## 🎯 Priority Migration Order

### Phase 1: Core Functionality (Week 1)

1. ✅ **Layout Components** (DONE)
   - [x] Navbar
   - [x] Footer
   - [x] Layout wrapper

2. 🔄 **Dashboard/Home Page**
   - [ ] Statistics cards
   - [ ] Quick action buttons
   - [ ] Recent tramites list
   - [ ] Charts (optional)

3. 🔄 **New Tramite Form**
   - [ ] Form fields with validation
   - [ ] Document list manager
   - [ ] Date picker
   - [ ] Submit handler with API
   - [ ] Success/error feedback

### Phase 2: Search & View (Week 2)

4. 🔄 **Consult Page**
   - [ ] Search by numero form
   - [ ] Search by DNI form
   - [ ] Results display
   - [ ] Tramite card component

5. 🔄 **Tramite Details Page**
   - [ ] Full tramite information
   - [ ] Status badge
   - [ ] Document checklist
   - [ ] Timeline (optional)
   - [ ] Action buttons

### Phase 3: Admin Features (Week 3)

6. 🔄 **All Tramites Page**
   - [ ] Filter panel
   - [ ] Tramites table/grid
   - [ ] Pagination
   - [ ] Sorting
   - [ ] Export (optional)

7. 🔄 **Edit Tramite Page**
   - [ ] Pre-filled form
   - [ ] Editable fields
   - [ ] Update handler
   - [ ] Validation

### Phase 4: Analytics (Week 4)

8. 🔄 **Statistics Page**
   - [ ] Overall stats cards
   - [ ] Pie chart (by status)
   - [ ] Bar chart (by type)
   - [ ] Line chart (trend)
   - [ ] Date range filter

## 📝 Component Mapping

### HTML Mockup → React Component

| HTML Element | React Component | Location |
|--------------|-----------------|----------|
| Top navigation bar | `<Navbar />` | `src/components/layout/Navbar.jsx` |
| Bottom footer | `<Footer />` | `src/components/layout/Footer.jsx` |
| Status badge | `<StatusBadge />` | `src/components/tramites/StatusBadge.jsx` |
| Loading spinner | `<LoadingSpinner />` | `src/components/common/LoadingSpinner.jsx` |
| Error message | `<ErrorMessage />` | `src/components/common/ErrorMessage.jsx` |
| Empty state | `<EmptyState />` | `src/components/common/EmptyState.jsx` |
| Filter panel | `<FilterPanel />` | `src/components/tramites/FilterPanel.jsx` |
| Tramite card | `<TramiteCard />` | `src/components/tramites/TramiteCard.jsx` |
| Tramite form | `<TramiteForm />` | `src/components/tramites/TramiteForm.jsx` |
| Pagination | `<Pagination />` | `src/components/pagination/Pagination.jsx` |
| Stat card | `<StatCard />` | `src/components/dashboard/StatCard.jsx` |

## 🛠️ Conversion Tips

### 1. Class to className

```html
<!-- HTML -->
<div class="flex items-center gap-3">

<!-- React JSX -->
<div className="flex items-center gap-3">
```

### 2. Inline Styles

```html
<!-- HTML -->
<div style="background-image: url('...')">

<!-- React JSX -->
<div style={{ backgroundImage: `url('...')` }}>
```

### 3. Event Handlers

```html
<!-- HTML -->
<button onclick="handleClick()">

<!-- React JSX -->
<button onClick={handleClick}>
```

### 4. Form Inputs

```html
<!-- HTML -->
<input type="text" value="fixed value">

<!-- React JSX with state -->
<input type="text" value={value} onChange={(e) => setValue(e.target.value)} />
```

### 5. Conditional Rendering

```html
<!-- HTML (hidden with CSS or display:none) -->
<div class="hidden">

<!-- React JSX -->
{showElement && <div>...</div>}
```

### 6. Lists

```html
<!-- HTML -->
<div>Item 1</div>
<div>Item 2</div>

<!-- React JSX -->
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}
```

### 7. Dark Mode Classes

TailwindCSS dark mode already configured:

```jsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
```

## 🎨 Styling Conversion

### Color Classes

| HTML (Stitch) | TailwindCSS | Custom Class |
|---------------|-------------|--------------|
| `color: #1e3fae` | `text-[#1e3fae]` | `text-primary` |
| `background: #1e3fae` | `bg-[#1e3fae]` | `bg-primary` |
| `background: #f6f6f8` | `bg-[#f6f6f8]` | `bg-background-light` |
| `background: #121520` | `bg-[#121520]` | `bg-background-dark` |

### Font Classes

| HTML | TailwindCSS |
|------|-------------|
| `font-family: 'Public Sans'` | `font-display` or `font-sans` |
| `font-weight: 900` | `font-black` |
| `font-weight: 700` | `font-bold` |
| `font-weight: 600` | `font-semibold` |
| `font-weight: 500` | `font-medium` |

## 🔌 Adding API Integration

### Before: Static Data

```jsx
const tramites = [
  { id: 1, numero: 'TRAM-001', estado: 'PENDIENTE' },
  { id: 2, numero: 'TRAM-002', estado: 'COMPLETADO' },
];
```

### After: API Data with React Query

```jsx
import { useQuery } from '@tanstack/react-query';
import { tramitesAPI } from '../api/tramites';

function TramitesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tramites', { page: 1, limit: 10 }],
    queryFn: () => tramitesAPI.getAll({ page: 1, limit: 10 })
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      {data.data.map(tramite => (
        <TramiteCard key={tramite.id} tramite={tramite} />
      ))}
    </div>
  );
}
```

## ✅ Migration Checklist

For each page:

- [ ] Extract layout structure from HTML
- [ ] Identify reusable components
- [ ] Create React component files
- [ ] Convert HTML to JSX
- [ ] Replace static data with state
- [ ] Add API integration
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add form validation (if applicable)
- [ ] Add user feedback (toasts)
- [ ] Test responsiveness
- [ ] Test dark mode
- [ ] Test with real backend
- [ ] Add accessibility attributes
- [ ] Code review
- [ ] Documentation

## 🚧 Known Challenges

### Challenge 1: Form State Management

**Solution:** Use React Hook Form

```jsx
import { useForm } from 'react-hook-form';

function TramiteForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    await tramitesAPI.create(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('dni', { required: true, pattern: /^\d{8}$/ })} />
      {errors.dni && <span>DNI inválido</span>}
    </form>
  );
}
```

### Challenge 2: Complex Filters

**Solution:** Use URL search params

```jsx
import { useSearchParams } from 'react-router-dom';

function AllTramitesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1');
  const estado = searchParams.get('estado') || '';

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };
}
```

### Challenge 3: Date Formatting

**Solution:** Use date-fns

```jsx
import { formatDate } from '../utils/formatters';

<p>{formatDate(tramite.fechaInicio)}</p>  // "08/02/2026"
```

## 📚 Resources

- [React Docs](https://react.dev)
- [TailwindCSS Docs](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
- [React Query](https://tanstack.com/query/latest)
- [date-fns](https://date-fns.org)

---

Start with the simplest pages first, then move to more complex ones as you get comfortable with the patterns!
