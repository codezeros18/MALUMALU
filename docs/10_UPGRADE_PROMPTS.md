# 📋 UPGRADE PROMPTS — Sprint 18–22
### (siap-tempel ke Claude Code · pola sama seperti `docs/05` & `docs/08`)

> Acuan teknis: `docs/09_UPGRADE_BLUEPRINT.md`. State repo: `docs/06_PROGRESS_LOG.md`.
> Cara pakai: copy satu blok `>>> PROMPT UNTUK CLAUDE CODE <<<`, paste, tunggu selesai,
> cek Definition of Done, centang tracker `docs/09` §5, lanjut sprint berikutnya
> **berurutan** (18→19→20→21→22). **Sprint 18 (audit) WAJIB pertama.**
> Simpan file ini sebagai `docs/10_UPGRADE_PROMPTS.md`.

---

## 🔍 SPRINT 18 — Audit Repo (WAJIB PERTAMA, jangan skip)

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita masuk fase UPGRADE (Sprint 18–22). SEBELUM membangun/menghapus apa pun, lakukan AUDIT
repo dulu — aturan tim: pastikan sesuatu ADA atau TIDAK sebelum menambah/membuang.

Baca konteks: docs/04_FULL_PRODUCTION_BLUEPRINT.md, docs/06_PROGRESS_LOG.md,
docs/07_DOKUMEN_VERIFIKASI_BLUEPRINT.md, docs/09_UPGRADE_BLUEPRINT.md.

Lakukan audit dan LAPORKAN (jangan ubah kode apa pun di sprint ini):

1. Struktur: daftar top-level web app + folder mobile/ + mobile/server/. Konfirmasi keduanya ada.
2. Konfirmasi keberadaan & tanda tangan fungsi berikut (kutip file:line):
   - src/lib/raster.ts (loader raster JRC) — format raster apa (grid JSON? geotiff?).
   - src/lib/geospatial.ts — apakah ada cekDeforestasi (point-in-raster)? Apakah SUDAH ada
     fungsi polygon/area/risk apa pun?
   - src/lib/ruleEngine.ts — tentukanTier, tentukanStdbStatus, getDocumentCompleteness.
   - src/lib/hashchain.ts — appendEntry, verifyChain.
   - src/lib/consent.ts — attemptAccess, isAuthorized (sumber baca: IndexedDB atau Supabase?).
   - src/lib/sync.ts — daftar SyncEntityType saat ini.
3. Polygon: apakah sudah ada komponen menggambar polygon / menghitung skor risiko deforestasi
   di web? (cari "polygon", "area", "risk", "turf.area", "booleanPointInPolygon").
4. RLS: cek migration/SQL — tabel mana yang masih pakai policy "demo_allow_all" (permisif) vs
   sudah per-role. Buat daftar per tabel.
5. Harga: di mobile/src/lib/harga/ — konfirmasi aggregate.ts, prices.ts (masih DATA DEMO?),
   dan apakah bug yang di-flag reviewer MASIH ADA:
   - rumus rata-rata berbobot (hasil 61.250 vs 61.500 yang diharapkan)
   - deep-link scheme hardcode vs env EXPO_PUBLIC_STATUS_SCHEME
   - parseInboundWebhook: penanganan group @g.us + cek fromMe
   - readBody: ada limit ukuran payload atau tidak
   - aggregateDaily: apakah filter komoditas+wilayah atau cuma grade
   - nudge "Paspor lengkap": sumber datanya AsyncStorage atau Supabase
6. Ringkas temuan jadi tabel "ADA / TIDAK ADA / SUDAH DIFIX" untuk tiap item di
   docs/09_UPGRADE_BLUEPRINT.md §1 & §5. Untuk yang ternyata SUDAH ADA/SUDAH DIFIX, tandai
   supaya sprint terkait dilewati (jangan duplikasi).
7. Tulis hasil audit ke docs/06_PROGRESS_LOG.md (append section "Audit Sprint 18").

