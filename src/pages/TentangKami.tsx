import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const KILLER_FLOW = [
  {
    step: '01',
    title: 'Tandai titik kebun',
    desc: 'Petugas tap peta atau pakai GPS ponsel — cukup satu titik koordinat, selesai dalam hitungan detik.',
  },
  {
    step: '02',
    title: 'Cek risiko deforestasi',
    desc: 'Point-in-raster terhadap peta JRC yang sudah tersimpan di perangkat — berjalan tanpa internet sama sekali.',
  },
  {
    step: '03',
    title: 'Kartu identitas otomatis',
    desc: 'Mesin aturan deterministik menentukan tier (Lokal / Export-Ready) dan status STDB, lengkap dengan alasannya.',
  },
  {
    step: '04',
    title: 'Rantai verifikasi (hash-chain)',
    desc: 'Setiap kartu dibubuhi rantai kriptografis — perubahan sekecil apa pun pada data langsung ketahuan.',
  },
  {
    step: '05',
    title: 'Consent & notifikasi akses',
    desc: 'Akses hanya terbuka atas izin petani. Percobaan akses tanpa izin memicu notifikasi seketika.',
  },
  {
    step: '06',
    title: 'Koreksi manual',
    desc: 'Keputusan akhir tetap di tangan petugas — sistem membantu, bukan menggantikan penilaian manusia.',
  },
];

const PLATFORM_FEATURES = [
  {
    title: 'Petani Terverifikasi Terdekat',
    desc: 'Eksportir cukup tap satu titik (mis. lokasi gudang) untuk menemukan petani berkas-lengkap terdekat, terurut jarak — bukan tebakan, dan kontak hanya terbuka atas izin petani.',
  },
  {
    title: 'Harga Referensi Wajar',
    desc: 'Rata-rata harga tertimbang per komoditas dan tier, dihitung dari transaksi nyata — dengan jaminan minimum sampel supaya angka tidak ditampilkan dari data yang terlalu tipis untuk dipercaya.',
  },
  {
    title: 'Paket Bukti Uji Tuntas EUDR',
    desc: 'Satu klik menghasilkan paket bukti berisi geolokasi, periode produksi, kelengkapan dokumen, dan integritas rantai hash — dilabeli tegas sebagai bukti pendukung, bukan pengajuan DDS resmi.',
  },
  {
    title: 'Notifikasi Real-Time ke Petani',
    desc: 'Petani mendapat notifikasi langsung saat kartunya dibuat maupun saat ada percobaan akses tanpa izin — kendali dan kesadaran ada di tangan pemilik data, bukan cuma di sistem.',
  },
  {
    title: 'Jejak Audit Anti-Ubah',
    desc: 'Rantai hash, log akses, dan dokumen petani memakai kebijakan append-only di level database — UPDATE dan DELETE diblokir untuk semua pihak, termasuk operator platform sendiri.',
  },
  {
    title: 'Sinkron Lintas-Perangkat',
    desc: 'Pola outbox offline-first memastikan data yang direkam di lapangan sampai ke setiap perangkat (agen, eksportir, petani) begitu online — lengkap dengan retry otomatis dan penandaan konflik.',
  },
];

const TIERS = [
  {
    name: 'Lokal / Program',
    audience: 'Mayoritas petani yang menjual ke pasar domestik',
    requirement: 'Identitas kependudukan, titik koordinat kebun, dan klaim kepemilikan dasar.',
    unlocks: 'Akses kredit usaha rakyat, pupuk bersubsidi, dan program pemerintah, disertai perlindungan identitas melalui notifikasi akses.',
  },
  {
    name: 'Export-Ready',
    audience: 'Petani yang memasok pengekspor',
    requirement: 'Tambahan berupa surat tanda daftar budidaya (STDB), pemeriksaan risiko deforestasi, dan rantai verifikasi digital.',
    unlocks: 'Kesiapan memenuhi persyaratan ketertelusuran pasar ekspor serta peluang premium harga dari pembeli.',
  },
];

const VALUE_CHAIN = [
  {
    party: 'Petani berlahan kecil',
    benefit: 'Data terverifikasi milik sendiri, perlindungan identitas, akses program, dan bagian dari premium.',
    pays: 'Tidak membayar (gratis atau minimal).',
  },
  {
    party: 'Agen / Koperasi',
    benefit: 'Basis pemasok yang tercatat rapi dan proses pendataan yang jauh lebih cepat.',
    pays: 'Dapat berkontribusi sebagian.',
  },
  {
    party: 'Pengekspor',
    benefit: 'Ketertelusuran rantai pasok otomatis yang tahan pemalsuan, kepatuhan ekspor, dan penghematan biaya verifikasi.',
    pays: 'Pihak yang membayar utama.',
  },
  {
    party: 'Pembeli akhir',
    benefit: 'Bukti bahwa komoditas bebas deforestasi dan sesuai regulasi.',
    pays: 'Sumber tekanan permintaan.',
  },
];

