import { useCallback, useEffect, useState } from 'react';
import { grantConsent, revokeConsent, listActiveConsents } from '../lib/consent';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Checkbox from './ui/Checkbox';
import EmptyState from './ui/EmptyState';
import type { ConsentRecord } from '../types';

const PRESET_PARTIES = ['Bank', 'Eksportir', 'Koperasi'];
const SCOPE_OPTIONS = ['lokasi', 'status', 'dokumen'];

interface ConsentPanelProps {
  kartuId: string;
  // 'agen' (default): beri izin ke pihak lain. 'petani': hanya lihat + cabut izin sendiri —
  // tidak boleh memberi izin baru.
  mode?: 'agen' | 'petani';
}

export default function ConsentPanel({ kartuId, mode = 'agen' }: ConsentPanelProps) {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [partyName, setPartyName] = useState(PRESET_PARTIES[0]);
  const [scope, setScope] = useState<string[]>(['lokasi', 'status']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const toggleScope = (s: string) => {
    setScope((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleGrant = async () => {
    setBusy(true);
    setError(null);
    try {
      await grantConsent(kartuId, partyName.trim(), scope);
      setPartyName(PRESET_PARTIES[0]);
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

  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-700">Consent & Akses</h2>

      {mode === 'agen' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Beri izin akses ke:</p>
          <Select value={partyName} onChange={setPartyName} className="w-full">
            {PRESET_PARTIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Input
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder="Atau ketik nama pihak lain"
            className="w-full text-sm"
          />
          <div className="flex flex-wrap gap-3">
            {SCOPE_OPTIONS.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
                <Checkbox checked={scope.includes(s)} onChange={() => toggleScope(s)} />
                {s}
              </label>
            ))}
          </div>
          <Button
            onClick={handleGrant}
            disabled={busy || scope.length === 0 || !partyName.trim()}
            fullWidth
            size="md"
          >
            Beri Izin ke {partyName.trim() || '…'}
          </Button>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-slate-600 mb-1">Izin aktif ({consents.length})</p>
        {consents.length === 0 ? (
          <EmptyState message="Belum ada izin aktif." />
        ) : (
          <ul className="space-y-1">
            {consents.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between text-xs border border-slate-100 rounded px-2 py-1"
              >
                <span>
                  {c.grantedTo} · {c.scope.join(', ')}
                </span>
                <button
                  type="button"
                  onClick={() => handleRevoke(c.id)}
                  className="text-red-600 hover:underline"
                >
                  Tarik izin
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </Card>
  );
}