JANGAN ubah kode aplikasi. Akhiri dengan rekomendasi: sprint mana yang perlu dikerjakan vs
dilewati berdasarkan temuan nyata.
```

### ✔️ Definition of Done
- Tabel ADA/TIDAK ADA/SUDAH DIFIX untuk semua item §1 & §5 blueprint.
- `docs/06_PROGRESS_LOG.md` ter-update.
- Rekomendasi sprint mana dikerjakan vs dilewati.

---

## 🟦🟩 SPRINT 19 — Polygon + Skor Risiko Deforestasi

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
SPRINT 19 — Polygon + Skor Risiko Deforestasi (WEB). Acuan docs/09_UPGRADE_BLUEPRINT.md §4.1.
Prasyarat: audit Sprint 18 mengonfirmasi fitur ini BELUM ada. Kalau sebagian sudah ada, reuse,
jangan duplikasi.

GUARDRAIL WAJIB:
- REUSE src/lib/raster.ts (loader JRC yang sudah ada). JANGAN buat loader raster kedua.
- Taruh logika baru di src/lib/geospatial.ts sebagai fungsi PURE BARU getPolygonRisk().
  JANGAN sentuh cekDeforestasi() (point-in-raster existing) maupun ruleEngine
  (tentukanTier/tentukanStdbStatus). Skor risiko = sinyal ADITIF, ditampilkan berdampingan.
- Disclosure jujur WAJIB tampil di UI: batas digambar MANUAL (bukan GPS-walked), JRC ~91%,
  commission error ~18%, skor = indikator perlu-audit bukan vonis.

Lakukan:
1. src/lib/geospatial.ts — tambah getPolygonRisk(polygonCoords: [number,number][]):
   - Tutup polygon (turf.polygon). Hitung luas: turf.area() -> hektar (m2/10000).
   - Ambil raster via loader existing. Untuk tiap sel grid di dalam bbox polygon, cek pusat sel
     dengan turf.booleanPointInPolygon; hitung sel "hutan" (nilai forest) vs total sel di dalam.
   - forestOverlapPct = selHutanDidalam / totalSelDidalam * 100.
   - risk: 'rendah' (<10%) | 'sedang' (10–40%) | 'tinggi' (>40%) — ambang boleh dikonstantakan.
   - return { luasHa, forestOverlapPct, risk, catatanError } (catatanError = disclosure standar).
   - Deterministik, pure, tanpa efek samping. Tangani polygon < 3 titik (invalid) dengan aman.
2. src/components/PolygonRiskMap.tsx (BARU; boleh ikuti pola NearbyMap.tsx/MapView.tsx):
   - Klik peta menambah vertex; tampilkan garis polygon; tombol "Tutup & Hitung", "Reset".
   - Saat dihitung: panggil getPolygonRisk -> tampil luas (ha), % overlap hutan, badge risk
     (rendah=hijau/sedang=kuning/tinggi=merah, reuse components/ui/Badge), + kotak disclosure.
   - Idempotent Leaflet default-icon fix seperti MapView.tsx.
3. Wire (additif) ke tempat yang relevan hasil audit — mis. halaman input agen (opsional saat
   buat plot) dan/atau detail eksportir. JANGAN mengganti alur point-in-raster yang sudah ada.
4. Regresi WAJIB:
   - npx tsc -b --noEmit + npm run build bersih.
   - node src/lib/ruleEngine.test-cases.ts tetap PASS (tier/STDB tak berubah).
   - cekDeforestasi() existing tetap berfungsi (uji satu titik aman + satu perlu-audit).
   - Browser test nyata (build+preview+Playwright): gambar polygon di area yang raster-nya hutan
     -> risk 'tinggi' & overlap tinggi; polygon di area kebun -> risk 'rendah'. Disclosure tampil.

Sarankan commit: "sprint-19: polygon deforestation risk score (additif, reuse raster)".
```

### ✔️ Definition of Done
- `getPolygonRisk()` pure + deterministik; luas via turf; skor dari overlap raster.
- UI polygon + badge risk + disclosure tampil; reset jalan.
- Nol regresi: tier/STDB/point-in-raster/hash-chain.
- Browser test: area hutan → tinggi, area kebun → rendah.

---

## 🟦 SPRINT 20 — Harga Referensi Nyata

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
SPRINT 20 — Harga Referensi dari Transaksi Terverifikasi (WEB). Acuan docs/09 §4.2.
Prinsip: harga referensi = AGREGAT transparan, BUKAN diset satu pihak (lindungi petani).

