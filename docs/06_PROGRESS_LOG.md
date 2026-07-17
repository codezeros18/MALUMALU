# 📖 PROGRESS LOG — JejakHijau v2 (Sprint 0–22)

> Dokumentasi naratif dari semua yang sudah dikerjakan. Tujuannya: supaya sesi Claude
> Code manapun (baru, reset, atau dilanjutkan orang lain) bisa paham state repo saat ini
> **tanpa perlu re-derive dari nol**.
>
> Gaya penulisan: apa yang dibangun → keputusan/deviasi penting + alasannya → hasil
> verifikasi nyata (bukan cuma "tsc bersih") → state akhir.
>
> **Bagian Sprint 0–8** di bawah ini adalah log asli akhir fase MVP (sebelum Supabase
> ada). Sprint 9–15 (full production: sync, 3 role, komponen reusable), Sprint 16–17
> (dokumen verifikasi + panel Eksportir), dan Sprint 18–22 (audit + polygon risk-score +
> harga referensi + RLS hardening + WA bot hardening) ditambahkan berurutan di bagian
> bawah — lihat `docs/04_FULL_PRODUCTION_BLUEPRINT.md`/`docs/05_FULL_PRODUCTION_PROMPTS.md`,
> `docs/07_DOKUMEN_VERIFIKASI_BLUEPRINT.md`/`docs/08_DOKUMEN_VERIFIKASI_PROMPTS.md`, dan
> `docs/09_UPGRADE_BLUEPRINT.md`/`docs/10_UPGRADE_PROMPTS.md` untuk detail teknis lengkap
> masing-masing fase. Ringkasan penutup fase upgrade: bagian "Ringkasan Sprint 18–22" di
> bawah.

---

## Sprint 0 — Kickoff

Baca `00_START_HERE.md`, `docs/01_BLUEPRINT_FULL.md`, `docs/02_TECH_ARCHITECTURE.md`,
`docs/03_MVP_SCOPE.md`, `TRACKER.md`. Dikonfirmasi paham: produk (PWA offline-first
untuk petugas koperasi/penyuluh), killer flow 6 langkah, tech stack (React+Vite+TS,
Tailwind, Leaflet, turf, geotiff, idb, crypto-js, vite-plugin-pwa), struktur folder +
aturan anti-konflik FS/AI, prinsip offline-first/deterministik/hash-chain-bukan-
blockchain/point-primary/disclose-keterbatasan/MVP-dulu.

Role dipilih: **Fullstack (FS)** untuk sesi ini (mengerjakan Sprint 1,2,4,6,7,8) —
Sprint 3 dan 5 (AI Engineer) juga dieksekusi di sesi yang sama secara berurutan karena
satu operator mengontrol kedua role di sesi ini (bukan dua instance paralel), tapi
aturan "hanya sentuh file sesuai role" tetap dipatuhi per-sprint.

**Keputusan penting sebelum mulai**: repo git di `d:\malumalu` (remote
`codezeros18/MALUMALU`) sudah punya history sebelum kickoff (`beb6685 Initial commit`,
`bb4ac25 done`) — BUKAN commit pertama blank seperti disyaratkan aturan lomba. User
memutuskan **lanjut apa adanya di atas history yang ada** (bukan reset/rewrite),
dikonfirmasi eksplisit lewat pertanyaan pilihan sebelum Sprint 1 dimulai.

---

## Sprint 1 — Setup & Foundation

**Dibangun**: Scaffold Vite+React+TS (di-scaffold ke folder scratch dulu lalu file
digabung ke root supaya tidak menimpa file blueprint), Tailwind v3 (classic
`tailwind.config.js`+`postcss.config.js`, BUKAN Tailwind v4 walau sempat ter-cache di
npm), struktur folder lengkap sesuai `docs/02_TECH_ARCHITECTURE.md` dengan file
placeholder bertag owner/sprint, `src/types/index.ts` lengkap (kontrak: Petani, Plot,
DeforestasiCheck, Kartu, HashChainEntry, ConsentRecord, AccessLog, NotifItem), routing
3 halaman (Home/PetaniList/PlotDetail), `vite-plugin-pwa` dasar.

**Deviasi/insiden penting**:
- **`registry.npmjs.org` diblokir di jaringan** (SNI-level, dikonfirmasi lewat `curl
  --resolve` yang tetap timeout walau IP benar) — bukan masalah DNS/proxy biasa.
  Workaround: `.npmrc` project di-set ke `registry=https://registry.npmmirror.com`
  (mirror publik yang terjangkau). Ini **tetap berlaku** untuk sprint-sprint
  selanjutnya — kalau jaringan resmi sudah normal, `.npmrc` ini boleh dihapus, tapi
  JANGAN dihapus otomatis tanpa mengecek dulu koneksi ke registry asli sudah pulih.
- Install sempat gagal separuh jalan (ECONNRESET) tanpa exit-code yang jujur karena
  di-pipe ke `tail` (menyembunyikan kegagalan asli) — pelajaran: jangan pipe output
  `npm install` ke `tail` kalau ingin exit code akurat.

**Verifikasi nyata**: `npm run dev` jalan tanpa error, `npx tsc -b --noEmit` bersih,
`npm run build` sukses dengan PWA precache aktif.

---

## Sprint 2 — Data Layer

**Dibangun** (`src/lib/db.ts`): `getDB()` singleton `openDB<PasporPetaniDB>` dengan 7
object store (petani, plot, kartu, hashchain, consent, accessLog, notif) + semua index
sesuai spesifikasi. CRUD lengkap per entity, semua async+try/catch, error di-rethrow
sebagai `Error` beraturan (bukan silent fail — data inti). `src/lib/storage.ts`
(wrapper localStorage, *soft-fail* karena cuma untuk flags kecil, beda filosofi dari
db.ts yang *hard-fail*). `src/hooks/useOnlineStatus.ts`.

**Verifikasi nyata**: `npx tsc -b --noEmit` dan `npm run build` bersih (belum ada
browser test di sprint ini karena belum ada UI yang memakainya).

---

## Sprint 3 — Geospatial Core (role AI, dieksekusi sesi sama)

**Dibangun**: `src/lib/gps.ts` (`getCurrentPosition`, `watchPosition`, `clearWatch`).
Raster: **JRC GFC2020 asli belum sempat diproses** dalam waktu terbatas — dipakai
raster **tiruan berlabel jelas** via `scripts/generate-raster.mjs` (grid 100x100, bbox
Pangalengan `[107.55, -7.20, 107.70, -7.10]`, 4 kantong "hutan" berbentuk blob
melingkar, ~8.3% sel=hutan). Hasil `public/rasters/pangalengan.json` memuat field
`note` eksplisit "DATA ILUSTRATIF UNTUK DEMO" (disclosure menempel di data, bukan cuma
komentar kode). `src/lib/raster.ts` (`loadRaster`, singleton cache in-memory).
`src/lib/geospatial.ts` (`pointToPixel`, `getRasterValue`, `cekDeforestasi(lat, lng,
plotId?)` — nilai hutan → **`perlu-audit`** BUKAN langsung tolak, karena commission
error 18%; non-hutan → `aman`; luar bbox/no-data → `perlu-audit`).

**Deviasi kecil**: signature `cekDeforestasi` menambah parameter ketiga opsional
`plotId = ''` (spek awal cuma sebut `cekDeforestasi(lat,lng)`) supaya
`DeforestasiCheck.plotId` (field wajib di kontrak tipe) bisa terisi benar saat dipanggil
FS di Sprint 4/6 dengan menyertakan `plot.id`.

**Verifikasi nyata**: 3 titik contoh dihitung manual lewat Node dan cocok 100% dengan
ekspektasi — aman (`-7.1055, 107.55825` → rasterValue 0), perlu-audit (`-7.1755,
107.61825` → rasterValue 1), luar bbox (`-6.90, 106.80` → null). `npx tsc -b --noEmit`
dan `npm run build` bersih (raster JSON otomatis ikut precache PWA).

---

## Sprint 4 — Map UI & Plot Tagging

**Dibangun**: `src/hooks/useGeolocation.ts`. `src/lib/db.ts` ditambah `listAllPlot()`
(untuk render semua marker — di luar spek awal yang cuma minta `listPlotByPetani`,
ditambah karena Home butuh lihat SEMUA plot lintas-petani untuk peta). `MapView.tsx`
(Leaflet center Pangalengan, tap-to-pick koordinat via `useMapEvents`, fallback grid
CSS+badge saat offline — tile OSM disembunyikan total saat offline, bukan dibiarkan gagal
fetch berulang). `PlotForm.tsx` (nama wajib, GPS button, warning akurasi >20m).
`Home.tsx` sebagai container penuh (gabung GPS/tap → `addPetani` → `addPlot` → simpan
`active-petani-id`/`active-plot-id` ke storage).

**Verifikasi nyata (Playwright + Chrome headless, browser sungguhan bukan simulasi)**:
tap peta → koordinat muncul di form → isi nama → simpan → pesan sukses + marker
bertambah → **dicek langsung ke IndexedDB dari browser**, data benar-benar tersimpan
dengan nilai yang cocok. Tombol GPS diuji dengan geolocation di-mock (lat/lng/akurasi
35m) → koordinat+akurasi tampil, warning akurasi rendah muncul (>20m threshold). Nol
console error di semua skenario.

---

## Sprint 5 — Rule Engine & Kartu (role AI, dieksekusi sesi sama)

**Dibangun** (`src/lib/ruleEngine.ts`, pure functions, tanpa `Math.random`/`Date.now`
di logika keputusan): `tentukanTier(input): Tier`, `tentukanStdbStatus(input): {status,
alasan}`, `generateKartu(params): Kartu` (hashChainRef sengaja `''`, diisi Sprint 6).
`src/lib/ruleEngine.test-cases.ts` — file self-check yang **bisa dijalankan langsung**
via `node src/lib/ruleEngine.test-cases.ts` (Node 24 native TS type-stripping, import
pakai ekstensi `.ts` eksplisit — pengecualian sengaja dari konvensi umum proyek, cuma
untuk file ini).

**Verifikasi nyata**: 3 skenario dijalankan sungguhan (bukan cuma ditulis) —
Kasus A (lengkap+STDB+aman) → `export-ready`+`stdb-ready` ✅; Kasus B (tanpa
STDB+perlu-audit) → `lokal`+`stdb-ready` dengan alasan audit ✅; Kasus C (nama
kosong+berisiko) → `lokal`+`belum-lengkap` dengan 3 alasan kekurangan ✅. Uji
determinisme (input identik dua kali) → tier/stdbStatus/alasan identik (cuma id/
createdAt beda, sesuai spek). Semua PASS di output riil.

---

## Sprint 6 — Hash-Chain (Tamper-Evident)

**Dibangun** (`src/lib/hashchain.ts`): `sha256`, `computeDataHash` (pakai *stable
stringify* rekursif — kunci objek diurutkan, supaya payload semantik-sama selalu hash
sama), `computeEntryHash`, `appendEntry`, `verifyChain` (replay dari genesis),
`simulateTamper`/`restoreEntry` (KHUSUS demo), `commitKartu(kartu)`.
`src/components/HashChainViewer.tsx` (list entri, Verifikasi/Simulasi tamper/Reset
demo, hijau/merah). `src/components/KartuCard.tsx` (tier badge, stdbStatus, alasan,
disclosure). `src/pages/PlotDetail.tsx` diwire penuh (load plot+petani → toggle
STDB/klaim → generate+commit kartu → tampilkan KartuCard+HashChainViewer). Link dari
Home ke PlotDetail ditambah (sebelumnya tidak terjangkau dari UI).

**Deviasi penting + alasan**: spek asli bilang commitKartu "simpan kartu via addKartu",
tapi `addKartu` (Sprint 2) **selalu generate `id`/`createdAt` baru** — tidak cocok untuk
kartu yang `id`-nya sudah dibuat `generateKartu` (Sprint 5). Ditambahkan **`putKartu()`**
dan **`putHashEntryRaw()`** di `db.ts` — *raw upsert* yang mempertahankan `id` apa
adanya, dipakai `commitKartu` dan (khusus) `simulateTamper`/`restoreEntry`.

**Verifikasi nyata (Playwright)**: buat kartu → commit → **Verifikasi Rantai → "✔
Rantai utuh"** → **Simulasi ubah data → otomatis "✖ Rantai rusak di entri #0"**
(screenshot dicek, merah jelas) → **Reset demo → "✔ Rantai utuh" lagi**. Nol console
error.

---

## Sprint 7 — Consent & Notif

**Dibangun**: `src/lib/consent.ts` (`grantConsent`, `revokeConsent`,
`listActiveConsents`, `isAuthorized` case-insensitive, `attemptAccess` — catat
`AccessLog` selalu, `NotifItem` severity `alert` kalau tidak authorized).
`src/context/AppContext.tsx` (`AppProvider`+`useAppContext`: `notifVersion`+
`refreshNotif()` — mekanisme refresh lintas-komponen tanpa Redux, dipakai supaya
`NotifBanner` langsung update begitu `ConsentPanel` memicu `attemptAccess`).
`NotifBanner.tsx` (banner sticky, severity-colored, markNotifRead). `ConsentPanel.tsx`
(preset pihak, custom, scope, daftar aktif+revoke, demo "Simulasikan akses"). Override
manual di `KartuCard.tsx` (form koreksi tier/stdbStatus+alasan wajib → **reuse
`commitKartu`** dari Sprint 6, BUKAN logika hash-chain baru — override otomatis
ter-append ke rantai). `NotifBanner` diintegrasi ke `App.tsx` (global, semua halaman).

**Verifikasi nyata (Playwright)**: grant consent "Bank" → `attemptAccess("Bank")` →
**authorized, TANPA notif** ✅ → `attemptAccess("Orang Asing")` → **DITOLAK + banner
merah otomatis muncul** ("Akses tanpa izin terdeteksi...") ✅ → dismiss → hilang ✅.
Override manual → alasan baru tampil, hash-chain bertambah dari 1→**2 entri**,
`verifyChain()` tetap "Rantai utuh" ✅. Nol console error.

---

## Sprint 8 — Offline, Polish, Deploy

**Dibangun**: PWA manifest lengkap (`vite.config.ts` — icon 192/512 PNG dibuat manual
via `scripts/generate-icons.mjs`, PNG encoder murni Node/zlib TANPA dependency gambar
baru, hijau brand+lingkaran pin putih; `workbox.globPatterns` mencakup
`ico,svg,png,json` sehingga `pangalengan.json` ikut precache — dikonfirmasi ada di
`dist/sw.js`). `src/components/OfflineIndicator.tsx` (🟢/🔴 di header). `src/data/
dummyData.ts` (3 petani/plot Pangalengan — Bu Ani/Pak Ujang/Pak Dedi, koordinat
sengaja dipilih supaya mencakup status "aman" DAN "perlu-audit"; `seedDummyData()`
idempoten, tombol manual "Muat data demo"; badge "DATA DEMO" via `isDemoPlot()`, id
demo disimpan di localStorage). Bagian collapsible "Tentang akurasi" di Home (disclosure
lengkap: JRC ~91%/commission error 18%, point-primary, hash-chain bukan blockchain,
data demo berlabel). `vercel.json` (rewrite SPA fallback ke `index.html`).

