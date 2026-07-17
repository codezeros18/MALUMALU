import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPetani, listPlotByPetani } from '../lib/db';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Data Petani</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Petani yang terdaftar di device ini (data lokal, bukan gabungan lintas-agen — untuk
          itu lihat Dashboard Eksportir).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="Belum ada petani terdaftar di device ini." />
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-200">
                <th className="py-2.5 px-3 font-medium">Petani</th>
                <th className="py-2.5 px-3 font-medium">Email</th>
                <th className="py-2.5 px-3 font-medium">Plot Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ petani, plots }) => (
                <tr key={petani.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 px-3 align-top">
                    <p className="text-slate-800 font-medium">{petani.nama}</p>
                    {petani.desa && <p className="text-slate-400 mt-0.5">{petani.desa}</p>}
                  </td>
                  <td className="py-2.5 px-3 align-top text-slate-500">
                    {petani.email || '—'}
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    {plots.length === 0 ? (
                      <span className="text-slate-400">Belum ada plot</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {plots.map((plot) => (
                          <Link
                            key={plot.id}
                            to={`/agen/plot/${plot.id}`}
                            className="text-brand-800 hover:underline"
                          >
                            {plot.komoditas} @ {plot.lat.toFixed(4)}, {plot.lng.toFixed(4)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
