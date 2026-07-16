import { useEffect, useMemo, useState } from 'react';
import { supabaseBackend, fromSupabaseRow } from '../lib/sync';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
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
  const [error, setError] = useState<string | null>(null);

  const [tierFilter, setTierFilter] = useState<TierFilter>('semua');
  const [stdbFilter, setStdbFilter] = useState<StdbFilter>('semua');
  const [search, setSearch] = useState('');
  const [selectedKartuId, setSelectedKartuId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
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
        if (cancelled) return;

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
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat data dari Supabase.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Card className="text-center text-sm text-slate-500">Memuat data dari Supabase…</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <Card className="text-sm text-red-700 bg-red-50 border-red-300">
          Dashboard ini butuh koneksi internet. {error}
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-brand-800">Dashboard Eksportir</h1>
        <p className="text-sm text-slate-600">
          Monitoring data petani lintas-agen — data terpusat dari Supabase (online-only).
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-brand-800">{totalPetani}</p>
          <p className="text-xs text-slate-500">Total Petani</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-brand-800">{exportReadyPct}%</p>
          <p className="text-xs text-slate-500">Export-Ready</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">{alertNotifCount}</p>
          <p className="text-xs text-slate-500">Alert Belum Ditinjau</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as TierFilter)}
            className="text-xs"
          >
            <option value="semua">Semua tier</option>
            <option value="lokal">Lokal</option>
            <option value="export-ready">Export-Ready</option>
          </Select>
          <Select
            value={stdbFilter}
            onChange={(e) => setStdbFilter(e.target.value as StdbFilter)}
            className="text-xs"
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
        </div>

        {filteredRows.length === 0 ? (
          <EmptyState message="Belum ada data kartu yang cocok." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-2">Petani</th>
                  <th className="py-2 pr-2">Agen</th>
                  <th className="py-2 pr-2">Tier</th>
                  <th className="py-2 pr-2">STDB</th>
                  <th className="py-2 pr-2">Deforestasi</th>
                  <th className="py-2 pr-2">Sync</th>
                  <th className="py-2 pr-2">Alert</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ kartu, petani, hasAlert }) => (
                  <tr
                    key={kartu.id}
                    onClick={() => setSelectedKartuId(kartu.id)}
                    className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${
                      selectedKartuId === kartu.id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <td className="py-2 pr-2">{petani?.nama ?? '—'}</td>
                    <td className="py-2 pr-2 font-mono text-[10px] text-slate-500">
                      {kartu.agentId ? kartu.agentId.slice(0, 8) : '—'}
                    </td>
                    <td className="py-2 pr-2">
                      <Badge tone={kartu.tier === 'export-ready' ? 'aman' : 'neutral'}>
                        {kartu.tier === 'export-ready' ? 'Export-Ready' : 'Lokal'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-2">
                      <Badge tone={kartu.stdbStatus === 'stdb-ready' ? 'synced' : 'perlu-audit'}>
                        {kartu.stdbStatus === 'stdb-ready' ? 'Ready' : 'Belum Lengkap'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-2">
                      <Badge tone={kartu.deforestasi}>{kartu.deforestasi}</Badge>
                    </td>
                    <td className="py-2 pr-2">
                      {/* Record ini terbaca dari Supabase, artinya SUDAH tersinkron by
                          definisi — kolom sync_status tidak disimpan server-side (lihat
                          ALLOWED_COLUMNS di lib/sync.ts), jadi tidak perlu (dan tidak
                          bisa) mengandalkan kartu.syncStatus di sini. */}
                      <Badge tone="synced">Tersinkron</Badge>
                    </td>
                    <td className="py-2 pr-2">{hasAlert && <Badge tone="alert">Alert</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedRow && (
        <div className="space-y-4">
          <KartuCard kartu={selectedRow.kartu} readOnly />
          <HashChainViewer entries={selectedAgentEntries} readOnly />
        </div>
      )}
    </div>
  );
}
