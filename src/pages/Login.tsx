import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, type Role } from '../context/AppContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RoleSelect from '../components/RoleSelect';
import { APP_LOCKED } from '../lib/appLock';

const ROLE_PATHS: Record<Role, string> = {
  agen: '/agen',
  petani: '/petani',
  eksportir: '/eksportir',
};

export default function Login() {
  const { setRole } = useAppContext();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Role>('agen');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setRole(selected);
    navigate(ROLE_PATHS[selected]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="relative flex-1 flex items-center justify-center px-6 py-16">
        <div
          className={
            APP_LOCKED
              ? 'w-full max-w-md text-center pointer-events-none select-none blur-sm opacity-40'
              : 'w-full max-w-md text-center'
          }
          aria-hidden={APP_LOCKED}
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Masuk ke Akun Anda
          </h1>
          <p className="text-slate-500 mt-3 mb-10">
            Platform identitas data &amp; ketertelusuran untuk petani skala kecil Indonesia.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <span className="block text-xs font-semibold text-slate-500 mb-1.5">Pilih Peran</span>
              <RoleSelect value={selected} onChange={setSelected} />
            </div>

            <button
              type="submit"
              disabled={APP_LOCKED}
              className="w-full flex items-center justify-between gap-2 px-5 py-3.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-brand-400 to-brand-800 hover:opacity-90 transition-opacity"
            >
              Masuk ke Akun Anda
              <span
                aria-hidden
                className="w-7 h-7 rounded-full bg-white/20 grid place-items-center shrink-0"
              >
                →
              </span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-8">
            Mode demo — pemilihan peran di atas TIDAK memverifikasi identitas sungguhan.
          </p>
        </div>

        {APP_LOCKED && (
          <div className="absolute inset-0 flex items-center justify-center px-6 bg-white/60 backdrop-blur-[2px]">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl p-8 text-center">
              <span className="inline-flex w-12 h-12 rounded-full bg-brand-50 text-brand-800 items-center justify-center text-xl mx-auto">
                🔒
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Demo Interaktif Belum Publik
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Kami sedang menyiapkan akses uji coba untuk mitra terpilih (koperasi, agen,
                dan pengekspor). Hubungi kami untuk jadwal demo langsung.
              </p>
              <a
                href="mailto:lint4ngboy@gmail.com"
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold text-white bg-gradient-to-r from-brand-400 to-brand-800 hover:opacity-90 transition-opacity"
              >
                Hubungi Kami untuk Kemitraan
                <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
