import { useCallback, useEffect, useState } from 'react';
import { verifyChain, simulateTamper, restoreEntry, type VerifyChainResult } from '../lib/hashchain';
import { listHashEntries } from '../lib/db';
import type { HashChainEntry } from '../types';

interface HashChainViewerProps {
  refreshSignal?: unknown;
}

export default function HashChainViewer({ refreshSignal }: HashChainViewerProps) {
  const [entries, setEntries] = useState<HashChainEntry[]>([]);
  const [result, setResult] = useState<VerifyChainResult | null>(null);
  const [tamperedBackup, setTamperedBackup] = useState<HashChainEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setEntries(await listHashEntries());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat rantai hash.');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, refreshSignal]);

  const handleVerify = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await verifyChain());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal verifikasi rantai.');
    } finally {
      setBusy(false);
    }
  }, []);

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
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Rantai Verifikasi (Hash-Chain)</h2>
        <span className="text-xs text-slate-400">{entries.length} entri</span>
      </div>

      <ul className="space-y-1 text-xs font-mono">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex justify-between gap-2 border border-slate-100 rounded px-2 py-1"
          >
            <span>#{entry.index}</span>
            <span className="text-slate-500">{new Date(entry.timestamp).toLocaleString('id-ID')}</span>
            <span>{entry.hash.slice(0, 8)}…</span>
          </li>
        ))}
        {entries.length === 0 && <li className="text-slate-400">Belum ada entri.</li>}
      </ul>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleVerify}
          disabled={busy}
          className="px-3 py-2 rounded-md bg-brand-800 text-white text-sm font-medium disabled:opacity-50"
        >
          Verifikasi Rantai
        </button>
        <button
          type="button"
          onClick={handleTamper}
          disabled={busy || entries.length === 0}
          className="px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium disabled:opacity-50"
        >
          Simulasi ubah data (demo)
        </button>
        <button
          type="button"
          onClick={handleResetDemo}
          disabled={busy || !tamperedBackup}
          className="px-3 py-2 rounded-md bg-slate-200 text-slate-700 text-sm font-medium disabled:opacity-50"
        >
          Reset demo
        </button>
      </div>

      {result && (
        <div
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            result.valid
              ? 'bg-green-50 text-green-700 border border-green-300'
              : 'bg-red-50 text-red-700 border border-red-300'
          }`}
        >
          {result.valid ? '✔ Rantai utuh' : `✖ Rantai rusak di entri #${result.brokenAtIndex}`}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <p className="text-[11px] text-slate-400">
        Rantai kriptografis deterministik (SHA-256, append-only) — bukan blockchain, tidak ada
        konsensus terdistribusi.
      </p>
    </div>
  );
}
