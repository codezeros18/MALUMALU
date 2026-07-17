# 🟦 SPRINT 1 — Setup & Foundation

| | |
|---|---|
| **Role** | 🟦 **Fullstack (FS / kamu)** |
| **Prasyarat** | Kickoff (`PROMPT_00_KICKOFF.md`) sudah selesai |
| **Estimasi** | ~2–3 jam |
| **Blok berikutnya** | Setelah ini, FS → Sprint 2; AI → Sprint 3 (paralel) |

---

## 🎯 Tujuan
Menyiapkan fondasi proyek: scaffold Vite React TS, semua dependency, Tailwind, struktur folder, kontrak tipe (`types/index.ts`), routing, PWA manifest dasar, dan git repo publik dengan commit pertama blank.

## ✅ Task (centang di TRACKER.md)
- [ ] 1.1 Scaffold Vite + React + TypeScript
- [ ] 1.2 Install dependency
- [ ] 1.3 Tailwind CSS
- [ ] 1.4 Struktur folder + `types/index.ts`
- [ ] 1.5 Routing + PWA manifest dasar
- [ ] 1.6 Git init + commit pertama BLANK

---

## >>> PROMPT UNTUK CLAUDE CODE (copy semua di bawah) >>>

```
Kita mulai SPRINT 1 — Setup & Foundation untuk proyek JejakHijau v2.
Ikuti docs/02_TECH_ARCHITECTURE.md sebagai acuan stack & struktur folder.

Lakukan berurutan:

1. Scaffold proyek Vite React TypeScript di folder ini (root = jejakhijau). Jika folder sudah ada isinya, sesuaikan tanpa menimpa file blueprint.

2. Install dependency berikut:
   - runtime: leaflet, react-leaflet, @turf/turf, geotiff, idb, crypto-js, nanoid, react-router-dom
   - dev: tailwindcss, postcss, autoprefixer, vite-plugin-pwa, @types/leaflet, @types/crypto-js

3. Setup Tailwind CSS (init config, tambahkan directive @tailwind ke src/index.css, konfigurasi content paths).

4. Buat struktur folder PERSIS seperti di docs/02_TECH_ARCHITECTURE.md bagian "Struktur Folder":
   - src/types/, src/lib/, src/hooks/, src/context/, src/components/, src/pages/, src/data/
   - public/rasters/
   - Buat file kosong placeholder (dengan komentar // TODO: sprint-N owner) untuk tiap file yang tercantum, supaya owner tinggal isi.

5. Isi src/types/index.ts LENGKAP dengan semua interface dari docs/02_TECH_ARCHITECTURE.md bagian "Data Model" (Petani, Plot, DeforestasiCheck, Kartu, HashChainEntry, ConsentRecord, AccessLog, NotifItem, dan type union-nya). Ini kontrak antar-modul, buat selengkap mungkin.

6. Setup React Router dengan 3 route: "/" (Home), "/petani" (PetaniList), "/plot/:id" (PlotDetail). Buat komponen halaman placeholder sederhana untuk masing-masing.

7. Setup PWA dasar: konfigurasi vite-plugin-pwa di vite.config.ts (registerType autoUpdate, manifest dengan name "JejakHijau", short_name "JejakHijau", theme_color hijau #1F5C3A, display standalone). Buat public/manifest.json bila perlu. (Service worker caching detail dikerjakan di Sprint 8, cukup fondasinya dulu.)

8. Buat App.tsx yang merender router + layout dasar (header "JejakHijau" + area konten). Pastikan `npm run dev` jalan tanpa error.

9. Setup Tailwind design token dasar: warna utama hijau (#1F5C3A, #2E7D4F), font sans. Buat header sederhana yang enak dilihat.

10. Git: inisialisasi repo, buat .gitignore (node_modules, dist). PENTING: buat commit PERTAMA yang KOSONG (blank) dengan: `git commit --allow-empty -m "init: blank first commit"`. Lalu commit hasil setup dengan: `git commit -m "sprint-1: project setup, tailwind, routing, types, pwa base".

Setelah selesai:
- Jalankan `npm run dev` dan pastikan tidak ada error.
- Berikan ringkasan file yang dibuat.
- Ingatkan aku untuk push ke GitHub sebagai repo PUBLIC.
- Konfirmasi Sprint 1 selesai dan bahwa AI Engineer sekarang bisa mulai Sprint 3 secara paralel.
```

## <<< AKHIR PROMPT <<<

---

## ✔️ Definition of Done
- `npm run dev` jalan tanpa error, tampil header "JejakHijau".
- Struktur folder sesuai arsitektur; `src/types/index.ts` berisi SEMUA tipe.
- 3 route jalan (Home/PetaniList/PlotDetail).
- PWA manifest ter-load (cek di devtools > Application).
- Git: commit pertama blank + commit setup ada. Repo siap di-push publik.

## 📌 Setelah Selesai
1. Push ke GitHub sebagai **repo publik**.
2. Centang task 1.1–1.6 di `TRACKER.md`.
3. Kabari AI Engineer: boleh mulai **Sprint 3** (paralel).
4. FS lanjut ke **Sprint 2**.
