// Skenario uji manual untuk ruleEngine.ts — deterministik, tanpa framework test runner.
// Jalankan langsung: node src/lib/ruleEngine.test-cases.ts
// (Import di sini pakai ekstensi ".ts" eksplisit supaya file bisa dieksekusi langsung
// oleh Node — bukan konvensi umum proyek ini, hanya untuk script self-check ini.)

import {
  generateKartu,
  tentukanTier,
  tentukanStdbStatus,
  type RuleEngineInput,
} from './ruleEngine.ts';
import type { Petani, Plot, DeforestasiCheck } from '../types/index.ts';

function makePetani(nama: string): Petani {
  return { id: 'petani-test', nama, createdAt: 0 };
}

function makePlot(lat: number, lng: number): Plot {
  return { id: 'plot-test', petaniId: 'petani-test', lat, lng, komoditas: 'kopi', capturedAt: 0 };
}

function makeCheck(status: DeforestasiCheck['status']): DeforestasiCheck {
  return {
    plotId: 'plot-test',
    status,
    rasterValue: status === 'aman' ? 0 : 1,
    catatanError: 'contoh catatan error untuk uji',
    checkedAt: 0,
  };
}

function assertEqual(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(
    `${ok ? 'PASS' : 'FAIL'} — ${label}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`,
  );
  if (!ok) throw new Error(`Assertion failed: ${label}`);
}

// ===== Kasus A: data lengkap + STDB + aman -> export-ready + stdb-ready =====
const inputA: RuleEngineInput = {
  nama: 'Bu Ani',
  lat: -7.15,
  lng: 107.62,
  komoditas: 'kopi',
  deforestasi: 'aman',
  punyaSTDB: true,
  klaimKepemilikan: true,
};
console.log('\n=== Kasus A: lengkap + STDB + aman ===');
assertEqual('tentukanTier(A)', tentukanTier(inputA), 'export-ready');
assertEqual('tentukanStdbStatus(A).status', tentukanStdbStatus(inputA).status, 'stdb-ready');

const kartuA = generateKartu({
  petani: makePetani(inputA.nama),
  plot: makePlot(inputA.lat, inputA.lng),
  check: makeCheck('aman'),
  punyaSTDB: true,
  klaimKepemilikan: true,
});
console.log('generateKartu(A):', kartuA);
assertEqual('kartuA.tier', kartuA.tier, 'export-ready');
assertEqual('kartuA.stdbStatus', kartuA.stdbStatus, 'stdb-ready');

// ===== Kasus B: data lengkap tanpa STDB + perlu-audit -> lokal + stdb-ready (alasan audit) =====
const inputB: RuleEngineInput = {
  nama: 'Pak Budi',
  lat: -7.1755,
  lng: 107.61825,
  komoditas: 'kopi',
  deforestasi: 'perlu-audit',
  punyaSTDB: false,
  klaimKepemilikan: true,
};
console.log('\n=== Kasus B: lengkap tanpa STDB + perlu-audit ===');
assertEqual('tentukanTier(B)', tentukanTier(inputB), 'lokal');
const statusB = tentukanStdbStatus(inputB);
assertEqual('tentukanStdbStatus(B).status', statusB.status, 'stdb-ready');
assertEqual(
  'tentukanStdbStatus(B) punya alasan audit',
  statusB.alasan.some((a) => a.includes('audit manual')),
  true,
);

const kartuB = generateKartu({
  petani: makePetani(inputB.nama),
  plot: makePlot(inputB.lat, inputB.lng),
  check: makeCheck('perlu-audit'),
  punyaSTDB: false,
  klaimKepemilikan: true,
});
console.log('generateKartu(B):', kartuB);
assertEqual('kartuB.tier', kartuB.tier, 'lokal');
assertEqual('kartuB.stdbStatus', kartuB.stdbStatus, 'stdb-ready');

// ===== Kasus C: nama kosong + berisiko -> lokal + belum-lengkap (alasan kekurangan) =====
const inputC: RuleEngineInput = {
  nama: '',
  lat: -7.15,
  lng: 107.62,
  komoditas: 'kopi',
  deforestasi: 'berisiko',
  punyaSTDB: false,
  klaimKepemilikan: false,
};
console.log('\n=== Kasus C: nama kosong + berisiko ===');
assertEqual('tentukanTier(C)', tentukanTier(inputC), 'lokal');
const statusC = tentukanStdbStatus(inputC);
assertEqual('tentukanStdbStatus(C).status', statusC.status, 'belum-lengkap');
assertEqual('tentukanStdbStatus(C) alasan >= 2', statusC.alasan.length >= 2, true);

const kartuC = generateKartu({
  petani: makePetani(inputC.nama),
  plot: makePlot(inputC.lat, inputC.lng),
  check: makeCheck('berisiko'),
  punyaSTDB: false,
  klaimKepemilikan: false,
});
console.log('generateKartu(C):', kartuC);
assertEqual('kartuC.tier', kartuC.tier, 'lokal');
assertEqual('kartuC.stdbStatus', kartuC.stdbStatus, 'belum-lengkap');

// ===== Determinisme: input identik -> keputusan identik (id/createdAt boleh beda) =====
console.log('\n=== Determinisme ===');
const kartuAUlang = generateKartu({
  petani: makePetani(inputA.nama),
  plot: makePlot(inputA.lat, inputA.lng),
  check: makeCheck('aman'),
  punyaSTDB: true,
  klaimKepemilikan: true,
});
assertEqual('determinisme tier', kartuAUlang.tier, kartuA.tier);
assertEqual('determinisme stdbStatus', kartuAUlang.stdbStatus, kartuA.stdbStatus);
assertEqual('determinisme alasan', kartuAUlang.alasan, kartuA.alasan);

console.log('\nSemua skenario PASS.');