**Verifikasi nyata paling ketat di seluruh fase MVP** — full offline end-to-end pakai
`npm run build` + `npm run preview` (bukan `npm run dev`) + Playwright:
1. Service worker ter-install & aktif, halaman ter-*controlled*.
2. Muat data demo (online) → **matikan network sepenuhnya** → reload → app shell
   tetap tampil, badge 🔴 Offline, peta jadi grid placeholder + tap tetap jalan.
3. 3 plot demo tetap terlihat (IndexedDB lokal, tidak terpengaruh network).
4. **Buat & Commit Kartu OFFLINE** — `cekDeforestasi` fetch raster dari cache SW,
   `generateKartu`, `commitKartu` semua sukses tanpa internet.
5. **Verifikasi Rantai OFFLINE** → "Rantai utuh".
6. **Consent + notif OFFLINE** → grant Bank, simulasi akses "Penyusup" → banner merah
   muncul, semua tanpa internet.
7. Nol console error di seluruh alur offline.

---

## State Akhir Repo — Akhir Fase MVP (baseline untuk Sprint 9)

### Struktur `src/` saat ini
```
src/
├── App.tsx                      (routing + layout + NotifBanner + OfflineIndicator)
├── main.tsx                     (BrowserRouter + leaflet.css import)
├── index.css                    (tailwind directives)
├── types/index.ts               (kontrak: Petani, Plot, DeforestasiCheck, Kartu,
│                                  HashChainEntry, ConsentRecord, AccessLog, NotifItem)
├── lib/
│   ├── db.ts                    (IndexedDB, semua CRUD + putKartu + putHashEntryRaw + listAllPlot)
│   ├── storage.ts                (localStorage wrapper, soft-fail)
│   ├── hashchain.ts              (sha256, appendEntry, verifyChain, commitKartu, simulateTamper/restoreEntry)
│   ├── consent.ts                (grantConsent, revokeConsent, isAuthorized, attemptAccess)
│   ├── gps.ts                    (getCurrentPosition, watchPosition)
│   ├── raster.ts                 (loadRaster)
│   ├── geospatial.ts              (pointToPixel, getRasterValue, cekDeforestasi)
│   └── ruleEngine.ts + ruleEngine.test-cases.ts (tentukanTier, tentukanStdbStatus, generateKartu)
├── hooks/
│   ├── useGeolocation.ts
│   └── useOnlineStatus.ts
├── context/AppContext.tsx        (notifVersion, refreshNotif)
├── components/
│   ├── MapView.tsx, PlotForm.tsx, KartuCard.tsx, HashChainViewer.tsx,
│   │   ConsentPanel.tsx, NotifBanner.tsx, OfflineIndicator.tsx
├── pages/Home.tsx, PetaniList.tsx (masih placeholder), PlotDetail.tsx
└── data/dummyData.ts             (seedDummyData, isDemoPlot)
```

### Dependency terpasang (`package.json`)
Runtime: `@turf/turf`, `crypto-js`, `geotiff` (BELUM benar-benar dipakai — raster masih
JSON grid custom, bukan GeoTIFF asli), `idb`, `leaflet`, `nanoid`, `react`, `react-dom`,
`react-leaflet`, `react-router-dom`. Dev: `@types/*`, `@vitejs/plugin-react`,
`autoprefixer`, `oxlint`, `postcss`, `tailwindcss` (v3, BUKAN v4), `typescript`, `vite`,
`vite-plugin-pwa`.

### Belum dibuat (jangan diasumsikan ada saat Sprint 9)
- Tidak ada backend/server apa pun — 100% client-side.
- Tidak ada auth/role — satu "pengguna" implisit (petugas/Agen).
- `src/pages/PetaniList.tsx` masih placeholder kosong dari Sprint 1.
- `@turf/turf` dan `geotiff` terpasang tapi belum benar-benar dipakai secara aktif
  (raster masih format JSON grid custom buatan sendiri, bukan file GeoTIFF asli
  dibaca lewat `geotiff.js`).
- `.npmrc` masih mengarah ke `registry.npmmirror.com` (workaround Sprint 1) — cek dulu
  apakah `registry.npmjs.org` sudah bisa diakses sebelum menghapusnya.
- Repo git: history sudah ada sebelum kickoff (bukan blank-first-commit), berjalan
  dengan commit-commit manual oleh user sepanjang sesi (`bb4ac25`...dst, pesan generik
  "done") — commit/push/pull selalu dilakukan manual oleh user, bukan oleh AI.

---

## Sprint 9–15 — Full Production (ringkasan)

Fase ini membalik keputusan MVP "DI-CUT TOTAL: backend server" secara sadar (dinyatakan
terbuka di `docs/04_FULL_PRODUCTION_BLUEPRINT.md` §0) untuk menambah Supabase (Postgres)
sebagai backend terpusat di atas fondasi offline-first yang sudah ada, tanpa mengganti
alur inti Agen yang sudah terverifikasi MVP.

**Dibangun** (ringkas — detail teknis penuh + prompt tiap sprint ada di `docs/04` dan
`docs/05`): Sprint 9 setup Supabase + schema + `lib/supabaseClient.ts` + field sync
opsional di `types/index.ts`. Sprint 10 sync engine outbox-pattern (`lib/sync.ts`,
`syncQueue` di `db.ts`, badge status per-record). Sprint 11 demo role-selector auth
(`AppContext.currentRole`, `RequireRole`, routing `/agen` `/petani` `/eksportir`).
Sprint 12 sistem komponen reusable (`components/ui/*`: Button, Card, Badge, Input,
Select, Textarea, Checkbox, EmptyState) + migrasi komponen existing ke primitif ini.
Sprint 13 `EksportirDashboard.tsx` (baca langsung Supabase, online-only, filter
tier/STDB/pencarian, drill-in `KartuCard`+`HashChainViewer` read-only). Sprint 14
`PetaniPortal.tsx` (lookup by email, lihat kartu sendiri, cabut consent sendiri, ekspor
PDF via `@media print`). Sprint 15 polish + hardening + full regression rehearsal.

**Deviasi/temuan penting**:
- **Sync-ordering bug** (Sprint 10): `listSyncQueue()` awalnya urut by-key (acak),
  bukan by-`createdAt` — menyebabkan `kartu` sinkron sebelum `plot` induknya ada di
  Supabase (FK violation). Fix: sort by `createdAt` ascending.
- **Hash-chain verification scope** (Sprint 13): sempat mau verifikasi hash-chain
  ter-filter per-`kartuId` — SALAH secara arsitektur (subset per-kartu tidak akan match
  GENESIS kalau ada entity lain dibuat lebih dulu di device yang sama). Fix: group &
  verifikasi per-`agentId`, didokumentasikan sebagai catatan integritas permanen di
  `docs/04` §1.
- **Sync retry storm** (pasca-Sprint-15, bug nyata dari user): item sync yang gagal
  permanen (orphan/rusak) retry setiap ~30 detik selamanya, membanjiri console dengan
  FK-violation error yang sama. Fix: `MAX_AUTO_RETRY_ATTEMPTS = 5` di `lib/sync.ts`,
  `markSyncConflict()` di `db.ts` (berhenti + tandai `syncStatus:'conflict'`), tombol
  manual "Coba lagi" via `requeueForSync()`.
- **Routing UX** (koreksi user pasca-Sprint-15): `/` awalnya langsung ke Login — user
  minta Beranda tampil sebagai landing page (`TentangKami.tsx`, company profile
  bergaya landing page SaaS modern), Login dipindah ke `/masuk`, tombol "Mulai"
  dihapus (hanya "Masuk").

**Verifikasi nyata**: setiap sprint diverifikasi Playwright + Chrome headless (bukan
cuma `tsc`/`build`), termasuk regresi lintas-sprint (mis. Sprint 15 = satu alur offline
utuh Agen dari MVP + 3 role + sync, dijalankan ulang penuh untuk pastikan nol regresi).
State akhir setelah Sprint 15: 3 role penuh berfungsi, sync outbox-pattern stabil dengan
retry-cutoff, komponen UI reusable dipakai konsisten di 3 dashboard.

---

## Sprint 16 — Dokumen Petani Terverifikasi

**Kenapa**: user mengajukan fitur ini lewat sesi Plan Mode eksplisit — meminta dinilai
dulu apakah melenceng dari tesis proyek sebelum dibangun. Verdict: **tidak melenceng**,
karena proposal asli sudah menjanjikan "peluang premium harga dari pembeli" untuk tier
Export-Ready — daftar dokumen EUDR (identitas/legalitas lahan/data teknis kebun/dokumen
pendukung) yang user riset memetakan langsung ke syarat itu. Detail penuh verdict +
keputusan desain ada di `docs/07_DOKUMEN_VERIFIKASI_BLUEPRINT.md` §0.

**Dibangun**: `DocumentType`+`PetaniDocument` di `types/index.ts` (10 tipe dokumen,
field `fileHash` bukan file). Store `petaniDocument` di `db.ts` (`DB_VERSION` 2→3,
migration guard) + CRUD. `petaniDocument` diwire ke `lib/sync.ts` (map ke tabel
Supabase `petani_document`, hanya kolom metadata+hash, TANPA kolom file/blob).
`src/lib/documents.ts` (BARU): `hashFile()` pakai Web Crypto API
(`crypto.subtle.digest`, bukan `crypto-js` yang sudah dipakai hash-chain — dipilih
karena lebih cocok untuk file besar), `registerDocument()` reuse penuh
`appendEntry()` dari `lib/hashchain.ts` Sprint 6 (setiap dokumen = 1 entri hash-chain
baru, TIDAK ada fungsi hash-chain paralel). `getDocumentCompleteness()` +
`REQUIRED_DOCUMENT_TYPES` (`ktp`, `bukti-kepemilikan-lahan`, `stdb`) ditambah ke
`lib/ruleEngine.ts` sebagai fungsi PURE terpisah — `tentukanTier()`/
`tentukanStdbStatus()` (Sprint 5) **tidak disentuh sama sekali**.
`src/components/DocumentUpload.tsx` (BARU): 10 tipe dokumen dikelompokkan 4 kategori
(Identitas/Legalitas Lahan/Data Teknis Kebun/Dokumen Pendukung), badge status per baris
(Belum ada/Tersimpan lokal/Tersinkron/Terverifikasi), upload native
`<input type="file" capture="environment">` (offline, zero dependency kamera baru),
badge ringkasan "Berkas Lengkap"/"Berkas Belum Lengkap" di header. Diwire ke
`PlotDetail.tsx` di bawah `ConsentPanel`. Tabel Supabase `petani_document` + RLS
permisif (`demo_allow_all`, pola identik tabel lain sejak Sprint 9) dijalankan manual
oleh user di SQL Editor.

**Verifikasi nyata (Playwright, build+preview bukan dev)**: `ruleEngine.test-cases.ts`
di-re-run setelah `getDocumentCompleteness` ditambah — **semua skenario existing tetap
PASS** (regresi nol ke logika tier/STDB). Offline: buat plot+kartu → unggah KTP+bukti
kepemilikan lahan+STDB (dummy file) → badge **"Berkas Belum Lengkap" → "Berkas
Lengkap"** → hash-chain bertambah **tepat 3 entri** → **"Verifikasi Rantai" tetap
"Rantai utuh"** (regresi hash-chain nol). Online: sinkron → dikonfirmasi LANGSUNG lewat
Supabase REST API (bukan cuma percaya IndexedDB) — **3 baris muncul, hanya
metadata+hash, tidak ada kolom file/blob**. Nol console error.

---

## Sprint 17 — Panel "Petani Terverifikasi Terdekat" (Eksportir)

**Kenapa**: pemenuhan langsung janji "Rantai Nilai" proposal asli — Eksportir butuh
"ketertelusuran rantai pasok otomatis" dan "basis pemasok yang tercatat rapi". Dikerjakan
SETELAH Sprint 16 terverifikasi penuh (keputusan bertahap, dikonfirmasi user di sesi
Plan Mode yang sama dengan Sprint 16).

**Dibangun**: `src/components/NearbyMap.tsx` (BARU, terpisah dari `MapView.tsx`) — klik
titik referensi di peta (pin biru default) + marker hasil petani terdekat (dot hijau
`L.divIcon`, dibedakan visual dari titik referensi). `src/pages/PetaniTerdekat.tsx`
(BARU, route `/eksportir/terdekat`): fetch `kartu`/`petani`/`plot`/`petaniDocument`
langsung dari Supabase (pola identik `EksportirDashboard.tsx`, online-only), hitung
`getDocumentCompleteness()` per-petani, filter HANYA yang `complete===true`, hitung
jarak dari titik klik ke plot pakai **`@turf/turf`'s `distance()`** (dependency yang
sudah terpasang sejak awal proyek tapi baru benar-benar dipakai di sprint ini), urutkan
ascending, render list (nama, desa, jarak km, badge tier + "Berkas Lengkap") + marker.
Tombol "Hubungi" memanggil **`attemptAccess()`** dari `lib/consent.ts` (Sprint 7) —
BUKAN jalur akses baru, akses tetap tercatat `AccessLog` dan tunduk consent yang sudah
diberikan petani. Nav item baru "Petani Terdekat" di `DashboardShell.tsx` (grup
Monitoring, ikon `Navigation` dari `lucide-react`).

**Catatan kejujuran arsitektur** (dicatat eksplisit di `docs/07` §2.2, bukan
disembunyikan): `attemptAccess()`/`isAuthorized()` mengecek consent dari IndexedDB
LOKAL, bukan Supabase. Di demo ini (satu browser, IndexedDB dipakai bersama lintas
ganti-role) ini bekerja benar. Untuk deployment sungguhan lintas-device (Eksportir di
device fisik terpisah dari Agen), pengecekan ini perlu diarahkan ke tabel `consent` di
Supabase — ini keterbatasan yang sudah melekat pada `lib/consent.ts` sejak Sprint 7,
bukan bug baru dari fitur ini. Dicatat sebagai stretch goal, bukan blocker.

**Verifikasi nyata (Playwright, satu alur penuh)**: Agen buat petani+plot+kartu → beri
consent ke "Eksportir" via `ConsentPanel` → unggah 3 dokumen wajib → sinkron manual
sampai queue kosong → ganti role ke Eksportir → **regresi**: `/eksportir` dashboard
existing dicek masih memuat baris (15 rows, termasuk data dari sprint-sprint
sebelumnya) → buka **Petani Terdekat** → klik titik peta → petani yang baru dibuat
**muncul di daftar** dengan jarak (0.0 km, karena titik referensi & plot sengaja
diklik di koordinat yang sama untuk uji distance-calc), badge tier "Lokal", badge
"Berkas Lengkap" → klik **"Hubungi"** → **"Akses diizinkan"** (cocok dengan consent yang
diberikan sebelumnya, membuktikan wiring `attemptAccess` benar-benar berfungsi, bukan
cuma dipanggil tanpa efek). Screenshot dicek visual: dua petani hasil sebelumnya (dari
sprint 16 dan sprint 17) sama-sama tampil dengan badge benar. Nol console error.

---

## Perbaikan Pasca-Sprint-17 — `getDB()` Cascading Failure

**Kenapa**: user melaporkan dua error nyata saat memakai app (bukan lewat Playwright):
`"Operasi database gagal: listConsentByKartu"` saat klik "Hubungi" di Petani Terdekat,
lalu `"Operasi database gagal: listPetani"` saat lookup email di Petani Portal — dua
fungsi yang sama sekali tidak berhubungan (satu soal consent, satu soal petani dasar
yang sudah ada sejak Sprint 2). Kejanggalan itu sendiri adalah petunjuk: kalau dua
operasi tak berkaitan gagal dengan pesan identik, penyebabnya satu titik bersama, bukan
bug di masing-masing fungsi.

