import { useEffect, useMemo, useState } from 'react';
import { distance, point } from '@turf/turf';
import { supabaseBackend, fromSupabaseRow } from '../lib/sync';
import { getDocumentCompleteness } from '../lib/ruleEngine';
import { attemptAccess } from '../lib/consent';
import NearbyMap from '../components/NearbyMap';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import type { Kartu, Petani, Plot, PetaniDocument } from '../types';

interface NearbyResult {
  kartu: Kartu;
  petani: Petani;
  plot: Plot;
  distanceKm: number;
}

export default function PetaniTerdekat() {
  const [kartuList, setKartuList] = useState<Kartu[]>([]);
  const [petaniList, setPetaniList] = useState<Petani[]>([]);
  const [plotList, setPlotList] = useState<Plot[]>([]);
  const [documentList, setDocumentList] = useState<PetaniDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [referencePoint, setReferencePoint] = useState<{ lat: number; lng: number } | null>(null);
  const [contactResult, setContactResult] = useState<Record<string, string>>({});
  const [contactingId, setContactingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [kartuRows, petaniRows, plotRows, docRows] = await Promise.all([
          supabaseBackend.fetchAll('kartu'),
          supabaseBackend.fetchAll('petani'),
          supabaseBackend.fetchAll('plot'),
          supabaseBackend.fetchAll('petaniDocument'),
        ]);
        if (cancelled) return;
        setKartuList(kartuRows.map((r) => fromSupabaseRow<Kartu>(r)));
        setPetaniList(petaniRows.map((r) => fromSupabaseRow<Petani>(r)));
        setPlotList(plotRows.map((r) => fromSupabaseRow<Plot>(r)));
        setDocumentList(docRows.map((r) => fromSupabaseRow<PetaniDocument>(r)));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data dari Supabase.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // "Berkas Lengkap" dihitung per-petani dari seluruh dokumen milik petani itu (lihat
  // lib/ruleEngine.ts getDocumentCompleteness) — TIDAK menyentuh tier/stdbStatus kartu.
  const completeByPetani = useMemo(() => {
    const byPetani = new Map<string, PetaniDocument[]>();
    for (const doc of documentList) {
      const list = byPetani.get(doc.petaniId) ?? [];
      list.push(doc);
      byPetani.set(doc.petaniId, list);
    }
    const result = new Map<string, boolean>();
    for (const [petaniId, docs] of byPetani) {
      result.set(petaniId, getDocumentCompleteness(docs).complete);
    }
    return result;
  }, [documentList]);

  const nearby: NearbyResult[] = useMemo(() => {
    if (!referencePoint) return [];
    const petaniById = new Map(petaniList.map((p) => [p.id, p]));
    const plotById = new Map(plotList.map((p) => [p.id, p]));
    const from = point([referencePoint.lng, referencePoint.lat]);

    const results: NearbyResult[] = [];
    for (const kartu of kartuList) {
      if (!completeByPetani.get(kartu.petaniId)) continue;
      const petani = petaniById.get(kartu.petaniId);
      const plot = plotById.get(kartu.plotId);
      if (!petani || !plot) continue;
      const to = point([plot.lng, plot.lat]);
      const distanceKm = distance(from, to, { units: 'kilometers' });
      results.push({ kartu, petani, plot, distanceKm });
    }
    return results.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [referencePoint, kartuList, petaniList, plotList, completeByPetani]);

  const handleHubungi = async (kartu: Kartu) => {
    setContactingId(kartu.id);
    try {
      const result = await attemptAccess(kartu.id, 'Eksportir');
      setContactResult((prev) => ({
        ...prev,
        [kartu.id]: result.authorized
          ? 'Akses diizinkan — kontak dapat dihubungi.'
          : 'Akses ditolak — petani belum memberi izin ke "Eksportir". Izin diberikan lewat Agen: buka Detail Plot petani ini → panel Consent & Akses → pilih/isi "Eksportir" → Beri Izin. Notif percobaan akses ini sudah terkirim ke petani.',
      }));
    } catch (err) {
      setContactResult((prev) => ({
        ...prev,
        [kartu.id]: err instanceof Error ? err.message : 'Gagal mencoba akses.',
      }));
    } finally {
      setContactingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Memuat data dari Supabase…</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-xl">
        Halaman ini butuh koneksi internet. {error}
      </p>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Petani Terverifikasi Terdekat</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Klik satu titik di peta (mis. lokasi gudang/fasilitas Anda) untuk menemukan petani
          dengan berkas lengkap paling dekat — jembatan supaya harga ke petani sesuai kesiapan
          ekspor & jarak, bukan sekadar tebakan.
        </p>
      </div>

      <NearbyMap
        referencePoint={referencePoint}
        onPickReference={(lat, lng) => setReferencePoint({ lat, lng })}
        markers={nearby.map((n) => ({
          id: n.kartu.id,
          lat: n.plot.lat,
          lng: n.plot.lng,
          label: `${n.petani.nama} · ${n.distanceKm.toFixed(1)} km`,
        }))}
      />

      {!referencePoint && (
        <EmptyState message="Klik satu titik di peta untuk mulai mencari petani terdekat." />
      )}

      {referencePoint && nearby.length === 0 && (
        <EmptyState message="Belum ada petani dengan berkas lengkap di data yang tersinkron." />
      )}

      {referencePoint && nearby.length > 0 && (
        <ul className="space-y-2">
          {nearby.map((n) => (
            <li
              key={n.kartu.id}
              className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{n.petani.nama}</p>
                <p className="text-xs text-slate-500">
                  {n.petani.desa || '—'} · {n.distanceKm.toFixed(1)} km
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge tone={n.kartu.tier === 'export-ready' ? 'aman' : 'neutral'}>
                    {n.kartu.tier === 'export-ready' ? 'Export-Ready' : 'Lokal'}
                  </Badge>
                  <Badge tone="aman">Berkas Lengkap</Badge>
                </div>
              </div>
              <div className="text-right shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleHubungi(n.kartu)}
                  disabled={contactingId === n.kartu.id}
                >
                  {contactingId === n.kartu.id ? 'Menghubungi…' : 'Hubungi'}
                </Button>
                {contactResult[n.kartu.id] && (
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[280px] text-left">
                    {contactResult[n.kartu.id]}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
