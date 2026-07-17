export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 text-center sm:text-left">
        <a href="#" className="underline hover:text-slate-700 transition-colors">
          Kebijakan Privasi
        </a>
        <span>Copyright@ JejakHijau {year}</span>
      </div>
    </footer>
  );
}
