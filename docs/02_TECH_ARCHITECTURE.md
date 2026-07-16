# 🏗️ TECH ARCHITECTURE — Paspor Petani v2

> Arsitektur, tech stack, data model, struktur folder, dan konvensi. Ini "sumber kebenaran teknis" — semua sprint mengacu ke sini. Claude Code baca ini saat kickoff.

---

## 1. Tech Stack (Final — Jangan Diganti Tanpa Alasan)

| Lapisan | Teknologi | Kegunaan |
|---|---|---|
| Framework | **React 18 + Vite + TypeScript** | UI, cepat, no build-hell |
| Styling | **Tailwind CSS** | styling cepat, konsisten |
| Peta | **Leaflet** + `react-leaflet` | tampil peta + tap koordinat |
| Raster | **geotiff** (GeoTIFF.js) | baca raster JRC offline |
| Geospasial | **@turf/turf** | operasi titik/area, jarak |
| Penyimpanan | **idb** (IndexedDB) | simpan data petani/plot/kartu (persist, besar) |
| Penyimpanan ringan | **localStorage** | setting + consent flags |
| Kripto | **crypto-js** | hashing untuk hash-chain |
| Offline | **vite-plugin-pwa** (Workbox) | service worker + manifest PWA |
| State | **React Context + hooks** (tanpa Redux) | cukup untuk MVP |
| ID | **nanoid** | id unik |
| Deploy | **Vercel** (push-to-deploy) | hosting instan |

**Install dasar (Sprint 1):**
```bash
npm create vite@latest paspor-petani -- --template react-ts
cd paspor-petani
npm install
npm install leaflet react-leaflet @turf/turf geotiff idb crypto-js nanoid
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
npm install -D @types/leaflet @types/crypto-js
```

---

## 2. Struktur Folder (WAJIB diikuti — biar FS & AI tidak konflik)

```
paspor-petani/
├── public/
│   ├── manifest.json
│   └── rasters/
│       └── pangalengan.json         # raster JRC yang sudah diproses (AI Engineer siapkan)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                    # tailwind directives
│   │
│   ├── types/
│   │   └── index.ts                 # SEMUA tipe TypeScript (kontrak antar-modul)
│   │
│   ├── lib/                         # logika inti (tanpa UI)
│   │   ├── db.ts                    # 🟦 FS  — IndexedDB (idb)
│   │   ├── storage.ts               # 🟦 FS  — localStorage wrapper
│   │   ├── hashchain.ts             # 🟦 FS  — hash-chain
│   │   ├── consent.ts               # 🟦 FS  — consent + access log + notif
│   │   ├── gps.ts                   # 🟩 AI  — wrapper geolocation
│   │   ├── raster.ts                # 🟩 AI  — load & baca raster JRC
│   │   ├── geospatial.ts            # 🟩 AI  — point-in-raster + turf
│   │   └── ruleEngine.ts            # 🟩 AI  — aturan status STDB
│   │
│   ├── hooks/
│   │   ├── useGeolocation.ts        # 🟩 AI
│   │   └── useOnlineStatus.ts       # 🟦 FS
│   │
│   ├── context/
│   │   └── AppContext.tsx           # 🟦 FS  — state global (petani aktif, dsb)
│   │
│   ├── components/
│   │   ├── MapView.tsx              # 🟦 FS (pakai lib/geospatial dari AI)
│   │   ├── PlotForm.tsx             # 🟦 FS
│   │   ├── KartuCard.tsx            # 🟦 FS
│   │   ├── HashChainViewer.tsx      # 🟦 FS
│   │   ├── ConsentPanel.tsx         # 🟦 FS
│   │   ├── NotifBanner.tsx          # 🟦 FS
│   │   └── OfflineIndicator.tsx     # 🟦 FS
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── PetaniList.tsx
│   │   └── PlotDetail.tsx
│   │
│   └── data/
│       └── dummyData.ts             # data demo (profil brako/Pangalengan, berlabel dummy)
├── scripts/
│   └── preprocess-raster.md         # 🟩 AI — cara crop & konversi JRC (dijelaskan di Sprint 3)
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

**Aturan anti-konflik git:**
- 🟦 **FS** hanya sentuh file bertag FS + `components/`, `pages/`, `context/`, `App.tsx`.
- 🟩 **AI** hanya sentuh file bertag AI di `lib/` + `hooks/useGeolocation.ts` + `scripts/`.
- **Kontrak** antar keduanya = `src/types/index.ts` (disepakati di Sprint 1, jarang berubah).

---

## 3. Data Model (Kontrak — `src/types/index.ts`)

```typescript
// ===== ENTITAS INTI =====

export interface Petani {
  id: string;
  nama: string;
  nikHash?: string;        // NIK di-hash (jangan simpan plaintext)
  telepon?: string;
  desa?: string;
  createdAt: number;
}

