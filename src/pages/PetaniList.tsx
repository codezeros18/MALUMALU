import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPetani, listPlotByPetani } from '../lib/db';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import type { Petani, Plot } from '../types';

interface PetaniRow {
  petani: Petani;
  plots: Plot[];
}

export default function PetaniList() {
  const [rows, setRows] = useState<PetaniRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const petaniList = await listPetani();
        const withPlots = await Promise.all(
          petaniList.map(async (petani) => ({
            petani,
            plots: await listPlotByPetani(petani.id),
          })),
        );
        withPlots.sort((a, b) => b.petani.createdAt - a.petani.createdAt);
        setRows(withPlots);
      } catch (err) {
        console.error('[PetaniList] gagal memuat data', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-brand-800">Daftar Petani</h1>
      <p className="text-sm text-slate-600">
        Petani yang terdaftar di device ini (data lokal, bukan gabungan lintas-agen —
        untuk itu lihat Dashboard Eksportir).
      </p>

      {loading ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="Belum ada petani terdaftar di device ini." />
      ) : (
        <div className="space-y-2">
          {rows.map(({ petani, plots }) => (
            <Card key={petani.id} className="space-y-1">
              <p className="font-semibold text-slate-800">{petani.nama}</p>
              {petani.desa && <p className="text-xs text-slate-500">{petani.desa}</p>}
              {petani.email && <p className="text-xs text-slate-500">{petani.email}</p>}
              <p className="text-xs text-slate-400">{plots.length} plot terdaftar</p>
              {plots.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {plots.map((plot) => (
                    <Link
                      key={plot.id}
                      to={`/agen/plot/${plot.id}`}
                      className="text-xs text-brand-800 underline"
                    >
                      {plot.komoditas} @ {plot.lat.toFixed(4)}, {plot.lng.toFixed(4)}
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
