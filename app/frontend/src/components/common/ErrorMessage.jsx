function ErrorMessage({ title = 'Error', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-error/5 border border-error/20 rounded-xl">
      <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-error text-4xl">error</span>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Reintentar
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