export interface Plot {
  id: string;
  petaniId: string;
  lat: number;
  lng: number;
  komoditas: string;       // default: "kopi"
  luasEstimasiHa?: number;
  gpsAccuracyM?: number;   // akurasi GPS (meter)
  capturedAt: number;
}

export type DeforestasiStatus = 'aman' | 'berisiko' | 'perlu-audit';

export interface DeforestasiCheck {
  plotId: string;
  status: DeforestasiStatus;
  rasterValue: number;     // nilai piksel raster
  catatanError: string;    // disclose commission error 18%
  checkedAt: number;
}

export type Tier = 'lokal' | 'export-ready';
export type StdbStatus = 'stdb-ready' | 'belum-lengkap';

export interface Kartu {
  id: string;
  plotId: string;
  petaniId: string;
  tier: Tier;
  stdbStatus: StdbStatus;
  alasan: string[];        // kenapa ready / belum
  deforestasi: DeforestasiStatus;
  hashChainRef: string;    // id entri hash-chain terakhir
  createdAt: number;
}

// ===== HASH-CHAIN =====

export interface HashChainEntry {
  id: string;
  index: number;           // urutan dalam rantai
  timestamp: number;
  payload: unknown;        // data yang di-hash (snapshot kartu)
  dataHash: string;        // hash dari payload
  previousHash: string;    // hash entri sebelumnya
  hash: string;            // hash gabungan (index+timestamp+dataHash+previousHash)
}

// ===== CONSENT & NOTIF =====

export interface ConsentRecord {
  id: string;
  kartuId: string;
  grantedTo: string;       // "bank" | "eksportir" | "koperasi" | nama
  scope: string[];         // ["lokasi","status","dokumen"]
  grantedAt: number;
  revokedAt?: number;
}

export interface AccessLog {
  id: string;
  kartuId: string;
  accessedBy: string;
  authorized: boolean;     // false → memicu notif
  timestamp: number;
  triggeredNotif: boolean;
}

export interface NotifItem {
  id: string;
  message: string;
  kartuId: string;
  severity: 'info' | 'warning' | 'alert';
  createdAt: number;
  read: boolean;
}
```

> **PENTING:** Tipe ini adalah kontrak. FS & AI sama-sama import dari sini. Kalau perlu ubah, diskusikan dulu (jarang perlu).

---

## 4. Arsitektur Alur Data

```
[GPS/Tap koordinat]
    → gps.ts (AI)
    → geospatial.ts point-in-raster (AI) ←── raster.ts baca pangalengan.json (AI)
    → DeforestasiCheck
    → ruleEngine.ts tentukan Tier + StdbStatus (AI)
    → Kartu (dibuat di context/UI oleh FS)
    → hashchain.ts bubuhi hash (FS)
    → db.ts simpan ke IndexedDB (FS)
    → consent.ts kelola izin + log akses + notif (FS)
    → UI render KartuCard + HashChainViewer + ConsentPanel + NotifBanner (FS)
```

---

## 5. Konvensi Kode

- **Bahasa:** komentar boleh Indonesia; nama variabel/fungsi English.
- **TypeScript strict** on.
- **Tidak ada** `any` kecuali `payload: unknown` di hash-chain.
- **Semua async** yang sentuh IndexedDB dibungkus try/catch.
- **Tidak pakai** localStorage/sessionStorage untuk data besar (pakai IndexedDB). localStorage hanya untuk flags kecil.
- **Offline-first:** tidak ada fungsi inti yang butuh internet. Kalau ada (mis. mock e-STDB), harus ada fallback + label "mock".
- **Commit:** `git commit -m "sprint-N: <ringkasan singkat>"` tiap sprint.

---

## 6. Catatan Data Raster (untuk AI Engineer)

- Sumber: **JRC Global Forest Cover 2020 (GFC2020)**, gratis, lisensi terbuka (atribusi).
- Untuk MVP: crop 1 wilayah demo (**Pangalengan, Bandung**, ~50×50 km bbox).
- Konversi ke format ringan yang bisa dibaca browser offline: **GeoJSON grid** atau **GeoTIFF terkompres** (< 20 MB). Detail langkah di Sprint 3.
- Kalau raster asli susah didapat cepat → buat **raster tiruan berlabel** (grid nilai 0/1 untuk area hutan/non-hutan Pangalengan) supaya demo tetap jalan. **Tandai jelas ini data ilustratif.**

---

## 7. Definisi "Point-in-Raster" (inti geospasial)

Diberi titik (lat, lng), cari piksel raster yang memuat titik itu, ambil nilainya:
- nilai = "hutan" → status `berisiko` atau `perlu-audit` (karena commission error 18%, kopi bernaung bisa false-positive → **jangan langsung tolak, tandai perlu-audit**).
- nilai = "non-hutan" → status `aman`.
- Selalu sertakan `catatanError` yang men-disclose 18% commission error.

---

Lanjut baca: `03_MVP_SCOPE.md`.
