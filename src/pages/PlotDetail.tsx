import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import KartuCard from '../components/KartuCard';
import HashChainViewer from '../components/HashChainViewer';
import ConsentPanel from '../components/ConsentPanel';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import Badge from '../components/ui/Badge';
import { getPlot, getPetani, getKartuByPlot, listSyncQueue, requeueForSync } from '../lib/db';
import { commitKartu } from '../lib/hashchain';
import { generateKartu } from '../lib/ruleEngine';
import { cekDeforestasi } from '../lib/geospatial';
import { isDemoPlot } from '../data/dummyData';
import { useAppContext } from '../context/AppContext';
import type { Plot, Petani, Kartu } from '../types';

export default function PlotDetail() {
  const { id } = useParams();
  const { syncVersion, triggerSync } = useAppContext();
  const [plot, setPlot] = useState<Plot | null>(null);
  const [petani, setPetani] = useState<Petani | null>(null);
  const [kartu, setKartu] = useState<Kartu | null>(null);
  const [kartuSyncFailed, setKartuSyncFailed] = useState(false);
  const [punyaSTDB, setPunyaSTDB] = useState(false);
  const [klaimKepemilikan, setKlaimKepemilikan] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const p = await getPlot(id);
      setPlot(p ?? null);
      if (p) {
        const [pet, existingKartu] = await Promise.all([
          getPetani(p.petaniId),
          getKartuByPlot(p.id),
        ]);
        setPetani(pet ?? null);
        setKartu(existingKartu ?? null);

        if (existingKartu) {
          const queue = await listSyncQueue();
          const pendingFailure = queue.some(
            (item) => item.entityId === existingKartu.id && item.attempts > 0,
          );
          setKartuSyncFailed(pendingFailure || existingKartu.syncStatus === 'conflict');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data plot.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load, syncVersion]);

  const handleRetrySync = async () => {
    if (kartu) {
      await requeueForSync('kartu', kartu.id);
    }
    await triggerSync();
  };

  const handleBuatKartu = async () => {
    if (!plot || !petani) return;
    setCreating(true);
    setError(null);
    try {
      const check = await cekDeforestasi(plot.lat, plot.lng, plot.id);
      const draft = generateKartu({ petani, plot, check, punyaSTDB, klaimKepemilikan });
      const committed = await commitKartu(draft);
      setKartu(committed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat kartu.');
    } finally {
      setCreating(false);
    }
  };

  if (!id) return null;

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-brand-800">Detail Plot</h1>
        {plot && isDemoPlot(plot.id) && <Badge tone="demo">DATA DEMO</Badge>}
      </div>

      {!plot && <p className="text-sm text-slate-500">Plot tidak ditemukan.</p>}

      {plot && petani && (
        <div className="text-sm text-slate-600">
          <p>Petani: {petani.nama}</p>
          <p>
            Koordinat: {plot.lat.toFixed(5)}, {plot.lng.toFixed(5)}
          </p>
        </div>
      )}

      {plot && petani && !kartu && (
        <Card className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={punyaSTDB} onChange={(e) => setPunyaSTDB(e.target.checked)} />
            Sudah punya STDB
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Checkbox
              checked={klaimKepemilikan}
              onChange={(e) => setKlaimKepemilikan(e.target.checked)}
            />
            Klaim kepemilikan dikonfirmasi
          </label>
          <Button onClick={handleBuatKartu} disabled={creating} fullWidth className="font-semibold">
            {creating ? 'Membuat kartu…' : 'Buat & Commit Kartu'}
          </Button>
        </Card>
      )}

      {kartu && (
        <KartuCard
          kartu={kartu}
          onKartuUpdated={setKartu}
          syncFailed={kartuSyncFailed}
          onRetrySync={handleRetrySync}
        />
      )}
      {kartu && <HashChainViewer refreshSignal={kartu.hashChainRef} />}
      {kartu && <ConsentPanel kartuId={kartu.id} />}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
