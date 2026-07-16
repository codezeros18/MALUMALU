import { useCallback, useEffect, useState } from 'react';
import { verifyChain, simulateTamper, restoreEntry, type VerifyChainResult } from '../lib/hashchain';
import { listHashEntries } from '../lib/db';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import type { HashChainEntry } from '../types';

interface HashChainViewerProps {
  refreshSignal?: unknown;
  // Kalau diisi, dipakai langsung tanpa fetch IndexedDB lokal — dipakai dashboard
  // Eksportir (Sprint 13) yang membaca rantai dari Supabase, bukan device ini.
  entries?: HashChainEntry[];
  // Sembunyikan tombol simulasi tamper & reset demo (default false, /agen tidak berubah).
  readOnly?: boolean;
}

export default function HashChainViewer({
  refreshSignal,
  entries: externalEntries,
  readOnly = false,
}: HashChainViewerProps) {
  const [entries, setEntries] = useState<HashChainEntry[]>(externalEntries ?? []);
  const [result, setResult] = useState<VerifyChainResult | null>(null);
  const [tamperedBackup, setTamperedBackup] = useState<HashChainEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (externalEntries) {
      setEntries([...externalEntries].sort((a, b) => a.index - b.index));
      return;
    }
    try {
      setEntries(await listHashEntries());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat rantai hash.');
    }
  }, [externalEntries]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshSignal]);

  const handleVerify = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await verifyChain(externalEntries ? entries : undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal verifikasi rantai.');
    } finally {
      setBusy(false);
    }
  }, [externalEntries, entries]);

  const handleTamper = async () => {
    if (entries.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const last = entries[entries.length - 1];
      setTamperedBackup(last);
      const originalPayload = (last.payload ?? {}) as Record<string, unknown>;
      const mutatedPayload = {
        ...originalPayload,
        __demoTamper: 'Data diam-diam diubah untuk simulasi (hash lama tidak diperbarui).',
      };
      await simulateTamper(last.index, mutatedPayload);
      await refresh();
      await handleVerify();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal simulasi tamper.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetDemo = async () => {
    if (!tamperedBackup) return;
    setBusy(true);
    setError(null);
    try {
      await restoreEntry(tamperedBackup);
      setTamperedBackup(null);
      await refresh();
      await handleVerify();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal reset demo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Rantai Verifikasi (Hash-Chain)</h2>
        <span className="text-xs text-slate-400">{entries.length} entri</span>
      </div>

      {entries.length === 0 ? (
        <EmptyState message="Belum ada entri." />
      ) : (
        <ul className="space-y-1 text-xs font-mono">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex justify-between gap-2 border border-slate-100 rounded px-2 py-1"
            >
              <span>#{entry.index}</span>
              <span className="text-slate-500">
                {new Date(entry.timestamp).toLocaleString('id-ID')}
              </span>
              <span>{entry.hash.slice(0, 8)}…</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleVerify} disabled={busy}>
          Verifikasi Rantai
        </Button>
        {!readOnly && (
          <>
            <Button variant="danger" onClick={handleTamper} disabled={busy || entries.length === 0}>
              Simulasi ubah data (demo)
            </Button>
            <Button variant="secondary" onClick={handleResetDemo} disabled={busy || !tamperedBackup}>
              Reset demo
            </Button>
          </>
        )}
      </div>

      {result && (
        <div
          className={`rounded-md px-3 py-2 flex items-center gap-2 border ${
            result.valid ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
          }`}
        >
          <Badge tone={result.valid ? 'aman' : 'berisiko'}>{result.valid ? 'Valid' : 'Rusak'}</Badge>
          <span className={`text-sm font-medium ${result.valid ? 'text-green-700' : 'text-red-700'}`}>
            {result.valid ? 'Rantai utuh' : `Rantai rusak di entri #${result.brokenAtIndex}`}
          </span>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <p className="text-[11px] text-slate-400">
        Rantai kriptografis deterministik (SHA-256, append-only) — bukan blockchain, tidak ada
        konsensus terdistribusi.
        {externalEntries && ' Menampilkan seluruh rantai milik agen terkait (bukan hanya kartu ini).'}
      </p>
    </Card>
  );
}
