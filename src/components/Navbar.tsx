import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Tentang Kami', to: '/tentang' },
  { label: 'Cara Kerja', to: '/#cara-kerja' },
  { label: 'Platform', to: '/#fitur-platform' },
  { label: 'Untuk Siapa', to: '/#model-nilai' },
  { label: 'Teknologi', to: '/#teknologi' },
  { label: 'Harga', to: '/#model-bisnis' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-slate-100 bg-white sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileOpen(false)}>
          <img src="/JejakHijau.png" alt="JejakHijau" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          <span className="text-base sm:text-lg font-bold text-slate-900">JejakHijau</span>
        </Link>

        {/* Breakpoint lg (bukan md): 6 tautan + tombol Masuk butuh ruang lebih di
            layar tablet supaya tidak berdesakan -- di bawah lg tampilkan hamburger. */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
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

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/masuk"
            className="inline-flex items-center px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-brand-800 hover:bg-brand-800/90 transition-colors"
          >
            Masuk
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            className="lg:hidden relative w-9 h-9 grid place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"
          >
            <span className="relative w-[18px] h-[18px] block">
              <Menu
                size={18}
                className={`absolute inset-0 transition-all duration-300 ease-out ${
                  mobileOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                }`}
              />
              <X
                size={18}
                className={`absolute inset-0 transition-all duration-300 ease-out ${
                  mobileOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Trik grid-rows animasi tinggi otomatis (0fr <-> 1fr) -- tanpa ini,
          panel cuma muncul/hilang instan (mount/unmount), tidak smooth. */}
      <div
        className={`lg:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          mobileOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <nav className="overflow-hidden border-slate-100 bg-white">
          <div className="border-t border-slate-100 px-5 py-3 flex flex-col text-sm font-medium text-slate-600">
            {NAV_LINKS.map((link) =>
              link.to.includes('#') ? (
                <a
                  key={link.label}
                  href={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 border-b border-slate-50 last:border-0 hover:text-slate-900 transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 border-b border-slate-50 last:border-0 hover:text-slate-900 transition-colors"
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
