function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div>
            <p>
              © {new Date().getFullYear()} <span className="font-semibold text-primary">GovTech</span> Trámites.
              Todos los derechos reservados.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">
              Términos y Condiciones
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Ayuda
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
