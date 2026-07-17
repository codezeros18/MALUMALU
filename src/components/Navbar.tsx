import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Beranda', to: '/' },
  { label: 'Tentang Kami', to: '/tentang' },
  { label: 'Platform', to: '/#fitur-platform' },
  { label: 'Untuk Siapa', to: '/#model-nilai' },
  { label: 'Harga', to: '/#model-bisnis' },
];

export default function Navbar() {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/JejakHijau.png" alt="JejakHijau" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold text-slate-900">JejakHijau</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          {NAV_LINKS.map((link) =>
            link.to.includes('#') ? (
              // Anchor lintas-halaman: <a> biasa (bukan react-router <Link>) supaya kalau
              // dipencet dari luar "/" (mis. dari /masuk) browser navigasi penuh ke "/"
              // dulu baru lompat ke section -- <Link> SPA tidak akan scroll ke hash
              // section pada halaman tujuan yang berbeda dari halaman asal.
              <a key={link.label} href={link.to} className="hover:text-slate-900 transition-colors">
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.to} className="hover:text-slate-900 transition-colors">
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/masuk"
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white bg-brand-800 hover:bg-brand-800/90 transition-colors"
          >
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}
