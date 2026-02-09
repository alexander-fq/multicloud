import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-slate-400 text-6xl">search_off</span>
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
        Página no encontrada
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
        La página que buscas no existe o ha sido movida.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:brightness-110 transition-all"
      >
        <span className="material-symbols-outlined">home</span>
        Volver al Inicio
      </Link>
    </div>
  );
}

export default NotFoundPage;
