# Preprocessing Raster — JRC GFC2020 (Pangalengan)

Target: peta risiko deforestasi untuk demo Pangalengan, Bandung.
bbox: lat **-7.20 .. -7.10**, lng **107.55 .. 107.70**.
Format output: `public/rasters/pangalengan.json`
```
{ bbox: [minLng, minLat, maxLng, maxLat], width, height, values: number[] }
```
`values` row-major, panjang = `width * height`. `0` = non-hutan, `1` = hutan.
Konvensi baris: **row 0 = utara (maxLat)**, row bertambah ke selatan — lihat `src/lib/geospatial.ts` (`pointToPixel`) yang mengasumsikan konvensi ini.

## Status saat ini: DATA ILUSTRATIF (bukan JRC asli)

Untuk sprint 30 jam ini, JRC GFC2020 asli belum sempat di-crop & dikonversi. Sebagai
gantinya dipakai raster **tiruan berlabel** yang dihasilkan `scripts/generate-raster.mjs`:
grid 100x100, sebagian besar sel = non-hutan (lahan kebun), dengan 4 "kantong hutan"
berbentuk blob melingkar. File hasil (`public/rasters/pangalengan.json`) memuat field
`note` yang secara eksplisit menyatakan **"DATA ILUSTRATIF UNTUK DEMO"** — jangan
dihapus/disembunyikan di UI (lihat prinsip disclose keterbatasan di `docs/01_BLUEPRINT_FULL.md`).

Jalankan ulang (kalau perlu regenerasi):
```bash
node scripts/generate-raster.mjs
```

## Titik verifikasi (dipakai untuk uji cekDeforestasi)

| Kasus | lat | lng | rasterValue | status |
|---|---|---|---|---|
| aman | -7.1055 | 107.55825 | 0 | `aman` |
| perlu-audit (di dalam kantong hutan) | -7.1755 | 107.61825 | 1 | `perlu-audit` |
| di luar bbox | -6.90 | 106.80 | null | `perlu-audit` |

Cara cek manual (Node, tanpa browser):
```bash
node -e "
const raster = require('./public/rasters/pangalengan.json');
console.log(raster.bbox, raster.width, raster.height, raster.values.length);
"
```

## Cara mengganti dengan JRC GFC2020 asli (kalau ada waktu / akses data)

1. Unduh tile JRC Global Forest Cover 2020 yang mencakup bbox Pangalengan (lisensi
   terbuka, atribusi wajib) dari sumber resmi JRC.
2. Crop ke bbox `[107.55, -7.20, 107.70, -7.10]` (pakai `geotiff.js` di Node, atau GDAL
   `gdalwarp -te 107.55 -7.20 107.70 -7.10 ...` kalau tersedia di mesin preprocessing).
3. Baca band forest/non-forest per piksel (biasanya nilai kelas tertentu = tutupan hutan),
   resample/downsample ke resolusi yang wajar untuk browser (mis. lebar/tinggi ratusan,
   bukan puluhan ribu piksel — supaya file JSON tetap ringan, < 20 MB).
4. Tulis ulang ke format `{bbox, width, height, values}` yang sama persis dengan di atas,
   row-major, row 0 = utara.
5. Ganti field `note` dengan atribusi sumber asli (JRC GFC2020) dan hapus label
   "DATA ILUSTRATIF" — TAPI tetap pertahankan disclosure commission error ~18% di
   `catatanError` (`src/lib/geospatial.ts`), karena itu properti dataset JRC, bukan
   artefak data tiruan.
6. `src/lib/raster.ts` dan `src/lib/geospatial.ts` tidak perlu diubah selama format JSON
   tetap sama — hanya isi `public/rasters/pangalengan.json` yang diganti.
