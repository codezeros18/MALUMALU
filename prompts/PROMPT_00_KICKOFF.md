# 🟢 PROMPT 00 — KICKOFF (Baca Ini Dulu Sebelum Sprint 1)

> **Dipakai oleh:** 🟦 FS **dan** 🟩 AI (dua-duanya jalankan kickoff ini di instance Claude Code masing-masing).
> **Kapan:** paling awal, sekali, sebelum sprint apa pun.
> **Tujuan:** Claude Code membaca seluruh konteks proyek supaya semua sprint berikutnya konsisten.

---

## Cara Pakai
1. Pastikan folder `paspor-petani-blueprint/` sudah ada di dalam workspace VS Code kamu.
2. Copy **SELURUH blok di bawah** (antara garis `>>>` dan `<<<`).
3. Paste ke Claude Code → enter.
4. Tunggu sampai Claude Code selesai membaca & memberi ringkasan pemahaman + rencana. **Jangan lanjut ke Sprint 1 sebelum ini selesai.**

---

>>> COPY MULAI DARI SINI >>>

Kamu adalah engineer yang akan membantu membangun proyek **Paspor Petani v2**, sebuah aplikasi PWA web offline-first (React + Vite + TypeScript) untuk kompetisi hackathon 30 jam.

TUGAS KICKOFF (lakukan sekarang, berurutan):

1. Baca dan pahami file konteks berikut di folder `paspor-petani-blueprint/`:
   - `00_START_HERE.md` (peta paket + role + cara pakai)
   - `docs/01_BLUEPRINT_FULL.md` (ide lengkap & alasan)
   - `docs/02_TECH_ARCHITECTURE.md` (tech stack, data model, struktur folder, konvensi — INI SUMBER KEBENARAN TEKNIS)
   - `docs/03_MVP_SCOPE.md` (batas MVP, yang dibangun vs ditunda)
   - `TRACKER.md` (daftar sprint & task)

2. Setelah membaca, berikan ringkasan singkat (maksimal 15 baris) yang membuktikan kamu paham:
   - Apa produk ini dalam 1 kalimat.
   - Killer flow 6 langkah.
   - Tech stack final yang dipakai.
   - Struktur folder & aturan anti-konflik antara role Fullstack (FS) dan AI Engineer (AI).
   - Prinsip penting: offline-first, deterministik, hash-chain (bukan blockchain), point-primary, disclose keterbatasan, MVP dulu.

3. Konfirmasi aturan kerja yang akan kamu patuhi di semua sprint berikutnya:
   - Ikuti struktur folder & tipe data (`src/types/index.ts`) sebagai kontrak.
   - Hanya kerjakan file sesuai role yang sedang dijalankan (jangan sentuh file role lain kecuali diminta).
   - Semua fungsi inti harus jalan offline; tidak ada dependency internet di alur inti.
   - Bungkus operasi IndexedDB dengan try/catch.
   - Jangan overclaim di UI; disclose keterbatasan peta (akurasi ~91%, commission error 18%) dan point-primary (GPS drift 3–11m).
   - Setelah tiap sprint, sarankan pesan commit `git commit -m "sprint-N: <ringkasan>"`.

4. JANGAN menulis kode apa pun sekarang. Kickoff ini HANYA untuk membaca konteks & konfirmasi pemahaman. Tunggu prompt sprint berikutnya.

5. Akhiri dengan: "✅ Kickoff selesai. Siap menerima prompt Sprint 1." (untuk FS) atau "✅ Kickoff selesai. Siap menerima prompt Sprint 3." (untuk AI).

<<< COPY SAMPAI SINI <<<

---

## Setelah Kickoff
- **🟦 FS** → lanjut ke `sprints/SPRINT_01_SETUP.md`.
- **🟩 AI** → tunggu Sprint 1 (setup) selesai dari FS, lalu lanjut ke `sprints/SPRINT_03_GEOSPATIAL.md`. (AI bisa mulai baca `SPRINT_03` & siapkan data raster sambil menunggu.)