**Root cause**: `getDB()` di `lib/db.ts` meng-cache `dbPromise` secara permanen,
termasuk kalau `openDB()`-nya REJECT. `DB_VERSION` baru saja naik 2→3 di Sprint 16 (store
`petaniDocument` baru) — begitu browser user membuka app dengan skema lama masih
ter-cache di tab lain, upgrade transaction bisa terblokir (event `blocked`, tidak
ditangani sebelumnya) dan promise yang gagal itu tersimpan selamanya di `dbPromise`.
Efeknya: SEKALI upgrade gagal, SEMUA panggilan `getDB()` berikutnya di sesi itu — lintas
fitur, bukan cuma yang memicunya — ikut gagal identik sampai reload penuh.

**Fix** (`src/lib/db.ts`):
- `openDB()` sekarang punya `blocking()` (tutup koneksi lama milik tab ini sendiri kalau
  ia menghalangi versi baru di tab lain, supaya upgrade lanjut tanpa perlu user manual
  menutup tab), `blocked()` (log jelas kalau masih terblokir tab lain), dan
  `terminated()` (reset cache kalau browser mematikan paksa koneksi).
- `.catch()` pada `openDB()` mereset `dbPromise = null` sebelum re-throw — promise yang
  gagal TIDAK BOLEH di-cache, supaya panggilan berikutnya retry dari nol alih-alih ikut
  gagal selamanya.
- `dbError()` sekarang menyisipkan `err.message` asli ke pesan yang tampil di UI (bukan
  cuma nama operasi) — supaya laporan bug berikutnya (kalau ada) langsung bisa
  didiagnosis dari screenshot user, tanpa perlu buka DevTools console.

**Verifikasi nyata**: regresi penuh (seed data demo, `PetaniList`, Petani Portal lookup
by email dengan petani BARU yang sengaja dibuat saat itu juga, alur dokumen Sprint 16,
alur "Hubungi" Sprint 17) — nol `"Operasi database gagal"` muncul di UI manapun, nol
console error selain noise offline-network yang sudah diketahui.

---

## Perbaikan Pasca-Sprint-17 — Konsistensi UX (STDB & Form Consent)

**Kenapa**: user menemukan dua inkonsistensi nyata sambil memakai app: (1) checklist
"Sudah punya STDB" di form Buat Kartu adalah klaim manual TANPA bukti, padahal ada
dokumen STDB yang bisa diunggah terpisah di panel Dokumen Petani — dua sinyal yang sama
tapi tidak terhubung; (2) di `ConsentPanel`, mengetik nama pihak custom (mis.
"Eksportir", "Koperasi") lalu klik tombol preset lain membuat teks yang diketik hilang
diam-diam — dua state (`selectedParty`/`customParty`) yang bisa saling menimpa tanpa
umpan balik visual yang jelas.

**Fix**:
- `src/pages/PlotDetail.tsx`: panel `DocumentUpload` dipindah ke ATAS form Buat Kartu
  (isi bukti dulu, baru hitung tier). Checkbox "Sudah punya STDB" sekarang otomatis
  tercentang + terkunci (`disabled`) begitu dokumen ber-`type: 'stdb'` terunggah —
  kalau belum ada, checkbox tetap bisa diedit manual (fleksibilitas lapangan
  dipertahankan) tapi diberi keterangan eksplisit "klaim manual tanpa bukti dokumen".
  `tentukanTier`/`tentukanStdbStatus` (Sprint 5) tidak disentuh — hanya SUMBER boolean
  `punyaSTDB` yang diperbaiki, bukan logikanya.
- `src/components/DocumentUpload.tsx`: terima `onDocumentsChange` callback baru (dipakai
  `PlotDetail.tsx` di atas). Dalam tiap kategori, dokumen wajib (`*`) diurutkan tampil
  duluan sebelum yang opsional. Ditambah kalimat eksplisit menjelaskan wajib vs opsional.
- `src/components/ConsentPanel.tsx`: `selectedParty`+`customParty` (dua state terpisah)
  digabung jadi satu `partyName` — preset cuma mengisi field yang sama, bukan state
  tersembunyi lain. Highlight preset sekarang selalu akurat (menyala HANYA kalau nilainya
  persis sama), dan form reset ke default "Bank" setelah submit berhasil.

**Verifikasi nyata (Playwright)**: urutan Dokumen-sebelum-Buat-Kartu dikonfirmasi lewat
posisi Y elemen. Checkbox STDB dikonfirmasi bisa diedit manual SEBELUM dokumen ada, lalu
otomatis checked+disabled SETELAH dokumen STDB diunggah, kartu berhasil dibuat dengan
tier yang menghormati status itu. Form consent: klik preset mengisi input persis,
mengetik custom text membatalkan highlight preset (bukan lagi silent override), tombol
submit selalu mengikuti teks yang benar-benar akan dikirim, form reset setelah submit.
Nol console error.

---

## Perbaikan Pasca-Sprint-17 — Poligon Batas Kebun (bukan titik tunggal saja)

**Kenapa**: user menilai penandaan lokasi kebun yang cuma satu titik ("basic") kurang
merepresentasikan kebun sungguhan — usul: Agen jalan ke tiap sudut kebun (mis. segi lima
= 5 sudut), catat tiap titik, lalu batas kebun otomatis tergambar sebagai poligon.
Dikonfirmasi lewat pertanyaan eksplisit: poligon jadi **opsi tambahan** (bukan wajib) —
mode titik-tunggal (cepat) tetap default, plot lama tanpa poligon tetap valid tanpa
migrasi data.

**Dibangun**: `src/lib/polygon.ts` (BARU) — `computeCentroid()`/`computeAreaHa()` pakai
`@turf/turf` (`centroid()`/`area()`, dependency yang sudah terpasang sejak awal proyek).
`src/components/PolygonDrawer.tsx` (BARU) — UI daftar titik bernomor, tombol "Catat
Titik via GPS" (pakai `useGeolocation` yang sudah ada) atau tap di peta, "Hapus titik
terakhir", "Reset", dan "Selesai Poligon" (aktif setelah >= 3 titik, `MIN_POLYGON_POINTS`).
`src/components/Map3D.tsx` — tambah `polygons` prop (GeoJSON source+fill+outline layer,
update via `setData()` bukan remove+re-add layer supaya murah dipanggil tiap titik baru).
`src/components/MapView.tsx` — tambah `drawingPoints` prop (marker bernomor + poligon
berjalan saat mode gambar aktif, MENGGANTIKAN titik-tunggal — dua mode saling eksklusif)
dan otomatis merender `boundary` plot yang sudah tersimpan sebagai poligon hijau di peta
overview. `src/pages/TambahPlot.tsx` — toggle mode "Titik Tunggal (cepat)" / "Poligon
(batas kebun)"; commit kartu polygon menghitung `luasEstimasiHa` OTOMATIS dari poligon
(bukan input manual). `src/types/index.ts` — `Plot.boundary?: {lat,lng}[]` (aditif,
opsional, plot lama tidak perlu migrasi). `src/lib/sync.ts` — `boundary` ditambah ke
`ALLOWED_COLUMNS.plot` (kolom Supabase `plot.boundary`, tipe `jsonb`, SQL manual oleh
user — lihat catatan di bawah).

