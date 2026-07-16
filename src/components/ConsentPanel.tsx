import { useCallback, useEffect, useState } from 'react';
import { grantConsent, revokeConsent, listActiveConsents, attemptAccess } from '../lib/consent';
import { useAppContext } from '../context/AppContext';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Checkbox from './ui/Checkbox';
import type { ConsentRecord } from '../types';

const PRESET_PARTIES = ['Bank', 'Eksportir', 'Koperasi'];
const SCOPE_OPTIONS = ['lokasi', 'status', 'dokumen'];

interface ConsentPanelProps {
  kartuId: string;
}

export default function ConsentPanel({ kartuId }: ConsentPanelProps) {
  const { refreshNotif } = useAppContext();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [selectedParty, setSelectedParty] = useState(PRESET_PARTIES[0]);
  const [customParty, setCustomParty] = useState('');
  const [scope, setScope] = useState<string[]>(['lokasi', 'status']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accessWho, setAccessWho] = useState('');
  const [accessResult, setAccessResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setConsents(await listActiveConsents(kartuId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar izin.');
    }
  }, [kartuId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const partyName = customParty.trim() || selectedParty;

  const toggleScope = (s: string) => {
    setScope((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleGrant = async () => {
    setBusy(true);
    setError(null);
    try {
      await grantConsent(kartuId, partyName, scope);
      setCustomParty('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memberi izin.');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await revokeConsent(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menarik izin.');
    } finally {
      setBusy(false);
    }
  };

  const handleAttemptAccess = async () => {
    const who = accessWho.trim();
    if (!who) return;
    setBusy(true);
    setError(null);
    try {
      const result = await attemptAccess(kartuId, who);
      setAccessResult(
        result.authorized
          ? `"${who}" BERHASIL mengakses data (izin aktif).`
          : `"${who}" DITOLAK — akses tanpa izin terdeteksi, notif dikirim.`,
      );
      refreshNotif();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal simulasi akses.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-700">Consent & Akses</h2>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">Beri izin akses ke:</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_PARTIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setSelectedParty(p);
                setCustomParty('');
              }}
              className={`text-xs px-2 py-1 rounded-full border ${
                selectedParty === p && !customParty
                  ? 'bg-brand-800 text-white border-brand-800'
                  : 'border-slate-300 text-slate-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <Input
          value={customParty}
          onChange={(e) => setCustomParty(e.target.value)}
          placeholder="Atau ketik nama pihak lain"
          className="w-full text-sm"
        />
        <div className="flex flex-wrap gap-3">
          {SCOPE_OPTIONS.map((s) => (
            <label key={s} className="flex items-center gap-1 text-xs text-slate-600">
              <Checkbox checked={scope.includes(s)} onChange={() => toggleScope(s)} />
              {s}
            </label>
          ))}
        </div>
        <Button onClick={handleGrant} disabled={busy || scope.length === 0} fullWidth size="md">
          Beri Izin ke {partyName}
        </Button>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-600 mb-1">Izin aktif ({consents.length})</p>
        <ul className="space-y-1">
          {consents.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between text-xs border border-slate-100 rounded px-2 py-1"
            >
              <span>
                {c.grantedTo} · {c.scope.join(', ')}
              </span>
              <button type="button" onClick={() => handleRevoke(c.id)} className="text-red-600 hover:underline">
                Tarik izin
              </button>
            </li>
          ))}
          {consents.length === 0 && <li className="text-xs text-slate-400">Belum ada izin aktif.</li>}
        </ul>
      </div>

      <div className="border-t border-slate-100 pt-3 space-y-2">
        <p className="text-xs font-medium text-slate-600">Demo: Simulasikan akses pihak lain</p>
        <div className="flex gap-2">
          <Input
            value={accessWho}
            onChange={(e) => setAccessWho(e.target.value)}
            placeholder="Nama pihak, mis. Orang Asing"
            className="flex-1 text-sm"
          />
          <Button variant="secondary" onClick={handleAttemptAccess} disabled={busy || !accessWho.trim()}>
            Coba akses
          </Button>
        </div>
        {accessResult && <p className="text-xs text-slate-600">{accessResult}</p>}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </Card>
  );
}
