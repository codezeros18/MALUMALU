# 🟩 SPRINT 5 — Rule Engine & Kartu Generation

| | |
|---|---|
| **Role** | 🟩 **AI Engineer** |
| **Prasyarat** | Sprint 3 (geospatial) + Sprint 4 (plot tersimpan) selesai |
| **Estimasi** | ~2–3 jam |

---

## 🎯 Tujuan
Membangun mesin aturan deterministik yang mengubah data plot + hasil `cekDeforestasi` menjadi **Kartu** dengan Tier (lokal/export-ready) + StdbStatus + alasan. Ini "otak administratif" — deterministik & dapat diaudit, bukan tebakan.

## ✅ Task
- [ ] 5.1 Tentukan Tier (lokal/export-ready)
- [ ] 5.2 Tentukan StdbStatus + alasan
- [ ] 5.3 Integrasi DeforestasiCheck → status kartu
- [ ] 5.4 `generateKartu(plot, petani, check)` → `Kartu`
- [ ] 5.5 Contoh kasus / test kecil

---

## 📋 Aturan (logika deterministik yang harus diimplementasikan)

**Tier:**
- `export-ready` bila: ada dokumen STDB (flag) + status deforestasi `aman` + data lengkap (nama, lokasi, komoditas).
- selain itu → `lokal`.

**StdbStatus:**
- `stdb-ready` bila: nama ada + koordinat valid + klaim kepemilikan dasar ada + deforestasi ≠ `berisiko`.
- `belum-lengkap` bila ada field wajib kosong ATAU deforestasi `berisiko`.

**Alasan (array string, selalu diisi — untuk transparansi):**
- contoh: "Lokasi terverifikasi", "Deforestasi: perlu audit manual (peta 91%, error 18%)", "Belum ada dokumen STDB → tier Lokal", dst.

---

## >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 5 — Rule Engine & Kartu untuk Paspor Petani v2 (aku role AI Engineer).
Acuan: docs/02_TECH_ARCHITECTURE.md + docs/03_MVP_SCOPE.md (F5). Tipe dari src/types/index.ts. Aku hanya menyentuh src/lib/ruleEngine.ts (dan file test kecilku).

Lakukan:

1. src/lib/ruleEngine.ts, implementasikan fungsi deterministik (tanpa LLM, tanpa randomness):

   a. tentukanTier(input): Tier
      - export-ready jika: input.punyaSTDB === true DAN deforestasi === 'aman' DAN data inti lengkap (nama, lat, lng, komoditas).
      - selain itu 'lokal'.

   b. tentukanStdbStatus(input): { status: StdbStatus; alasan: string[] }
      - Kumpulkan alasan di array.
      - 'stdb-ready' jika: nama ada + koordinat valid + klaimKepemilikan true + deforestasi !== 'berisiko'.
      - 'belum-lengkap' jika ada syarat kurang; tiap kekurangan tambahkan alasan spesifik.
      - Untuk deforestasi 'perlu-audit', JANGAN gagalkan; tambahkan alasan "Perlu audit manual (peta JRC ~91%, commission error ~18%; kebun kopi bernaung bisa terbaca hutan)".

   c. generateKartu(params): Kartu
      - params: { petani: Petani; plot: Plot; check: DeforestasiCheck; punyaSTDB: boolean; klaimKepemilikan: boolean }
      - hitung tier + stdbStatus + alasan.
      - kembalikan objek Kartu lengkap (id via nanoid, plotId, petaniId, tier, stdbStatus, alasan, deforestasi: check.status, hashChainRef: "" (diisi Sprint 6), createdAt: Date.now()).
      - JANGAN menyimpan ke DB di sini (biar FS yang orkestrasi simpan + hash-chain). Fungsi ini murni (pure).

2. Buat src/lib/ruleEngine.test-cases.ts (atau komentar contoh) dengan minimal 3 skenario dan hasil yang diharapkan:
   - Kasus A: data lengkap + STDB + aman → export-ready + stdb-ready.
   - Kasus B: data lengkap tanpa STDB + perlu-audit → lokal + stdb-ready (dengan alasan audit).
   - Kasus C: nama kosong / berisiko → lokal + belum-lengkap (dengan alasan kekurangan).

3. Pastikan fungsi 100% deterministik: input sama → output sama. Tidak ada Math.random, tidak ada Date.now di logika keputusan (Date.now hanya untuk field createdAt).

4. Beri komentar singkat di atas tiap fungsi menjelaskan aturannya (untuk transparansi/audit).

Setelah selesai:
- TypeScript bersih.
- Tunjukkan output ketiga kasus contoh.
- Jelaskan ke FS cara memanggil generateKartu lalu meneruskan ke hash-chain (Sprint 6).
- Sarankan commit: `git commit -m "sprint-5: deterministic rule engine + kartu generation"`.
```

## <<< AKHIR PROMPT <<<

---

## ✔️ Definition of Done
- `generateKartu()` mengembalikan Kartu valid & deterministik.
- Tier & StdbStatus benar untuk 3 kasus contoh.
- `alasan[]` selalu terisi (transparansi), termasuk disclaimer audit untuk `perlu-audit`.
- Fungsi murni (tidak menyentuh DB).

## 📌 Setelah Selesai
1. Centang 5.1–5.5 di `TRACKER.md`.
2. Commit + kabari FS: `generateKartu` siap dipakai untuk Sprint 6 (hash-chain).
3. AI Engineer selesai jalur inti. Bisa bantu FS di Sprint 8 (raster caching offline) atau siapkan post-MVP (draf dosir LLM).
