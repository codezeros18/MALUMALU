#!/usr/bin/env node
// Generates the DEMO risk raster for Pangalengan in the same format the
// website team's real JRC GFC2020 preprocessing will produce.
// Format: { source, bbox: {latMin,latMax,lngMin,lngMax}, rows, cols, cells[][] }
// cell value 1 = deforestation indicated post-2020, 0 = clear. Row 0 = north edge.
const fs = require('fs');

const rows = 20;
const cols = 20;
const cells = Array.from({ length: rows }, (_, r) =>
  Array.from({ length: cols }, (_, c) =>
    (r < 5 && c >= 14) || (r >= 12 && r <= 14 && c >= 3 && c <= 6) ? 1 : 0,
  ),
);

const raster = {
  source: 'JRC GFC2020 (DATA DEMO — ilustratif)',
  bbox: { latMin: -7.25, latMax: -7.05, lngMin: 107.52, lngMax: 107.72 },
  rows,
  cols,
  cells,
};

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/pangalengan.json', JSON.stringify(raster));
console.log('wrote src/data/pangalengan.json');
