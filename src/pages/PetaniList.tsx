import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge';
import { Users, Landmark, MapPin, Mail, Phone } from 'lucide-react';

export default function PetaniList() {
  const { petaniList, plots } = useAppContext();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="text-emerald-600" size={20} />
          Daftar Petani Terregistrasi
        </h1>
        <p className="text-xs text-slate-500 max-w-xl">
          Berikut adalah daftar lengkap profil petani kopi skala kecil di wilayah Pangalengan, Bandung yang terregistrasi dalam sistem identitas Paspor Petani.
        </p>
      </div>

      {petaniList.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-8 text-center text-slate-500 text-xs">
          Belum ada petani terdaftar di database luring device ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {petaniList.map((petani) => {
            const farmerPlots = plots.filter((p) => p.petaniId === petani.id);

            return (
              <div
                key={petani.id}
                className="bg-white border border-slate-150 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {petani.photoUrl ? (
                      <img
                        src={petani.photoUrl}
                        alt={petani.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {petani.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{petani.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {petani.id}</p>
                    </div>
                  </div>

                  <Badge tone={petani.isSynced ? 'synced' : 'pending'}>
                    {petani.isSynced ? 'Tersinkron' : 'Lokal'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-50 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    <Landmark size={13} className="text-slate-400" />
                    <span>Kelompok: <strong>{petani.group}</strong></span>
                  </div>
                  {petani.desa && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span>Desa: {petani.desa}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" />
                    <span>No. WA: {petani.phone}</span>
                  </div>
                  {petani.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      <span className="font-mono text-[11px]">{petani.email}</span>
                    </div>
                  )}
                </div>

                {farmerPlots.length > 0 && (
                  <div className="pt-2 border-t border-slate-50 space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                      Plot Terdaftar ({farmerPlots.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {farmerPlots.map((plot) => (
                        <Link
                          key={plot.id}
                          to={`/agen/plot/${plot.id}`}
                          className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1"
                        >
                          <MapPin size={10} />
                          <span>
                            {plot.name.replace(`Petak Kopi ${petani.name} - `, '')} ({plot.areaSize} Ha)
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
