import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, type Role } from '../context/AppContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RoleSelect from '../components/RoleSelect';

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
        <div className="w-full max-w-md text-center">
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
      </main>

      <Footer />
    </div>
  );
}
