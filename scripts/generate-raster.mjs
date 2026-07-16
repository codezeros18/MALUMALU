// Generator raster TIRUAN (ilustratif) untuk demo Pangalengan.
// Dipakai selama JRC GFC2020 asli belum diproses (lihat scripts/preprocess-raster.md).
// Jalankan: node scripts/generate-raster.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WIDTH = 100;
const HEIGHT = 100;
// [minLng, minLat, maxLng, maxLat] — bbox kira-kira Pangalengan, Bandung.
const BBOX = [107.55, -7.2, 107.7, -7.1];

// Kantong "hutan" (value=1) berbentuk blob melingkar; sisanya non-hutan (value=0)
// merepresentasikan kebun/lahan petani. Posisi & radius dipilih manual agar ada
// contoh titik "aman", "perlu-audit" yang jelas untuk verifikasi.
const FOREST_BLOBS = [
  { row: 15, col: 20, radius: 9 },
  { row: 40, col: 70, radius: 7 },
  { row: 75, col: 45, radius: 10 },
  { row: 60, col: 15, radius: 6 },
];

function isForest(row, col) {
  return FOREST_BLOBS.some((b) => {
    const dr = row - b.row;
    const dc = col - b.col;
    return Math.sqrt(dr * dr + dc * dc) <= b.radius;
  });
}

const values = new Array(WIDTH * HEIGHT);
for (let row = 0; row < HEIGHT; row++) {
  for (let col = 0; col < WIDTH; col++) {
    values[row * WIDTH + col] = isForest(row, col) ? 1 : 0;
  }
}

const raster = {
  bbox: BBOX,
  width: WIDTH,
  height: HEIGHT,
  values,
  note:
    'DATA ILUSTRATIF UNTUK DEMO — bukan JRC GFC2020 asli. Grid hutan/non-hutan tiruan ' +
    'dibuat manual untuk kebutuhan hackathon 30 jam. Ganti dengan raster JRC asli ' +
    '(lihat scripts/preprocess-raster.md) sebelum klaim produksi.',
};

const outPath = join(__dirname, '..', 'public', 'rasters', 'pangalengan.json');
writeFileSync(outPath, JSON.stringify(raster));
console.log(`Raster ditulis ke ${outPath} (${WIDTH}x${HEIGHT}, ${values.length} sel)`);
