import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <span className="material-symbols-outlined block text-2xl">description</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-primary">GovTech</span>{' '}
            <span className="font-normal text-slate-500">Trámites</span>
          </h1>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary border-b-2 border-primary pb-1'
                  : 'text-slate-600 dark:text-slate-400 hover:text-primary'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/tramites/consultar"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary border-b-2 border-primary pb-1'
                  : 'text-slate-600 dark:text-slate-400 hover:text-primary'
              }`
            }
          >
            Consultar
          </NavLink>
          <NavLink
            to="/tramites"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary border-b-2 border-primary pb-1'
                  : 'text-slate-600 dark:text-slate-400 hover:text-primary'
              }`
            }
          >
            Todos los Trámites
          </NavLink>
          <NavLink
            to="/estadisticas"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary border-b-2 border-primary pb-1'
                  : 'text-slate-600 dark:text-slate-400 hover:text-primary'
              }`
            }
          >
            Estadísticas
          </NavLink>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/tramites/nuevo"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-lg">note_add</span>
            Nuevo Trámite
          </Link>

          {/* User menu placeholder */}
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
