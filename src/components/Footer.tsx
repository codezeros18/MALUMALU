export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-500">
        <a href="#" className="underline hover:text-slate-700 transition-colors">
          Kebijakan Privasi
        </a>
        <span>Copyright@ Paspor Petani {year}</span>
      </div>
    </footer>
  );
}
