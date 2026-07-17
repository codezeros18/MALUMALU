import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  Trees, 
  MapPin, 
  Coins, 
  Users, 
  Building2, 
  BadgeCheck, 
  Lock, 
  Globe, 
  Database, 
  Smartphone, 
  Server, 
  Cpu
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const farmerHeroImage = "/src/assets/images/indonesian_farmer_hero_1784251365248.jpg";
const sadFarmerImage = "/src/assets/images/sad_indonesian_farmer_1784251831140.jpg";

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
    icon: Users,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    party: 'Agen / Koperasi',
    benefit: 'Basis pemasok yang tercatat rapi dan proses pendataan yang jauh lebih cepat.',
    pays: 'Dapat berkontribusi sebagian.',
    icon: Building2,
    color: 'bg-teal-50 text-teal-800 border-teal-200'
  },
  {
    party: 'Pengekspor',
    benefit: 'Ketertelusuran rantai pasok otomatis yang tahan pemalsuan, kepatuhan ekspor, dan penghematan biaya verifikasi.',
    pays: 'Pihak yang membayar utama.',
    icon: Coins,
    color: 'bg-brand-50 text-brand-800 border-brand-200'
  },
  {
    party: 'Pembeli akhir',
    benefit: 'Bukti bahwa komoditas bebas deforestasi dan sesuai regulasi.',
    pays: 'Sumber tekanan permintaan.',
    icon: Globe,
    color: 'bg-sky-50 text-sky-800 border-sky-200'
  },
];

const TECH_STACK = [
  { label: 'React + Vite + TypeScript', desc: 'Aplikasi web cepat, PWA installable', icon: Cpu },
  { label: 'MapLibre GL + Turf.js', desc: 'Peta 3D bertekstur medan & operasi geospasial point-in-raster', icon: Globe },
  { label: 'IndexedDB', desc: 'Penyimpanan lokal — inti aplikasi jalan tanpa internet', icon: Database },
  { label: 'crypto-js (SHA-256)', desc: 'Rantai verifikasi tamper-evident, bukan blockchain', icon: Lock },
  { label: 'Supabase', desc: 'Sinkronisasi terpusat lintas-agen saat online', icon: Server },
  { label: 'Service Worker (PWA)', desc: 'Cache aset & data inti untuk mode lapangan', icon: Smartphone },
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
} as const;

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 15
    }
  }
} as const;

