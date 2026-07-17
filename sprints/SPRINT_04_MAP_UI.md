# 🟦 SPRINT 4 — Map UI & Plot Tagging

| | |
|---|---|
| **Role** | 🟦 **Fullstack (FS)** — pakai modul `lib/geospatial` & `lib/gps` dari 🟩 AI |
| **Prasyarat** | Sprint 1, 2 (FS) **dan** Sprint 3 (AI) selesai |
| **Estimasi** | ~3–4 jam |
| **Titik gabung** | Ini merge point pertama FS + AI |

---

## 🎯 Tujuan
Membangun antarmuka peta: tampilkan peta Pangalengan, tap untuk menandai plot (atau pakai GPS), form registrasi petani singkat, simpan Petani + Plot ke DB, tampilkan marker. Inilah langkah 1 killer flow ("tap plot").

## ✅ Task
- [ ] 4.1 `MapView.tsx` (Leaflet, center Pangalengan)
- [ ] 4.2 Tap peta → koordinat + tombol GPS
- [ ] 4.3 `PlotForm.tsx` (registrasi petani)
- [ ] 4.4 Simpan Petani + Plot ke DB
- [ ] 4.5 Marker plot di peta
- [ ] 4.6 `useGeolocation.ts` (🟩 AI bantu) terintegrasi

---

## >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 4 — Map UI & Plot Tagging untuk JejakHijau v2 (aku role Fullstack).
Modul geospasial sudah tersedia dari Sprint 3: src/lib/gps.ts (getCurrentPosition) dan src/lib/geospatial.ts (cekDeforestasi). Data layer dari Sprint 2: src/lib/db.ts (addPetani, addPlot, dst). Pakai tipe dari src/types/index.ts.

Lakukan:

1. src/hooks/useGeolocation.ts (jika belum dibuat AI): hook yang membungkus lib/gps.getCurrentPosition, mengembalikan { position, loading, error, request() }.

2. src/components/MapView.tsx memakai react-leaflet:
   - Peta ter-center di Pangalengan (lat -7.15, lng 107.62, zoom ~13).
   - Gunakan tile layer OpenStreetMap. CATATAN OFFLINE: tile online tidak akan muncul saat offline; itu OK untuk MVP (peta dasar boleh kosong offline), yang penting KOORDINAT & LOGIKA tetap jalan offline. Tambahkan fallback: bila offline, tampilkan grid/placeholder sederhana + tetap izinkan tap koordinat. (Caching tile lanjutan = post-MVP.)
   - onClick peta → tangkap {lat,lng} → panggil callback prop onPickLocation(lat,lng).
   - Tampilkan marker untuk daftar plot yang diberikan via prop.

3. src/components/PlotForm.tsx:
   - Form singkat: nama petani (wajib), desa (opsional), komoditas (default "kopi"), telepon (opsional).
   - Menampilkan koordinat terpilih (dari tap peta atau tombol "Pakai GPS" yang memanggil useGeolocation).
   - Tombol "Pakai GPS" → isi koordinat + tampilkan akurasi (m). Jika akurasi > 20m, tampilkan catatan kecil "akurasi rendah di bawah kanopi (point-primary)".
   - Tombol "Simpan Plot".

4. Alur simpan (di Home.tsx atau komponen container):
   - Saat submit: addPetani(...) → dapat petaniId → addPlot({petaniId, lat, lng, komoditas, gpsAccuracyM, capturedAt}) → simpan.
   - Simpan active-petani-id & plot terakhir ke localStorage (via storage.ts) untuk dipakai sprint berikutnya.
   - Setelah simpan, tampilkan marker plot baru di MapView + navigasi/scroll ke ringkasan plot.

5. src/pages/Home.tsx: rangkai MapView + PlotForm + daftar plot tersimpan (ambil dari DB). Layout mobile-first (mudah dipakai di HP lapangan), tombol besar, teks jelas.

6. Pastikan tap peta ATAU GPS dua-duanya bisa mengisi koordinat. Prioritaskan UX cepat (<30 detik dari buka app sampai plot tersimpan).

7. Belum perlu panggil cekDeforestasi di sini (itu Sprint 5 saat generate kartu) — tapi siapkan agar plotId mudah diteruskan.

Setelah selesai:
- Uji: tap peta → isi form → simpan → marker muncul → data ada di IndexedDB.
- Uji tombol GPS (boleh pakai koordinat dummy jika di emulator).
- Sarankan commit: `git commit -m "sprint-4: map view, plot tagging, petani form, save to db"`.
```

## <<< AKHIR PROMPT <<<

---

## ✔️ Definition of Done
- Peta tampil, center Pangalengan.
- Tap peta / GPS mengisi koordinat.
- Form registrasi petani jalan; Petani + Plot tersimpan di IndexedDB.
- Marker plot muncul di peta.
- Alur "buka app → plot tersimpan" < 30 detik.

## 📌 Setelah Selesai
1. Centang 4.1–4.6 di `TRACKER.md`.
2. Commit.
3. Kabari **AI Engineer**: map + plot siap → mulai **Sprint 5** (rule engine & kartu).
4. FS bisa menunggu Sprint 5 atau siapkan Sprint 6 (baca dulu).
