import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
          Bienvenido a GovTech Trámites
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Sistema de gestión y consulta de trámites gubernamentales
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Link
          to="/tramites/nuevo"
          className="group p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-card-hover transition-all hover:border-primary/50"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">note_add</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
            Registrar Nuevo Trámite
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Inicie un nuevo trámite completando el formulario
          </p>
        </Link>

        <Link
          to="/tramites/consultar"
          className="group p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-card-hover transition-all hover:border-primary/50"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">pageview</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
            Consultar Trámite
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Busque el estado de su trámite por número o DNI
          </p>
        </Link>
      </div>
    </div>
  );
}

export default HomePage;
