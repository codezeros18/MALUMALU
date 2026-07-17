# 🎯 MVP SCOPE — JejakHijau v2

> Batas tegas: apa yang dibangun di MVP (8 sprint) vs yang ditunda. Baca ini supaya nggak over-scope. Prioritas mutlak: **MVP jalan offline & demoable dulu.**

---

## 1. Prinsip Scope

1. **MVP dulu, fitur nanti.** 8 sprint MVP harus hijau semua sebelum sentuh fitur pelengkap.
2. **Killer flow > kelengkapan.** Yang penting 6 langkah alur inti jalan mulus, bukan banyak fitur.
3. **Offline & demoable = syarat lulus tiap sprint.**
4. **Jujur > canggih.** Disclose keterbatasan, jangan overclaim.

---

## 2. Fitur MVP (DIBANGUN — 8 Sprint)

| # | Fitur | Sprint | Role | Status |
|---|---|---|---|---|
| F1 | Setup proyek + PWA base + Tailwind + routing | 1 | 🟦 FS | ⬜ |
| F2 | Data layer (IndexedDB) + types + storage | 2 | 🟦 FS | ⬜ |
| F3 | Geospatial core (point-in-raster + GeoTIFF + GPS) | 3 | 🟩 AI | ⬜ |
| F4 | Map UI + tap-to-tag plot + registrasi petani | 4 | 🟦 FS +🟩 | ⬜ |
| F5 | Rule engine STDB + generate kartu (tiered) | 5 | 🟩 AI | ⬜ |
| F6 | Hash-chain + tamper-evident viewer | 6 | 🟦 FS | ⬜ |
| F7 | Consent panel + access log + notif engine + override | 7 | 🟦 FS | ⬜ |
| F8 | Offline (service worker) + dummy data + polish + deploy | 8 | 🟦 FS +🟩 | ⬜ |

---

## 3. Detail Tiap Fitur MVP

### F1 — Setup & Foundation
Scaffold Vite React TS, Tailwind, struktur folder sesuai arsitektur, PWA manifest dasar, routing (Home / PetaniList / PlotDetail), `types/index.ts` (kontrak), git repo publik (commit pertama blank).

### F2 — Data Layer
IndexedDB via `idb`: object store untuk Petani, Plot, Kartu, HashChainEntry, ConsentRecord, AccessLog, NotifItem. CRUD helper. localStorage wrapper untuk setting/flags. Semua async + try/catch.

### F3 — Geospatial Core
`gps.ts` (wrapper geolocation + akurasi), `raster.ts` (load pangalengan.json/tif offline), `geospatial.ts` (point-in-raster + turf), preprocessing raster JRC (crop Pangalengan → format ringan). Output: `DeforestasiCheck`.

### F4 — Map UI & Plot Tagging
Leaflet map center Pangalengan, tap → tangkap koordinat (atau pakai GPS tombol), form registrasi petani singkat, tampil marker plot, simpan Plot ke DB.

### F5 — Rule Engine & Kartu
`ruleEngine.ts`: dari DeforestasiCheck + kelengkapan data → tentukan Tier (lokal/export-ready) + StdbStatus + alasan. Generate objek Kartu. UI KartuCard render hasil.

### F6 — Hash-Chain
`hashchain.ts`: bikin entri berantai (index, timestamp, dataHash, previousHash, hash) pakai crypto-js. Simpan ke DB. `HashChainViewer.tsx`: tampil rantai + tombol "simulasi ubah data" → tunjukkan rantai rusak (tamper-evident). **Ini money-moment demo.**

### F7 — Consent & Notif
`consent.ts`: grant/revoke izin akses per kartu, catat AccessLog. Akses tak-terotorisasi → buat NotifItem (severity alert). `ConsentPanel.tsx` (kelola izin), `NotifBanner.tsx` (tampil notif), tombol override manual pada kartu.

### F8 — Offline, Polish, Deploy
`vite-plugin-pwa` (Workbox) service worker → app + raster ter-cache, jalan offline. `OfflineIndicator.tsx`. Isi `dummyData.ts` (profil Pangalengan/brako, berlabel dummy). Polish Tailwind. Deploy Vercel. Rehearsal demo (uji matikan wifi).

---

## 4. DITUNDA (Post-MVP — hanya kalau ada waktu)

| # | Fitur | Kenapa ditunda |
|---|---|---|
| P1 | Draf dosir via LLM (+ templat fallback) | Nice-to-have, bukan killer flow |
| P2 | Multi-plot per petani + list management | MVP cukup 1 plot per demo |
| P3 | Ekspor kartu ke PDF | Tambahan, bukan inti |
| P4 | Mock sinkron e-STDB (tombol "andai tersambung") | Cukup label statis di MVP |
| P5 | Ringkasan/statistik koperasi | Dashboard = post-MVP |
| P6 | Mode multi-bahasa | Tambahan |

*(Detail post-MVP di `features/POST_MVP_FEATURES.md`.)*

---

## 5. DI-CUT TOTAL (Jangan Dibangun)

- Poligon presisi (GPS drift → point-primary saja).
- Dashboard agregat 12-modul.
- Fitur harga/premium/pembayaran.
- Blockchain publik (pakai hash-chain saja).
- Backend server (semua client-side offline; kecuali deploy statis).

---

## 6. Definition of MVP Done (checklist besar)

- [ ] Demo 6-langkah killer flow jalan live tanpa error.
- [ ] Jalan **offline** (wifi mati, app + data + raster tetap jalan).
- [ ] Hash-chain tamper-evident bisa didemokan (ubah data → rantai rusak).
- [ ] Notif akses tak-terotorisasi muncul.
- [ ] Override manual jalan.
- [ ] Deploy Vercel sukses (atau localhost siap).
- [ ] Repo publik, ≥3 commit, commit pertama blank.
- [ ] UI men-disclose keterbatasan (akurasi peta ~91%, error 18%, point-primary).
- [ ] Semua 8 baris di `TRACKER.md` ✅.

---

Lanjut: buka `TRACKER.md` untuk mulai melacak, lalu `prompts/PROMPT_00_KICKOFF.md`.