const TECH_STACK = [
  { label: 'React + Vite + TypeScript', desc: 'Aplikasi web cepat, PWA installable' },
  { label: 'MapLibre GL + Turf.js', desc: 'Peta 3D bertekstur medan & operasi geospasial point-in-raster' },
  { label: 'IndexedDB', desc: 'Penyimpanan lokal — inti aplikasi jalan tanpa internet' },
  { label: 'crypto-js (SHA-256)', desc: 'Rantai verifikasi tamper-evident, bukan blockchain' },
  { label: 'Supabase', desc: 'Sinkronisasi terpusat lintas-agen saat online' },
  { label: 'Service Worker (PWA)', desc: 'Cache aset & data inti untuk mode lapangan' },
];

const DIFFERENTIATORS = [
  {
    title: 'Rantai verifikasi, bukan janji blockchain',
    desc: 'Kami sengaja memilih pendekatan kriptografis yang ringan dan pasti — bisa jalan tanpa internet, tanpa biaya gas, tanpa hype yang berlebihan.',
  },
  {
    title: 'Kejujuran teknis sebagai fitur',
    desc: 'Akurasi peta JRC ~91% dengan commission error ~18% diungkap terbuka di setiap kartu — bukan disembunyikan di balik klaim sempurna.',
  },
  {
    title: 'Titik, bukan poligon — dan kami bilang itu',
    desc: 'Penandaan berbasis titik (point-primary) karena sinyal GPS di bawah kanopi bisa menyimpang 3–11 meter. Keterbatasan diungkap, bukan ditutupi.',
  },
  {
    title: 'Bukan asumsi pasar',
    desc: 'Tim memiliki akses ke rantai pasok kopi nyata di Pangalengan, Bandung — lokasi uji coba yang sesungguhnya, bukan skenario di atas kertas.',
  },
];