**Sekalian diperbaiki** (masih dalam sesi yang sama, ikut redesign `TambahPlot.tsx`):
peta Lokasi Kebun dibuat FULL-WIDTH (dulu grid 2/3+1/3 map+form berdampingan), komoditas
diubah dari input teks bebas jadi dropdown ~33 komoditas pertanian/perkebunan Indonesia
(kopi tetap default & urutan pertama — fokus utama produk, selaras integrasi notifikasi
WhatsApp tim lain yang berpusat ke kopi) + opsi "Lainnya…" untuk komoditas di luar daftar.
Konvensi label form disatukan: tanda `*` di judul field = wajib (bukan lagi tulisan
"Opsional" bertebaran), placeholder selalu contoh isian nyata (mis. "Contoh: Ade
Supriatna"), bukan kata "Opsional". Tombol "Sinkron sekarang" di Ringkasan Agen diganti
icon-only (↻, animasi spin saat proses) — pola yang sama persis dengan tombol refresh di
`EksportirDashboard.tsx`, supaya konsisten lintas dashboard.

**Sengaja TIDAK dikerjakan** (usul user sendiri, ditarik kembali setelah ditanya):
heatmap kepadatan sebaran petani di Dashboard Eksportir — user awalnya mengusulkan,
lalu eksplisit bilang "sebenernya bukan heatmap sih kalo ga masuk akal" dan saat
ditanya lokasi/kebutuhannya, memilih "skip dulu, tidak perlu". Dicatat di sini supaya
tidak dianggap terlewat — ini keputusan sadar ditunda, bukan belum sempat.

**Verifikasi nyata (Playwright)**: mode Poligon diaktifkan → tap 5 titik segi lima di
peta 3D → tiap titik langsung tercatat & tampil di daftar → estimasi luas muncul →
"Selesai Poligon" → plot tersimpan → **dikonfirmasi LANGSUNG dari IndexedDB** (bukan
cuma UI): `boundary` berisi persis 5 titik, `luasEstimasiHa` terisi otomatis (> 0, hasil
`turf.area()`, bukan default/kosong). Regresi: mode Titik Tunggal (default) dites ulang
dari navigasi fresh — masih berfungsi identik seperti sebelum fitur poligon ada. Nol
console error.

**Migrasi Supabase yang PERLU dijalankan manual** (belum dijalankan per pengecekan
`GET /rest/v1/plot?select=boundary` yang masih error `column plot.boundary does not
exist`):
```sql
alter table plot add column boundary jsonb;
```

---

## State Akhir Repo Saat Ini (setelah Sprint 17)

### Tambahan struktur `src/` sejak baseline MVP di atas
```
src/
├── lib/
│   ├── sync.ts                   (outbox pattern, SyncBackend, supabaseBackend/mockLocalBackend)
│   ├── supabaseClient.ts         (singleton client)
│   ├── documents.ts              (hashFile via Web Crypto, registerDocument)
│   ├── waha.ts                   (integrasi WhatsApp notif, fail-soft)
│   └── ruleEngine.ts             (+ getDocumentCompleteness, REQUIRED_DOCUMENT_TYPES — tentukanTier/tentukanStdbStatus tetap sama)
├── context/AppContext.tsx        (+ currentRole/setRole, syncVersion/triggerSync)
├── components/
│   ├── ui/                       (Button, Card, Badge, Input, Select, Textarea, Checkbox, EmptyState)
│   ├── DashboardShell.tsx        (sidebar layout per-role, nav, ProfileMenu, Ctrl+K search)
│   ├── DocumentUpload.tsx        (Sprint 16)
│   ├── NearbyMap.tsx             (Sprint 17)
│   ├── RequireRole.tsx, Navbar.tsx, Footer.tsx, RoleSelect.tsx
├── pages/
│   ├── Login.tsx (route /masuk), TentangKami.tsx (route / dan /tentang)
│   ├── EksportirDashboard.tsx, PetaniTerdekat.tsx (Sprint 17), PetaniPortal.tsx
```

### Tabel Supabase (kumulatif sejak Sprint 9)
`profiles`, `petani`, `plot`, `kartu`, `hashchain`, `consent`, `access_log`, `notif`,
**`petani_document`** (Sprint 16) — semua RLS aktif + policy `demo_allow_all` permisif
("PERKETAT SEBELUM PRODUKSI SUNGGUHAN", dicatat sejak Sprint 9).

### Belum dibuat / stretch goal tercatat (jangan diasumsikan ada)
- Upload file dokumen SUNGGUHAN ke Supabase Storage — hanya hash+metadata yang ada.
- Verifikasi dokumen otomatis/OCR — `PetaniDocument.verified` murni manual.
- Consent check lintas-device via Supabase (lihat catatan arsitektur Sprint 17 di atas)
  — saat ini masih baca IndexedDB lokal.
- Real Supabase Auth (magic-link) — masih demo role-selector (localStorage).

---

## Audit Sprint 18 — Verifikasi Repo Sebelum Fase Upgrade (Sprint 19–22)

**Kenapa**: `docs/09_UPGRADE_BLUEPRINT.md` disusun dari dokumen yang di-share ke user, BUKAN
dari membaca repo langsung — jadi sebelum bangun/hapus apa pun di Sprint 19–22, aturan tim
mewajibkan audit dulu: pastikan tiap item ADA/TIDAK ADA/SUDAH DIFIX di repo nyata. **Tidak
ada kode aplikasi yang diubah di sprint ini** — murni pembacaan (Read/Grep) + 1 kali
`npx jest` di `mobile/` untuk verifikasi bug WA (perlu `npm install` dulu karena
`mobile/node_modules` belum ada — instalasi dependency, bukan perubahan kode).

### 18.1 Struktur repo

Dikonfirmasi ADA keduanya: web app di root (`src/`, `docs/`, dst) DAN `mobile/` (Expo app)
DAN `mobile/server/` (`wahaWebhookServer.ts` + `webhookParser.ts`, proses Node.js terpisah
dari bundle Expo, dijalankan via `npm run waha:webhook`).

### 18.2 Keberadaan & tanda tangan fungsi inti

| Fungsi | Lokasi | Status |
|---|---|---|
| `loadRaster()` | `src/lib/raster.ts:10` | ADA — format **grid JSON** (`/rasters/pangalengan.json`, `{bbox, width, height, values[]}` row-major 0/1), BUKAN geotiff |
| `cekDeforestasi()` (point-in-raster) | `src/lib/geospatial.ts:41` | ADA |
| Fungsi polygon/area/risk di `geospatial.ts` | — | **TIDAK ADA** (lihat 18.3) |
| `tentukanTier`, `tentukanStdbStatus` | `src/lib/ruleEngine.ts:44,57` | ADA, tidak diubah sejak Sprint 5 |
| `getDocumentCompleteness` | `src/lib/ruleEngine.ts:143` | ADA (Sprint 16) |
| `appendEntry`, `verifyChain` | `src/lib/hashchain.ts:48,77` | ADA, tidak diubah sejak Sprint 6 |
| `attemptAccess`, `isAuthorized` | `src/lib/consent.ts:64,35` | ADA — sumber baca **IndexedDB lokal** (`import ... from './db'`), BUKAN Supabase. Keterbatasan lintas-device dari `docs/07` §2.2 masih berlaku persis, belum berubah |
| `SyncEntityType` | `src/lib/db.ts:17-25` | `petani \| plot \| kartu \| hashchain \| consent \| accessLog \| notif \| petaniDocument` — belum ada `transaksi` |

### 18.3 Polygon — koreksi penting terhadap asumsi blueprint

Blueprint `docs/09` §0 menulis "fitur polygon baru **reuse** ini, bukan bikin baru" dengan
asumsi polygon belum ada sama sekali. **Faktanya lebih nuanced**: di sesi pasca-Sprint-17
(sebelum blueprint upgrade ini dibuat), fitur **menggambar batas kebun** sudah dibangun:
`src/lib/polygon.ts` (`computeCentroid`, `computeAreaHa` — pakai `turf.area`/`turf.centroid`),
`src/components/PolygonDrawer.tsx`, layer poligon di `Map3D.tsx`/`MapView.tsx`, terintegrasi
di `TambahPlot.tsx` (mode "Poligon" — tap sudut kebun / GPS per titik → auto luas). Ini
sudah **terverifikasi Playwright** (lihat entri progress log sebelumnya).

Yang **BELUM ADA** (dikonfirmasi grep `polygon|risk|booleanPointInPolygon` kosong di seluruh
`src/`, web maupun `mobile/src/lib/geospatial.ts`): **skor risiko deforestasi dari overlap
piksel raster di dalam polygon** (`getPolygonRisk()` — % sel hutan vs total sel di dalam
polygon, dipetakan ke rendah/sedang/tinggi). Ini murni fungsi kalkulasi baru; UI polygon-nya
sendiri **JANGAN dibangun ulang** — tinggal reuse `PolygonDrawer.tsx`/`lib/polygon.ts` yang
sudah ada, tambahkan hasil risk-score sebagai badge tambahan.

**Koreksi tracker**: Sprint 19 dipersempit — HANYA 19.1 (`getPolygonRisk()` di
`geospatial.ts`, reuse raster) + 19.2 (mapping skor) + disclosure UI. Item "bangun UI
gambar polygon" (bagian dari 19.3/19.4 lama) **dilewati, sudah ada** — cukup wire skor ke
komponen yang sudah ada, bukan bikin `PolygonRiskMap.tsx` baru dari nol.

### 18.4 RLS — status per tabel

Tidak ada file migrasi SQL tersimpan di repo (semua SQL dijalankan manual oleh user di
Supabase Dashboard, sesuai pola sejak Sprint 9). Diverifikasi **empiris** (bukan cuma baca
dokumen): sebuah `DELETE` lewat **anon key** (tanpa auth context apa pun) terhadap
`consent`, `access_log`, `notif`, `petani_document`, `kartu`, `plot`, `petani` **berhasil
tanpa ditolak** — ini secara langsung membuktikan policy `demo_allow_all` (`for all using
(true) with check (true)`) MASIH aktif di tabel-tabel itu, bukan cuma asumsi dari dokumen.

| Tabel | Policy saat ini | Bukti |
|---|---|---|
| `petani` | `demo_allow_all` (permisif) | DELETE anon berhasil |
| `plot` | `demo_allow_all` (permisif) | DELETE anon berhasil |
| `kartu` | `demo_allow_all` (permisif) | DELETE anon berhasil |
| `consent` | `demo_allow_all` (permisif) | DELETE anon berhasil |
| `access_log` | `demo_allow_all` (permisif) | DELETE anon berhasil |
| `notif` | `demo_allow_all` (permisif) | DELETE anon berhasil |
| `petani_document` | `demo_allow_all` (permisif) | DELETE anon berhasil |
| `hashchain`, `profiles` | `demo_allow_all` (permisif, asumsi) | tidak diuji-hapus langsung (hash-chain sengaja tidak disentuh sesi ini — append-only), tapi SQL migrasi asli Sprint 9 menerapkan policy identik ke SEMUA tabel sekaligus dan tidak pernah ada `alter policy` terpisah sesudahnya |

**Kesimpulan**: Sprint 21 (RLS hardening) **tetap sepenuhnya diperlukan** — ini gap produksi
paling nyata dan paling berisiko (siapa pun dengan anon key publik bisa baca/tulis/hapus
SEMUA data siapa pun saat ini).

### 18.5 Harga referensi & bug WA — status per item

`mobile/src/lib/harga/aggregate.ts`, `prices.ts`, `bot.ts`, `pasporLookup.ts` semua ADA.
`prices.ts` (`SAMPLE_PRICE_SOURCES`) eksplisit dilabeli "SAMPLE... BUKAN harga pasar nyata"
di komentar file — **masih DATA DEMO**, dikonfirmasi. Tabel `transaksi` di Supabase
**TIDAK ADA** (dicek langsung via REST, `PGRST205`). Jest suite `mobile/` (10 suite, 67
test) dijalankan penuh — **semua PASS**.

| Bug yang di-flag reviewer | Status | Bukti |
|---|---|---|
| Rata-rata berbobot (61.250 vs 61.500) | **SUDAH DIFIX** | `aggregateDaily` di `aggregate.ts:76` menghitung `Σ(price·txn)/Σ(txn)` — matematis benar = 61250. Test `harga.test.ts:54` assert `toBe(61250)` dan **PASS**. (Komentar test baris 53 punya typo aritmatika "=61500" — kosmetik saja, TIDAK memengaruhi kode/assertion yang sudah benar) |
| Deep-link scheme hardcode | **MASIH ADA** | `bot.ts:9` — `STATUS_LINK_SCHEME = 'jejakhijau://status'` hardcode literal, TIDAK baca `process.env.EXPO_PUBLIC_STATUS_SCHEME` walau env var itu sudah didokumentasikan di `.env.example:16` |
| `parseInboundWebhook` — cek `fromMe` | **SUDAH DIFIX** | `webhookParser.ts:20` — `if (fromMe) return null` |
| `parseInboundWebhook` — abaikan group `@g.us` | **MASIH ADA (bug)** | Tidak ada pengecekan `@g.us` eksplisit. `webhookParser.ts:23` — `from.replace(/@.*/, '')` justru MEN-STRIP suffix grup lalu memperlakukan JID grup sebagai "nomor telepon", bukan menolak pesannya |
| `readBody` — limit ukuran payload | **MASIH ADA (bug)** | `wahaWebhookServer.ts:12-19` — `raw += chunk` tanpa batas, tidak ada respons `413` sama sekali |
| `aggregateDaily` — filter komoditas+wilayah | **CAMPURAN** | `aggregateDaily()` sendiri (`aggregate.ts:46`) HANYA filter by `grade` — parameter `komoditas`/`wilayah` diterima tapi tidak dipakai memfilter `sources`, hanya diteruskan ke output. **Tapi** jalur yang benar-benar dipakai bot (`getReferencePrice()` → `filterSources()` dulu baru `aggregateDaily()`) SUDAH benar filter komoditas+wilayah duluan. Jadi: tidak ada bug user-facing HARI INI, tapi `aggregateDaily` sendiri rapuh kalau dipanggil langsung dengan data campuran (mis. saat Sprint 20 nanti) |
| Nudge "Paspor lengkap" — AsyncStorage vs Supabase | **MASIH ADA (bug, lebih parah dari deskripsi)** | `pasporLookup.ts` baca `../db` (AsyncStorage lokal mobile app, lihat komentar file baris 2-3 yang mengakui ini). **Lebih parah**: `wahaWebhookServer.ts:40` bahkan TIDAK memanggil `resolvePasporForBot` sama sekali (parameter `lookup` ke-4 di `handlePriceMessage` diomit) — nudge saat ini benar-benar TIDAK AKTIF di server webhook yang jalan, bukan cuma salah sumber data |

### 18.6 Ringkasan Verdict — BUILD/UPGRADE/DEFER (koreksi dari `docs/09` §1)

| Fitur | Verdict `docs/09` (asumsi) | Verdict Audit (nyata) | Sprint |
|---|---|---|---|
| Polygon draw | ❓ "kemungkinan belum" | **UI-nya SUDAH ADA** (dibangun pasca-Sprint-17). Hanya skor risiko yang belum. | 19 (dipersempit) |
| Skor risiko deforestasi (`getPolygonRisk`) | dibundel dengan polygon draw | **BENAR-BENAR belum ada**, perlu dibangun dari nol (fungsi murni saja, UI reuse) | 19 |
| Harga referensi nyata | "agregasi ada tapi data DEMO" | **Dikonfirmasi tepat** — agregasi ADA & BENAR, data masih SAMPLE, tabel `transaksi` TIDAK ADA | 20 (penuh) |
| RLS hardening | "ada, permisif" | **Dikonfirmasi tepat, dibuktikan empiris** (DELETE anon berhasil di 7 tabel) — gap produksi terbesar | 21 (penuh, prioritas tertinggi) |
| Consent lintas-device | "keterbatasan diakui" | **Dikonfirmasi tepat** — masih baca IndexedDB lokal | 21 (penuh) |
| WA bot bugfix | "bug di-flag" (6 item, diasumsikan semua ada) | **3 dari 6 SUDAH DIFIX** (rata-rata berbobot, fromMe, — 2 murni; 1 campuran/aggregateDaily). **3 MASIH ADA**: deep-link hardcode, `@g.us` group, `readBody` limit, nudge tidak aktif (4 kalau dihitung terpisah — lihat tabel 18.5) | 22 (dipersempit ke item yang masih ada) |
| Company profile | "ada" | **Dikonfirmasi ADA** (`TentangKami.tsx`) | DEFER (tetap, skip) |
| Redis | "tidak perlu" | **Dikonfirmasi TIDAK ADA** dependency Redis di manapun | JANGAN (tetap, skip) |
| Upload file asli ke Storage | "sengaja ditunda" | **Dikonfirmasi TIDAK ADA**, hash+metadata saja | DEFER (tetap, skip) |
| Mobile app fitur baru | "ada" | **Dikonfirmasi ADA**, banyak (port lengkap dari web: db/hashchain/ruleEngine/consent/geospatial + WA bot) | PAUSE (tetap, skip) |

### Rekomendasi eksekusi Sprint 19–22

1. **Sprint 19 (Polygon Risk-Score)** — kerjakan, tapi **DIPERSEMPIT**: hanya
   `getPolygonRisk()` baru di `geospatial.ts` + wire skor ke `PolygonDrawer.tsx`/
   `PassportCard.tsx`/`PetaniTerdekat.tsx` yang sudah ada. **JANGAN** bangun ulang UI
   gambar polygon — sudah ada dan sudah teruji.
2. **Sprint 20 (Harga Referensi Nyata)** — kerjakan penuh sesuai blueprint. Tabel
   `transaksi` + agregasi belum ada di web sama sekali (baru ada versi mobile/demo).
3. **Sprint 21 (RLS + Consent Lintas-Device)** — kerjakan penuh, **PRIORITAS TERTINGGI**
   di antara semua sprint upgrade (gap keamanan nyata & terbukti, bukan teoretis).
4. **Sprint 22 (WA Bot Hardening)** — kerjakan tapi **DIPERSEMPIT ke 4 item nyata**: deep-
   link scheme dari env, tolak `@g.us` (bukan cuma strip suffix), `readBody` size limit
   + 413, dan aktifkan+benerin nudge (wire ke Supabase, bukan AsyncStorage — sekaligus
   perbaiki bahwa nudge sekarang tidak dipanggil sama sekali). Item rata-rata berbobot dan
   `fromMe` **DILEWATI** (sudah benar). `aggregateDaily`'s missing filter boleh dirapikan
   sekalian (low-risk, defensif) tapi bukan prioritas karena jalur produksi sudah benar
   lewat `getReferencePrice()`.

---

## Sprint 19 — Skor Risiko Deforestasi Poligon (dipersempit sesuai Audit Sprint 18)

**Kenapa**: `docs/09_UPGRADE_BLUEPRINT.md` §4.1 awalnya minta bangun "polygon draw + skor
risiko" sekaligus, dengan asumsi keduanya belum ada. Audit Sprint 18 mengoreksi ini: UI
gambar poligon (`PolygonDrawer.tsx`, `lib/polygon.ts`, layer `Map3D.tsx`) **sudah ada**
dari sesi pasca-Sprint-17 — hanya skor risikonya yang benar-benar belum ada. Sprint ini
dieksekusi sesuai koreksi itu: **tidak ada komponen UI baru**, hanya fungsi kalkulasi baru
+ wiring ke komponen yang sudah ada.

**Dibangun**: `getPolygonRisk(points)` BARU di `src/lib/geospatial.ts` — fungsi PURE
terpisah dari `cekDeforestasi()`/`pointToPixel()`/`getRasterValue()` yang sudah ada
(TIDAK disentuh sama sekali). REUSE penuh `lib/raster.ts` (loader yang sama, tidak ada
loader kedua) dan `computeAreaHa()` dari `lib/polygon.ts` (Sprint 17-ish, tidak duplikasi
rumus luas). Algoritma: bangun poligon turf dari titik-titik, scan seluruh grid raster
(100×100 = 10.000 sel, full-scan trivial untuk ukuran ini), untuk tiap sel yang PUSATNYA
jatuh di dalam poligon (`turf.booleanPointInPolygon`) hitung apakah sel itu "hutan"
(nilai 1) — `forestOverlapPct = selHutanDidalam/totalSelDidalam*100`, dipetakan ke
`rendah` (<10%) / `sedang` (10-40%) / `tinggi` (>40%). Poligon di luar bbox raster
(`cellsInside === 0`) **sengaja TIDAK diklaim aman** — jatuh ke `sedang`, konsisten
dengan cara `cekDeforestasi()` memperlakukan titik di luar bbox/tanpa data raster.

Diwire ke `src/components/PolygonDrawer.tsx` (bukan komponen baru): badge skor risiko
live muncul di samping estimasi luas yang sudah ada, dihitung ulang tiap titik
bertambah/berkurang (`useEffect` pada `points`), reuse `components/ui/Badge.tsx` dengan
mapping `rendah→aman(hijau)`, `sedang→perlu-audit(kuning)`, `tinggi→berisiko(merah)` —
tone yang sudah ada di Badge, tidak perlu tone baru. Disclosure kejujuran WAJIB tampil:
batas digambar manual/GPS-per-titik (bukan jalur GPS kontinu resmi), JRC ~91% akurasi,
commission error ~18%, "skor ini indikator awal, bukan vonis — tetap perlu audit manual".

**Verifikasi nyata**:
- `npx tsc -b --noEmit` + `npm run build` bersih.
- `node src/lib/ruleEngine.test-cases.ts` — semua skenario tetap PASS (regresi nol ke
  `tentukanTier`/`tentukanStdbStatus`, sesuai guardrail — fungsi ini sama sekali tidak
  disentuh oleh perubahan Sprint 19).
- Sanity-check matematika standalone (di luar TypeScript, mirror algoritma di Node+turf
  langsung baca `public/rasters/pangalengan.json`) mengonfirmasi dua kotak uji sebelum
  dipakai di browser test: kotak "hutan" → 50% overlap (3/6 sel), kotak "aman" → 0%
  overlap (0/2 sel) — kontras cukup jelas untuk uji risk-level.
- Browser test nyata (Playwright, build+preview, **GPS di-mock presisi** via
  `context.setGeolocation()` per titik — bukan tap-pixel kasar pada peta 3D miring, supaya
  koordinat benar-benar menyasar sel raster yang sudah diverifikasi): poligon di kotak
  hutan → **"Risiko Tinggi (50% area hutan)"**; poligon di kotak aman → **"Risiko Rendah
  (0% area hutan)"**; disclosure kejujuran tampil di kedua kasus. **Regresi**:
  `cekDeforestasi()` titik-tunggal (mode "Titik Tunggal" default) dites ulang di titik
  non-forest yang sama — tetap menghasilkan badge "aman" seperti sebelum Sprint 19 ada.
  Alur akhir (selesai poligon → isi nama → simpan plot) tetap berfungsi. Nol console error.

**Sengaja TIDAK dikerjakan** (sesuai cakupan yang dipersempit audit): komponen
`PolygonRiskMap.tsx` baru — UI-nya sudah ada di `PolygonDrawer.tsx`, membangun ulang
hanya akan menduplikasi kerja yang sudah teruji.

---

## Sprint 20 — Harga Referensi dari Transaksi Terverifikasi

**Kenapa**: prinsip inti dari `docs/09_UPGRADE_BLUEPRINT.md` §2 — harga referensi harus
jadi AGREGAT TRANSPARAN dari transaksi terverifikasi, bukan angka yang diset satu pihak
(eksportir) sepihak ke petani. Ini yang melindungi petani dari ditipu harga. Audit
Sprint 18 mengonfirmasi: agregasi versi `mobile/` sudah ADA & rumusnya BENAR, tapi
datanya masih `SAMPLE_PRICE_SOURCES` (DATA DEMO) dan tabel `transaksi` di Supabase sama
sekali belum ada — sprint ini membangun fondasi data nyata di web.

**Keputusan arsitektur penting** (dicatat eksplisit, bukan diam-diam): guardrail Sprint 20
minta "SATU rumus dipakai bersama web + WA" via **modul shared ATAU rumus yang
disamakan**. Web (root) dan `mobile/` adalah dua paket npm independen — masing-masing
`package.json`/`node_modules` sendiri, TIDAK ada npm workspace yang menghubungkan
keduanya. Membuat monorepo/workspace sungguhan sekarang adalah perubahan infra besar &
berisiko (bisa memengaruhi pipeline build Vercel/Expo yang sudah berjalan) di luar
cakupan fitur harga. **Dipilih opsi kedua**: `src/lib/harga/aggregate.ts` (BARU, web)
mengimplementasikan PRINSIP MATEMATIS YANG SAMA seperti `mobile/src/lib/harga/aggregate.ts`
(rata-rata berbobot — yang audit Sprint 18 sudah konfirmasi BENAR, bukan bug yang perlu
diperbaiki). Bedanya hanya bentuk data: mobile beroperasi di atas `PriceSource[]`
(sumber yang SUDAH diagregasi, tiap sumber punya `txnCount` sendiri), web beroperasi
langsung di atas baris `Transaksi[]` individual (tiap baris = 1 transaksi nyata, bobot 1
masing-masing) — secara matematis kasus khusus dari rumus yang sama.

**Dibangun**:
- `Transaksi` (BARU) di `types/index.ts`: `komoditas`, `wilayah`, `grade`, `hargaPerKg`,
  `tanggal`, `verified`, `createdAt` + field `Syncable` standar.
- `src/lib/db.ts`: store `transaksi` (`DB_VERSION` 3→4, migration guard) + `addTransaksi`/
  `listTransaksi` — pola CRUD identik store lain, offline-first penuh (outbox sync).
- `src/lib/sync.ts`: `'transaksi'` ditambah ke `SyncEntityType`/`TABLE_NAME`
  (→ `transaksi`)/`ALLOWED_COLUMNS`.
- `src/lib/harga/aggregate.ts` (BARU): `getReferencePrice(transaksi, komoditas, wilayah,
  grade)` — filter `verified===true` + match komoditas/wilayah/grade (dinormalisasi:
  trim+lowercase+collapse-whitespace, pola sama seperti `mobile/`'s `normalize()`),
  return `null` kalau match < `MIN_TXN_COUNT` (3) — **guard "data belum cukup"**, TIDAK
  pernah menampilkan angka dari sampel terlalu kecil.
- `src/lib/komoditas.ts` (BARU): `KOMODITAS_OPTIONS`/`KOMODITAS_LAINNYA` diekstrak dari
  `PlotForm.tsx` supaya taksonomi komoditas satu sumber, dipakai bersama form plot & form
  transaksi (sebelumnya cuma di dalam `PlotForm.tsx`, sekarang diimpor keduanya).
- `src/pages/HargaReferensi.tsx` (BARU, satu komponen role-aware — bukan dua halaman
  terpisah): rute `/agen/harga` & `/eksportir/harga`. Agen lihat form "Rekam Transaksi"
  (offline-first, ke IndexedDB lokal) + riwayat transaksi device ini + panel "Cek Harga
  Referensi". Eksportir HANYA lihat panel "Cek Harga Referensi" (baca `transaksi` dari
  Supabase via `supabaseBackend.fetchAll`, pola sama seperti `EksportirDashboard.tsx`/
  `PetaniTerdekat.tsx` — online-only untuk data lintas-agen). Petani TIDAK dapat akses
  (sesuai guardrail eksplisit "petani: -").
- Nav item "Harga Referensi" ditambah ke `DashboardShell.tsx` untuk grup Agen & Eksportir
  (ikon `TrendingUp`).

**Tabel Supabase `transaksi`** (SQL disiapkan, **BELUM dijalankan user** — dikonfirmasi
lewat REST API, masih `PGRST205`):
```sql
create table transaksi (
  id text primary key,
  komoditas text not null,
  wilayah text not null,
  grade text not null default '',
  harga_per_kg bigint not null,
  tanggal text not null,
  verified boolean not null default true,
  created_at bigint not null,
  agent_id text not null
);

alter table transaksi enable row level security;
create policy "demo_allow_all" on transaksi for all using (true) with check (true);
```
RLS `demo_allow_all` (BUKAN per-role) — konsisten dengan semua tabel lain sejak Sprint 9;
per-role sungguhan sengaja ditunda ke Sprint 21 (belum ada `auth.uid()` di sistem demo
role-selector ini untuk dijadikan dasar policy — bikin satu tabel per-role sekarang tanpa
mekanisme auth yang mendasarinya hanya akan jadi kerja sia-sia yang harus diulang).

**Verifikasi nyata**: `tsc`/`build` bersih, `ruleEngine.test-cases.ts` tetap PASS (nol
regresi). Browser test (Playwright): rekam transaksi OFFLINE-FIRST berhasil walau tabel
Supabase `transaksi` belum ada sama sekali (penyimpanan lokal tidak bergantung sinkron)
— transaksi baru langsung tampil di riwayat device. "Cek Harga Referensi" mencoba baca
Supabase, gagal dengan pesan error yang JELAS ("Gagal mengambil data dari Supabase
(transaksi): ...") — halaman tetap stabil, TIDAK crash. Role-gating dikonfirmasi:
Eksportir melihat panel "Cek Harga Referensi" TAPI TIDAK melihat form "Rekam Transaksi"
(Agen-only). Nav "Harga Referensi" muncul benar di kedua role. **Verifikasi angka
agregat lintas-role (>=3 transaksi → avg/range muncul benar; <3 → "data belum cukup")
BELUM bisa dilakukan** — menunggu SQL di atas dijalankan user, karena butuh tabel
Supabase sungguhan untuk uji round-trip lintas-agen.

**Sengaja TIDAK dikerjakan**: modul shared literal (npm workspace) antara web & mobile —
lihat "Keputusan arsitektur penting" di atas. Seeding data demo transaksi palsu — kalau
belum ada transaksi nyata, guard "data belum cukup" yang tampil (jujur), bukan angka
buatan berlabel DATA DEMO (beda dengan `mobile/`'s `SAMPLE_PRICE_SOURCES` yang memang
untuk demo standalone bot, bukan preseden untuk data platform sungguhan ini).

---

## Sprint 21 — RLS Hardening + Consent Lintas-Device (dipersempit — blocker Auth ditemukan)

**Kenapa**: `docs/09_UPGRADE_BLUEPRINT.md` §4.3 minta ganti SEMUA policy `demo_allow_all`
jadi policy per-role (`agent_id = auth.uid()`, "petani lihat barisnya sendiri", dst) DAN
`isAuthorized()`/`attemptAccess()` cek consent lintas-device via Supabase.

**Blocker ditemukan SEBELUM eksekusi apa pun** (bukan sesudah, dan bukan diam-diam
dilewati): app ini **belum punya Supabase Auth sungguhan**. Semua role (Agen/Petani/
Eksportir) memakai SATU anon key yang sama; pemilihan peran cuma toggle di
`localStorage` (`AppContext.currentRole`), bukan sesi Supabase Auth. Kalau policy
`agent_id = auth.uid()` dkk ditulis & dijalankan SEKARANG, `auth.uid()` akan SELALU
`NULL` untuk setiap request (tidak ada yang benar-benar login lewat Supabase Auth) —
artinya SEMUA baris di SEMUA tabel akan langsung tidak bisa diakses siapa pun, app mati
total (Agen tidak bisa buat petani, Eksportir dashboard kosong, Petani Portal error).
Ini bukan risiko kecil — kalau dijalankan tanpa peringatan, live demo project ini bisa
langsung rusak total di tengah persiapan presentasi.

Blocker ini dikonfirmasi eksplisit ke user (bukan diputuskan sepihak) via pertanyaan
pilihan sebelum menyentuh kode/SQL apa pun. User memilih **"Partial hardening dulu"**:
kerjakan yang aman tanpa Auth, dokumentasikan sisanya sebagai gap yang jelas menunggu
sprint Auth terpisah (bukan pura-pura sudah selesai).

**Dibangun** (yang TIDAK butuh `auth.uid()`, jadi aman dikerjakan sekarang):

1. **Consent lintas-device** (`src/lib/consent.ts`) — `isAuthorized()` sekarang baca
   consent AKTIF dari Supabase dulu (`fetchActiveConsentsRemote()`, fungsi baru), baru
   FALLBACK ke IndexedDB lokal kalau gagal (offline/network error, try/catch). Signature
   `isAuthorized`/`attemptAccess` **tidak berubah sama sekali** — hanya SUMBER data yang
   berubah, kontraknya tetap. `listActiveConsents()` (dipakai `ConsentPanel.tsx` untuk
   grant/revoke/lihat izin) **SENGAJA TETAP baca lokal saja** — kalau dialihkan ke
   Supabase juga, ada jeda sinkron outbox yang bikin izin yang BARU SAJA diberikan Agen
   sempat tidak kelihatan di UI-nya sendiri (stale read); beda kasus dengan
   `isAuthorized()` yang justru BUTUH baca lintas-device. Dicatat eksplisit sebagai
   keputusan sadar di komentar kode, bukan inkonsistensi.
2. **RLS append-only** untuk `hashchain`, `access_log`, `petani_document` — SQL
   disiapkan (di bawah), TIDAK butuh `auth.uid()` karena hanya membatasi OPERASI
   (blokir UPDATE+DELETE untuk semua, sisakan SELECT+INSERT), bukan MEMBATASI SIAPA.
   Dikonfirmasi aman: `simulateTamper()`/`restoreEntry()` (demo tamper-evidence
   hash-chain) tidak pernah sync ke Supabase (`putHashEntryRaw()` murni lokal, tidak
   panggil `enqueueSync`) — jadi larangan UPDATE di Supabase tidak memengaruhi demo itu
   sama sekali. `markDocumentVerified()` (yang butuh UPDATE) dikonfirmasi **belum
   di-wire ke UI manapun** (dead code) — jadi larangan UPDATE juga tidak memutus fitur
   aktif apa pun sekarang; kalau nanti diaktifkan, perlu policy UPDATE terpisah yang
   lebih ketat (idealnya menunggu Auth juga).

**SQL yang perlu dijalankan user** (append-only — DELETE+UPDATE diblokir untuk semua,
BUKAN per-role, jadi tidak butuh Auth):
```sql
drop policy if exists "demo_allow_all" on hashchain;
create policy "select_all" on hashchain for select using (true);
create policy "insert_all" on hashchain for insert with check (true);

drop policy if exists "demo_allow_all" on access_log;
create policy "select_all" on access_log for select using (true);
create policy "insert_all" on access_log for insert with check (true);

drop policy if exists "demo_allow_all" on petani_document;
create policy "select_all" on petani_document for select using (true);
create policy "insert_all" on petani_document for insert with check (true);
```
Catatan: ini akan menghilangkan kemampuan DELETE via anon key untuk 3 tabel ini —
termasuk teknik yang dipakai sesi ini untuk membersihkan data test-script dari Supabase
(lihat "Perbaikan Pasca-Sprint-17 — ..." di atas). Ini justru KONSEKUENSI YANG BENAR
dari hardening (anon key publik memang seharusnya tidak bisa menghapus audit trail),
bukan efek samping yang tidak disengaja.

**Verifikasi nyata — uji lintas-device SUNGGUHAN** (bukan 1 browser/IndexedDB yang
"kebetulan benar" seperti pengujian Sprint 17 sebelumnya): dua `browser.newContext()`
Playwright TERPISAH (IndexedDB masing-masing kosong dari awal, benar-benar mensimulasikan
dua device fisik berbeda).
- **Context A (Agen)**: buat petani+plot+kartu+3 dokumen wajib, beri consent ke
  "Eksportir", sinkron sampai `syncQueue` benar-benar 0 (dikonfirmasi lewat IndexedDB
  langsung, bukan asumsi).
- **Context B (Eksportir, device BERBEDA, IndexedDB kosong sejak awal)**: buka Petani
  Terdekat, petani dari Context A **muncul di daftar** (data dari Supabase) → klik
  **"Hubungi"** → **"Akses diizinkan"**. Ini BUKTI nyata `isAuthorized()` sekarang benar-
  benar baca dari Supabase — SEBELUM fix ini, skenario yang SAMA persis di device
  benar-benar terpisah akan GAGAL (local IndexedDB Context B kosong, tidak pernah
  melihat consent yang diberikan di Context A).
- **Fallback offline** diuji terpisah: device baru (online dulu untuk buat data, LALU
  offline) mencoba `attemptAccess()` ke pihak yang belum pernah diberi izin — tetap
  menolak dengan benar (fallback ke lokal kosong), **TIDAK hang/macet** menunggu fetch
  yang mustahil selesai saat offline.
- `tsc -b --noEmit` + `npm run build` bersih. Nol console error tak terduga di kedua
  skenario (selain noise `Failed to fetch`/`ERR_INTERNET_DISCONNECTED` yang memang
  diharapkan saat sengaja offline).
- Regresi: `ConsentPanel.tsx` (grant "Izin aktif (1)" langsung muncul, tanpa stale-read)
  tetap berfungsi persis seperti sebelumnya karena `listActiveConsents()` sengaja tidak
  diubah.

**Sengaja DITUNDA** (bukan diabaikan — didokumentasikan jelas sebagai gap terbuka):
- Policy per-role (`agent_id = auth.uid()`, dst) untuk `petani`/`plot`/`kartu`/`consent`/
  `notif`/`transaksi` — **butuh Supabase Auth sungguhan dulu** (magic-link atau setara),
  yang berarti mengganti demo role-selector (`localStorage`) dengan sesi Auth asli. Ini
  scope sprint terpisah, bukan bagian Sprint 21.
- Uji "login sebagai agen A tidak bisa lihat data agen B" — butuh identitas akun
  sungguhan dari Auth untuk berarti apa-apa; sekarang semua "agen" memakai anon key
  yang sama sehingga skenario ini belum bisa dibuktikan secara jujur.

---

## Sprint 22 — WA Bot Hardening + Wire Nudge (1 item prompt ditolak sebagai salah)

**Kenapa**: `docs/09_UPGRADE_BLUEPRINT.md` §4.4 minta perbaiki 6 bug yang di-flag
reviewer pada layanan harga WA (`mobile/`). Audit Sprint 18 sudah mengonfirmasi mana
yang benar-benar masih ada (3-4 dari 6) — sprint ini mengerjakan yang nyata, TDD
(test ditulis/diperbarui bareng tiap fix).

**⚠️ Satu item prompt DITOLAK sebagai salah, bukan dikerjakan buta**: prompt asli
meminta "perbaiki rata-rata berbobot supaya hasil 61.500 (bukan 61.250)". Dihitung
ulang manual: `(58000×4 + 61000×3 + 64000×5) / (4+3+5) = 735000/12 = 61250`. **61.250
adalah jawaban matematis yang BENAR** — audit Sprint 18 sudah mengonfirmasi ini, dan
kode `aggregateDaily` yang ada sekarang SUDAH menghasilkan 61250 dengan test yang
PASS. Kalau kode "diperbaiki" mengikuti prompt supaya menghasilkan 61.500, itu artinya
SENGAJA memasukkan bug matematis ke kode yang tadinya benar. Ditolak, bukan
dikerjakan — komentar test yang salah tulis "= 61500" (typo aritmatika, bukan
assertion) diperbaiki jadi penjelasan yang akurat, tidak lebih.

**Dibangun** (5 dari 6 item lain, semua nyata dikonfirmasi audit):

1. **Deep-link scheme dari env** (`mobile/src/lib/harga/bot.ts`) — `STATUS_LINK_SCHEME
   = process.env.EXPO_PUBLIC_STATUS_SCHEME || 'jejakhijau://status'`, bukan hardcode
   literal lagi. Test baru pakai `jest.resetModules()` + `require()` ulang untuk
   membuktikan override env benar-benar terbaca (bukan cuma nilai default kebetulan
   sama).
2. **`fromMe` diperketat** (`mobile/server/webhookParser.ts`) — `fromMe === true`
   eksplisit (bukan truthy JS biasa) supaya nilai malformed/tipe lain tidak diam-diam
   men-skip semua pesan. Test baru: `fromMe: 'yes'` (string truthy, bukan boolean)
   TIDAK di-skip.
3. **Pesan grup (`@g.us`) diabaikan** — `from.endsWith('@g.us')` → return null SEBELUM
   sempat di-strip jadi "nomor telepon" palsu (JID grup yang panjang, kalau lolos akan
   diperlakukan seolah nomor asli). Ini sekaligus menutup kekhawatiran "balasan
   terarah ke chatId yang salah" dari prompt asli — begitu grup ditolak di titik parse,
   tidak ada balasan yang dicoba sama sekali untuk grup.
4. **`readBody` dengan limit ukuran + HTTP 413** — dipindah dari
   `wahaWebhookServer.ts` ke `webhookParser.ts` (supaya testable tanpa I/O sungguhan,
   pola yang sama seperti `parseInboundWebhook`). Batas 100KB (`MAX_WEBHOOK_BODY_BYTES`),
   `PayloadTooLargeError` custom yang ditangkap `wahaWebhookServer.ts` untuk membalas
   413. **Bug ditemukan & diperbaiki SAAT verifikasi end-to-end** (bukan cuma lolos
   test unit): implementasi pertama memanggil `req.destroy()` begitu batas terlampaui
   — ternyata ini mematikan socket TCP yang dipakai bersama request & response
   SEBELUM sempat menulis 413, jadi klien cuma melihat connection reset mentah
   (dikonfirmasi nyata: `curl` exit code 56 "failure receiving data"). Diganti
   `req.pause()` (berhenti mengakumulasi tanpa mematikan socket) — setelah fix,
   `curl` ke server yang benar-benar berjalan mengonfirmasi HTTP 413 bersih.
5. **`aggregateDaily` filter komoditas + wilayah + grade** (`mobile/src/lib/harga/
   aggregate.ts`) — sebelumnya HANYA filter grade (komoditas/wilayah diterima tapi
   tidak dipakai menyaring). Test baru: sumber dengan wilayah/komoditas berbeda TIDAK
   lagi mencemari rata-rata saat `aggregateDaily` dipanggil langsung (bukan lewat
   `getReferencePrice()` yang sudah pre-filter).
6. **Nudge "Paspor lengkap" via Supabase** — `mobile/server/pasporLookupSupabase.ts`
   (BARU): replikasi logika `lengkap`/`tier` yang SAMA PERSIS dengan versi AsyncStorage
   (`mobile/src/lib/harga/pasporLookup.ts`), tapi baca dari tabel Supabase
   `petani`/`plot`/`kartu` via REST (`mobile/server/supabaseRest.ts`, BARU — fetch()
   polos, bukan `@supabase/supabase-js` penuh, supaya server tetap ringan). Konversi
   `tier` web (`'export-ready'`, strip) ↔ mobile (`'export_ready'`, underscore)
   didokumentasikan eksplisit di satu titik. **Sebelumnya nudge ini benar-benar TIDAK
   PERNAH dipanggil** di `wahaWebhookServer.ts` (parameter `lookup` diomit total) —
   sekarang aktif, fail-soft (kalau Supabase belum dikonfigurasi/gagal, bot tetap
   balas harga TANPA nudge, bukan gagal total).
7. **Harga WA disambungkan ke data nyata** — `mobile/server/transaksiSource.ts`
   (BARU): `mapTransaksiToPriceSources()` (pure, testable) memetakan baris `Transaksi`
   individual (tabel `transaksi`, Sprint 20 web) ke `PriceSource[]` (bentuk yang
   dipakai `aggregateDaily`/`getReferencePrice` mobile — rumus SUDAH BENAR, tidak
   disentuh) dengan `txnCount: 1` per baris (satu transaksi nyata = bobot 1, prinsip
   matematis sama seperti dijelaskan di `src/lib/harga/aggregate.ts` web, Sprint 20).
   `wahaWebhookServer.ts` sekarang coba `fetchTransaksiPriceSources()` dulu, **fallback
   otomatis ke `SAMPLE_PRICE_SOURCES` berlabel DATA DEMO** (log eksplisit
   "membalas dengan DATA DEMO") kalau Supabase belum dikonfigurasi, fetch gagal, atau
   tabel kosong — tidak pernah mengklaim data sample sebagai data nyata.

**Env baru** (`mobile/.env.example`): `SUPABASE_URL`/`SUPABASE_ANON_KEY` — dipakai
HANYA oleh `mobile/server/` (proses Node standalone), BUKAN app Expo itu sendiri (yang
masih sepenuhnya offline/AsyncStorage, tidak berubah). Anon key publik, bukan
service_role, konsisten dengan aturan yang sama sejak Sprint 9 web.

**Verifikasi nyata**:
- `npx tsc --noEmit` di `mobile/` bersih (2 error pra-eksisting di `src/app/status.tsx`
  soal `theme/tokens.ts` yang tidak disentuh sama sekali oleh Sprint 22 — dikonfirmasi
  lewat `git diff --stat` kosong untuk file itu, di luar cakupan sprint ini).
- Jest **13 suite / 93 test — semua PASS** (naik dari 10 suite/67 test sebelum sprint
  ini; 4 suite baru: `supabaseRest`, `pasporLookupSupabase`, `transaksiSource`, plus
  test tambahan di `webhookParser` & `harga`).
- **Verifikasi end-to-end nyata tanpa instance WAHA** (tidak tersedia di lingkungan
  ini — dicatat jujur, bukan diklaim ada): `wahaWebhookServer.ts` dijalankan
  SUNGGUHAN (`npx tsx`, proses HTTP asli, bukan mock) di port lokal, diuji 5 skenario
  lewat `curl` sungguhan — pesan normal (200, diproses, coba balas — gagal graceful
  karena WAHA memang tidak dikonfigurasi di lingkungan ini, sesuai ekspektasi), pesan
  grup `@g.us` (200 ack, TIDAK diproses lebih lanjut, dikonfirmasi lewat log kosong),
  payload oversized (413 bersih setelah fix `req.pause()`), `fromMe:true` (200 ack,
  diabaikan), dan server tetap hidup+responsif setelah semua skenario (regresi: tidak
  ada crash dari salah satu request).

**Sengaja TIDAK dikerjakan**: "perbaikan" rata-rata berbobot ke 61.500 — lihat
penjelasan penolakan di atas.

---

## Ringkasan Sprint 18–22 (Fase Upgrade) — Rollup Penutup

> Ringkasan tingkat-tinggi. Detail teknis lengkap (file:line, algoritma, hasil test)
> ada di masing-masing entri sprint di atas — bagian ini TIDAK mengulang itu, hanya
> menyambungkan gambaran besarnya.

### Apa yang diaudit (Sprint 18)

Blueprint `docs/09_UPGRADE_BLUEPRINT.md` disusun dari dokumen yang di-share, bukan dari
membaca repo langsung — jadi sprint pertama fase ini murni audit (nol kode diubah):
konfirmasi struktur repo (web + `mobile/` + `mobile/server/`), tanda tangan fungsi inti
per file:line, status RLS per tabel (dibuktikan empiris via percobaan DELETE anon key,
bukan cuma baca dokumen), dan status 6 bug WA yang di-flag reviewer. Audit ini
mengoreksi beberapa asumsi blueprint yang meleset dari repo nyata (lihat "Audit
Sprint 18" di atas untuk tabelnya) — koreksi itu yang menentukan cakupan Sprint 19-22
di bawah, bukan blueprint asli apa adanya.

### Apa yang dibangun/diperbaiki per sprint

- **Sprint 19 — Skor Risiko Deforestasi Poligon**: `getPolygonRisk()` baru
  (`src/lib/geospatial.ts`), diwire ke `PolygonDrawer.tsx` yang sudah ada. **Dilewati**:
  UI gambar poligon (`PolygonRiskMap.tsx` yang diminta blueprint) — sudah ada dari sesi
  sebelum audit, tidak dibangun ulang.
- **Sprint 20 — Harga Referensi dari Transaksi Terverifikasi**: tabel `transaksi` +
  `src/lib/harga/aggregate.ts` (web) + halaman `HargaReferensi.tsx` (role-aware, Agen
  rekam+lihat, Eksportir lihat saja, Petani tidak dapat akses).
- **Sprint 21 — RLS Hardening + Consent Lintas-Device**: **dipersempit setelah blocker
  ditemukan** (app belum punya Supabase Auth sungguhan — lihat di bawah) dan
  dikonfirmasi ke user sebelum eksekusi. Yang dikerjakan: consent lintas-device via
  Supabase (`lib/consent.ts`) + RLS append-only untuk `hashchain`/`access_log`/
  `petani_document`. **Ditunda**: RLS per-role (`auth.uid()`) untuk tabel lain.
- **Sprint 22 — WA Bot Hardening + Wire Nudge**: 5 dari 6 bug diperbaiki (env scheme,
  `fromMe` ketat, tolak grup `@g.us`, `readBody` size-limit+413, filter
  `aggregateDaily`, nudge+harga via Supabase). **Ditolak** (bukan dikerjakan): "perbaiki"
  rata-rata berbobot ke 61.500 — nilai itu salah hitung, kode yang ada sudah benar.

### Daftar file baru/berubah (kumulatif Sprint 19–22)

**Web (root) — baru:**
`src/lib/harga/aggregate.ts`, `src/lib/komoditas.ts`, `src/pages/HargaReferensi.tsx`

**Web (root) — diubah:**
`src/lib/geospatial.ts`, `src/components/PolygonDrawer.tsx`, `src/types/index.ts`,
`src/lib/db.ts`, `src/lib/sync.ts`, `src/components/PlotForm.tsx`, `src/App.tsx`,
`src/components/DashboardShell.tsx`, `src/lib/consent.ts`

**Mobile — baru:**
`mobile/server/supabaseRest.ts`, `mobile/server/pasporLookupSupabase.ts`,
`mobile/server/transaksiSource.ts`, `mobile/server/__tests__/supabaseRest.test.ts`,
`mobile/server/__tests__/pasporLookupSupabase.test.ts`,
`mobile/server/__tests__/transaksiSource.test.ts`

**Mobile — diubah:**
`mobile/src/lib/harga/bot.ts`, `mobile/src/lib/harga/aggregate.ts`,
`mobile/server/webhookParser.ts`, `mobile/server/wahaWebhookServer.ts`,
`mobile/server/__tests__/webhookParser.test.ts`,
`mobile/src/lib/harga/__tests__/harga.test.ts`, `mobile/.env.example`

**SQL Supabase dijalankan user** (dikonfirmasi empiris lewat REST, bukan asumsi):
`alter table plot add column boundary jsonb`, tabel `transaksi` + `demo_allow_all`,
RLS append-only `hashchain`/`access_log`/`petani_document` — **ketiganya SUDAH aktif**.

### Keputusan teknis penting (dicatat eksplisit, bukan diam-diam)

1. **Blocker RLS per-role**: `auth.uid()` selalu `NULL` tanpa Supabase Auth sungguhan —
   menjalankan policy per-role sekarang akan mematikan seluruh app. Dikonfirmasi ke
   user via pertanyaan sebelum eksekusi, dipilih "partial hardening dulu". Per-role
   penuh butuh sprint Auth terpisah (belum dijadwalkan).
2. **Agregasi harga "samakan rumus", bukan modul shared**: web & mobile dua paket npm
   independen tanpa workspace — bikin monorepo sungguhan sekarang berisiko ke pipeline
   build yang sudah jalan (Vercel/Expo). Prinsip matematis disamakan (rumus rata-rata
   berbobot yang sama), diimplementasikan dua kali dengan bentuk data yang cocok
   masing-masing konteks (`Transaksi[]` individual di web, `PriceSource[]`
   pre-agregat di mobile — `txnCount:1` per baris transaksi adalah kasus khusus dari
   rumus yang sama, bukan rumus kedua).
3. **Satu bug "fix" DITOLAK**: rata-rata berbobot 61.250 sudah matematis benar (dihitung
   ulang manual + dikonfirmasi audit Sprint 18 + test PASS). Prompt yang minta ubah ke
   61.500 salah hitung — dituruti buta akan memasukkan bug ke kode yang benar.
4. **`req.pause()` bukan `req.destroy()`** untuk pembatasan ukuran payload webhook —
   ditemukan & diperbaiki SAAT verifikasi end-to-end (bukan cuma lolos test unit):
   `destroy()` mematikan socket sebelum HTTP 413 sempat terkirim.

### Known issues / gap yang tersisa (jujur, bukan disembunyikan)

- **Supabase Auth belum ada** — blocker utama Sprint 21 (lihat di atas). Tanpa ini:
  RLS per-role penuh, dan uji "agen A tidak bisa lihat data agen B", keduanya belum
  bisa dikerjakan/dibuktikan secara jujur.
- **`mobile/server/.env` perlu diisi manual** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  plus config WAHA yang sudah ada sebelumnya) supaya nudge Paspor & harga referensi
  nyata aktif di server webhook — tanpa ini, fallback otomatis ke perilaku sebelumnya
  (tanpa nudge / `SAMPLE_PRICE_SOURCES` berlabel DATA DEMO), bukan gagal total.
- **Tidak ada instance WAHA nyata di lingkungan ini** — verifikasi Sprint 22 dilakukan
  lewat server HTTP sungguhan + `curl`, BUKAN round-trip WhatsApp asli. Kalau WAHA
  sungguhan sudah dikonfigurasi, disarankan uji manual sekali: kirim "harga kopi
  Pangalengan" dari WA asli, konfirmasi balasan formatnya benar.
- **`markDocumentVerified()` masih dead code** (tidak diwire ke UI manapun) — kalau
  nanti diaktifkan untuk alur "petugas verifikasi dokumen", perlu policy `UPDATE`
  terpisah di `petani_document` (saat ini INSERT+SELECT saja, hasil hardening append-only
  Sprint 21).
- **Satu baris probe RLS tersisa di `hashchain`** (`id: "__rls-probe__"`, dibuat sesi
  ini untuk membuktikan append-only bekerja) — **tidak bisa dihapus lagi lewat anon
  key** (justru bukti hardening-nya berfungsi). Baris ini tidak terhubung ke
  petani/plot/kartu manapun (isolated `agent_id: "probe"`) sehingga tidak mengganggu
  verifikasi hash-chain agen manapun, tapi kalau mau tabel yang bersih sepenuhnya,
  perlu dihapus manual lewat Supabase Dashboard (akses admin, bukan anon key).
- **Harga referensi masih akan tampil "data belum cukup"** sampai ada minimal 3
  transaksi terverifikasi nyata per kombinasi komoditas×wilayah×grade — belum ada
  transaksi nyata yang direkam per penulisan ini (memang seharusnya begitu, bukan bug —
  guard ini sengaja mencegah angka menyesatkan dari sampel kosong).

---

## Perbaikan Pasca-Sprint-22 — Poligon-Only, Paket Bukti EUDR, Kelanjutan "Hubungi"

**Kenapa**: tiga permintaan user, dieksekusi via sesi Plan Mode eksplisit.

1. **Simplifikasi Tambah Plot**: user menilai mode "Titik Tunggal" tidak diperlukan —
   poligon (batas kebun sungguhan) langsung jadi satu-satunya alur, lebih "to the
   point". Sekalian ditambah input koordinat manual (lat/lng angka langsung) sebagai
   cara ketiga menambah titik poligon, selain tap peta & GPS — lebih cepat & presisi
   daripada tap di peta 3D miring, terutama untuk demo/testing.
2. **Bug data (bukan bug kode)**: user melaporkan "Cek Harga Referensi" tidak
   menemukan transaksi yang jelas-jelas sudah direkam. Dikonfirmasi lewat cek langsung
   ke Supabase: transaksi itu tersimpan dengan wilayah `"Pangelangan"` (typo — bukan
   "Pangalengan"). Filter exact-match memang sengaja ketat (menghindari fuzzy-match
   yang bisa diam-diam mencampur wilayah berbeda) — solusinya autocomplete, bukan
   melonggarkan filter.
3. **Paket Bukti Uji Tuntas (EUDR)**: user menanyakan apakah benar ada syarat dokumen
   untuk EUDR — dikonfirmasi BENAR (`docs/01_BLUEPRINT_FULL.md` baris 89 sudah mencatat
   ini sejak awal proyek). Dibangun fitur yang MERANGKUM data yang sudah ada (geolokasi,
   status deforestasi, legalitas dokumen, integritas hash-chain) jadi satu dokumen
   unduh untuk eksportir — dengan disclosure eksplisit ini dokumen PENDUKUNG, bukan DDS
   resmi (petani/platform tidak mengajukan DDS ke sistem UE, itu tetap tanggung jawab
   operator/eksportir).
4. **Kelanjutan "Hubungi"**: user menunjukkan bahwa setelah `attemptAccess()` return
   `authorized: true`, hasilnya cuma teks "Akses diizinkan" tanpa cara benar-benar
   menghubungi — buntu, tidak ada kelanjutan nyata.

**Keputusan dikonfirmasi user** (AskUserQuestion sebelum plan ditulis): Paket EUDR
**digerbang di belakang consent** (baru bisa diunduh SETELAH "Hubungi" berhasil, pola
sama seperti nomor kontak) — `attemptAccess()`/`isAuthorized()` tetap satu-satunya
jalur akses ke data sensitif petani, tidak ada pintu belakang baru. Cakupan: **hanya
`/eksportir/terdekat` dulu**, dashboard Eksportir utama tidak disentuh.

**Dibangun**:

1. **`src/pages/TambahPlot.tsx`** — mode toggle "Titik Tunggal"/"Poligon" DIHAPUS,
   poligon jadi satu-satunya alur. `src/components/PolygonDrawer.tsx` — tambah input
   koordinat manual (dua `Input type="number"` + tombol "Tambah Titik", validasi
   rentang lat -90..90/lng -180..180) sebagai cara ketiga menambah titik selain
   GPS/tap peta. `src/components/PlotForm.tsx` — teks kosong-koordinat diubah jadi
   "Selesaikan poligon batas kebun di atas dulu" (sebelumnya menyebut "Pakai GPS" yang
   sudah tidak relevan).
2. **`src/pages/HargaReferensi.tsx`** — `<datalist>` HTML native (zero dependency)
   untuk field Wilayah di form "Rekam Transaksi" (dari `ownTransaksi` lokal) dan "Cek
   Harga Referensi" (dari hasil fetch Supabase terakhir). Input tetap bebas ketik —
   datalist cuma saran, tidak memaksa dropdown. Data lama yang sudah salah ketik
   ("Pangelangan") SENGAJA tidak diubah otomatis (keputusan user, bukan diam-diam
   dimodifikasi).
3. **`src/pages/PetaniTerdekat.tsx`** — `contactResult` diubah dari `Record<string,
   string>` jadi `Record<string, {authorized: boolean; message: string}>` supaya ada
   sinyal boolean eksplisit (bukan cuma teks) untuk nge-gate kelanjutan. Setelah
   `authorized: true`: tampilkan nomor telepon petani + tombol "Chat WhatsApp" (link
   `https://wa.me/<nomor>`, REUSE `normalizePhone()` dari `lib/waha.ts` yang sudah ada
   untuk notif akses-tanpa-izin — TIDAK perlu WAHA server untuk ini, `wa.me` deep-link
   dibuka manual oleh Eksportir, bukan pesan otomatis) + link "Lihat Paket Bukti EUDR".
   Kalau `petani.telepon` kosong: pesan jujur "hubungi lewat Agen pendamping".
4. **`src/pages/PaketBuktiEudr.tsx`** (BARU), rute `/eksportir/paket/:kartuId` —
   **guard akses ganda**: halaman ini sendiri panggil `isAuthorized(kartuId,
   'Eksportir')` (REUSE `lib/consent.ts`, tidak ada jalur akses baru) saat dimuat,
   SEBELUM fetch data apa pun — supaya akses langsung lewat URL (bukan cuma lewat
   tombol) tetap tertolak kalau belum ada consent. Isi paket 100% REUSE data & fungsi
   yang sudah ada: `getPolygonRisk()` (Sprint 19, dihitung ulang saat unduh karena tidak
   pernah disimpan), `getDocumentCompleteness()` + `DocumentUpload` `readOnly` (Sprint
   16), `HashChainViewer` `entries`+`readOnly` dikelompokkan per-`agentId` (pola sama
   `EksportirDashboard.tsx`), `KartuCard` `readOnly`, QR code (pola `PassportCard.tsx`).
   Disclosure permanen (tidak bisa disembunyikan): "Dokumen pendukung... BUKAN Due
   Diligence Statement resmi. Pengajuan DDS ke sistem UE tetap tanggung jawab
   operator/eksportir." Tombol "Cetak/Unduh PDF" → `window.print()` (pola sama
   `PetaniPortal.tsx`, `.no-print` class yang sudah ada di `index.css`).

**Verifikasi nyata (Playwright, 2 browser context terpisah)**:
- **Guard ganda dibuktikan dengan kartu SUNGGUHAN tanpa consent** (bukan reuse kartu
  yang consent-nya sudah diberikan sebelumnya di test yang sama — percobaan pertama
  salah desain begitu, keliru mengira consent itu per-sesi padahal per-nama-pihak;
  diperbaiki dengan membuat petani B terpisah tanpa consent sama sekali): akses
  langsung `/eksportir/paket/:kartuId` untuk kartu TANPA consent → **"Akses ditolak"**.
- Petani A (consent sudah diberikan): link "Lihat Paket Bukti EUDR" **TIDAK muncul**
  sebelum klik Hubungi (regresi gate) → klik Hubungi → nomor telepon + tombol "Chat
  WhatsApp" muncul dengan link `wa.me/62...` format benar → link paket EUDR muncul →
  dibuka → semua bagian tampil (disclosure, geolokasi, legalitas dokumen, hash-chain,
  QR). Nol console error.
- Mode poligon-only: toggle "Titik Tunggal" dikonfirmasi TIDAK ADA lagi, UI poligon
  langsung aktif. Input koordinat manual: 3 titik ditambah via ketik angka (tanpa tap
  peta sama sekali) → estimasi luas muncul → validasi rentang (lat 200 → ditolak) →
  plot berhasil disimpan.
- Datalist wilayah: rekam transaksi baru dengan wilayah "Wilayah Datalist Test" →
  datalist di form yang sama langsung berisi nilai itu untuk transaksi berikutnya.
- `tsc -b --noEmit` + `npm run build` + `ruleEngine.test-cases.ts` — semua bersih/PASS
  (nol regresi ke tier/STDB, tidak disentuh sama sekali oleh perubahan ini).

**Sengaja TIDAK dikerjakan**: paket EUDR di Dashboard Eksportir utama (`/eksportir`,
hanya di Petani Terdekat sesuai keputusan user); normalisasi otomatis wilayah yang
sudah salah ketik (datalist cuma cegah typo baru); WAHA otomatis untuk kontak
Eksportir→Petani (pakai `wa.me` manual, bukan pesan terkirim sendiri).

---

## Perbaikan Pasca-Sprint-22 (lanjutan) — Fix Hash-Chain agentId, Periode Produksi EUDR, Rekomendasi Mitigasi Risiko

**Bug dilaporkan user**: "Rantai rusak di entri #0" muncul di Paket Bukti EUDR untuk
petani "Vassel" (data uji sungguhan, bukan demo).

**Investigasi**: recompute manual hash-chain "Vassel" lewat script Node berdiri sendiri
(mirror persis `stableStringify`/`computeDataHash`/`computeEntryHash` dari
`lib/hashchain.ts`) — ketemu **3 entri terpisah** semuanya `index=0,
previous_hash="GENESIS"` di bawah `agentId` yang SAMA, alih-alih satu rantai
berkelanjutan. Root cause: `agentId` disimpan di **localStorage** (`getDeviceAgentId()`)
sementara data hash-chain aktual ada di **IndexedDB** — dua penyimpanan yang independen.
Kalau IndexedDB direset/dibersihkan (mis. "Clear site data" browser yang tidak konsisten
menghapus localStorage) sementara `agentId` lama masih ada di localStorage,
`getDeviceAgentId()` memakai ulang ID lama padahal `getLastHashEntry()` (query ke
IndexedDB yang sudah kosong) tidak menemukan apa-apa → `appendEntry()` menulis ulang
index 0/GENESIS baru di bawah agentId yang sama, memecah rantai jadi beberapa
"generasi" yang masing-masing kelihatan valid sendiri-sendiri tapi rusak saat digabung
per-agentId (pola grouping yang dipakai `EksportirDashboard.tsx`/`PaketBuktiEudr.tsx`).

**Fix** (`src/lib/db.ts`, `getDB()` → `upgrade(db, oldVersion)`): tambah
`removeItem(DEVICE_AGENT_ID_KEY)` sebagai statement PERTAMA di dalam blok
`if (oldVersion < 1)` — blok ini HANYA jalan saat IndexedDB benar-benar baru di browser
tsb (bukan migrasi versi biasa), jadi titik yang tepat untuk memastikan agentId baru
juga selalu di-generate ulang, tidak pernah menimpa index 0 di bawah agentId yang sudah
pernah dipakai sebelumnya.

**Batasan jujur**: data "Vassel" yang SUDAH terlanjur pecah (3 fragmen) **permanen tidak
bisa diperbaiki lewat software** — RLS append-only Sprint 21 memblokir UPDATE/DELETE ke
tabel `hashchain` bahkan lewat anon key (dikonfirmasi lewat probe row yang gagal
dihapus). Ini trade-off jujur dari desain append-only: kesalahan pun jadi tak-dapat-diubah,
konsisten dengan filosofi "hash-chain, bukan blockchain, tapi tamper-evident" proyek ini.

**Verifikasi**: `tsc -b --noEmit` + `npm run build` bersih. Playwright regresi ulang
`test-verify-eudr-hashchain.mjs` atas 5 petani "Petani Terdekat" — 4 rantai (dibuat
SETELAH fix) semuanya **valid**, hanya "Vassel" (data SEBELUM fix) yang tetap
`broken=true` di entri #0 — sesuai ekspektasi (bukti fix bekerja untuk device baru, dan
bukti kerusakan lama memang tidak hilang sendiri).