GUARDRAIL:
- SATU rumus agregasi dipakai bersama web + WA. Kalau mobile/src/lib/harga/aggregate.ts sudah
  punya getReferencePrice(), ANGKAT jadi modul shared atau samakan rumusnya — jangan dua rumus.
- Perbaiki bug rata-rata berbobot yang di-flag (hasil 61.250 vs 61.500 yang benar) DI SATU
  tempat, lalu dipakai web & WA.
- Bila jumlah transaksi < ambang (mis. 3) untuk komoditas×wilayah×grade -> tampilkan
  "data belum cukup", JANGAN tampilkan angka menyesatkan. Selama data belum nyata -> label DATA DEMO.

Lakukan:
1. Supabase: tabel transaksi (id, komoditas, wilayah, grade, harga, tanggal, verified bool,
   agent_id). Enable RLS (agen: insert/select miliknya; eksportir: select agregat; petani: -).
   Siapkan SQL untuk user jalankan manual (pola seperti tabel lain).
2. Repo + sync: tambah 'transaksi' ke SyncEntityType/TABLE_NAME/ALLOWED_COLUMNS di lib/sync.ts
   (pola entity existing). CRUD di repo/db seperti entity lain (offline outbox tetap berlaku).
3. Modul agregasi shared: getReferencePrice(sources, {komoditas, wilayah, grade}) ->
   { avg, min, max, txnCount } dengan rata-rata berbobot yang BENAR + filter komoditas+wilayah+grade.
4. UI Agen: form "Rekam Transaksi" (verified) + list transaksi.
5. UI referensi (agen/eksportir): tampil avg/range/txnCount per komoditas×wilayah, dengan guard
   "data belum cukup" + label sumber (platform aggregate / DATA DEMO).
6. Regresi + build bersih + (bila ada) update Jest agregasi supaya hijau dengan rumus baru.

Sarankan commit: "sprint-20: harga referensi dari transaksi terverifikasi + agregasi shared".
```

### ✔️ Definition of Done
- Tabel `transaksi` + RLS + sync jalan (offline outbox tetap).
- Satu rumus agregasi (bug rata-rata fixed) dipakai web + WA.
- Guard "data belum cukup"; label sumber jujur.
- Build + test hijau.

---

## 🟦 SPRINT 21 — RLS Hardening + Consent Lintas-Device

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
SPRINT 21 — RLS Hardening + Consent lintas-device. Acuan docs/09 §4.3. Ini menutup gap produksi
terbesar: policy "demo_allow_all" masih permisif.

GUARDRAIL:
- attemptAccess() tetap SATU-SATUNYA jalur akses kontak petani. Ubah SUMBER pengecekan consent,
  bukan kontraknya.
- Perubahan RLS harus diuji LINTAS-AKUN (bukti nyata), bukan hanya percaya UI tidak error.

Lakukan:
1. Untuk tiap tabel yang audit Sprint 18 tandai "demo_allow_all", tulis policy per-role SQL
   pengganti (siapkan untuk user jalankan manual di Supabase SQL Editor):
   - petani: SELECT hanya barisnya sendiri (map via profiles/auth.uid()).
   - agen: SELECT/INSERT/UPDATE hanya baris agent_id = auth.uid().
   - eksportir: SELECT hanya baris rantai pasoknya (relasi share/consent) DAN consent aktif.
   - hash_chain, access_logs, petani_document: INSERT saja untuk semua (append-only).
2. lib/consent.ts: isAuthorized()/attemptAccess() baca tabel consent dari Supabase (yang sudah
   tersinkron) untuk cek izin lintas-device; FALLBACK ke IndexedDB lokal saat offline. Jangan ubah
   signature fungsi. Tetap catat AccessLog + picu notif seperti sebelumnya.
3. Regresi: alur consent Sprint 7 (grant/revoke, override manual) + panel nearby Sprint 17
   (tombol "Hubungi") tetap benar. Uji: eksportir tanpa consent -> ditolak + notif; dengan consent
   -> diizinkan.
4. Uji lintas-akun: login sebagai agen A tidak bisa lihat data agen B; eksportir hanya lihat
   rantai pasoknya; petani hanya datanya. Buktikan via query nyata.
5. npx tsc -b --noEmit + npm run build bersih.

Sarankan commit: "sprint-21: rls hardening per-role + consent check via supabase (fallback offline)".
```

