# 📖 PROGRESS LOG — Paspor Petani v2 (Sprint 0–8, Fase MVP)

> Dokumentasi naratif dari semua yang sudah dikerjakan sampai akhir fase MVP. Tujuannya:
> supaya sesi Claude Code manapun (baru, reset, atau dilanjutkan orang lain) bisa paham
> state repo saat ini **tanpa perlu re-derive dari nol**. Baca ini sebelum mulai
> `docs/05_FULL_PRODUCTION_PROMPTS.md` Sprint 9.
>
> Gaya penulisan: apa yang dibangun → keputusan/deviasi penting + alasannya → hasil
> verifikasi nyata (bukan cuma "tsc bersih") → state akhir.

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

## State Akhir Repo (baseline untuk Sprint 9 — full-production)

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