export default function TentangKami() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    // Halaman ini dirender client-side, jadi scroll-ke-hash bawaan browser tidak
    // berjalan (elemen belum ada di DOM saat browser mencoba lompat saat load) --
    // scroll manual di sini setelah mount, baik untuk navigasi dari halaman lain
    // maupun klik Navbar saat sudah berada di "/".
    const el = document.getElementById(location.hash.slice(1));
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 via-white to-white pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 shadow-sm">
              <span aria-hidden>🌱</span>
              Dipercaya petugas koperasi &amp; penyuluh pertanian Indonesia
            </span>

            <h1 className="mt-8 text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Ubah Kebun Jadi{' '}
              <span className="bg-gradient-to-r from-brand-400 to-brand-800 bg-clip-text text-transparent">
                Identitas Data Milik Petani
              </span>
              .
            </h1>

            <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto">
              Alat bagi petugas koperasi dan penyuluh untuk melindungi identitas petani,
              membuka akses program domestik, dan menyiapkan kebun untuk pasar ekspor —
              semua bekerja tanpa internet.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:lint4ngboy@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-brand-400 to-brand-800 hover:opacity-90 transition-opacity"
              >
                Hubungi Kami untuk Kemitraan
                <span aria-hidden>↗</span>
              </a>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              Live dalam hitungan menit · Data selalu milik petani · Bekerja offline
            </p>
          </div>
        </section>

        {/* ===== MASALAH ===== */}
        <section className="border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-brand-800 tracking-wide uppercase">
              Latar Belakang
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
              Petani kecil sering tidak terbaca oleh sistem yang menentukan nasibnya.
            </h2>
            <p className="mt-6 text-slate-600 max-w-2xl leading-relaxed">
              Tanpa dokumen resmi atas kebunnya, petani berlahan kecil sulit mengakses
              kredit usaha rakyat, pupuk bersubsidi, dan pasar premium. Yang lebih
              berbahaya: ketika data tentang mereka dikuasai pihak lain, mereka bisa
              dirugikan tanpa mengetahuinya — sebagaimana pernah diberitakan kasus dugaan
              penyalahgunaan identitas ratusan petani untuk pengajuan kredit fiktif. Kami
              memakai kejadian semacam itu sebagai ilustrasi akar masalah — lemahnya
              kepemilikan dan kendali petani atas datanya sendiri — bukan klaim bahwa
              JejakHijau dapat mencegahnya secara langsung.
            </p>
            <p className="mt-4 text-slate-600 max-w-2xl leading-relaxed">
              Dari arah lain, regulasi antideforestasi Uni Eropa yang berlaku bertahap
              sejak 2025 mewajibkan data geolokasi kebun dan bukti bebas deforestasi hingga
              tingkat kebun — dan petani kopi kecil adalah mata rantai terlemah karena
              umumnya belum punya peta maupun dokumen lahan.
            </p>
          </div>
        </section>

        {/* ===== SOLUSI / KILLER FLOW ===== */}
        <section id="cara-kerja" className="border-t border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-brand-800 tracking-wide uppercase">
              Cara Kerja
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
              Enam langkah, selesai dalam hitungan menit di lapangan.
            </h2>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {KILLER_FLOW.map((item) => (
                <div
                  key={item.step}
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-brand-400 transition-colors"
                >
                  <span className="text-xs font-bold text-brand-400">{item.step}</span>
                  <h3 className="mt-2 text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FITUR PLATFORM (Eksportir & Agen) ===== */}
        <section id="fitur-platform" className="border-t border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-brand-800 tracking-wide uppercase">
              Fitur Platform
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
              Lebih dari satu kartu — dibangun untuk seluruh rantai pasok.
            </h2>
            <p className="mt-6 text-slate-600 max-w-2xl leading-relaxed">
              Enam langkah di lapangan tadi baru titik awal. Begitu data tersinkron, agen,
              eksportir, dan petani sendiri mendapat alat masing-masing untuk memakainya.
            </p>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PLATFORM_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-slate-200 p-6 hover:border-brand-400 transition-colors"
                >
                  <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== MODEL NILAI BERTINGKAT ===== */}
        <section id="model-nilai" className="border-t border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-brand-800 tracking-wide uppercase">
              Model Nilai
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
              Relevan bagi seluruh petani — bukan cuma yang berorientasi ekspor.
            </h2>

            <div className="mt-12 grid md:grid-cols-2 gap-6">
              {TIERS.map((tier) => (
                <div key={tier.name} className="rounded-2xl border border-slate-200 p-8">
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-bold">
                    {tier.name}
                  </span>
                  <p className="mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Untuk
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{tier.audience}</p>
                  <p className="mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Syarat minimal
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{tier.requirement}</p>
                  <p className="mt-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Yang dibuka
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{tier.unlocks}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== KEUNGGULAN ===== */}
        <section className="border-t border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-brand-800 tracking-wide uppercase">
              Kenapa Berbeda
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
              Sederhana dan jujur, bukan janji berlebihan.
            </h2>

            <div className="mt-12 grid sm:grid-cols-2 gap-8">
              {DIFFERENTIATORS.map((d) => (
                <div key={d.title} className="flex gap-4">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-brand-800 text-white grid place-items-center text-sm font-bold">
                    ✓
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{d.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== RANTAI NILAI / SIAPA MEMBAYAR ===== */}
        <section id="model-bisnis" className="border-t border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-brand-800 tracking-wide uppercase">
              Model Bisnis
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
              Yang membayar bukan petani miskin — melainkan pihak yang paling
              berkepentingan.
            </h2>
            <p className="mt-6 text-slate-600 max-w-2xl leading-relaxed">
              Pengekspor dan agen menghadapi tekanan kepatuhan ekspor dan butuh basis
              pemasok yang tercatat rapi — merekalah yang membayar. Petani hampir tidak
              membayar, namun memperoleh perlindungan, akses program, dan bagian dari
              premium.
            </p>

            <div className="mt-10 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b border-slate-200">
                    <th className="py-3 pr-4 font-semibold text-slate-500">Pemangku</th>
                    <th className="py-3 pr-4 font-semibold text-slate-500">
                      Manfaat yang diperoleh
                    </th>
                    <th className="py-3 font-semibold text-slate-500">Peran pembiayaan</th>
                  </tr>
                </thead>
                <tbody>
                  {VALUE_CHAIN.map((row) => (
                    <tr key={row.party} className="border-b border-slate-100">
                      <td className="py-4 pr-4 font-semibold text-slate-900 align-top whitespace-nowrap">
                        {row.party}
                      </td>
                      <td className="py-4 pr-4 text-slate-600 align-top">{row.benefit}</td>
                      <td className="py-4 text-slate-600 align-top whitespace-nowrap">
                        {row.pays}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ===== TEKNOLOGI ===== */}
        <section className="border-t border-slate-100 bg-white">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <p className="text-xs font-semibold text-brand-800 tracking-wide uppercase">
              Teknologi
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl">
              Dibangun untuk lapangan, bukan cuma demo.
            </h2>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TECH_STACK.map((tech) => (
                <div
                  key={tech.label}
                  className="bg-white rounded-xl border border-slate-200 px-5 py-4"
                >
                  <p className="text-sm font-bold text-slate-900">{tech.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{tech.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== VISI & DAMPAK ===== */}
        <section className="border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-6 py-20 text-center">
            <p className="text-xs font-semibold text-brand-800 tracking-wide uppercase">
              Visi Kami
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Kedaulatan data untuk setiap petani berlahan kecil di Indonesia.
            </h2>
            <p className="mt-6 text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Dampak yang bisa langsung diukur: berkurangnya waktu pendaftaran,
              bertambahnya petani yang tercatat dan terlindungi, serta lahirnya data
              pemasok yang sebelumnya tidak ada. Dampak jangka panjang seperti terbukanya
              akses pasar premium kami nyatakan sebagai skenario yang kami perjuangkan —
              bukan kepastian yang sudah tercapai.
            </p>
            <p className="mt-4 text-sm text-slate-400">
              Lokasi uji coba awal: sentra kopi Pangalengan, Kabupaten Bandung.
            </p>
          </div>
        </section>

        {/* ===== CTA PENUTUP ===== */}
        <section className="border-t border-slate-100 bg-gradient-to-b from-white to-brand-50/60">
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Siap mengubah kebun jadi identitas data milik petani?
            </h2>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:lint4ngboy@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-brand-400 to-brand-800 hover:opacity-90 transition-opacity"
              >
                Hubungi Kami untuk Kemitraan
                <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
