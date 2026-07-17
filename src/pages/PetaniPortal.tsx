import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Petani, Plot } from '../types';
import Badge from '../components/Badge';
import {
  User,
  Search,
  CheckCircle,
  AlertTriangle,
  Fingerprint,
  Users,
  Eye,
  Lock,
  FileCheck,
  CreditCard,
  DollarSign,
  TrendingUp,
  History,
  Info,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

export default function PetaniPortal() {
  const {
    petaniList,
    plots,
    consentRequests,
    updateConsentRequest,
    accessLogs,
    addNotification
  } = useAppContext();

  const [searchEmail, setSearchEmail] = useState('');
  const [activeFarmer, setActiveFarmer] = useState<Petani | null>(null);
  const [negotiationPrices, setNegotiationPrices] = useState<Record<string, number>>({});
  const [showNegoInput, setShowNegoInput] = useState<Record<string, boolean>>({});

  const handleSearchEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const found = petaniList.find(
      p => p.email?.trim().toLowerCase() === searchEmail.trim().toLowerCase()
    );

    if (found) {
      setActiveFarmer(found);
      addNotification(`Selamat datang kembali, ${found.name}!`, 'success');
    } else {
      addNotification('Email tidak ditemukan. Coba gunakan Jaja (jaja@sunda.coop) atau Siti (siti@sunda.coop).', 'warning');
    }
  };

  const handleSelectDemoFarmer = (farmer: Petani) => {
    setActiveFarmer(farmer);
    addNotification(`Portal dimuat untuk petani: ${farmer.name}`, 'success');
  };

  const activePlots = activeFarmer
    ? plots.filter(p => p.petaniId === activeFarmer.id)
    : [];

  const activeRequests = activeFarmer
    ? consentRequests.filter(req => {
        const plot = plots.find(p => p.id === req.plotId);
        return plot && plot.petaniId === activeFarmer.id;
      })
    : [];

  const activeAccessLogs = activeFarmer
    ? accessLogs.filter(log => log.petaniId === activeFarmer.id)
    : [];

  const handleApprove = (id: string) => {
    updateConsentRequest(id, 'disetujui');
  };

  const handleReject = (id: string) => {
    updateConsentRequest(id, 'ditolak');
  };

  const handleNego = (id: string, originalBid: number) => {
    const price = negotiationPrices[id];
    if (!price || price <= originalBid) {
      addNotification('Harga tanding harus lebih tinggi dari penawaran awal!', 'warning');
      return;
    }
    updateConsentRequest(id, 'disetujui', price);
    setShowNegoInput(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Portal Header */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
            Portal Kedaulatan Data Petani
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Portal Mandiri &amp; Manajemen Consent Petani
          </h1>
          <p className="text-xs text-slate-500 leading-normal max-w-2xl">
            Di portal ini, Anda memegang kedaulatan penuh atas koordinat geospasial kebun kopi Anda. Berikan izin akses ke eksportir atau negosiasikan harga kopi terbaik berdasarkan keunikan paspor kebun Anda.
          </p>
        </div>

        {activeFarmer && (
          <button
            onClick={() => setActiveFarmer(null)}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all shrink-0 cursor-pointer"
          >
            Keluar Portal
          </button>
        )}
      </div>

      {!activeFarmer ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Email Search Box */}
          <div className="md:col-span-6 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Search className="text-emerald-600" size={18} />
              <h3 className="font-bold text-sm uppercase tracking-wide">Cari Akun Petani</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Masukkan email terdaftar Anda untuk memuat dashboard personal, memeriksa kecocokan audit EUDR, dan merespons penawaran harga.
            </p>

            <form onSubmit={handleSearchEmail} className="space-y-3">
              <input
                type="email"
                required
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                placeholder="Contoh: jaja@sunda.coop"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700 font-mono"
              />
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all cursor-pointer"
              >
                Masuk Portal Petani
              </button>
            </form>
          </div>

          {/* Demo Selector Grid */}
          <div className="md:col-span-6 bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Users className="text-blue-600" size={18} />
              <h3 className="font-bold text-sm uppercase tracking-wide">Pilih Cepat Petani Demo</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Untuk kemudahan uji coba di AI Studio preview, pilih salah satu profil petani terdaftar di bawah ini untuk mensimulasikan manajemen persetujuan akses (consent) secara instan.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {petaniList.map(farmer => (
                <button
                  key={farmer.id}
                  onClick={() => handleSelectDemoFarmer(farmer)}
                  className="w-full bg-white border border-slate-100 hover:border-blue-400 p-3.5 rounded-xl flex items-center justify-between text-left transition-all hover:shadow-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    {farmer.photoUrl ? (
                      <img
                        src={farmer.photoUrl}
                        alt={farmer.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-150 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {farmer.name.charAt(4)}
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-slate-800 block group-hover:text-blue-700 transition-colors">
                        {farmer.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {farmer.email || 'Tanpa email'} • {farmer.group}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Logged in farmer view */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Personal Passport & Land Plots */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-600" />
                Paspor Digital Kebun Anda ({activePlots.length})
              </h3>
              <button
                onClick={() => window.print()}
                className="no-print px-3 py-1.5 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                Cetak Paspor (PDF)
              </button>
            </div>

            {activePlots.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-xl p-8 text-center space-y-2">
                <Info className="text-slate-300 mx-auto" size={32} />
                <p className="text-xs text-slate-500 font-medium">Anda belum memiliki koordinat plot kebun terdaftar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activePlots.map(plot => (
                  <div key={plot.id} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-xs">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          Plot ID: {plot.id}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{plot.name}</h4>
                        <p className="text-xs text-slate-500">
                          Komoditas: <strong>{plot.commodity}</strong> • Luas: {plot.areaSize} Hektar
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {plot.forestRisk === 'Aman' ? (
                          <Badge tone="aman">Lolos EUDR (Bebas Deforestasi)</Badge>
                        ) : plot.forestRisk === 'Risiko Rendah' ? (
                          <Badge tone="pending">Risiko Rendah</Badge>
                        ) : (
                          <Badge tone="berisiko">Risiko Tinggi</Badge>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">
                          STDB: {plot.stdbStatus}
                        </span>
                      </div>
                    </div>

                    {/* Georeference and QR-Hash Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">
                          Perekaman Koordinat GPS
                        </span>
                        <span className="text-slate-800 font-semibold block">
                          Lat: {plot.latitude.toFixed(6)}
                        </span>
                        <span className="text-slate-800 font-semibold block">
                          Lng: {plot.longitude.toFixed(6)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider flex items-center gap-1">
                          <Fingerprint size={12} className="text-emerald-600" />
                          Tanda Tangan Digital SHA-256
                        </span>
                        <span className="text-slate-700 font-mono text-[10.5px] font-semibold break-all leading-relaxed block" title={plot.signatureHash}>
                          {plot.signatureHash}
                        </span>
                      </div>
                    </div>

                    {/* EUDR Traceability Reasons */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Detail Verifikasi EUDR Lapangan
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                        {plot.reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5 p-2 bg-slate-50/50 rounded-lg">
                            <CheckCircle size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Consent Requests & Privacy Audits */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Consent Requests Section with Bidding */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                Permintaan Akses &amp; Penawaran Harga ({activeRequests.length})
              </h3>

              {activeRequests.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-xs">
                  Tidak ada permintaan persetujuan aktif saat ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRequests.map(req => {
                    const plot = plots.find(p => p.id === req.plotId);
                    const isNegoActive = showNegoInput[req.id];

                    return (
                      <div key={req.id} className="bg-white border border-slate-100 rounded-xl p-4 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                              Permintaan Izin
                            </span>
                            <h4 className="font-bold text-xs text-slate-800 mt-1">{req.exporterName}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">Diajukan: {req.requestedAt}</p>
                          </div>

                          <div className="text-right shrink-0">
                            {req.status === 'diminta' ? (
                              <Badge tone="pending">Menunggu Keputusan</Badge>
                            ) : req.status === 'disetujui' ? (
                              <Badge tone="aman">Diizinkan</Badge>
                            ) : (
                              <Badge tone="berisiko">Ditolak</Badge>
                            )}
                          </div>
                        </div>

                        {plot && (
                          <p className="text-[11px] text-slate-600">
                            Memohon akses koordinat lokasi untuk kebun: <strong>{plot.name}</strong>.
                          </p>
                        )}

                        {/* Bid price from exporter */}
                        {req.bidPrice && (
                          <div className="bg-emerald-50/80 border border-emerald-100 rounded-lg p-3 flex justify-between items-center text-xs">
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-bold font-mono">
                                Harga Penawaran Exporter
                              </span>
                              <span className="font-mono font-bold text-emerald-800 text-sm">
                                Rp {req.bidPrice.toLocaleString('id-ID')}/Kg
                              </span>
                              {req.negotiatedPrice && (
                                <span className="text-[10px] text-blue-700 block font-mono font-bold mt-0.5">
                                  Nego Anda: Rp {req.negotiatedPrice.toLocaleString('id-ID')}/Kg
                                </span>
                              )}
                            </div>

                            <div className="text-right font-mono text-[9px]">
                              {req.bidStatus === 'diterima' && (
                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase">
                                  Harga Deal!
                                </span>
                              )}
                              {req.bidStatus === 'pending' && (
                                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">
                                  Menunggu Nego
                                </span>
                              )}
                              {req.bidStatus === 'nego' && (
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase">
                                  Menunggu Response Nego
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {req.status === 'diminta' && (
                          <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                            {isNegoActive ? (
                              <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                                  Tulis Harga Nego Anda (Rp/Kg)
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    placeholder="Contoh: 64000"
                                    onChange={e => setNegotiationPrices(prev => ({ ...prev, [req.id]: Number(e.target.value) }))}
                                    className="flex-1 text-xs px-2 py-1 border border-slate-300 rounded font-mono"
                                  />
                                  <button
                                    onClick={() => handleNego(req.id, req.bidPrice || 0)}
                                    className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded transition-colors cursor-pointer"
                                  >
                                    Kirim Nego
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => handleApprove(req.id)}
                                  className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded transition-colors cursor-pointer uppercase tracking-wider"
                                >
                                  Izinkan
                                </button>
                                {req.bidPrice && (
                                  <button
                                    onClick={() => setShowNegoInput(prev => ({ ...prev, [req.id]: true }))}
                                    className="py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded transition-colors cursor-pointer uppercase tracking-wider"
                                  >
                                    Nego Harga
                                  </button>
                                )}
                                <button
                                  onClick={() => handleReject(req.id)}
                                  className="py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded transition-colors cursor-pointer uppercase tracking-wider"
                                >
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Privacy Audits Log */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <History size={16} className="text-slate-700" />
                Audit Log Akses &amp; Histori Privasi ({activeAccessLogs.length})
              </h3>

              {activeAccessLogs.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-xs">
                  Belum ada log akses terekam untuk kebun Anda.
                </div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {activeAccessLogs.map(log => (
                    <div key={log.id} className="bg-white border border-slate-100 rounded-lg p-3 flex justify-between items-start text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">{log.readerName}</span>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Tujuan: {log.purpose}
                        </p>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          Waktu: {log.timestamp}
                        </span>
                      </div>

                      <div className="shrink-0 text-right">
                        {log.authorized ? (
                          <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold uppercase font-mono">
                            <CheckCircle size={10} />
                            <span>Izin Valid</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[9px] text-rose-600 font-extrabold uppercase font-mono animate-pulse">
                            <AlertTriangle size={10} />
                            <span>Ilegal / Terblokir</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
