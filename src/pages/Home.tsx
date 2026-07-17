import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  MapPin,
  Plus,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { listAllPlot, listSyncQueue, requeueForSync } from '../lib/db';
import { seedDummyData, isDemoPlot } from '../data/dummyData';
import { useAppContext } from '../context/AppContext';
import type { Plot } from '../types';

function SyncBadge({
  status,
  attempts,
  onRetry,
}: {
  status?: Plot['syncStatus'];
  attempts: number;
  onRetry: () => void;
}) {
  if (attempts > 0 || status === 'conflict') {
    return (
      <span className="inline-flex items-center gap-1">
        <Badge tone="alert">Gagal sinkron</Badge>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRetry();
          }}
          className="text-[10px] text-brand-800 font-medium hover:underline"
        >
          Coba lagi
        </button>
      </span>
    );
  }
  if (status === 'synced') return <Badge tone="synced">Tersinkron</Badge>;
  return <Badge tone="pending">Tersimpan lokal</Badge>;
}

interface KpiCardProps {
  icon: typeof MapPin;
  label: string;
  value: number;
  tone?: 'default' | 'green' | 'red';
}

const KPI_TONE_CLASSES: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'bg-slate-100 text-slate-600',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-600',
};

function KpiCard({ icon: Icon, label, value, tone = 'default' }: KpiCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
      <span className={`w-10 h-10 shrink-0 rounded-lg grid place-items-center ${KPI_TONE_CLASSES[tone]}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xl font-semibold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { syncVersion, triggerSync } = useAppContext();

  const [plots, setPlots] = useState<Plot[]>([]);
  const [queueAttempts, setQueueAttempts] = useState<Map<string, number>>(new Map());
  const [seeding, setSeeding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);

  const refreshPlots = useCallback(async () => {
    try {
      setPlots(await listAllPlot());
      const queue = await listSyncQueue();
      const map = new Map<string, number>();
      for (const item of queue) {
        if (item.attempts > 0) map.set(item.entityId, item.attempts);
      }
      setQueueAttempts(map);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refreshPlots();
  }, [refreshPlots, syncVersion]);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await triggerSync();
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryPlot = async (plotId: string) => {
    await requeueForSync('plot', plotId);
    await triggerSync();
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    setMessage(null);
    try {
      const result = await seedDummyData();
      setMessageIsError(false);
      if (result.seeded) {
        setMessage(`${result.plots.length} data demo dimuat (Pangalengan, komoditas kopi).`);
        await refreshPlots();
      } else {
        setMessage('DB sudah berisi data — data demo tidak dimuat ulang.');
      }
    } catch (err) {
      setMessageIsError(true);
      setMessage(err instanceof Error ? err.message : 'Gagal memuat data demo.');
    } finally {
      setSeeding(false);
    }
  };

  const stats = useMemo(() => {
    let synced = 0;
    let failed = 0;
    let demo = 0;
    for (const plot of plots) {
      const attempts = queueAttempts.get(plot.id) ?? 0;
      if (attempts > 0 || plot.syncStatus === 'conflict') failed += 1;
      else if (plot.syncStatus === 'synced') synced += 1;
      if (isDemoPlot(plot.id)) demo += 1;
    }
    return { synced, failed, demo };
  }, [plots, queueAttempts]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Ringkasan Agen</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Pantau plot yang sudah terdaftar, lalu tandai kebun baru saat turun ke lapangan.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={MapPin} label="Total Plot" value={plots.length} />
        <KpiCard icon={CheckCircle2} label="Tersinkron" value={stats.synced} tone="green" />
        <KpiCard
          icon={AlertTriangle}
          label="Perlu Perhatian"
          value={stats.failed}
          tone={stats.failed > 0 ? 'red' : 'default'}
        />
        <KpiCard icon={FlaskConical} label="Data Demo" value={stats.demo} />
      </div>

      <Link
        to="/agen/tambah"
        className="group flex items-center justify-between gap-4 rounded-xl border-2 border-dashed border-brand-100 bg-brand-50/50 hover:border-brand-400 hover:bg-brand-50 transition-colors px-6 py-5"
      >
        <div className="flex items-center gap-4 min-w-0">
          <span className="w-12 h-12 shrink-0 rounded-full bg-brand-800 text-white grid place-items-center group-hover:scale-105 transition-transform">
            <Plus size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900">Tandai Plot Baru</p>
            <p className="text-sm text-slate-500">
              Tap peta 3D atau pakai GPS untuk mendaftarkan kebun & petani baru.
            </p>
          </div>
        </div>
        <ArrowRight size={20} className="text-brand-800 shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleSeedDemo} disabled={seeding}>
          {seeding ? 'Memuat…' : 'Muat data demo (3 petani contoh Pangalengan)'}
        </Button>
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing}
          title="Sinkron sekarang"
          className="w-9 h-9 shrink-0 grid place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 transition-colors"
        >
          <span aria-hidden className={syncing ? 'animate-spin' : ''}>
            ↻
          </span>
        </button>
      </div>

      {message && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            messageIsError
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-brand-50 border-brand-400 text-brand-800'
          }`}
        >
          {message}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Plot tersimpan ({plots.length})
        </h2>
        {plots.length === 0 ? (
          <EmptyState message="Belum ada plot tersimpan — tandai plot baru atau muat data demo untuk mulai." />
        ) : (
          <ul className="space-y-1">
            {plots.map((plot) => (
              <li key={plot.id}>
                <Link
                  to={`/agen/plot/${plot.id}`}
                  className="flex items-center justify-between gap-2 text-xs text-slate-500 border border-slate-200 rounded px-2 py-1.5 hover:border-brand-400 hover:text-brand-800 bg-white"
                >
                  <span>
                    {plot.komoditas} @ {plot.lat.toFixed(5)}, {plot.lng.toFixed(5)}
                    {plot.gpsAccuracyM ? ` · akurasi ${Math.round(plot.gpsAccuracyM)}m` : ''}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    {isDemoPlot(plot.id) && <Badge tone="demo">DATA DEMO</Badge>}
                    <SyncBadge
                      status={plot.syncStatus}
                      attempts={queueAttempts.get(plot.id) ?? 0}
                      onRetry={() => handleRetryPlot(plot.id)}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
