import { useState } from 'react';
import { TrendingUp, Award, DollarSign } from 'lucide-react';

export default function HargaHariIni() {
  const [amount, setAmount] = useState<number>(100);

  const priceRefs = [
    { name: 'Arabika Typica (Premium)', min: 60000, max: 65000, desc: 'Varietas klasik Pangalengan, ekspor kualitas prima.' },
    { name: 'Arabika Sigararutang', min: 53000, max: 58000, desc: 'Rasa asam bersih, ketahanan penyakit baik.' },
    { name: 'Arabika Kartika', min: 48000, max: 52000, desc: 'Varietas kerdil produktif, cocok dataran tinggi.' },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Referensi Pasar Kopi</h3>
            <p className="text-xs text-slate-500 font-mono">Pangalengan • Diperbarui hari ini</p>
          </div>
        </div>
        <div className="text-right">
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Ekspor Stabil
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {priceRefs.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                {idx === 0 && <Award size={12} className="text-yellow-500" />}
                {item.name}
              </span>
              <p className="text-[11px] text-slate-500 leading-normal">{item.desc}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-bold text-emerald-700">
                Rp {item.min.toLocaleString('id-ID')} - {item.max.toLocaleString('id-ID')}
              </span>
              <p className="text-[10px] text-slate-400 font-mono">per Kg Ceri Merah</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50 space-y-3">
        <span className="text-xs font-semibold text-slate-700 block">Kalkulator Estimasi Hasil Kebun</span>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Jumlah panen..."
              className="w-full pl-3 pr-16 py-1.5 text-xs border border-emerald-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono text-slate-700"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
              Kg Ceri
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-emerald-100/50">
          <div>
            <span className="text-[10px] text-slate-500 block">Premium (Typica)</span>
            <span className="text-xs font-mono font-bold text-emerald-800">
              Rp {(amount * 62500).toLocaleString('id-ID')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Sigararutang</span>
            <span className="text-xs font-mono font-bold text-emerald-800">
              Rp {(amount * 55500).toLocaleString('id-ID')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Kartika</span>
            <span className="text-xs font-mono font-bold text-emerald-800">
              Rp {(amount * 50000).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
