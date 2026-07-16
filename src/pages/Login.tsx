import { useNavigate } from 'react-router-dom';
import { useAppContext, type Role } from '../context/AppContext';

const ROLE_OPTIONS: { role: Role; label: string; description: string; path: string }[] = [
  {
    role: 'agen',
    label: 'Agen',
    description: 'Tandai kebun, buat kartu, kelola consent & notif — bekerja offline di lapangan.',
    path: '/agen',
  },
  {
    role: 'petani',
    label: 'Petani',
    description: 'Lihat paspor data milik Anda sendiri, kelola izin akses, unduh sebagai PDF.',
    path: '/petani',
  },
  {
    role: 'eksportir',
    label: 'Eksportir',
    description: 'Pantau data petani lintas-agen dari satu dashboard terpusat.',
    path: '/eksportir',
  },
];

export default function Login() {
  const { setRole } = useAppContext();
  const navigate = useNavigate();

  const handleSelect = (role: Role, path: string) => {
    setRole(role);
    navigate(path);
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="text-center pt-8">
        <h1 className="text-2xl font-bold text-brand-800">Paspor Petani</h1>
        <p className="text-sm text-slate-600 mt-1">Pilih peran untuk masuk (mode demo, tanpa password).</p>
      </div>

      <div className="space-y-3">
        {ROLE_OPTIONS.map(({ role, label, description, path }) => (
          <button
            key={role}
            type="button"
            onClick={() => handleSelect(role, path)}
            className="w-full text-left bg-white border border-slate-200 rounded-lg p-4 hover:border-brand-400 transition-colors"
          >
            <p className="text-base font-semibold text-brand-800">{label}</p>
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 text-center pt-4">
        Mode demo — pemilihan peran di atas TIDAK memverifikasi identitas sungguhan.
      </p>
    </div>
  );
}
