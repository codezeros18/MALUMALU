import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import Map3D, { type Map3DMarker } from '../components/Map3D';
import Badge from '../components/Badge';
import HargaHariIni from '../components/HargaHariIni';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  DollarSign,
  Send,
  Lock,
  Unlock,
  Eye,
  Globe,
  TrendingUp,
  Fingerprint,
  Calendar
} from 'lucide-react';

export default function EksportirDashboard() {
  const {
    plots,
    petaniList,
    consentRequests,
    triggerConsentRequest,
    simulateAccessPlot,
    verifyPlotHash,
    addNotification
  } = useAppContext();

  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('semua');
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(plots[0]?.id || null);
  
  // Exporter credentials (hardcoded for simulation)
  const EXPORTER_NAME = 'PT Java Coffee Quality (Exporter)';
  const [bidValue, setBidValue] = useState<string>('62000');
  const [accessPurpose, setAccessPurpose] = useState<string>('Uji Tuntas EUDR Kapal Kontainer #J-2026');

  const selectedPlot = useMemo(() => {
    return plots.find(p => p.id === selectedPlotId) || null;
  }, [plots, selectedPlotId]);

  const selectedPlotFarmer = useMemo(() => {
    if (!selectedPlot) return null;
    return petaniList.find(pt => pt.id === selectedPlot.petaniId) || null;
  }, [selectedPlot, petaniList]);

  const selectedConsent = useMemo(() => {
    if (!selectedPlot) return null;
    return consentRequests.find(
      r => r.plotId === selectedPlot.id && r.exporterName === EXPORTER_NAME
    ) || null;
  }, [selectedPlot, consentRequests]);

  const filteredPlots = useMemo(() => {
    return plots.filter(plot => {
      const farmer = petaniList.find(pt => pt.id === plot.petaniId);
      const farmerName = farmer ? farmer.name : '';
      const matchesSearch =
        plot.name.toLowerCase().includes(search.toLowerCase()) ||
        farmerName.toLowerCase().includes(search.toLowerCase());

      const matchesRisk =
        filterRisk === 'semua' ||
        plot.forestRisk.toLowerCase() === filterRisk.toLowerCase();

      return matchesSearch && matchesRisk;
    });
  }, [plots, petaniList, search, filterRisk]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = plots.length;
    const exportReady = plots.filter(p => p.forestRisk === 'Aman' && p.stdbStatus === 'Terbit').length;
    const totalHectares = plots.reduce((sum, p) => sum + p.areaSize, 0);
    const pendingConsents = consentRequests.filter(r => r.exporterName === EXPORTER_NAME && r.status === 'diminta').length;

    return {
      total,
      exportReady,
      percentReady: total > 0 ? Math.round((exportReady / total) * 100) : 0,
      totalHectares: parseFloat(totalHectares.toFixed(2)),
      pendingConsents
    };
  }, [plots, consentRequests]);

  const handleRequestConsent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlot) return;
    const bid = bidValue ? Number(bidValue) : undefined;
    triggerConsentRequest(selectedPlot.id, EXPORTER_NAME, bid);
    addNotification(`Permintaan izin akses diajukan kepada petani ${selectedPlotFarmer?.name} untuk kebun "${selectedPlot.name}".`, 'info');
  };

  const handleAccessSecretData = () => {
    if (!selectedPlot) return;
    const result = simulateAccessPlot(
      selectedPlot.id,
      EXPORTER_NAME,
      'eksportir',
      accessPurpose || 'Audit Dokumen Bebas Deforestasi'
    );

    if (result.authorized) {
      addNotification('AKSES BERHASIL: Koordinat kebun kopi didekripsi dan diverifikasi lolos EUDR.', 'success');
    } else {
      addNotification('AKSES DITOLAK: Anda tidak memiliki izin akses dari petani pemilik lahan! Pelanggaran privasi terekam.', 'alert');
    }
  };

  // Simulating an unauthorized spy bypass attempt
  const handleSpyBypassAttempt = () => {
    if (!selectedPlot) return;
    simulateAccessPlot(
      selectedPlot.id,
      'PT Bandung Trading Corp (Tanpa Izin)',
      'eksportir',
      'Penyusupan data titik koordinat geospasial sekunder'
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      
      {/* Exporter Title Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
            Portal Kepatuhan Eksportir (EUDR)
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Audit &amp; Kepatuhan Bebas Deforestasi
          </h1>
          <p className="text-xs text-slate-500 leading-normal max-w-2xl">
            Lacak keterlacakan kopi (traceability), verifikasi validitas tanda tangan kriptografis dari dinas kehutanan, dan kelola izin koordinat untuk audit kepatuhan ekspor ke Uni Eropa.
          </p>
        </div>

        <div className="shrink-0 flex gap-2">
          <span className="bg-slate-900 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
            <Globe size={14} className="text-emerald-400 animate-spin-slow" />
            <span>Auditor: PT Java Coffee</span>
          </span>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="bg-slate-100 text-slate-800 p-3 rounded-xl">
            <Globe size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Plot Terdaftar</span>
            <span className="text-xl font-bold text-slate-800 block">{stats.total} Kebun</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Export-Ready (Lolos)</span>
            <span className="text-xl font-bold text-emerald-700 block">{stats.exportReady} Plot ({stats.percentReady}%)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimasi Luas Total</span>
            <span className="text-xl font-bold text-blue-700 block">{stats.totalHectares} Hektar</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="bg-rose-50 text-rose-700 p-3 rounded-xl">
            <ShieldAlert size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consent Tertunda</span>
            <span className="text-xl font-bold text-rose-700 block">{stats.pendingConsents} Menunggu</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Columns: Map & Plot List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Globe size={16} className="text-emerald-600" />
              Verifikasi Geospasial Kawasan Hutan
            </h3>
            <Map3D
              center={selectedPlot ? { lat: selectedPlot.latitude, lng: selectedPlot.longitude } : { lat: -7.17, lng: 107.61 }}
              zoom={12}
              markers={plots.map(p => {
                const farmer = petaniList.find(pt => pt.id === p.petaniId);
                const isSelected = selectedPlotId === p.id;
                return {
                  id: p.id,
                  lat: p.latitude,
                  lng: p.longitude,
                  color: isSelected ? '#3b82f6' : (p.forestRisk === 'Aman' ? '#10b981' : p.forestRisk === 'Risiko Rendah' ? '#f59e0b' : '#f43f5e'),
                  label: `${p.name} (${farmer?.name || 'Petani'}) - ${p.forestRisk}`
                };
              })}
              onPick={(lat, lng) => {
                // Find nearest plot to make select easy
                const nearest = plots.reduce((prev, curr) => {
                  const distPrev = Math.pow(curr.latitude - lat, 2) + Math.pow(curr.longitude - lng, 2);
                  const distCurr = Math.pow(prev.latitude - lat, 2) + Math.pow(prev.longitude - lng, 2);
                  return distPrev < distCurr ? curr : prev;
                });
                setSelectedPlotId(nearest.id);
              }}
              className="h-[480px]"
            />
          </div>

          {/* Table list of all plots */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Daftar Lahan Petani Pangalengan</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cari petani/kebun..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden"
                />
                <select
                  value={filterRisk}
                  onChange={e => setFilterRisk(e.target.value)}
                  className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden bg-white"
                >
                  <option value="semua">Semua Risiko</option>
                  <option value="aman">Aman</option>
                  <option value="risiko rendah">Risiko Rendah</option>
                  <option value="risiko tinggi">Risiko Tinggi</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    <th className="pb-2.5">Nama Kebun / Petani</th>
                    <th className="pb-2.5">Risiko JRC</th>
                    <th className="pb-2.5">STDB</th>
                    <th className="pb-2.5">Koordinat GPS</th>
                    <th className="pb-2.5">Consent Anda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlots.map(plot => {
                    const farmer = petaniList.find(pt => pt.id === plot.petaniId);
                    const consent = consentRequests.find(
                      r => r.plotId === plot.id && r.exporterName === EXPORTER_NAME
                    );
                    const isSelected = selectedPlotId === plot.id;

                    return (
                      <tr
                        key={plot.id}
                        onClick={() => setSelectedPlotId(plot.id)}
                        className={`hover:bg-slate-50/80 transition-all cursor-pointer ${
                          isSelected ? 'bg-slate-50/90 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3">
                          <span className="font-bold text-slate-800 block">{plot.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {farmer ? farmer.name : 'Unknown Farmer'} • {plot.areaSize} Ha
                          </span>
                        </td>
                        <td className="py-3">
                          {plot.forestRisk === 'Aman' ? (
                            <Badge tone="aman">Aman</Badge>
                          ) : plot.forestRisk === 'Risiko Rendah' ? (
                            <Badge tone="pending">Risiko Rendah</Badge>
                          ) : (
                            <Badge tone="berisiko">Risiko Tinggi</Badge>
                          )}
                        </td>
                        <td className="py-3 text-slate-700 font-mono text-[10.5px]">
                          {plot.stdbStatus}
                        </td>
                        <td className="py-3 text-slate-500 font-mono text-[10px]">
                          {plot.latitude.toFixed(4)}, {plot.longitude.toFixed(4)}
                        </td>
                        <td className="py-3">
                          {consent ? (
                            consent.status === 'disetujui' ? (
                              <Badge tone="aman">Diizinkan</Badge>
                            ) : consent.status === 'ditolak' ? (
                              <Badge tone="alert">Ditolak</Badge>
                            ) : (
                              <Badge tone="pending">Menunggu</Badge>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Belum Ada</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Compliance and Consent Controls */}
        <div className="lg:col-span-5 space-y-6">
          {selectedPlot ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Detail Audit Kepatuhan EUDR
                </span>
                <h4 className="text-base font-extrabold text-slate-800 mt-0.5">{selectedPlot.name}</h4>
                <p className="text-xs text-slate-500">
                  Pemilik: <strong>{selectedPlotFarmer?.name}</strong> • {selectedPlot.commodity}
                </p>
              </div>

              {/* Dynamic Hash Verification Card */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                    Integritas Kriptografi Data
                  </span>
                  {verifyPlotHash(selectedPlot.id) ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                      <CheckCircle size={10} /> Valid
                    </span>
                  ) : (
                    <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 animate-pulse">
                      <AlertTriangle size={10} /> TAMPERED
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Signature Hash:</span>
                    <span className="font-bold text-slate-800">
                      {selectedPlot.signatureHash.substring(0, 16)}...
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Di-verifikasi Oleh:</span>
                    <span className="font-semibold text-slate-700">Andi (Agen Lapangan)</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Waktu Terbit:</span>
                    <span className="font-semibold text-slate-700">{selectedPlot.verifiedAt}</span>
                  </div>
                </div>
              </div>

              {/* Consent Management & Access Trigger Box */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Manajemen Consent Koordinat GPS
                </span>

                {selectedConsent?.status === 'disetujui' ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl p-4 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <Unlock size={14} />
                        <span>Izin Akses Aktif (Granted)</span>
                      </div>
                      <p className="leading-normal opacity-90 text-[11px]">
                        Petani telah memberikan izin penuh bagi Anda untuk membaca titik koordinat presisi guna diunggah ke portal EUDR Uni Eropa.
                      </p>
                      {selectedConsent.negotiatedPrice && (
                        <div className="pt-1.5 font-mono text-[11px] text-emerald-800 font-extrabold">
                          Harga Transaksi Disetujui: Rp {selectedConsent.negotiatedPrice.toLocaleString('id-ID')}/Kg
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Keterangan Audit Dekripsi
                      </label>
                      <input
                        type="text"
                        value={accessPurpose}
                        onChange={e => setAccessPurpose(e.target.value)}
                        placeholder="Contoh: Audit Bebras Deforestasi Kapal ID-202"
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700"
                      />
                      <button
                        onClick={handleAccessSecretData}
                        className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-950 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Baca Koordinat Kebun Kopi</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Lock size={14} className="text-slate-500" />
                        <span>Koordinat Terkunci (Sovereign)</span>
                      </div>
                      <p className="leading-normal text-slate-500 text-[11px]">
                        Sesuai kedaulatan data, koordinat presisi disembunyikan sebelum petani memberikan persetujuan (consent).
                      </p>
                    </div>

                    {selectedConsent?.status === 'diminta' ? (
                      <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-xl p-3.5 text-center text-xs font-semibold">
                        Menunggu persetujuan petani... Penawaran awal Anda: Rp {Number(bidValue).toLocaleString('id-ID')}/Kg.
                      </div>
                    ) : (
                      <form onSubmit={handleRequestConsent} className="space-y-3 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                            Tawarkan Harga Kopi Terbaik (Rp/Kg)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={bidValue}
                              onChange={e => setBidValue(e.target.value)}
                              placeholder="Contoh: 62000"
                              className="w-full text-xs pl-3 pr-16 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-slate-700 bg-white"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold font-mono">
                              Rp/Kg
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 leading-normal block">
                            Petani dapat menerima langsung atau menegosiasikan harga ini di portal mandiri mereka.
                          </span>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send size={13} />
                          <span>Minta Izin Akses Data</span>
                        </button>
                      </form>
                    )}

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block animate-pulse">
                        Simulasi Pelanggaran Privasi (Demo)
                      </span>
                      <button
                        onClick={handleSpyBypassAttempt}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        title="Simulasi membaca data koordinat tanpa izin petani untuk melihat audit alert"
                      >
                        Paksa Baca Koordinat Tanpa Izin
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-xs">
              Silakan pilih salah satu plot kebun di kiri untuk melihat detail audit.
            </div>
          )}

          {/* Price Reference Card widget */}
          <HargaHariIni />
        </div>

      </div>
    </div>
  );
}
