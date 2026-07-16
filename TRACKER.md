# ✅ TRACKER — Paspor Petani v2

> **Papan pelacakan utama.** Setelah tiap task selesai & lolos Definition of Done, ganti `[ ]` → `[x]`.
> Legenda: `[ ]` belum · `[x]` ✅ selesai · `[~]` 🟡 sedang dikerjakan · `[!]` ❌ blocked/gagal
>
> Kolom Role: 🟦 FS (Fullstack/kamu) · 🟩 AI (AI Engineer)

---

## 📊 Ringkasan Progres MVP

| Sprint | Nama | Role | Status | Progres |
|---|---|---|---|---|
| 1 | Setup & Foundation | 🟦 FS | ⬜ | 0/6 |
| 2 | Data Layer | 🟦 FS | ⬜ | 0/5 |
| 3 | Geospatial Core | 🟩 AI | ⬜ | 0/6 |
| 4 | Map UI & Plot Tagging | 🟦 FS +🟩 | ⬜ | 0/6 |
| 5 | Rule Engine & Kartu | 🟩 AI | ⬜ | 0/5 |
| 6 | Hash-Chain | 🟦 FS | ⬜ | 0/5 |
| 7 | Consent & Notif | 🟦 FS | ⬜ | 0/6 |
| 8 | Offline, Polish, Deploy | 🟦 FS +🟩 | ⬜ | 0/7 |

**MVP: 0/46 task selesai.**

---

## 🟦 SPRINT 1 — Setup & Foundation (FS)
- [ ] 1.1 Scaffold Vite + React + TypeScript (`npm create vite`)
- [ ] 1.2 Install semua dependency (leaflet, turf, geotiff, idb, crypto-js, dll)
- [ ] 1.3 Setup Tailwind CSS + `index.css`
- [ ] 1.4 Buat struktur folder sesuai arsitektur + `src/types/index.ts` (kontrak)
- [ ] 1.5 Setup routing (Home / PetaniList / PlotDetail) + PWA manifest dasar
- [ ] 1.6 Init git, repo publik, **commit pertama BLANK**, lalu commit setup

## 🟦 SPRINT 2 — Data Layer (FS)
- [ ] 2.1 Setup IndexedDB (`lib/db.ts`) + object stores semua entitas
- [ ] 2.2 CRUD helper: Petani (add/get/list/update)
- [ ] 2.3 CRUD helper: Plot & Kartu
- [ ] 2.4 CRUD helper: HashChainEntry, ConsentRecord, AccessLog, NotifItem
- [ ] 2.5 `lib/storage.ts` (localStorage wrapper) + `hooks/useOnlineStatus.ts`

## 🟩 SPRINT 3 — Geospatial Core (AI)
- [ ] 3.1 `lib/gps.ts` — wrapper geolocation + akurasi
- [ ] 3.2 Preprocessing raster JRC → Pangalengan (crop + konversi ringan)
- [ ] 3.3 Simpan hasil ke `public/rasters/pangalengan.json` (atau .tif)
- [ ] 3.4 `lib/raster.ts` — load raster offline
- [ ] 3.5 `lib/geospatial.ts` — point-in-raster + turf
- [ ] 3.6 Fungsi `cekDeforestasi(lat,lng)` → `DeforestasiCheck` (+ disclose error 18%)

## 🟦 SPRINT 4 — Map UI & Plot Tagging (FS +🟩 assist)
- [ ] 4.1 `components/MapView.tsx` — Leaflet center Pangalengan
- [ ] 4.2 Tap peta → tangkap koordinat + tombol "pakai GPS"
- [ ] 4.3 `components/PlotForm.tsx` — registrasi petani singkat
- [ ] 4.4 Simpan Petani + Plot ke DB
- [ ] 4.5 Tampil marker plot di peta
- [ ] 4.6 `hooks/useGeolocation.ts` (🟩) terintegrasi

## 🟩 SPRINT 5 — Rule Engine & Kartu (AI)
- [ ] 5.1 `lib/ruleEngine.ts` — tentukan Tier (lokal/export-ready)
- [ ] 5.2 Tentukan StdbStatus + alasan (array)
- [ ] 5.3 Integrasi DeforestasiCheck → status kartu
- [ ] 5.4 Fungsi `generateKartu(plot, petani, check)` → `Kartu`
- [ ] 5.5 Unit test kecil / contoh kasus (aman, berisiko, belum-lengkap)

## 🟦 SPRINT 6 — Hash-Chain (FS)
- [ ] 6.1 `lib/hashchain.ts` — buat entri berantai (crypto-js)
- [ ] 6.2 Fungsi `appendEntry(payload)` + `verifyChain()`
- [ ] 6.3 Simpan rantai ke IndexedDB
- [ ] 6.4 `components/HashChainViewer.tsx` — tampil rantai
- [ ] 6.5 Tombol "simulasi ubah data" → tampil rantai RUSAK (tamper-evident)

## 🟦 SPRINT 7 — Consent & Notif (FS)
- [ ] 7.1 `lib/consent.ts` — grant/revoke izin per kartu
- [ ] 7.2 Catat AccessLog tiap akses
- [ ] 7.3 Akses tak-terotorisasi → buat NotifItem (alert)
- [ ] 7.4 `components/ConsentPanel.tsx` — kelola izin
- [ ] 7.5 `components/NotifBanner.tsx` — tampil notif real-time
- [ ] 7.6 Tombol override manual pada kartu

## 🟦 SPRINT 8 — Offline, Polish, Deploy (FS +🟩 assist)
- [ ] 8.1 Setup `vite-plugin-pwa` (Workbox) — cache app + raster
- [ ] 8.2 `components/OfflineIndicator.tsx`
- [ ] 8.3 Uji offline (matikan wifi → app + data + raster jalan)
- [ ] 8.4 Isi `data/dummyData.ts` (profil Pangalengan, berlabel dummy)
- [ ] 8.5 Polish UI Tailwind + disclose keterbatasan di UI
- [ ] 8.6 Deploy Vercel (atau siapkan localhost demo)
- [ ] 8.7 Rehearsal demo 6-langkah + commit final

---

## 🎉 MVP DONE?
- [ ] Semua 46 task ✅
- [ ] Killer flow jalan offline & live tanpa error
- [ ] Deploy sukses / demo siap

---

## 🧩 POST-MVP (isi setelah MVP hijau — lihat `features/POST_MVP_FEATURES.md`)
- [ ] P1 Draf dosir LLM
- [ ] P2 Multi-plot management
- [ ] P3 Ekspor PDF
- [ ] P4 Mock sinkron e-STDB
- [ ] P5 Ringkasan koperasi
- [ ] P6 Multi-bahasa