### Fitur baru 1 — Periode Produksi (EUDR)

User bertanya: EUDR mensyaratkan geolokasi disertai waktu/periode produksi komoditas,
bukan cuma titik/poligon lokasi saja — apakah app ini sudah punya field itu? **Jawaban:
belum, ditambahkan sekarang.**

- `src/types/index.ts` — `Plot` dapat 2 field baru opsional:
  `periodeProduksiMulai`/`periodeProduksiSelesai` (string `YYYY-MM-DD`). Opsional
  supaya plot lama tanpa data ini tetap valid tanpa migrasi paksa.
- `src/components/PlotForm.tsx` — 2 `Input type="date"` baru di antara Komoditas dan
  Telepon, dengan penjelasan singkat kenapa field ini ada. Validasi: tanggal selesai
  tidak boleh sebelum tanggal mulai (blok submit + pesan error), tapi field ini sendiri
  BOLEH dikosongkan (tidak wajib — banyak petani belum tahu tanggal pastinya).
- `src/pages/TambahPlot.tsx` — diteruskan ke `addPlot()`.
- `src/lib/sync.ts` — kolom `periode_produksi_mulai`/`periode_produksi_selesai`
  ditambahkan ke `ALLOWED_COLUMNS.plot` (konversi camelCase↔snake_case otomatis lewat
  `toSupabaseRow`/`fromSupabaseRow`, tidak perlu kode konversi manual). **User perlu
  jalankan SQL manual di Supabase**: `alter table plot add column if not exists
  periode_produksi_mulai date, add column if not exists periode_produksi_selesai date;`