export default function TentangKami() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFDFB] text-slate-800 antialiased overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {/* ===== SECTION 1: BERANDA ===== */}
        <section id="beranda" className="relative pt-44 pb-36 overflow-hidden flex items-center min-h-[90vh] bg-gradient-to-b from-[#FAFDFB] via-[#F4FAF6] to-[#FAFDFB]">
          {/* Immersive background image & elegant light overlay */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={farmerHeroImage}
              alt="Indonesian coffee farmer background"
              className="w-full h-full object-cover opacity-[0.58] brightness-[1.12] scale-105 transform transition-transform duration-[10000ms] ease-out select-none"
              referrerPolicy="no-referrer"
            />
            {/* Soft light gradient overlay to guarantee 100% text legibility and smooth blending */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FAFDFB]/75 via-[#FAFDFB]/40 to-[#FAFDFB]/95" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent via-[#FAFDFB]/40 to-[#FAFDFB] pointer-events-none" />
          </div>
          
          <div className="relative z-10 max-w-6xl mx-auto px-6 w-full text-center space-y-10 flex flex-col items-center">
            {/* Centered Heading and Subheading */}
            <motion.div 
              className="max-w-4xl mx-auto space-y-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 backdrop-blur-md shadow-sm mx-auto">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-800 tracking-wide">
                  Dipercaya Koperasi &amp; Penyuluh Indonesia
                </span>
              </div>

              <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] font-display">
                Ubah Kebun Jadi{' '}
                <span className="relative inline-block text-emerald-600">
                  Identitas Data
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-emerald-100/60 -z-10 rounded" />
                </span>{' '}
                Milik Petani.
              </h1>

              <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-sans">
                Alat revolusioner bagi petugas koperasi dan penyuluh pertanian untuk melindungi identitas petani, membuka akses program domestik, dan mempersiapkan kebun guna pasar ekspor — semuanya berfungsi <strong className="font-bold text-emerald-600">100% tanpa jaringan internet</strong>.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  to="/masuk"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
                >
                  Mulai Demo Sekarang
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="mailto:lint4ngboy@gmail.com"
                  className="inline-flex items-center gap-1.5 px-6 py-3.5 rounded-full text-sm font-bold text-slate-700 border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 bg-white/85 transition-all duration-300"
                >
                  Kemitraan
                </a>
              </div>
            </motion.div>

            {/* Premium Glassmorphic quote showing the solemn contrast of crisis */}
            <motion.div
              className="max-w-2xl bg-white/80 backdrop-blur-md border border-emerald-100/80 p-5 rounded-2xl shadow-xl text-left flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-emerald-500/30">
                <img
                  src={sadFarmerImage}
                  alt="Solemn farmer"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-sm bg-red-50 text-red-600 border border-red-100 text-[9px] font-extrabold uppercase tracking-wider">
                    Krisis Identitas Petani
                  </span>
                </div>
                <p className="text-slate-800 text-sm italic font-medium leading-relaxed">
                  "Tanpa paspor digital, kebun kami dianggap tidak sah dan rentan dieksploitasi oleh rantai pasok global."
                </p>
                <p className="text-slate-500 text-[10px] font-semibold">
                  — Kelompok Tani Kopi Pangalengan, Kabupaten Bandung Selatan
                </p>
              </div>
            </motion.div>

            {/* Quick stats on mobile / tablet / desktop bottom */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-200 max-w-3xl w-full mx-auto">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-display">100%</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Bekerja Offline</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-display">Sertifikasi</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">EUDR &amp; STDB Ready</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-display font-mono">Kriptografis</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Aman &amp; Valid</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 2: TENTANG KAMI ===== */}
        <section id="tentang-kami" className="relative py-24 border-y border-slate-100 bg-white overflow-hidden">
          <div className="absolute top-1/2 left-0 w-80 h-80 bg-emerald-50/40 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative max-w-5xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
            {/* Left: Graphic illustration / Accent */}
            <motion.div 
              className="md:col-span-5 space-y-6 order-last md:order-first"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-slate-50 border border-slate-200/60 p-8 rounded-3xl space-y-6 shadow-sm">
                <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <blockquote className="text-slate-700 font-medium italic text-base leading-relaxed">
                  "Ketika data dikuasai pihak asing tanpa persetujuan, kedaulatan petani dirampas. Kami hadir untuk memberikan kendali kedaulatan data kembali ke genggaman petani."
                </blockquote>
                <div className="border-t border-slate-200 pt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-800 text-white grid place-items-center text-xs font-bold">
                    P
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Visi Kemitraan Kopi</p>
                    <p className="text-[10px] text-slate-500">Pendampingan Petani Bandung Selatan</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Story-driven Text */}
            <motion.div 
              className="md:col-span-7 space-y-6"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
            >
              <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-bold border border-brand-200">
                Latar Belakang &amp; Visi
              </span>
              
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Petani kecil sering kali tidak terlihat oleh sistem yang menentukan nasib mereka.
              </h2>
              
              <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                <p>
                  Tanpa dokumen resmi atas lahan kebunnya, jutaan petani berlahan kecil sangat sulit mengakses kredit usaha rakyat, jatah pupuk bersubsidi, dan premi harga pasar ekspor. 
                </p>
                <p className="font-semibold text-slate-900 border-l-4 border-brand-800 pl-4 py-1">
                  Bahaya eksploitasi data: Di berbagai wilayah, data identitas petani sering kali disalahgunakan oleh pihak yang tidak bertanggung jawab demi keuntungan sepihak (seperti pengajuan kredit fiktif).
                </p>
                <p>
                  Dari arah lain, regulasi antideforestasi Uni Eropa (<strong className="font-bold text-slate-900">EUDR</strong>) mewajibkan pemetaan data geolokasi presisi bebas deforestasi tingkat kebun untuk seluruh komoditas kopi dan cokelat yang diekspor. Tanpa alat digital yang jujur, petani kecil kita akan terdepak dari rantai perdagangan global.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ===== SECTION 3: ALUR KERJA ===== */}
        <section id="alur-kerja" className="relative py-24 bg-slate-50/60 border-b border-slate-100 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 text-center space-y-4">
            <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold border border-brand-200">
              Alur Kerja
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Enam langkah digital yang instan dan akurat di lapangan.
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
              Proses pendataan super cepat oleh koperasi atau pendamping petani, bekerja andal tanpa perlu koneksi internet di pedalaman.
            </p>

            <motion.div 
              className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
            >
              {KILLER_FLOW.map((item) => (
                <motion.div
                  key={item.step}
                  variants={itemVariants}
                  className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-lg hover:border-brand-500 hover:translate-y-[-4px] transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold text-brand-800/15 font-display">{item.step}</span>
                    <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-800 grid place-items-center text-xs font-bold shadow-sm">
                      ✓
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-950 font-display">{item.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== SECTION 3B: TRANSAKSI ADIL (FAIR TRADE) ===== */}
        <section className="relative py-24 bg-white border-b border-slate-100 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6">
            
            {/* Header */}
            <div className="text-center space-y-4 max-w-3xl mx-auto mb-20">
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-100 uppercase tracking-wider">
                Transparansi &amp; Posisi Tawar Adil
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Bagaimana Indeks Harga Membantu Transaksi yang Adil (Fair Trade)
              </h2>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                Platform Agregasi menyambungkan data pasar real-time ke saku petani sehingga negosiasi tidak lagi berbasis tebakan (feeling), melainkan data nyata terverifikasi.
              </p>
            </div>

            {/* Timeline */}
            <div className="relative max-w-5xl mx-auto">
              {/* Vertical timeline line - desktop */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-100 -translate-x-1/2 hidden lg:block" />
              {/* Vertical timeline line - mobile */}
              <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-emerald-100 lg:hidden" />

              <div className="space-y-16 lg:space-y-24">
                
                {/* Step 1 */}
                <div className="relative flex flex-col lg:flex-row items-stretch">
                  {/* Left Column (Content) */}
                  <div className="w-full lg:w-1/2 lg:pr-16 text-left pl-16 lg:pl-0 flex flex-col justify-center order-2 lg:order-1">
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="space-y-3"
                    >
                      <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">
                        Langkah 1: Input Harga
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                        Pengumpulan Sumber Data Pasar
                      </h3>
                      <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                        Sistem mengumpulkan data dari dua sumber kuat: input manual transaksi deal terakhir dari agen/eksportir di lapangan, dikombinasikan dengan data eksternal acuan Asosiasi Petani, Bappebti, atau nilai ekspor rata-rata regional.
                      </p>
                    </motion.div>
                  </div>

                  {/* Circle Indicator */}
                  <div className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-2 lg:top-1/2 lg:-translate-y-1/2 z-10 flex items-center justify-center w-16 h-16 order-1 lg:order-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-lg shadow-lg shadow-emerald-800/10 border-4 border-white">
                      01
                    </div>
                  </div>

                  {/* Right Column (Spacer) */}
                  <div className="hidden lg:block w-1/2 order-3" />
                </div>

                {/* Step 2 */}
                <div className="relative flex flex-col lg:flex-row items-stretch">
                  {/* Left Column (Spacer) */}
                  <div className="hidden lg:block w-1/2 order-1" />

                  {/* Circle Indicator */}
                  <div className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-2 lg:top-1/2 lg:-translate-y-1/2 z-10 flex items-center justify-center w-16 h-16 order-1 lg:order-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-lg shadow-lg shadow-emerald-800/10 border-4 border-white">
                      02
                    </div>
                  </div>

                  {/* Right Column (Content) */}
                  <div className="w-full lg:w-1/2 lg:pl-16 text-left pl-16 lg:pl-0 flex flex-col justify-center order-2">
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="space-y-3"
                    >
                      <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">
                        Langkah 2: Agregasi
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                        Kalkulasi Indeks Referensi Harian
                      </h3>
                      <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                        Platform agregator secara otomatis menghitung indeks referensi harian yang adil yang dikelompokkan berdasarkan Komoditas (Kopi Arabika, dll.), Wilayah (Kecamatan/Kabupaten), hingga Grade/Kualitas (Premium Export-Ready).
                      </p>
                    </motion.div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex flex-col lg:flex-row items-stretch">
                  {/* Left Column (Content) */}
                  <div className="w-full lg:w-1/2 lg:pr-16 text-left pl-16 lg:pl-0 flex flex-col justify-center order-2 lg:order-1">
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="space-y-3"
                    >
                      <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">
                        Langkah 3: Akses Ganda
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                        Akses Transparan di Dua Pihak
                      </h3>
                      <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                        Output disajikan di dua titik akses utama: Agen/Petani melihat widget "Harga Hari Ini" di dashboard mereka, sementara Eksportir melihat indeks wajar wilayah pada peta sebelum mengajukan penawaran.
                      </p>
                    </motion.div>
                  </div>

                  {/* Circle Indicator */}
                  <div className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-2 lg:top-1/2 lg:-translate-y-1/2 z-10 flex items-center justify-center w-16 h-16 order-1 lg:order-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-lg shadow-lg shadow-emerald-800/10 border-4 border-white">
                      03
                    </div>
                  </div>

                  {/* Right Column (Spacer) */}
                  <div className="hidden lg:block w-1/2 order-3" />
                </div>

                {/* Step 4 */}
                <div className="relative flex flex-col lg:flex-row items-stretch">
                  {/* Left Column (Spacer) */}
                  <div className="hidden lg:block w-1/2 order-1" />

                  {/* Circle Indicator */}
                  <div className="absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-2 lg:top-1/2 lg:-translate-y-1/2 z-10 flex items-center justify-center w-16 h-16 order-1 lg:order-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-lg shadow-lg shadow-emerald-800/10 border-4 border-white">
                      04
                    </div>
                  </div>

                  {/* Right Column (Content) */}
                  <div className="w-full lg:w-1/2 lg:pl-16 text-left pl-16 lg:pl-0 flex flex-col justify-center order-2">
                    <motion.div
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="space-y-3"
                    >
                      <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase tracking-wide">
                        Langkah 4: Negosiasi Adil
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                        Posisi Tawar Kuat &amp; Berkelanjutan
                      </h3>
                      <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                        Sebelum merespons tawaran eksportir, petani sudah tahu kisaran harga wajar kopi grade bersangkutan di wilayah mereka (misal: Rp 58k-64k/Kg). Jika tawaran di bawah itu, petani mengajukan counter-bid dengan landasan data nyata.
                      </p>
                    </motion.div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Dark Green Banner Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-24 max-w-5xl mx-auto rounded-3xl bg-[#004D40] text-white p-8 sm:p-12 text-left relative overflow-hidden shadow-xl"
            >
              <div className="absolute right-0 bottom-0 w-96 h-96 bg-emerald-800/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <span className="inline-block px-3 py-1 rounded-md bg-emerald-900/60 border border-emerald-700 text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest">
                  Siklus Aliran Data (Flow) Sebelum ke Peta
                </span>
                <h3 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight">
                  Menghubungkan Kepercayaan Pasar dengan Kesejahteraan Lapangan
                </h3>
                <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
                  Eksportir membuka peta → melihat lahan petani terdekat yang berstatus <strong className="font-bold text-white">Full-Verified (Rendah Risiko Deforestasi)</strong> → Eksportir menawar harga. Sebelum disetujui, petani sudah mengetahui batas bawah harga wajar regional. Negosiasi berjalan adil, menghasilkan kepastian transaksi luring yang aman, bebas manipulasi tengkulak, dan siap diekspor ke pelabuhan kargo internasional.
                </p>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ===== SECTION 4: UNTUK SIAPA ===== */}
        <section id="untuk-siapa" className="relative py-24 bg-white border-b border-slate-100 overflow-hidden">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-50/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
            <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-bold border border-brand-200">
              Kategori &amp; Pengguna
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Model Nilai Bertingkat untuk Semua Petani.
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
              Platform kami dirancang relevan dan berdaya guna tinggi bagi seluruh golongan petani — baik mitra lokal maupun yang berfokus ekspor global.
            </p>

            <div className="mt-16 grid md:grid-cols-2 gap-8 text-left">
              {/* Card 1: Lokal */}
              <motion.div 
                className="rounded-3xl border border-slate-200 p-8 bg-white relative overflow-hidden flex flex-col justify-between group hover:border-slate-300 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                      {TIERS[0].name}
                    </span>
                    <BadgeCheck className="text-slate-400" size={24} />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Sasaran</p>
                    <p className="text-base font-bold text-slate-900">{TIERS[0].audience}</p>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Syarat Minimal</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{TIERS[0].requirement}</p>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Akses yang Dibuka</p>
                    <p className="text-sm text-slate-700 font-semibold leading-relaxed">{TIERS[0].unlocks}</p>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Export Ready */}
              <motion.div 
                className="rounded-3xl border-2 border-brand-800 p-8 bg-white relative overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-300 group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="absolute top-0 right-0 bg-brand-800 text-white text-[10px] font-extrabold uppercase px-6 py-1.5 rounded-bl-2xl tracking-wider">
                  Kesiapan Ekspor
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-bold border border-brand-200">
                      {TIERS[1].name}
                    </span>
                    <BadgeCheck className="text-brand-800" size={24} />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-brand-800 uppercase tracking-wide">Target Sasaran</p>
                    <p className="text-base font-bold text-slate-900">{TIERS[1].audience}</p>
                  </div>

                  <div className="space-y-2 border-t border-brand-100 pt-4">
                    <p className="text-[10px] font-bold text-brand-800 uppercase tracking-wide">Syarat Minimal</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{TIERS[1].requirement}</p>
                  </div>

                  <div className="space-y-2 border-t border-brand-100 pt-4">
                    <p className="text-[10px] font-bold text-brand-800 uppercase tracking-wide">Akses yang Dibuka</p>
                    <p className="text-sm text-brand-900 font-bold leading-relaxed">{TIERS[1].unlocks}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 5: HARGA ===== */}
        <section id="harga" className="relative py-24 bg-slate-50/60 border-b border-slate-100 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
            <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold border border-brand-200">
              Model Keadilan &amp; Harga
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Didanai oleh Eksportir — 100% Gratis untuk Petani Kecil.
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
              Rantai pasok global harus didasarkan pada keadilan. Petani kecil tidak boleh dibebani biaya birokrasi, pengekspor yang membutuhkan sertifikat patuh yang mendanainya.
            </p>

            <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {VALUE_CHAIN.map((row, idx) => {
                const IconComponent = row.icon;
                return (
                  <motion.div
                    key={row.party}
                    className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                  >
                    <div className="space-y-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${row.color}`}>
                        <IconComponent size={20} />
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peran</p>
                        <h4 className="text-base font-bold text-slate-950">{row.party}</h4>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{row.benefit}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Biaya Pembiayaan</p>
                      <p className="text-sm font-extrabold text-brand-800 mt-0.5">{row.pays}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Premium detailed table view */}
            <div className="mt-16 overflow-hidden border border-slate-200 rounded-2xl shadow-md bg-white">
              <div className="p-5 border-b border-slate-200 bg-slate-50 text-left">
                <h4 className="text-sm font-bold text-slate-900">Tabel Rincian Kontribusi Nilai</h4>
                <p className="text-xs text-slate-500">Transparansi rantai pembayaran dan kontribusi setiap entitas.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200 text-xs uppercase bg-slate-50/50">
                      <th className="py-3 px-6 font-semibold">Pemangku Kepentingan</th>
                      <th className="py-3 px-6 font-semibold">Manfaat yang Diperoleh</th>
                      <th className="py-3 px-6 font-semibold">Biaya Pembiayaan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VALUE_CHAIN.map((row) => (
                      <tr key={row.party} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                          {row.party}
                        </td>
                        <td className="py-4 px-6 text-slate-600 leading-relaxed text-xs sm:text-sm">{row.benefit}</td>
                        <td className="py-4 px-6 text-brand-800 font-bold whitespace-nowrap text-xs sm:text-sm">
                          {row.pays}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 6: KEUNGGULAN (STAYS, BUT POLISHED) ===== */}
        <section className="relative py-24 bg-white border-b border-slate-100 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
            <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-bold border border-brand-200">
              Kejujuran Teknis
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Sederhana dan Jujur, Bukan Janji Berlebihan.
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
              Kami menyajikan fakta teknis apa adanya tanpa hiperbola atau jargon blockchain yang dipaksakan.
            </p>

            <div className="mt-16 grid sm:grid-cols-2 gap-8 text-left">
              {DIFFERENTIATORS.map((d) => (
                <div key={d.title} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50/80 transition-colors">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-brand-800 text-white grid place-items-center text-sm font-bold shadow-sm shadow-brand-800/10">
                    ✓
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">{d.title}</h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed font-sans">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SECTION 7: TEKNOLOGI (STAYS, BUT POLISHED) ===== */}
        <section className="relative py-24 bg-slate-50/60 border-b border-slate-100 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
            <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold border border-brand-200">
              Teknologi Andalan
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Dibangun untuk Lapangan, Bukan Cuma Demo.
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
              Kombinasi teknologi mutakhir untuk memastikan aplikasi bekerja mulus di daerah blankspot hutan kopi.
            </p>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {TECH_STACK.map((tech) => {
                const IconComponent = tech.icon;
                return (
                  <div
                    key={tech.label}
                    className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-lg transition-all duration-300 space-y-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center">
                      <IconComponent size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900 font-display">{tech.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">{tech.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== SECTION 8: VISI & DAMPAK (STAYS, BUT POLISHED) ===== */}
        <section className="relative py-24 bg-white border-b border-slate-100 text-center overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-bold border border-brand-200">
              Visi Kami
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Kedaulatan data untuk setiap petani berlahan kecil di Indonesia.
            </h2>
            <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto text-sm sm:text-base">
              Dampak yang bisa langsung diukur: berkurangnya waktu pendaftaran, bertambahnya petani yang tercatat dan terlindungi, serta lahirnya data pemasok yang sebelumnya tidak ada. Dampak jangka panjang seperti terbukanya akses pasar premium kami nyatakan sebagai skenario yang kami perjuangkan — bukan kepastian yang sudah tercapai.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 shadow-sm mt-4">
              <MapPin size={14} className="text-brand-800" />
              Lokasi Uji Coba: Sentra Kopi Pangalengan, Kabupaten Bandung, Jawa Barat.
            </div>
          </div>
        </section>

        {/* ===== SECTION 9: CTA PENUTUP (STAYS, BUT POLISHED) ===== */}
        <section className="relative py-24 bg-gradient-to-b from-white to-brand-50/40">
          <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Siap mengubah kebun jadi identitas data milik petani?
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm sm:text-base">
              Bergabunglah bersama kami membangun sistem keadilan data dari tingkat akar rumput terkecil Indonesia.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/masuk"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-brand-800 hover:from-brand-800 hover:to-brand-800 shadow-lg shadow-brand-800/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
              >
                Mulai Demo Sekarang
                <ArrowRight size={16} />
              </Link>
              <a
                href="mailto:lint4ngboy@gmail.com"
                className="inline-flex items-center px-8 py-4 rounded-full text-sm font-bold text-slate-700 border border-slate-200 hover:border-brand-400 hover:bg-white bg-slate-50/50 transition-all duration-300"
              >
                Hubungi Kami
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
