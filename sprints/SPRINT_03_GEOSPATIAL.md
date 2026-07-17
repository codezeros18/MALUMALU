# 🟩 SPRINT 3 — Geospatial Core

| | |
|---|---|
| **Role** | 🟩 **AI Engineer** |
| **Prasyarat** | Sprint 1 (setup) selesai oleh FS. Kickoff sudah dijalankan di instance AI. |
| **Estimasi** | ~4–5 jam (termasuk preprocessing raster) |
| **Paralel dengan** | FS mengerjakan Sprint 2 |

---

## 🎯 Tujuan
Membangun inti geospasial: wrapper GPS, preprocessing raster JRC (crop Pangalengan → format ringan offline), pembacaan raster, dan fungsi point-in-raster yang mengeluarkan `DeforestasiCheck`. Ini "otak" yang membedakan proyek — bikin nyata, bukan tempelan.

## ✅ Task
- [ ] 3.1 `lib/gps.ts`
- [ ] 3.2 Preprocessing raster JRC → Pangalengan
- [ ] 3.3 Simpan ke `public/rasters/pangalengan.json`
- [ ] 3.4 `lib/raster.ts` (load offline)
- [ ] 3.5 `lib/geospatial.ts` (point-in-raster + turf)
- [ ] 3.6 `cekDeforestasi(lat,lng)` → `DeforestasiCheck`

---

## 📥 Catatan Data Raster (baca dulu)
- Sumber ideal: **JRC Global Forest Cover 2020**. Kalau bisa diunduh & di-crop cepat → pakai itu.
- Kalau akses/ukuran jadi kendala di 30 jam → **buat raster tiruan berlabel**: grid nilai (0 = non-hutan, 1 = hutan) untuk bbox Pangalengan (~ -7.20..-7.10 lat, 107.55..107.70 lng), resolusi grid kecil (mis. 100×100 sel). **Tandai jelas di file bahwa ini data ilustratif untuk demo.** Jujur > canggih.
- Format output ringan yang mudah dibaca browser offline: **JSON** berisi `{ bbox, width, height, values: number[] }` (row-major). Simpan di `public/rasters/pangalengan.json`.

---

## >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 3 — Geospatial Core untuk JejakHijau v2 (aku role AI Engineer).
Acuan: docs/02_TECH_ARCHITECTURE.md (bagian "Point-in-Raster" + data model DeforestasiCheck).
PENTING: aku HANYA menyentuh file milik role AI: src/lib/gps.ts, src/lib/raster.ts, src/lib/geospatial.ts, src/hooks/useGeolocation.ts (nanti Sprint 4), scripts/, public/rasters/. Jangan ubah file lain.

Lakukan:

1. src/lib/gps.ts:
   - Fungsi getCurrentPosition(): Promise<{lat:number; lng:number; accuracyM:number}> memakai navigator.geolocation dengan opsi enableHighAccuracy, timeout, maximumAge. Bungkus error dengan pesan ramah.
   - Fungsi watchPosition(cb) opsional untuk update live.

2. Preprocessing raster (buat scripts/preprocess-raster.md yang mendokumentasikan langkah + skrip yang dipakai):
   - Target: peta risiko deforestasi wilayah Pangalengan (bbox kira-kira lat -7.20..-7.10, lng 107.55..107.70).
   - Jika JRC GFC2020 tersedia: jelaskan cara crop ke bbox & konversi ke JSON grid {bbox, width, height, values} (0=non-hutan,1=hutan).
   - Jika tidak tersedia cepat: generate raster TIRUAN berlabel — grid 100x100 dengan pola realistis (sebagian besar area kebun=0, beberapa kantong hutan=1). Beri komentar jelas "DATA ILUSTRATIF UNTUK DEMO".
   - Hasilkan file public/rasters/pangalengan.json.

3. Buat public/rasters/pangalengan.json sesuai format {bbox:[minLng,minLat,maxLng,maxLat], width, height, values:number[]}. Row-major, values panjang = width*height.

4. src/lib/raster.ts:
   - Fungsi loadRaster(): Promise<RasterData> yang fetch "/rasters/pangalengan.json" (bekerja offline setelah di-cache). Cache hasil di memori (singleton) supaya tidak fetch berulang.
   - Tipe RasterData = { bbox:[number,number,number,number]; width:number; height:number; values:number[] }.

5. src/lib/geospatial.ts:
   - Fungsi pointToPixel(lat,lng,raster): konversi koordinat → indeks sel grid (col,row) berdasarkan bbox+width+height. Kembalikan null jika di luar bbox.
   - Fungsi getRasterValue(lat,lng,raster): number|null.
   - (Opsional) pakai @turf/turf untuk hitung jarak/estimasi luas bila diperlukan.

6. Fungsi utama cekDeforestasi(lat,lng): Promise<DeforestasiCheck> (impor tipe dari src/types/index.ts):
   - load raster, ambil nilai piksel.
   - nilai=1 (hutan) → status "perlu-audit" (BUKAN langsung "berisiko"/tolak), karena commission error 18% (kebun kopi bernaung sering false-positive).
   - nilai=0 (non-hutan) → status "aman".
   - di luar bbox atau null → status "perlu-audit".
   - Selalu isi catatanError: "Peta JRC ~91% akurasi, commission error ~18% (kebun kopi bernaung bisa terbaca hutan). Perlu audit manual bila 'perlu-audit'."
   - Isi rasterValue & checkedAt.

7. Buat contoh pemanggilan kecil (di komentar atau file scratch) untuk 3 titik: satu 'aman', satu 'perlu-audit', satu di luar bbox — supaya bisa diverifikasi.

Setelah selesai:
- Pastikan TypeScript bersih.
- Jelaskan cara FS memanggil cekDeforestasi() nanti di Sprint 4.
- Sarankan commit: `git commit -m "sprint-3: geospatial core, raster loader, point-in-raster, cekDeforestasi"`.
```

## <<< AKHIR PROMPT <<<

---

## ✔️ Definition of Done
- `public/rasters/pangalengan.json` ada (asli atau tiruan berlabel).
- `cekDeforestasi(lat,lng)` mengembalikan `DeforestasiCheck` valid untuk titik aman / perlu-audit / luar-bbox.
- `catatanError` selalu men-disclose 18% commission error.
- Bekerja tanpa internet setelah raster ter-fetch sekali.
- TypeScript bersih.

## 📌 Setelah Selesai
1. Centang 3.1–3.6 di `TRACKER.md`.
2. Commit + kabari FS: `lib/geospatial.cekDeforestasi` & `lib/gps` siap dipakai di Sprint 4.
3. AI Engineer lanjut menunggu Sprint 4 selesai (bagian map) → lalu kerjakan **Sprint 5** (rule engine). Sambil menunggu, boleh baca `SPRINT_05_RULE_ENGINE.md`.
