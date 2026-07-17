# 🟦 SPRINT 8 — Offline, Polish, Demo & Deploy

| | |
|---|---|
| **Role** | 🟦 **Fullstack (FS)** + 🟩 **AI Engineer** (bantu caching raster offline) |
| **Prasyarat** | Sprint 1–7 selesai |
| **Estimasi** | ~4–6 jam (termasuk rehearsal) |

---

## 🎯 Tujuan
Membuat app benar-benar **offline-first** (service worker), memoles UI + men-disclose keterbatasan, mengisi data demo (profil Pangalengan berlabel dummy), deploy ke Vercel, dan rehearsal demo 6-langkah. Ini sprint penutup MVP.

## ✅ Task
- [ ] 8.1 `vite-plugin-pwa` (Workbox) cache app + raster
- [ ] 8.2 `OfflineIndicator.tsx`
- [ ] 8.3 Uji offline (wifi mati → tetap jalan)
- [ ] 8.4 `dummyData.ts` (berlabel dummy)
- [ ] 8.5 Polish UI + disclose keterbatasan
- [ ] 8.6 Deploy Vercel
- [ ] 8.7 Rehearsal + commit final

---

## >>> PROMPT UNTUK CLAUDE CODE (FS) >>>

```
Kita mulai SPRINT 8 — Offline, Polish, Deploy untuk JejakHijau v2 (aku role Fullstack).
Acuan: docs/03_MVP_SCOPE.md (F8) + Definition of MVP Done. Gunakan vite-plugin-pwa (Workbox).

Lakukan:

1. Konfigurasi vite-plugin-pwa untuk offline penuh:
   - registerType: 'autoUpdate'.
   - workbox.globPatterns: cache semua aset build (js, css, html, ico, png, svg).
   - runtimeCaching / tambahan: pastikan file /rasters/pangalengan.json ikut ter-precache (masukkan ke includeAssets atau globPatterns) supaya point-in-raster jalan offline.
   - Manifest lengkap: name, short_name, icons (buat icon sederhana 192 & 512 hijau bila belum ada), theme_color #1F5C3A, background_color, display standalone, start_url "/".

2. src/components/OfflineIndicator.tsx: badge kecil di header memakai useOnlineStatus → "🟢 Online" / "🔴 Offline (mode lapangan)". Saat offline, tegaskan app tetap berfungsi.

3. src/data/dummyData.ts: buat data demo realistis berbasis profil Pangalengan/kopi (mis. 3 petani, masing-masing 1 plot dengan koordinat di dalam bbox Pangalengan, komoditas "kopi"). BERI LABEL JELAS di komentar & di UI (badge "DATA DEMO") bahwa ini data ilustratif, bukan data pemasok nyata. Sediakan fungsi seedDummyData() yang mengisi DB bila kosong (dipanggil via tombol "Muat data demo", bukan otomatis).

4. Polish UI (Tailwind), mobile-first:
   - Alur demo jelas & cepat: Home (peta + form) → simpan plot → tampil Kartu (dengan tier + status + alasan) → HashChainViewer → ConsentPanel → NotifBanner.
   - Tambahkan bagian "Tentang akurasi" kecil yang MEN-DISCLOSE: "Peta risiko: JRC GFC2020, akurasi ~91%, commission error ~18% (kebun kopi bernaung bisa terbaca hutan). Titik lokasi (point-primary) karena GPS di bawah kanopi meleset 3–11 m. Rantai verifikasi = hash-chain (bukan blockchain). Data demo berlabel."
   - Pastikan teks Indonesia, tombol besar, kontras baik.

5. Uji offline end-to-end:
   - Build (`npm run build`) + preview (`npm run preview`).
   - Buka app, muat data demo, lalu MATIKAN network (devtools offline / matikan wifi) → pastikan: peta koordinat/logika, point-in-raster, generate kartu, hash-chain, consent, notif SEMUA tetap jalan. (Tile peta dasar boleh kosong offline — itu OK.)
   - Perbaiki bila ada yang butuh internet di alur inti.

6. Deploy:
   - Siapkan untuk deploy Vercel (vercel.json bila perlu, atau instruksi `vercel --prod`). Pastikan build output benar (dist).
   - Beri instruksi langkah deploy + verifikasi PWA installable (Lighthouse PWA check opsional).

7. Commit final: `git commit -m "sprint-8: offline pwa, dummy data, polish, disclosures, deploy-ready"`.

Setelah selesai:
- Berikan checklist verifikasi "Definition of MVP Done" dan tandai mana yang sudah lolos.
- Berikan skrip langkah demo 6-langkah singkat untuk rehearsal.
```

## <<< AKHIR PROMPT <<<

---

## >>> PROMPT TAMBAHAN UNTUK 🟩 AI ENGINEER (bila raster offline belum sempurna) >>>

```
Aku AI Engineer, bantu Sprint 8 bagian caching raster offline untuk JejakHijau v2.
Masalah: pastikan /rasters/pangalengan.json tersedia offline setelah pertama load, dan lib/raster.ts membacanya dengan benar dari cache.
Lakukan:
1. Verifikasi loadRaster() di src/lib/raster.ts memakai path absolut "/rasters/pangalengan.json" dan meng-cache hasil di memori.
2. Pastikan file raster ikut di-precache Workbox (koordinasi dengan konfigurasi vite-plugin-pwa milik FS: tambahkan ekstensi json ke globPatterns atau includeAssets).
3. Tambahkan fallback: bila fetch raster gagal (offline & belum ter-cache), tampilkan pesan ramah + tetap izinkan input manual koordinat (status default 'perlu-audit').
4. Uji: load app online sekali → matikan network → cekDeforestasi tetap mengembalikan hasil.
Sarankan commit: `git commit -m "sprint-8-ai: offline raster caching + fallback"`.
```

## <<< AKHIR PROMPT <<<

---

## ✔️ Definition of Done (= Definition of MVP Done)
- [ ] Killer flow 6 langkah jalan live tanpa error.
- [ ] **Offline**: wifi mati → point-in-raster, kartu, hash-chain, consent, notif tetap jalan.
- [ ] Hash-chain tamper-evident bisa didemokan.
- [ ] Notif akses tak-terotorisasi muncul.
- [ ] Override manual jalan.
- [ ] UI men-disclose keterbatasan (akurasi 91%/error 18%, point-primary, hash-chain bukan blockchain, data demo berlabel).
- [ ] Deploy Vercel sukses / localhost preview siap.
- [ ] Repo publik, ≥3 commit, commit pertama blank.

## 📌 Setelah Selesai
1. Centang 8.1–8.7 + blok "MVP DONE" di `TRACKER.md`.
2. Commit + push final.
3. 🎉 MVP selesai. Kalau masih ada waktu → buka `features/POST_MVP_FEATURES.md`.
