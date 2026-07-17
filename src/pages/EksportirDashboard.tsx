import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseBackend, fromSupabaseRow } from '../lib/sync';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import PageLoader from '../components/ui/PageLoader';
import KartuCard from '../components/KartuCard';
import HashChainViewer from '../components/HashChainViewer';
import type {
  Kartu,
  Petani,
  Plot,
  AccessLog,
  HashChainEntry,
  NotifItem,
  Tier,
  StdbStatus,
} from '../types';

interface DashboardRow {
  kartu: Kartu;
  petani?: Petani;
  plot?: Plot;
  hasAlert: boolean;
}

type TierFilter = 'semua' | Tier;
type StdbFilter = 'semua' | StdbStatus;

export default function EksportirDashboard() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [hashEntriesByAgent, setHashEntriesByAgent] = useState<Map<string, HashChainEntry[]>>(
    new Map(),
  );
  const [alertNotifCount, setAlertNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tierFilter, setTierFilter] = useState<TierFilter>('semua');
  const [stdbFilter, setStdbFilter] = useState<StdbFilter>('semua');
  const [search, setSearch] = useState('');
  const [selectedKartuId, setSelectedKartuId] = useState<string | null>(null);

  const loadData = useCallback(async (isCancelled: () => boolean) => {
    setError(null);
    try {
      const [kartuRows, petaniRows, plotRows, accessLogRows, hashchainRows, notifRows] =
        await Promise.all([
          supabaseBackend.fetchAll('kartu'),
          supabaseBackend.fetchAll('petani'),
          supabaseBackend.fetchAll('plot'),
          supabaseBackend.fetchAll('accessLog'),
          supabaseBackend.fetchAll('hashchain'),
          supabaseBackend.fetchAll('notif'),
        ]);
      if (isCancelled()) return;

      const kartuList = kartuRows.map((r) => fromSupabaseRow<Kartu>(r));
      const petaniList = petaniRows.map((r) => fromSupabaseRow<Petani>(r));
      const plotList = plotRows.map((r) => fromSupabaseRow<Plot>(r));
      const accessLogList = accessLogRows.map((r) => fromSupabaseRow<AccessLog>(r));
      const hashchainList = hashchainRows.map((r) => fromSupabaseRow<HashChainEntry>(r));
      const notifList = notifRows.map((r) => fromSupabaseRow<NotifItem>(r));

      const petaniById = new Map(petaniList.map((p) => [p.id, p]));
      const plotById = new Map(plotList.map((p) => [p.id, p]));
      const unauthorizedKartuIds = new Set(
        accessLogList.filter((log) => !log.authorized).map((log) => log.kartuId),
      );

      const newRows: DashboardRow[] = kartuList.map((kartu) => ({
        kartu,
        petani: petaniById.get(kartu.petaniId),
        plot: plotById.get(kartu.plotId),
        hasAlert: unauthorizedKartuIds.has(kartu.id),
      }));
      setRows(newRows);

      // Dikelompokkan per-agen (bukan per-kartu): hash-chain adalah rantai lokal per
      // device/agen (lihat docs/04_FULL_PRODUCTION_BLUEPRINT.md §1 "Catatan Integritas
      // Hash-Chain") — memverifikasi subset per-kartu saja akan salah (previousHash
      // entri pertama kartu itu tidak akan cocok dengan GENESIS kalau ada kartu lain
      // yang dibuat sebelumnya di device yang sama).
      const byAgent = new Map<string, HashChainEntry[]>();
      for (const entry of hashchainList) {
        if (!entry.agentId) continue;
        const list = byAgent.get(entry.agentId) ?? [];
        list.push(entry);
        byAgent.set(entry.agentId, list);
      }
      setHashEntriesByAgent(byAgent);

      setAlertNotifCount(notifList.filter((n) => n.severity === 'alert' && !n.read).length);
    } catch (err) {
      if (!isCancelled()) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data dari Supabase.');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadData(() => cancelled).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData(() => false);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(({ kartu, petani }) => {
      if (tierFilter !== 'semua' && kartu.tier !== tierFilter) return false;
      if (stdbFilter !== 'semua' && kartu.stdbStatus !== stdbFilter) return false;
      if (q) {
        const haystack = `${petani?.nama ?? ''} ${petani?.desa ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, tierFilter, stdbFilter, search]);

  const totalPetani = useMemo(() => new Set(rows.map((r) => r.kartu.petaniId)).size, [rows]);
  const exportReadyPct =
    rows.length > 0
      ? Math.round(
          (rows.filter((r) => r.kartu.tier === 'export-ready').length / rows.length) * 100,
        )
      : 0;

  const selectedRow = rows.find((r) => r.kartu.id === selectedKartuId);
  const selectedAgentEntries =
    selectedRow?.kartu.agentId ? (hashEntriesByAgent.get(selectedRow.kartu.agentId) ?? []) : [];

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-xl">
        Dashboard ini butuh koneksi internet. {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard Eksportir</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Monitoring data petani lintas-agen — data terpusat dari Supabase (online-only).
        </p>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-12 gap-y-4 border-b border-slate-100 pb-6">
        <div>
          <p className="text-xs text-slate-400">Total Petani</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{totalPetani}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Export-Ready</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{exportReadyPct}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Alert Belum Ditinjau</p>
          <p
            className={`text-2xl font-semibold mt-1 ${alertNotifCount > 0 ? 'text-red-600' : 'text-slate-900'}`}
          >
            {alertNotifCount}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={tierFilter}
            onChange={(v) => setTierFilter(v as TierFilter)}
            className="w-40"
          >
            <option value="semua">Semua tier</option>
            <option value="lokal">Lokal</option>
            <option value="export-ready">Export-Ready</option>
          </Select>
          <Select
            value={stdbFilter}
            onChange={(v) => setStdbFilter(v as StdbFilter)}
            className="w-48"
          >
            <option value="semua">Semua status STDB</option>
            <option value="stdb-ready">STDB Ready</option>
            <option value="belum-lengkap">Belum Lengkap</option>
          </Select>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama/desa..."
            className="flex-1 text-sm min-w-[160px]"
          />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Muat ulang data"
            className="w-9 h-9 shrink-0 grid place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 transition-colors"
          >
            <span aria-hidden className={refreshing ? 'animate-spin' : ''}>
              ↻
            </span>
          </button>
        </div>

        {filteredRows.length === 0 ? (
          <EmptyState message="Belum ada data kartu yang cocok." />
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-medium">Petani</th>
                  <th className="py-2.5 px-3 font-medium">Agen</th>
                  <th className="py-2.5 px-3 font-medium">Tier</th>
                  <th className="py-2.5 px-3 font-medium">STDB</th>
                  <th className="py-2.5 px-3 font-medium">Deforestasi</th>
                  <th className="py-2.5 px-3 font-medium">Sync</th>
                  <th className="py-2.5 px-3 font-medium">Alert</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ kartu, petani, hasAlert }) => (
                  <tr
                    key={kartu.id}
                    onClick={() => setSelectedKartuId(kartu.id)}
                    className={`border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedKartuId === kartu.id ? 'bg-brand-50/60' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-800">{petani?.nama ?? '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                      {kartu.agentId ? kartu.agentId.slice(0, 8) : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge tone={kartu.tier === 'export-ready' ? 'aman' : 'neutral'}>
                        {kartu.tier === 'export-ready' ? 'Export-Ready' : 'Lokal'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge tone={kartu.stdbStatus === 'stdb-ready' ? 'synced' : 'perlu-audit'}>
                        {kartu.stdbStatus === 'stdb-ready' ? 'Ready' : 'Belum Lengkap'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge tone={kartu.deforestasi}>{kartu.deforestasi}</Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      {/* Record ini terbaca dari Supabase, artinya SUDAH tersinkron by
                          definisi — kolom sync_status tidak disimpan server-side (lihat
                          ALLOWED_COLUMNS di lib/sync.ts), jadi tidak perlu (dan tidak
                          bisa) mengandalkan kartu.syncStatus di sini. */}
                      <Badge tone="synced">Tersinkron</Badge>
                    </td>
                    <td className="py-2.5 px-3">{hasAlert && <Badge tone="alert">Alert</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selectedRow)}
        onClose={() => setSelectedKartuId(null)}
        title={selectedRow?.petani?.nama ?? 'Detail Kartu'}
      >
        {selectedRow && (
          <>
            <KartuCard kartu={selectedRow.kartu} readOnly />
            <HashChainViewer entries={selectedAgentEntries} readOnly />
          </>
        )}
      </Modal>
    </div>
  );
}
