function EmptyState({ icon = 'inbox', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-slate-400 text-5xl">{icon}</span>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">{message}</p>
      </div>
      {action}
    </div>
  );
}

export default EmptyState;
