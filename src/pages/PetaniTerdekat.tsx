import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import Map3D, { type Map3DMarker } from '../components/Map3D';
import Badge from '../components/Badge';
import { Navigation, MapPin, Phone, CheckCircle, HelpCircle } from 'lucide-react';

export default function PetaniTerdekat() {
  const { plots, petaniList, addNotification } = useAppContext();
  
  // Default reference point (Pangalengan Center)
  const [refPoint, setRefPoint] = useState<{ lat: number; lng: number }>({
    lat: -7.21,
    lng: 107.61
  });

  const [contactedId, setContactedId] = useState<string | null>(null);

  // Simple and highly reliable distance calculation in km
  const nearbyList = useMemo(() => {
    return plots.map(plot => {
      const farmer = petaniList.find(pt => pt.id === plot.petaniId);
      
      // Rough distance approximation (1 degree is approx 111km)
      const dLat = plot.latitude - refPoint.lat;
      const dLng = plot.longitude - refPoint.lng;
      const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;

      return {
        plot,
        farmer,
        distanceKm: parseFloat(distanceKm.toFixed(2))
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [plots, petaniList, refPoint]);

  const handleHubungi = (farmerName: string, plotId: string) => {
    setContactedId(plotId);
    addNotification(`Menghubungi petani ${farmerName} melalui Paspor Gateway secure messaging...`, 'info');
    setTimeout(() => {
      addNotification(`Sambungan aman dengan ${farmerName} berhasil dibuka! Silakan mulai negosiasi harga kopi.`, 'success');
      setContactedId(null);
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Navigation className="text-emerald-600 animate-pulse" size={20} />
          Petani Terdekat &amp; Optimasi Logistik
        </h1>
        <p className="text-xs text-slate-500 max-w-2xl">
          Klik koordinat gudang atau pabrik pengolahan Anda di peta untuk menghitung rute pengumpulan kopi paling efisien guna meminimalkan jejak karbon transportasi.
        </p>
      </div>

      {/* Map component picking */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
          Klik Lokasi Gudang Anda di Peta
        </span>
        <Map3D
          center={refPoint}
          zoom={12}
          markers={plots.map(p => {
            const farmer = petaniList.find(pt => pt.id === p.petaniId);
            return {
              id: p.id,
              lat: p.latitude,
              lng: p.longitude,
              color: '#10b981',
              label: `${p.name} (${farmer?.name || 'Petani'})`
            };
          }).concat([{
            id: 'ref-point',
            lat: refPoint.lat,
            lng: refPoint.lng,
            color: '#3b82f6',
            label: 'Titik Referensi Gudang Anda'
          }])}
          onPick={(lat, lng) => {
            setRefPoint({ lat, lng });
            addNotification(`Titik referensi logistik diperbarui ke koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'info');
          }}
          className="h-96"
        />
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 flex items-center gap-2">
          <MapPin size={14} className="text-blue-600 shrink-0" />
          <span>Lokasi Referensi Logistik Saat Ini: <strong className="font-mono text-slate-800">{refPoint.lat.toFixed(5)}, {refPoint.lng.toFixed(5)}</strong></span>
        </div>
      </div>

      {/* Nearby list */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Rekomendasi Jalur Pengumpulan Kopi (Proximity)
        </span>

        <div className="space-y-3">
          {nearbyList.map(({ plot, farmer, distanceKm }) => (
            <div
              key={plot.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-150 rounded-xl p-4 hover:bg-slate-50/50 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">
                    {farmer ? farmer.name : 'Unknown Farmer'}
                  </span>
                  <Badge tone={distanceKm < 3 ? 'aman' : 'pending'}>
                    {distanceKm} km
                  </Badge>
                </div>
                
                <p className="text-xs text-slate-500">
                  Kebun: <strong>{plot.name}</strong> • Komoditas: {plot.commodity} • Luas: {plot.areaSize} Ha
                </p>
                
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    GPS: {plot.latitude.toFixed(4)}, {plot.longitude.toFixed(4)}
                  </span>
                  {plot.forestRisk === 'Aman' ? (
                    <Badge tone="aman">Bebas Deforestasi</Badge>
                  ) : (
                    <Badge tone="berisiko">Evaluasi Lapangan</Badge>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  disabled={contactedId === plot.id}
                  onClick={() => handleHubungi(farmer?.name || 'Petani', plot.id)}
                  className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Phone size={13} />
                  <span>{contactedId === plot.id ? 'Menghubungi...' : 'Hubungi'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