### ✔️ Definition of Done
- Tidak ada lagi `demo_allow_all`; tiap role terbukti hanya lihat datanya (lintas-akun).
- Consent dicek dari Supabase (fallback lokal saat offline), kontrak `attemptAccess` tetap.
- Regresi consent & nearby panel nol.

---

## 🟦 SPRINT 22 — WA Bot Hardening + Wire Nudge

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
SPRINT 22 — WA Bot Hardening + wire nudge ke data nyata. Acuan docs/09 §4.4. Semua item ini
di-flag reviewer; audit Sprint 18 konfirmasi mana yang masih ada. Kerjakan yang masih ada saja.

Lakukan (TDD: tulis/uji dulu bila memungkinkan, Jest):
1. Rata-rata berbobot: perbaiki rumus di modul agregasi shared (Sprint 20) supaya hasil BENAR
   (yang di-flag: 61.250 seharusnya 61.500). Update test agar mencerminkan nilai benar.
2. Deep-link scheme: baca dari env EXPO_PUBLIC_STATUS_SCHEME (jangan hardcode). Sinkronkan doc &
   .env.example dengan kode.
3. mobile/server webhookParser (parseInboundWebhook):
   - cek fromMe secara boolean KETAT (abaikan bila bukan boolean/true).
   - ABAIKAN group chat: jika chatId berakhiran '@g.us' -> jangan proses/balas.
   - pastикан balasan diarahkan ke chatId pengirim yang benar (@c.us), bukan angka hasil parse.
4. readBody (wahaWebhookServer): batasi akumulasi body (mis. maks 100KB); jika melebihi -> balas
   HTTP 413 dan hentikan. Cegah memory exhaustion/DoS.
5. aggregateDaily: filter sources by komoditas + wilayah + grade (sesuai signature), bukan cuma grade.
6. Nudge "Paspor lengkap": ambil status kelengkapan petani dari SUPABASE via nomor telepon
   (bukan AsyncStorage yang tak terjangkau dari proses Node standalone). Tambah lookup ke Supabase
   REST/anon di server, atau endpoint kecil. Dokumentasikan.
7. Sambungkan balasan harga WA ke referensi Sprint 20 (agregat nyata / DATA DEMO berlabel).
8. Verifikasi: npx tsc --noEmit bersih; Jest suite HIJAU (termasuk test baru); bila ada WAHA
   instance, uji end-to-end satu pesan "harga kopi Pangalengan" -> balasan benar + nudge dari
   data Supabase.

Sarankan commit: "sprint-22: wa bot hardening (weighted-avg, group-chat, dos-limit, env-scheme,
aggregate-filter) + nudge via supabase".
```

### ✔️ Definition of Done
- Semua bug yang di-flag & masih ada → diperbaiki + test hijau.
- Group chat diabaikan; body dibatasi (413); scheme dari env; aggregate filter benar.
- Nudge baca data petani dari Supabase (bukan AsyncStorage).
- Harga WA tersambung ke referensi nyata / berlabel DATA DEMO.

---

## 🧾 PROMPT PENUTUP — Update Progress Log

### >>> PROMPT >>>
```
Update docs/06_PROGRESS_LOG.md: tambah ringkasan Sprint 18–22 (apa yang diaudit, dibangun,
diperbaiki, dilewati karena sudah ada), daftar file baru/berubah, keputusan teknis, dan known
issues tersisa. Perbarui tracker docs/09 §5 (centang yang selesai). Hanya dokumentasi; jangan
ubah kode.
```

---

### Urutan Ringkas
18 (audit) → 19 (polygon risk) → 20 (harga referensi) → 21 (RLS + consent) → 22 (WA hardening) → penutup (progress log).
Lewati sprint yang audit buktikan sudah ada/sudah difix. Offline tetap IndexedDB+outbox — **jangan tambah Redis.**
