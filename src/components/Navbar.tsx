import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { label: 'Beranda', to: '#beranda' },
  { label: 'Tentang Kami', to: '#tentang-kami' },
  { label: 'Alur Kerja', to: '#alur-kerja' },
  { label: 'Untuk Siapa', to: '#untuk-siapa' },
  { label: 'Harga', to: '#harga' },
];

export default function Navbar() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/' || location.pathname === '/tentang';
  const [activeSection, setActiveSection] = useState('#beranda');

  useEffect(() => {
    if (!isLandingPage) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120; // Sweet spot offset for active header highlight

      // Check if we are close to the bottom of the page
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
      if (isAtBottom) {
        setActiveSection('#harga');
        return;
      }

      for (const link of NAV_LINKS) {
        const el = document.querySelector(link.to);
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          const height = (el as HTMLElement).offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(link.to);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run initially
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLandingPage]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    if (isLandingPage) {
      e.preventDefault();
      const el = document.querySelector(to);
      if (el) {
        const headerOffset = 80;
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        setActiveSection(to);
        // Update URL hash without breaking history
        window.history.pushState(null, '', to);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <span className="w-8 h-8 rounded-md bg-emerald-600 text-white grid place-items-center text-sm font-bold group-hover:scale-105 transition-transform duration-300">
            P
          </span>
          <span className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">Paspor Petani</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          {NAV_LINKS.map((link) => {
            const hrefVal = isLandingPage ? link.to : `/${link.to}`;
            const isActive = isLandingPage && activeSection === link.to;
            return (
              <a
                key={link.label}
                href={hrefVal}
                onClick={(e) => handleLinkClick(e, link.to)}
                className={`relative py-1.5 transition-colors duration-300 ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {link.label}
                <span
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transition-transform duration-300 ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/masuk"
            className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95 transition-all duration-300"
          >
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}

