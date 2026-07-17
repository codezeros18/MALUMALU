import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Badge from '../components/Badge';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  User,
  MapPin,
  Fingerprint,
  Calendar,
  History,
  FileCheck,
  Edit3,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function PlotDetail() {
  const { id } = useParams();
  const { plots, petaniList, updatePlot, verifyPlotHash, addNotification } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  
  // Edit Form Fields
  const [editedName, setEditedName] = useState('');
  const [editedSize, setEditedSize] = useState(0);
  const [editedCommodity, setEditedCommodity] = useState('');
  const [editedStdb, setEditedStdb] = useState<'Terbit' | 'Dalam Proses' | 'Belum Ada'>('Belum Ada');
  const [editedRisk, setEditedRisk] = useState<'Aman' | 'Risiko Rendah' | 'Risiko Tinggi'>('Aman');

  const plot = useMemo(() => {
    return plots.find(p => p.id === id) || null;
  }, [plots, id]);

  const farmer = useMemo(() => {
    if (!plot) return null;
    return petaniList.find(pt => pt.id === plot.petaniId) || null;
  }, [plot, petaniList]);

  // Init edit state
  const handleStartEdit = () => {
    if (!plot) return;
    setEditedName(plot.name);
    setEditedSize(plot.areaSize);
    setEditedCommodity(plot.commodity);
    setEditedStdb(plot.stdbStatus);
    setEditedRisk(plot.forestRisk);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plot) return;

    updatePlot(plot.id, {
      name: editedName,
      areaSize: Number(editedSize),
      commodity: editedCommodity,
      stdbStatus: editedStdb,
      forestRisk: editedRisk,
      isCorrected: true
    });

    setIsEditing(false);
    addNotification(`Data plot "${editedName}" berhasil dikoreksi dan ditandatangani ulang secara kriptografis.`, 'success');
  };

  if (!plot) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center space-y-4">
        <p className="text-slate-500 font-semibold">Plot Paspor tidak ditemukan.</p>
        <Link to="/agen" className="text-emerald-600 underline text-xs font-bold">
          Kembali ke Peta Agen
        </Link>
      </div>
    );
  }

  const isValidHash = verifyPlotHash(plot.id);
  const isTampered = plot.name.includes('MODIFIKASI');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      
      {/* Back button */}
      <Link
        to="/agen"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Kembali ke Workspace Agen</span>
      </Link>

      {/* Header card with integrity badge */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              Paspor ID: {plot.id}
            </span>
            {isValidHash && !isTampered ? (
              <Badge tone="aman">Tanda Tangan Valid</Badge>
            ) : (
              <Badge tone="berisiko">HUKUM DATA RUSAK / TAMPERED</Badge>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{plot.name}</h1>
          <p className="text-xs text-slate-500">
            Kedaulatan Kopi Pangalengan • Komoditas: <strong>{plot.commodity}</strong>
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 size={13} />
            <span>Koreksi &amp; Tanda Tangani Ulang</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Farmer profile & Coordinates */}
        <div className="md:col-span-7 space-y-6">
          
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="bg-white border border-slate-150 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Edit3 size={16} className="text-emerald-600" />
                Koreksi Data Plot Kebun
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nama Plot Kebun
                  </label>
                  <input
                    type="text"
                    required
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Luas Lahan (Ha)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editedSize}
                      onChange={e => setEditedSize(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg font-mono text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Komoditas Utama
                    </label>
                    <input
                      type="text"
                      required
                      value={editedCommodity}
                      onChange={e => setEditedCommodity(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Status STDB
                    </label>
                    <select
                      value={editedStdb}
                      onChange={e => setEditedStdb(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Terbit">Terbit</option>
                      <option value="Dalam Proses">Dalam Proses</option>
                      <option value="Belum Ada">Belum Ada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Risiko Deforestasi JRC
                    </label>
                    <select
                      value={editedRisk}
                      onChange={e => setEditedRisk(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="Aman">Aman (Lolos)</option>
                      <option value="Risiko Rendah">Risiko Rendah</option>
                      <option value="Risiko Tinggi">Risiko Tinggi (Gagal)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  Koreksi &amp; Tandatangani Ulang
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-5 shadow-xs">
              
              {/* Security Warning box */}
              {!isValidHash || isTampered ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-950 text-xs flex gap-3 leading-relaxed items-start">
                  <ShieldAlert className="text-rose-600 shrink-0 animate-bounce mt-0.5" size={18} />
                  <div className="space-y-1">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] text-rose-800">
                      Indikasi Pelanggaran Integritas Data!
                    </span>
                    <p>
                      Tanda tangan digital SHA-256 yang terekam di rantai tidak cocok dengan kalkulasi data plot saat ini. Data ini terdeteksi telah dimodifikasi secara tidak sah di luar prosedur tanda tangan digital (tampered).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-950 text-xs flex gap-3 leading-relaxed items-start">
                  <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-800">
                      Keamanan Terjamin (EUDR Compliant)
                    </span>
                    <p>
                      Payload plot tervalidasi 100% cocok dengan tanda tangan digital dinas pertanian. Dokumen terbit secara sah dan tamper-proof.
                    </p>
                  </div>
                </div>
              )}

              {/* Farmer Profile block */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Pemilik Kebun (Farmer Profile)
                </span>

                {farmer ? (
                  <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                    {farmer.photoUrl ? (
                      <img
                        src={farmer.photoUrl}
                        alt={farmer.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">
                        {farmer.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-sm text-slate-800 block">{farmer.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        NIK: {farmer.nik} • {farmer.group}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Profil petani tidak ditemukan.</p>
                )}
              </div>

              {/* Geo parameters grid */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Spesifikasi Geospasial &amp; Parameter Lahan
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[9px] block uppercase">Koordinat GPS</span>
                    <span className="text-slate-800 font-bold block">Lat: {plot.latitude.toFixed(6)}</span>
                    <span className="text-slate-800 font-bold block">Lng: {plot.longitude.toFixed(6)}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 text-[9px] block uppercase">Peta Raster &amp; Ukuran</span>
                    <span className="text-slate-800 font-bold block">Luas: {plot.areaSize} Hektar</span>
                    <span className="text-slate-800 font-bold block">Akurasi GPS: ±{plot.accuracyM || 5.0}m</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right column: Cryptographic Verification Logs */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <History size={16} className="text-emerald-600 animate-spin-slow" />
              Rantai Audit Verifikasi ({plot.logs.length})
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Berikut adalah histori tanda tangan digital (hash chain) yang mendokumentasikan setiap modifikasi atau penerbitan paspor resmi.
            </p>

            <div className="space-y-4">
              {plot.logs.map((log, index) => (
                <div
                  key={index}
                  className="relative pl-5 border-l-2 border-slate-100 last:border-transparent space-y-2 pb-1"
                >
                  <div className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-mono block">
                      {log.timestamp}
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Petugas: <strong>{log.operator}</strong>
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg font-mono text-[9px] text-slate-600 space-y-0.5">
                    <span className="text-[8px] text-slate-400 uppercase block">Hash Hasil Tanda Tangan:</span>
                    <span className="break-all font-semibold block">{log.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
