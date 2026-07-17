import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import Map3D, { type Map3DMarker } from '../components/Map3D';
import OfflineIndicator from '../components/OfflineIndicator';
import Badge from '../components/Badge';
import {
  UserPlus,
  RefreshCw,
  Database,
  MapPin,
  Compass,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Trash2,
  Lock,
  Unlock,
  AlertOctagon,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const {
    plots,
    petaniList,
    addPetani,
    addPlot,
    isOnline,
    resetToDefault,
    verifyPlotHash,
    tamperPlotData,
    updatePlot,
    addNotification
  } = useAppContext();

  // State form
  const [nama, setNama] = useState('');
  const [desa, setDesa] = useState('');
  const [komoditas, setKomoditas] = useState('kopi');
  const [telepon, setTelepon] = useState('');
  const [email, setEmail] = useState('');
  
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [showAccuracyInfo, setShowAccuracyInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'list'>('register');
  const [isSyncing, setIsSyncing] = useState(false);

  // Verification results map
  const [verificationStates, setVerificationStates] = useState<Record<string, { verified: boolean; checked: boolean }>>({});

  const handlePickLocation = (lat: number, lng: number) => {
    setPicked({ lat, lng });
    setAccuracyM(null); // manual click
  };

  const handleUseGps = () => {
    // Simulate real GPS trigger in Pangalengan Coffee farms
    const randomLat = -7.170000 - (Math.random() * 0.05);
    const randomLng = 107.590000 + (Math.random() * 0.05);
    setPicked({ lat: parseFloat(randomLat.toFixed(6)), lng: parseFloat(randomLng.toFixed(6)) });
    setAccuracyM(parseFloat((3 + Math.random() * 5).toFixed(1)));
    addNotification('Sinyal GPS terkunci! Akurasi ± 4.2m.', 'success');
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      addNotification('Sinkronisasi basis data pusat selesai. Semua tanda tangan kriptografis tervalidasi.', 'success');
    }, 1200);
  };

  const handleSavePlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama) {
      addNotification('Nama petani wajib diisi!', 'warning');
      return;
    }
    if (!picked) {
      addNotification('Silakan pilih koordinat lokasi di peta terlebih dahulu.', 'warning');
      return;
    }

    // Determine JRC forest risk status on creation
    const getRisk = (lat: number, lng: number): 'Aman' | 'Risiko Rendah' | 'Risiko Tinggi' => {
      if (lat < -7.21 && lng > 107.62) return 'Risiko Tinggi';
      if (lat < -7.19 && lng > 107.60) return 'Risiko Rendah';
      return 'Aman';
    };

    const risk = getRisk(picked.lat, picked.lng);
    const tier = risk === 'Aman' ? 'Export-Ready' : 'Lokal / Program';

    // Save Farmer
    const petaniId = addPetani({
      name: nama,
      nik: `320422${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      phone: telepon || '0812-xxxx-xxxx',
      group: 'Koperasi Kopi Klasik Sunda',
      desa: desa || 'Desa Pangalengan',
      email: email || undefined
    });

    // Save Plot
    addPlot({
      petaniId,
      name: `Petak Kopi ${nama} - ${desa || 'Pangalengan'}`,
      latitude: picked.lat,
      longitude: picked.lng,
      areaSize: parseFloat((0.5 + Math.random() * 2).toFixed(2)),
      commodity: komoditas === 'kopi' ? 'Kopi Arabika' : komoditas,
      forestRisk: risk,
      stdbStatus: risk === 'Aman' ? 'Terbit' : 'Dalam Proses',
      tier,
      reasons: risk === 'Aman' 
        ? ['Lolos JRC Forest Cover 2020', 'Akurasi GPS prima', 'Dokumen STDB sesuai database dinas']
        : ['Berada dekat batas kawasan hutan lindung', 'Dokumen STDB dalam proses verifikasi lapangan'],
      isCorrected: false,
      accuracyM: accuracyM || 5.0,
      email: email || undefined
    });

    // Reset Form
    setNama('');
    setDesa('');
    setTelepon('');
    setEmail('');
    setPicked(null);
    setAccuracyM(null);
    setActiveTab('list');
  };

  const checkPlotVerification = (id: string) => {
    const isValid = verifyPlotHash(id);
    setVerificationStates(prev => ({
      ...prev,
      [id]: { verified: isValid, checked: true }
    }));
    if (isValid) {
      addNotification('VALID: Tanda tangan digital cocok dengan payload data. Lolos audit kepatuhan EUDR.', 'success');
    } else {
      addNotification('PERINGATAN: Tanda tangan digital rusak! Indikasi manipulasi data ilegal terdeteksi.', 'alert');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Workspace Header Dashboard */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              Workspace Agen Lapangan
            </span>
            <OfflineIndicator />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Alur Kerja Registrasi &amp; Penerbitan Paspor Petani
          </h1>
          <p className="text-xs text-slate-500 leading-normal max-w-2xl">
            Gunakan modul ini untuk melakukan digitasi poligon, penentuan batas koordinat, dan melacak kepatuhan bebas deforestasi (EUDR) kopi Pangalengan.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Menyinkron…' : 'Sinkron Sekarang'}</span>
          </button>
          <button
            onClick={resetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all cursor-pointer"
            title="Reset ulang database contoh untuk demo"
          >
            <Trash2 size={13} />
            <span>Reset Database Demo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Interactive Map & Forms */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-emerald-600 animate-pulse" />
              1. Pemetaan Geospasial Kebun Kopi
            </h3>
            <Map3D
              center={picked || (plots.length > 0 ? { lat: plots[0].latitude, lng: plots[0].longitude } : { lat: -7.17, lng: 107.61 })}
              zoom={12}
              markers={plots.map(p => {
                const farmer = petaniList.find(pt => pt.id === p.petaniId);
                return {
                  id: p.id,
                  lat: p.latitude,
                  lng: p.longitude,
                  color: p.forestRisk === 'Aman' ? '#10b981' : p.forestRisk === 'Risiko Rendah' ? '#f59e0b' : '#f43f5e',
                  label: `${p.name} (${farmer?.name || 'Petani'}) - ${p.forestRisk}`
                };
              }).concat(picked ? [{
                id: 'picked-position',
                lat: picked.lat,
                lng: picked.lng,
                color: '#3b82f6',
                label: 'Lokasi Baru Dipilih'
              }] : [])}
              onPick={handlePickLocation}
              className="h-96"
            />
          </div>

          {/* GPS Coordinates & Accuracy Info */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Koordinat Kebun Kopi
                </span>
                {picked ? (
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    S {Math.abs(picked.lat).toFixed(6)}° , E {picked.lng.toFixed(6)}°
                    {accuracyM && ` (Akurasi GPS: ±${accuracyM}m)`}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-mono italic">
                    Belum ada koordinat — tap peta atau pakai GPS.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleUseGps}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Compass size={14} className="animate-spin-slow" />
                <span>Pakai GPS Lapangan</span>
              </button>
            </div>

            {/* Accordion: Tentang Akurasi */}
            <div className="border-t border-slate-200/60 pt-2">
              <button
                type="button"
                onClick={() => setShowAccuracyInfo(!showAccuracyInfo)}
                className="w-full flex justify-between items-center text-xs font-semibold text-slate-600 hover:text-slate-900 focus:outline-hidden text-left"
              >
                <span> Tentang Akurasi GPS &amp; Buffer Regulasi EUDR</span>
                {showAccuracyInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              {showAccuracyInfo && (
                <div className="mt-2 text-[11px] text-slate-500 space-y-1.5 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                  <p>
                    <strong>Akurasi GPS Lapangan:</strong> Sesuai standar Uni Eropa (EUDR), koordinat plot kecil wajib dipetakan menggunakan GPS dengan akurasi di bawah 10 meter untuk menjamin kepemilikan riil tanpa tumpang tindih kawasan lindung.
                  </p>
                  <p>
                    <strong>Point-in-Raster &amp; Buffer:</strong> Sistem kami menghitung titik plot terhadap peta raster JRC Forest Cover 2020. Jarak aman minimum dari perbatasan hutan lindung direkomendasikan sebesar 25 meter sebagai buffer kesalahan transmisi GPS.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Form & Registered Lists */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border-b border-slate-100 flex gap-4">
            <button
              onClick={() => setActiveTab('register')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'register' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Registrasi Baru
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'list' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Daftar Paspor ({plots.length})
            </button>
          </div>

          {activeTab === 'register' ? (
            <form onSubmit={handleSavePlot} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <UserPlus size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wide">Formulir Paspor Kebun</h3>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nama petani *
                  </label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama lengkap petani"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Desa
                  </label>
                  <input
                    type="text"
                    value={desa}
                    onChange={(e) => setDesa(e.target.value)}
                    placeholder="Contoh: Cibeureum / Malabar"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Komoditas
                  </label>
                  <select
                    value={komoditas}
                    onChange={(e) => setKomoditas(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-700 bg-white"
                  >
                    <option value="kopi">Kopi Arabika (Typica/Sigararutang)</option>
                    <option value="Teh">Teh Hijau Pekoe</option>
                    <option value="Sayuran">Sayuran Kol/Kentang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Telepon
                  </label>
                  <input
                    type="text"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    placeholder="No. WhatsApp aktif"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Email petani (opsional, untuk akses portal)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@portalpetani.com"
                    className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!picked || !nama}
                className="w-full py-3 mt-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer uppercase tracking-wider"
              >
                Simpan Plot &amp; Terbitkan Paspor
              </button>
            </form>
          ) : (
            <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2">
              {plots.map((plot) => {
                const farmer = petaniList.find(p => p.id === plot.petaniId);
                const verification = verificationStates[plot.id];
                const isTampered = plot.name.includes('MODIFIKASI');

                return (
                  <div
                    key={plot.id}
                    className="bg-white border border-slate-100 rounded-xl p-4 space-y-3.5 shadow-xs hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          ID: {plot.id}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 leading-normal">
                          {plot.name}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Pemilik: <strong>{farmer ? farmer.name : 'Unknown'}</strong> • Desa: {farmer?.desa || 'Pangalengan'}
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {plot.forestRisk === 'Aman' ? (
                          <Badge tone="aman">Aman (EUDR)</Badge>
                        ) : plot.forestRisk === 'Risiko Rendah' ? (
                          <Badge tone="pending">Risiko Rendah</Badge>
                        ) : (
                          <Badge tone="berisiko">Risiko Tinggi</Badge>
                        )}
                        <span className="text-[9px] font-semibold text-slate-400 font-mono">
                          {plot.areaSize} Ha • {plot.commodity}
                        </span>
                      </div>
                    </div>

                    {/* Coordinates & Signatures */}
                    <div className="bg-slate-50 rounded-lg p-2.5 space-y-2 text-[10px]">
                      <div className="flex justify-between font-mono text-slate-600">
                        <span>Koordinat:</span>
                        <span className="font-bold">
                          {plot.latitude.toFixed(6)}, {plot.longitude.toFixed(6)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-slate-500">
                          <span className="flex items-center gap-1">
                            <Fingerprint size={12} className="text-slate-400" />
                            Digital Hash:
                          </span>
                          <span className="font-semibold text-slate-700 tracking-tight" title={plot.signatureHash}>
                            {plot.signatureHash.substring(0, 16)}...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-mono">Status Dokumen:</span>
                          <span className="font-bold text-slate-700">{plot.stdbStatus}</span>
                        </div>
                      </div>
                    </div>

                    {/* Security Verification & Simulation Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      {verification?.checked ? (
                        verification.verified && !isTampered ? (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                            <CheckCircle size={12} />
                            <span>Kriptografi Valid</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-rose-600 font-extrabold animate-bounce">
                            <AlertTriangle size={12} />
                            <span>DATA PALSU / TAMPERED</span>
                          </div>
                        )
                      ) : (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Menunggu verifikasi...
                        </div>
                      )}

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => checkPlotVerification(plot.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-900 rounded transition-all cursor-pointer"
                        >
                          Audit Hash
                        </button>
                        <button
                          onClick={() => tamperPlotData(plot.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-all cursor-pointer"
                          title="Simulasikan manipulasi database luar ilegal tanpa re-sign"
                        >
                          Manipulasi Data (Demo)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