- `src/pages/PlotDetail.tsx` — ditampilkan di kartu "Informasi Plot".
- `src/pages/PaketBuktiEudr.tsx` — ditampilkan di kartu Geolokasi, dengan peringatan
  kuning kalau kosong ("Belum diisi — EUDR mensyaratkan geolokasi disertai periode
  produksi") supaya eksportir langsung lihat kalau ada data yang perlu dilengkapi.

### Fitur baru 2 — Rekomendasi Mitigasi Risiko Deforestasi

User minta: kalau risk assessment "sedang"/"tinggi", app harus menyediakan panduan
mitigasi konkret (mis. "perlu restorasi dan reboisasi"), bukan cuma badge risiko tanpa
tindak lanjut.

- `src/lib/geospatial.ts` — fungsi baru **pure, tidak disimpan** (dihitung ulang dari
  level risiko saat ini, konsisten dengan `getPolygonRisk()`):
  - `deforestasiStatusToRiskLevel()` — petakan `DeforestasiStatus` (titik-tunggal:
    aman/berisiko/perlu-audit) ke skala `PolygonRiskLevel` (rendah/sedang/tinggi) yang
    sama dipakai poligon, supaya satu set konten mitigasi berlaku untuk kedua jalur.
  - `getMitigationGuidance(level)` — konten referensi detail per level (judul,
    ringkasan, daftar aksi konkret, disclaimer). Level **sedang**: verifikasi lapangan
    (ground-truthing), foto kondisi lahan, telusuri riwayat lahan sebelum cut-off EUDR
    31 Des 2020, pertimbangkan buffer vegetasi tepi lahan. Level **tinggi**: audit
    lapangan wajib sebelum tier export-ready, susun rencana **restorasi & reboisasi**
    sesuai pedoman dinas kehutanan setempat, pertimbangkan pisahkan panen dari batch
    ekspor, konsultasi dinas lingkungan. **Disclaimer permanen**: "Rekomendasi umum
    berbasis praktik uji tuntas EUDR — bukan nasihat hukum/lingkungan resmi."
- `src/types/index.ts` — `Kartu` dapat field baru opsional `mitigasiRisiko` (catatan
  bebas petugas) + `mitigasiRisikoUpdatedAt`. **Murni advisory/log** — TIDAK pernah
  dibaca oleh `lib/ruleEngine.ts` (`tentukanTier`/`tentukanStdbStatus` tetap
  deterministik, tidak disentuh sama sekali).
- `src/components/KartuCard.tsx` — box rekomendasi otomatis muncul kapan pun
  `kartu.deforestasi !== 'aman'` (berlaku di SEMUA tempat `KartuCard` dipakai: Detail
  Plot Agen, Paket Bukti EUDR Eksportir — tanpa kode tambahan karena reuse komponen
  yang sama). Kalau sudah ada catatan mitigasi tersimpan, ditampilkan sebagai kutipan.
  Tombol "Catat Tindakan Mitigasi" (disembunyikan di mode `readOnly` — jadi Eksportir
  di Paket Bukti EUDR bisa LIHAT rekomendasi + catatan tapi tidak bisa mengedit, hanya
  Agen/petugas yang bisa) buka textarea, simpan lewat `commitKartu()` (REUSE hash-chain
  commit yang sudah ada — perubahan catatan mitigasi pun tercatat & terverifikasi di
  rantai, konsisten dengan semua perubahan kartu lain).
- `src/lib/sync.ts` — kolom `mitigasi_risiko`/`mitigasi_risiko_updated_at` ditambahkan
  ke `ALLOWED_COLUMNS.kartu`. **User perlu jalankan SQL manual di Supabase**:
  `alter table kartu add column if not exists mitigasi_risiko text, add column if not
  exists mitigasi_risiko_updated_at bigint;`

**Verifikasi (Playwright, build+preview)**: plot poligon dibuat di area forest-heavy
(koordinat sama dipakai `test-polygon-risk.mjs` sebelumnya untuk memastikan hasil
`perlu-audit`) dengan periode produksi terisi → Detail Plot menampilkan periode produksi
persis seperti diisi → "Buat & Commit Kartu" → status deforestasi `perlu-audit` → box
"Risiko tinggi — mitigasi wajib sebelum status export-ready" muncul otomatis dengan 5
poin aksi konkret (audit lapangan, restorasi & reboisasi, dst) → klik "Catat Tindakan
Mitigasi" → isi catatan → simpan → catatan tersimpan & tampil kembali setelah reload
state. Nol console error. `tsc -b --noEmit` + `npm run build` bersih.

**SQL yang perlu dijalankan user secara manual di Supabase** (belum dijalankan — sesuai
aturan proyek, semua perubahan skema Supabase dilakukan manual oleh user):

```sql
alter table plot
  add column if not exists periode_produksi_mulai date,
  add column if not exists periode_produksi_selesai date;

alter table kartu
  add column if not exists mitigasi_risiko text,
  add column if not exists mitigasi_risiko_updated_at bigint;
```

**PENTING — urutan langkah**: field baru sudah otomatis ikut ke `ALLOWED_COLUMNS` di
`lib/sync.ts`, artinya sinkron ke Supabase akan MENCOBA mengirim kolom
`periode_produksi_mulai`/`periode_produksi_selesai`/`mitigasi_risiko`/
`mitigasi_risiko_updated_at` mulai sekarang. Kalau SQL di atas BELUM dijalankan, upsert
plot/kartu ke Supabase akan gagal dengan error "column does not exist" dari Postgrest
(masuk syncQueue sebagai gagal, retry otomatis sampai 5x lalu berhenti — sesuai
`MAX_AUTO_RETRY_ATTEMPTS` yang sudah ada). Data tetap aman tersimpan LOKAL di IndexedDB
selama itu. **Jalankan SQL di atas dulu sebelum data baru mulai direkam**, supaya tidak
ada plot/kartu yang menumpuk gagal sinkron di antrean.

---

## Perbaikan Pasca-Sprint-22 (lanjutan lagi) — Foto Bukti Kebun (ganti Peta 3D Live di Paspor)

**Masalah dilaporkan user**: `PassportCard.tsx` (kartu yang dilihat petani di Portal
Petani) me-render `Map3D` (MapLibre GL + terrain 3D + tile jarak jauh) secara LIVE
setiap kali dibuka. Untuk device petani yang lemah/koneksi lambat, render WebGL + fetch
ulang tile tiap buka paspor bisa berat/lambat/gagal — padahal poligon batas kebun itu
sudah pernah digambar & dirender sempurna sekali oleh Agen saat pendataan.

**Solusi**: tangkap **screenshot statis** dari peta 3D persis saat poligon baru selesai
digambar (masih di device Agen, saat koneksi & device biasanya lebih baik), simpan
sebagai foto, lalu Paspor Petani menampilkan FOTO itu (elemen `<img>` biasa, murah
untuk device apa pun) alih-alih me-render ulang MapLibre setiap kali dibuka.

**Dibangun**:

1. **`src/components/Map3D.tsx`** — dikonversi ke `forwardRef` + `useImperativeHandle`
   mengekspor `getSnapshot(): Promise<string|null>`. Detail teknis penting:
   - `canvasContextAttributes: { preserveDrawingBuffer: true }` ditambahkan ke
     konstruktor `maplibregl.Map` — WAJIB, tanpa ini `getCanvas().toDataURL()` sering
     balikin canvas kosong karena WebGL default membersihkan drawing buffer tiap frame.
   - `getSnapshot()` menunggu event `'idle'` (+ `triggerRepaint()` untuk memastikan
     event itu benar-benar terpicu) sebelum membaca canvas — supaya tidak menangkap
     frame kosong/setengah-render saat tile/terrain masih loading.
   - Canvas asli (bisa 2-3x lebih besar dari device pixel ratio) di-downscale ke maks
     480px lebar via canvas sementara sebelum `toDataURL('image/jpeg', 0.6)` — hasil
     akhir ~20-35KB per foto, cukup kecil untuk IndexedDB & kolom Postgres `text`.
2. **`src/components/MapView.tsx`** — diteruskan jadi `forwardRef` juga (pure pass-through
   ke `Map3D`) supaya `TambahPlot.tsx` bisa panggil `getSnapshot()` lewat satu ref.
3. **`src/pages/TambahPlot.tsx`** — `handleFinishPolygon` sekarang `async`: begitu Agen
   klik "Selesai Poligon" (poligon sudah pasti ≥3 titik & sudah ter-render di peta),
   langsung panggil `mapRef.current.getSnapshot()`. State baru `capturingSnapshot`
   ditambahkan **bukan cuma kosmetik** — awalnya foto gagal ~50% waktu di uji Playwright
   karena race condition nyata: `setPolygonFinished(true)` (sinkron) bikin teks "Poligon
   selesai" langsung muncul, TAPI `getSnapshot()` (async, nunggu event `'idle'`) belum
   tentu selesai — Agen yang cepat isi form & klik "Simpan Plot" bisa submit SEBELUM
   foto selesai ditangkap, foto diam-diam hilang tanpa peringatan apa pun. Fix:
   `capturingSnapshot` ditampilkan sebagai teks "· Mengambil foto bukti…" DAN dipakai
   men-disable tombol "Simpan Plot" (`submitting={saving || capturingSnapshot}`) —
   race-nya beneran ditutup, bukan cuma disembunyikan.
4. **`src/types/index.ts`** — `Plot.boundarySnapshot?: string` (JPEG data URL). Opsional
   — plot lama atau capture yang gagal (offline/canvas kosong/dll) tetap valid, jatuh ke
   perilaku lama.
5. **`src/lib/sync.ts`** — `boundary_snapshot` ditambahkan ke `ALLOWED_COLUMNS.plot`.
6. **`src/components/PassportCard.tsx`** — kalau `plot.boundarySnapshot` ada, tampilkan
   `<img>` (dengan disclosure kecil "Foto batas kebun — diambil otomatis saat
   pendataan, bukan peta live") **menggantikan** `<Map3D>`. Kalau tidak ada (plot lama,
   atau capture gagal), fallback ke `<Map3D>` live seperti sebelumnya — regresi nol.

**Ditemukan & diperbaiki sekalian (regresi tak terkait, dari proses editing paralel di
luar sesi ini)**: saat verifikasi ulang lewat `tsc -b`, ditemukan 2 bug pre-existing yang
memblokir build:
- **`HashChainViewer.tsx` kehilangan seluruh fitur `readOnly` + simulasi tamper**
  (tombol "Simulasi ubah data (demo)"/"Reset demo" beserta `simulateTamper`/
  `restoreEntry` di `lib/hashchain.ts`) — hilang total dari kode, padahal README
  mendokumentasikan ini sebagai fitur nyata yang bisa didemokan live. Dipulihkan
  persis dari histori git (`git show <commit>:path`), digabung dengan perbaikan
  `EmptyState` yang sudah lebih baru di versi saat ini.
- **`HargaReferensi.tsx`** sempat punya JSX tidak seimbang (`<div>` ditutup `</SectionCard>`)
  dari refactor "Tambah Transaksi via Modal" yang sedang berjalan paralel (bukan dari
  sesi ini) — selesai terwiring sendiri sebelum verifikasi akhir, tidak perlu campur tangan.

**Verifikasi (Playwright, build+preview)**: plot poligon dibuat manual-coordinate → foto
ditangkap (26KB JPEG base64 dikonfirmasi) → kartu dibuat → ganti role ke Petani → cari
via email → Portal menampilkan `<img alt="Foto batas kebun">` dengan `src` data URL JPEG
valid, BUKAN `<canvas>` MapLibre. Test terpisah mengonfirmasi `simulateTamper`/
`restoreEntry` pulih 100%: Verifikasi Rantai → utuh → Simulasi ubah data → rusak
terdeteksi di entri yang tepat → Reset demo → utuh lagi. `tsc -b --noEmit` + `npm run
build` bersih.

**SQL yang perlu dijalankan user secara manual di Supabase**:

```sql
alter table plot add column if not exists boundary_snapshot text;
```

Sama seperti field EUDR sebelumnya: tanpa SQL ini, foto tetap tersimpan & tampil penuh
secara LOKAL, hanya sinkron ke Supabase yang akan gagal (retry otomatis lalu berhenti)
untuk kolom yang belum ada sampai SQL ini dijalankan.

### Susulan — Backfill foto untuk plot LAMA (`PlotDetail.tsx`)

User melaporkan kartu "Vassel" (data uji nyata, dibuat sebelum fitur ini ada) masih
menampilkan peta 3D live yang bisa digeser/di-zoom — perilaku fallback yang memang
disengaja (plot lama tidak punya `boundarySnapshot`), tapi tanpa cara memperbaikinya
selain menggambar ulang seluruh poligon dari nol lewat alur Tambah Plot.

**Dibangun**: `src/lib/db.ts` — `setPlotBoundarySnapshot(id, snapshot)`, fungsi kecil
khusus (bukan `updatePlot` generik — itu di luar cakupan permintaan ini) yang menambal
`boundarySnapshot` ke plot yang sudah ada + `enqueueSync`. `src/pages/PlotDetail.tsx` —
tombol "Ambil Foto Batas Kebun" muncul otomatis di bawah peta kalau
`plot.boundary.length >= 3 && !plot.boundarySnapshot` (peta yang sama yang sudah tampil
di halaman itu dipakai sebagai sumber `getSnapshot()`, tidak perlu Agen menggambar ulang
apa pun) — begitu berhasil, tombol hilang berganti keterangan "Foto batas kebun sudah
ada". Kalau gagal (offline/dll), pesan error tampil dan tombol tetap ada untuk dicoba
lagi.

**Catatan penting untuk "Vassel" spesifik**: karena `PetaniList.tsx`/`Home.tsx` di Agen
cuma baca IndexedDB LOKAL device itu (bukan gabungan lintas-device seperti
`EksportirDashboard.tsx`), tombol backfill ini hanya bisa dipakai dari **device/browser
yang memang punya plot itu di IndexedDB lokalnya** (biasanya device Agen yang aslinya
input data tsb). Kalau "Vassel" dibuat dari sesi/browser lain yang datanya sudah tidak
ada lagi secara lokal, foto tidak bisa di-backfill dari device manapun sampai
`PetaniList.tsx` diupgrade untuk gabung lokal+remote (perbaikan yang sama yang sudah
direkomendasikan di rencana fitur CRUD/audit-trail sebelumnya, belum diimplementasikan).

**Verifikasi (Playwright)**: plot baru dibuat (otomatis dapat foto) → foto DIHAPUS
manual langsung dari IndexedDB (simulasi plot lama) → reload → tombol "Ambil Foto Batas
Kebun" muncul → diklik → foto berhasil ditangkap dari peta yang sudah tampil di halaman
→ pesan "Foto batas kebun sudah ada" muncul, tombol hilang. `tsc -b --noEmit` + `npm run
build` bersih.

### Susulan lagi — Hapus tombol "Simulasi ubah data (demo)" / "Reset demo"

User minta tombol simulasi tamper di `HashChainViewer.tsx` (yang barusan dipulihkan dari
histori git di sesi ini karena hilang tak sengaja) dihapus lagi — kali ini permanen &
disengaja, bukan regresi. Dihapus total, bukan disembunyikan:
- `src/components/HashChainViewer.tsx` — tombol "Simulasi ubah data (demo)"/"Reset demo",
  `handleTamper`/`handleResetDemo`, state `tamperedBackup`, dan prop `readOnly` (satu-satunya
  fungsinya sebelumnya adalah menyembunyikan dua tombol ini — begitu tombolnya hilang,
  propnya jadi tidak berguna, jadi ikut dihapus, bukan dibiarkan jadi dead prop).
- `src/lib/hashchain.ts` — `simulateTamper()`/`restoreEntry()` dihapus (sudah tidak
  dipanggil dari mana pun).
- `src/lib/db.ts` — `putHashEntryRaw()` dihapus (satu-satunya pemanggilnya adalah dua
  fungsi demo di atas).
- 3 call site yang sebelumnya pass `readOnly` ke `HashChainViewer` (`EksportirDashboard.tsx`,
  `PaketBuktiEudr.tsx`, `PetaniPortal.tsx`) — prop itu dibuang dari pemanggilan
  `<HashChainViewer>` saja; `readOnly` di `<DocumentUpload>`/`<KartuCard>` pada baris yang
  sama TIDAK disentuh (itu prop terpisah, masih berfungsi penuh untuk komponen lain).
- `README.md` — klaim "Hit **Simulasi Ubah Data** → the chain breaks..." di bagian tour
  dihapus; baris tabel "Tamper detection" diubah supaya tidak lagi mengklaim ada tombol
  demo interaktif, tapi tetap jujur bahwa `verifyChain()` sendiri (deteksi mismatch hash
  entry-per-entry) tetap sepenuhnya nyata/berfungsi — cuma jalur pemicunya (tombol UI)
  yang dihapus, bukan mekanisme deteksinya.

**Verifikasi**: `tsc -b --noEmit` + `npm run build` bersih. `Verifikasi Rantai` tetap
berfungsi normal (dicoba manual di `/agen/plot/:id`) — cuma tombol simulasi & reset yang
hilang dari UI, sisanya HashChainViewer tidak berubah.
