# 🧭 UPGRADE BLUEPRINT + TRACKER — Sprint 18–22
### (Polygon Risk-Score · Harga Referensi Nyata · RLS Hardening · WA Hardening)

> Lanjutan dari `docs/04_FULL_PRODUCTION_BLUEPRINT.md` (Sprint 9–15) dan
> `docs/07_DOKUMEN_VERIFIKASI_BLUEPRINT.md` (Sprint 16–17). Prompt siap-tempel:
> `docs/10_UPGRADE_PROMPTS.md`. Simpan file ini sebagai `docs/09_UPGRADE_BLUEPRINT.md`.
>
> ⚠️ **Dibuat dari dokumen yang di-share, BUKAN dari repo langsung.** Karena itu
> **Sprint 18 = AUDIT repo dulu** (verifikasi apa yang benar-benar ada) sebelum
> bangun/hapus apa pun. Aturan tim: *pastikan dulu ada/tidak di project sebelum
> menambah atau membuang.*

---

## 0. State Saat Ini (ringkas, dari dokumen)

Sudah selesai & JANGAN diutak-atik (fondasi):
- Sprint 9–15: full production (Supabase + Auth role + sync offline outbox + 3 role).
- Sprint 16: Dokumen Petani Terverifikasi (hash+metadata, `getDocumentCompleteness`, hash-chain reuse).
- Sprint 17: Panel "Petani Terverifikasi Terdekat" untuk eksportir.
- WhatsApp harga bot (WAHA) + webhook receiver di `mobile/` — **ada, tapi ada bug** (lihat §5 Sprint 21).
- Mobile app (`mobile/`, Expo) + company profile — **ada, di-DEFER dulu**.

Inti geospasial yang sudah ada: `src/lib/raster.ts` (loader JRC offline), `src/lib/geospatial.ts`
(`cekDeforestasi` = point-in-raster). Fitur polygon baru **reuse** ini, bukan bikin baru.

---

## 1. Verdict Fitur: BUILD / UPGRADE / DEFER / JANGAN

> ✅ **Dikoreksi oleh Audit Sprint 18** (`docs/06_PROGRESS_LOG.md`, bagian "Audit Sprint
> 18") — baca detail bukti di sana sebelum eksekusi sprint manapun di bawah.

| Fitur | Ada di repo? (hasil audit nyata) | Aksi | Sprint |
|---|---|---|---|
| **Polygon draw** | ✅ **SUDAH ADA** (`lib/polygon.ts`, `PolygonDrawer.tsx`, layer poligon `Map3D.tsx`, terintegrasi `TambahPlot.tsx`) — dibangun pasca-Sprint-17, sebelum blueprint ini ditulis | **SKIP** (jangan bangun ulang UI) | — |
| **Skor risiko deforestasi (`getPolygonRisk`)** | ❌ TIDAK ADA (dikonfirmasi grep kosong web+mobile) | **BUILD** (fungsi murni saja, reuse UI polygon yang sudah ada) | 19 (dipersempit) |
| **Harga referensi nyata (dari transaksi terverifikasi)** | ⚠️ agregasi ADA & rumus BENAR, tapi data masih SAMPLE, tabel `transaksi` TIDAK ADA di Supabase | **UPGRADE** (rekam transaksi + agregat) | 20 |
| **RLS hardening per-role (`auth.uid()`)** | ⚠️ ADA, permisif — **dibuktikan empiris** (DELETE anon key berhasil di 7 tabel tanpa auth). **BLOCKER ditemukan Sprint 21**: app belum punya Supabase Auth sungguhan, jadi `auth.uid()` selalu NULL — policy per-role akan mematikan seluruh app kalau dijalankan sekarang | **DEFER** ke sprint Auth terpisah (dikonfirmasi user) | — (butuh Sprint Auth dulu) |
| **RLS append-only (hashchain/access_log/petani_document)** | ❌ belum ada — sub-bagian dari hardening yang TIDAK butuh auth.uid() | **HARDEN** (SQL disiapkan, aman dijalankan sekarang) | 21 |
| **Consent cek lintas-device via Supabase** | ⚠️ keterbatasan dikonfirmasi tepat (masih baca IndexedDB lokal) | **UPGRADE — SELESAI** (tidak butuh auth.uid(), dibuktikan 2 browser context terpisah) | 21 |
| **WA bot bugfix + wire nudge ke Supabase** | ⚠️ 3/6 SUDAH DIFIX (rata-rata berbobot, `fromMe`), 3-4 MASIH ADA (deep-link hardcode, `@g.us`, `readBody` limit, nudge tidak aktif sama sekali) — detail per-item di §5 audit | **FIX — SELESAI.** 1 item ("perbaiki" rata-rata ke 61.500) DITOLAK sebagai salah (61.250 sudah matematis benar) | 22 |
| **Company profile** | ✅ ada (`TentangKami.tsx`) | **DEFER** | — |
| **Redis untuk offline** | ❌ tidak ada dependency di manapun, dikonfirmasi | **JANGAN** | — |
| **Upload file asli ke Supabase Storage** | ❌ sengaja ditunda, dikonfirmasi (hash+metadata saja) | **DEFER** (stretch) | — |
| **Mobile app fitur baru** | ✅ ada (port lengkap dari web + WA bot) | **PAUSE** (fokus web dulu) | — |

---

## 2. Klarifikasi Arsitektur (baca sebelum eksekusi)

**Offline:** tetap **IndexedDB + outbox sync** (sudah ada sejak Sprint 10–12). Saat offline,
tulisan masuk antrian → auto-flush saat online. **Redis TIDAK dipakai** — Redis server-side,
tak terjangkau saat device offline. (Kalau nanti mau optimasi server: Redis boleh untuk cache
agregat harga / rate-limit webhook, tapi itu pasca-lomba, bukan sekarang.)

**Web-first:** web **sudah tersambung Supabase** sejak Sprint 9. Fitur baru **ikut pola yang ada**
(repo layer + `lib/sync.ts` + RLS), bukan "menyambung backend dari nol". Tidak ada backend baru
selain tabel/kolom Supabase tambahan.

**Harga referensi = agregat transparan**, bukan diset satu pihak. Sumber = transaksi terverifikasi
yang direkam agen di platform (komoditas × wilayah × grade → avg + range + jumlah txn). Petani
tanya via WA → dapat referensi pasar. Ini yang melindungi petani dari ditipu (bukan quote sepihak
eksportir). Opsional: cross-check referensi publik (mis. PIHPS/Bappebti) — **hanya kalau feed-nya
benar tersedia**; kalau tidak, tetap label "agregat platform" + `DATA DEMO` sampai ada data nyata.

---

## 3. 🔒 Guardrail Non-Negotiable (lanjutan dari docs 04 & 07)

1. `tentukanTier()` / `tentukanStdbStatus()` (Sprint 5) **TIDAK disentuh**. Skor risiko polygon
   = sinyal **additif** (fungsi pure baru, mis. `getPolygonRisk()`), ditampilkan berdampingan —
   **tidak** menyusup ke keputusan tier/STDB.
2. `appendEntry()` / `verifyChain()` (`lib/hashchain.ts`) **di-REUSE apa adanya**. Tidak ada
   hash-chain paralel baru.
3. Akses eksportir ke kontak petani tetap **wajib lewat `attemptAccess()`** (`lib/consent.ts`).
   Tidak ada pintu belakang.
4. Fitur polygon **reuse** `lib/raster.ts` (loader JRC yang sudah ada) — **jangan** buat loader
   raster kedua. Kalau raster saat ini format grid JSON, sampling polygon pakai grid yang sama.
5. Data publik/eksternal (cuaca, harga, NDVI) **TIDAK** masuk hash-chain — hanya identitas/legalitas
   petani (konsisten dgn keputusan Sprint 16).
6. **Verifikasi keberadaan sebelum menambah/menghapus** (Sprint 18 audit). Kalau sesuatu ternyata
   sudah ada, jangan diduplikasi; kalau tidak ada, baru bangun.
7. Angka Rp & harga = **transaksi terverifikasi atau berlabel `DATA DEMO`**. Nol overclaim.
   Disclosure peta (JRC ~91%, commission error 18%, batas manual bukan GPS-walked) tetap tampil.

---

## 4. Rincian Fitur

### 4.1 Sprint 19 — Polygon + Skor Risiko Deforestasi (WEB) 🟦 FS + 🟩 AI

**Apa:** di peta, user (agen saat input, atau eksportir saat menilai) menggambar batas kebun dengan
klik beberapa titik → app hitung luas + skor risiko deforestasi berbasis overlap piksel hutan JRC.

**Plain logic:**
- Gambar polygon (klik titik-titik → tutup polygon).
- Luas = `turf.area(polygon)` → hektar.
- Sampling: ambil semua sel grid raster JRC di dalam bbox polygon; untuk tiap sel, cek
  `turf.booleanPointInPolygon(centerSel, polygon)`; hitung berapa sel "hutan" (nilai=1) vs total
  sel di dalam polygon.
- **Skor risiko** = % sel hutan di dalam polygon → petakan ke `rendah` (<X%) / `sedang` / `tinggi`.
- Output additif: `{ luasHa, forestOverlapPct, risk: 'rendah'|'sedang'|'tinggi', catatanError }`.

**Kejujuran (WAJIB tampil di UI):** "Batas digambar manual (bukan jalan-keliling GPS). Peta JRC
~91% akurasi, commission error ~18% (kebun kopi bernaung bisa terbaca hutan). Skor ini indikator,
perlu audit manual — bukan vonis." Override manual tetap ada.

**Reuse & guardrail:** pakai `lib/raster.ts` existing; taruh logika di `lib/geospatial.ts`
(fungsi baru `getPolygonRisk()`), jangan sentuh `cekDeforestasi()` yang sudah ada; jangan ubah
rule engine.

**UI:** komponen `PolygonRiskMap.tsx` (boleh extend `NearbyMap.tsx`/`MapView.tsx` pattern; kalau
butuh gambar polygon, pakai klik-tambah-vertex manual — hindari dependency berat baru kecuali
`leaflet` sudah cukup). Tampilkan skor + luas + disclosure + tombol "reset polygon".

### 4.2 Sprint 20 — Harga Referensi Nyata (WEB) 🟦 FS

**Apa:** rekam transaksi terverifikasi di web (agen input deal: komoditas, wilayah, grade, harga,
tanggal, verified) → agregasi referensi (avg/range/txn-count) → dipakai dashboard + WA bot.

**Guardrail:** referensi = agregat, bukan angka sepihak. Kalau data < N transaksi → tampilkan
"data belum cukup" (jangan tampilkan angka menyesatkan). Selama belum ada data nyata → `DATA DEMO`.

**Reuse:** kalau `mobile/src/lib/harga/aggregate.ts` sudah punya `getReferencePrice()`, **angkat
logika agregasi jadi shared** atau replikasi pola yang sama di web (jangan dua rumus berbeda).
Perbaiki rumus rata-rata berbobot yang di-flag (61.250 vs 61.500) di satu tempat, dipakai bersama.

### 4.3 Sprint 21 — RLS Hardening + Consent Lintas-Device 🟦 FS

**RLS hardening:** ganti semua policy `demo_allow_all` jadi policy per-role sesungguhnya
(petani lihat datanya sendiri; agen row `agent_id = auth.uid()`; eksportir hanya rantai pasok +
consent aktif). Uji lintas-akun (bukan cuma percaya UI). Ini **gap produksi terbesar**.

**Consent lintas-device:** `isAuthorized()`/`attemptAccess()` saat ini baca IndexedDB lokal
(diakui di docs 07 §2.2). Untuk multi-device, arahkan pengecekan ke tabel `consent` di Supabase
(yang sudah tersinkron). Fallback ke lokal saat offline. **Tanpa mengubah** kontrak `attemptAccess`
(tetap satu-satunya jalur akses).

### 4.4 Sprint 22 — WA Bot Hardening + Wire Nudge 🟦 FS

Fix bug yang di-flag reviewer (semua sudah dikonfirmasi ADA):
- Rata-rata berbobot salah (61.250 vs 61.500) → perbaiki rumus + test.
- Deep-link scheme: pakai `EXPO_PUBLIC_STATUS_SCHEME` dari env, jangan hardcode.
- `parseInboundWebhook`: cek `fromMe` boolean ketat; **abaikan group chat** (`@g.us`); jangan balas
  ke chatId salah.
- `readBody`: batasi ukuran payload + balas **413** kalau lewat (cegah DoS).
- `aggregateDaily`: filter juga by **komoditas + wilayah** (sesuai signature), bukan cuma grade.
- Nudge "Paspor lengkap": wire ke data petani **via Supabase** (standalone server tak bisa baca
  AsyncStorage mobile) — baca dari tabel Supabase pakai `telepon`.
- Harga: sambungkan ke referensi Sprint 20 (bukan `DATA DEMO`) begitu data tersedia.

---

## 5. Tracker Sprint 18–22

> `[ ]` belum · `[x]` ✅ · `[~]` 🟡 · `[!]` ❌ blocked. Role 🟦 FS · 🟩 AI.

### 🔍 SPRINT 18 — Audit Repo (WAJIB pertama) 🟦 FS
- [x] 18.1 Audit struktur repo web + `mobile/` + `mobile/server/` — keduanya ADA
- [x] 18.2 Konfirmasi keberadaan: `lib/raster.ts`, `lib/geospatial.ts`, `getDocumentCompleteness`, `attemptAccess`, `lib/sync.ts`, harga `aggregate.ts` — semua ADA (file:line di `docs/06_PROGRESS_LOG.md` §18.2)
- [x] 18.3 Konfirmasi apakah polygon-draw / risk-score SUDAH ada atau belum — **draw SUDAH ADA, risk-score BELUM**
- [x] 18.4 Konfirmasi RLS policy saat ini (permisif/ketat) per tabel — SEMUA masih `demo_allow_all`, dibuktikan empiris
- [x] 18.5 Konfirmasi bug WA yang di-flag masih ada atau sudah diperbaiki — 2 SUDAH DIFIX, 1 campuran, 3-4 MASIH ADA (detail §18.5)
- [x] 18.6 Update `docs/06_PROGRESS_LOG.md` dengan temuan + koreksi blueprint ini — selesai, lihat "Audit Sprint 18"

### 🟦🟩 SPRINT 19 — Polygon + Skor Risiko Deforestasi (dipersempit oleh audit) — ✅ SELESAI
- [x] 19.1 `getPolygonRisk()` di `lib/geospatial.ts` (reuse `lib/raster.ts`; turf area + point-in-polygon)
- [x] 19.2 Petakan % overlap hutan → rendah (<10%)/sedang (10-40%)/tinggi (>40%) + `catatanError`
- [x] ~~19.3 `PolygonRiskMap.tsx` (gambar polygon manual...)~~ — **SKIP, UI SUDAH ADA** (`PolygonDrawer.tsx` + `lib/polygon.ts` + layer `Map3D.tsx`, dibangun pasca-Sprint-17). Reuse, jangan bangun ulang.
- [x] 19.4 Wire skor risiko ke `PolygonDrawer.tsx` (badge live saat titik bertambah, di samping estimasi luas yang sudah ada)
- [x] 19.5 Guardrail: `tentukanTier/StdbStatus` (ruleEngine.test-cases.ts PASS) & `cekDeforestasi` (browser test titik-tunggal tetap "aman") nol regresi
- [x] 19.6 Build + browser test nyata — poligon di kotak yang dikonfirmasi 50% sel hutan → "Risiko Tinggi (50% area hutan)"; poligon di kotak 0% hutan → "Risiko Rendah (0% area hutan)". Titik direkam via GPS **mock presisi** (`context.setGeolocation`), bukan tap-pixel kasar, supaya koordinat tepat menyasar sel raster yang sudah diverifikasi isinya.

### 🟦 SPRINT 20 — Harga Referensi Nyata — ✅ SELESAI (SQL menunggu dijalankan user)
- [x] 20.1 Tabel `transaksi` (komoditas, wilayah, grade, harga_per_kg, tanggal, verified, agent_id) + RLS `demo_allow_all` (pola sama seperti semua tabel lain — per-role sungguhan menunggu Sprint 21 karena belum ada `auth.uid()` untuk dijadikan dasar policy). **SQL disiapkan, BELUM dijalankan user** (dikonfirmasi via REST: `PGRST205` masih muncul)
- [x] 20.2 `'transaksi'` ditambah ke `SyncEntityType`/`TABLE_NAME`/`ALLOWED_COLUMNS` (`lib/sync.ts`) + store IndexedDB (`lib/db.ts`, `DB_VERSION` 3→4) + `addTransaksi`/`listTransaksi`
- [x] 20.3 UI agen: form "Rekam Transaksi" (`HargaReferensi.tsx`, offline-first) + riwayat transaksi milik device ini
- [x] 20.4 `src/lib/harga/aggregate.ts` (BARU) — `getReferencePrice()` prinsip matematis SAMA dengan `mobile/src/lib/harga/aggregate.ts` (audit Sprint 18: rumus mobile SUDAH BENAR, bukan bug). **Bukan modul shared literal** — web & mobile dua paket npm independen tanpa workspace; keputusan sadar "samakan rumus" (opsi kedua di guardrail), didokumentasikan di komentar file
- [x] 20.5 Guard "data belum cukup" (`MIN_TXN_COUNT = 3`) — TIDAK menampilkan angka dari sampel kurang dari itu
- [x] 20.6 Halaman "Harga Referensi" (read) untuk agen (form+riwayat+lookup) & eksportir (lookup saja) — role-aware satu komponen, bukan dua halaman terpisah

### 🟦 SPRINT 21 — RLS Hardening + Consent Lintas-Device — ⚠️ DIPERSEMPIT (blocker nyata)
> **Blocker ditemukan sebelum eksekusi, dikonfirmasi ke user, dan user memilih "partial
> hardening dulu"**: policy per-role (`agent_id = auth.uid()`, dst) TIDAK BISA aman
> ditulis sekarang karena app **belum punya Supabase Auth sungguhan** — semua role
> pakai anon key yang sama, `auth.uid()` akan selalu NULL. Menjalankan SQL per-role
> sekarang akan membuat SEMUA request (Agen/Petani/Eksportir) gagal total (auth.uid()
> tidak pernah cocok dengan apa pun). Ditunda ke sprint Auth terpisah, bukan diabaikan.
- [x] ~~21.1 Ganti semua `demo_allow_all` → policy per-role~~ — **DITUNDA, butuh Supabase Auth dulu** (lihat blocker di atas). Sebagai gantinya: **hardening append-only** untuk `hashchain`/`access_log`/`petani_document` (DELETE+UPDATE diblokir, tidak butuh auth.uid()) — SQL disiapkan, belum dijalankan user.
- [x] ~~21.2 Uji lintas-akun: tiap role hanya lihat datanya~~ — **DITUNDA** (butuh identitas akun sungguhan dari Auth, belum ada)
- [x] 21.3 `isAuthorized`/`attemptAccess` baca `consent` dari Supabase (fallback lokal saat offline) — **SELESAI**, tidak butuh auth.uid() (baca tabel yang sudah readable), signature fungsi tidak berubah
- [x] 21.4 Regresi: alur consent Sprint 7 (grant/revoke via `ConsentPanel.tsx`, sengaja TETAP baca lokal supaya tidak ada stale-read setelah grant) & panel nearby Sprint 17 tetap jalan — dikonfirmasi
- [x] 21.5 Build + **uji lintas-device sungguhan** (2 browser context terpisah, IndexedDB masing-masing kosong dari awal — bukan 1 browser context yang "kebetulan benar" seperti pengujian Sprint 17 sebelumnya)

### 🟦 SPRINT 22 — WA Bot Hardening + Wire Nudge — ✅ SELESAI (1 item ditolak, salah)
- [x] ~~22.1 "Fix" rata-rata berbobot ke 61.500~~ — **DITOLAK, JANGAN DIKERJAKAN.** Audit
      Sprint 18 & perhitungan ulang mengonfirmasi **61.250 adalah jawaban matematis yang
      BENAR** ((58000×4+61000×3+64000×5)/12=61250). Angka "61.500" di prompt asli SALAH
      HITUNG. Kode & test (`aggregateDaily`) sudah benar & tetap PASS — "memperbaikinya"
      ke 61.500 justru akan MEMASUKKAN bug ke kode yang sudah benar. Komentar test yang
      salah tulis "=61500" sudah diperbaiki jadi penjelasan yang akurat.
- [x] 22.2 Deep-link scheme dari env (`bot.ts`: `process.env.EXPO_PUBLIC_STATUS_SCHEME || 'pasporpetani://status'`) + test env-override (reset-modules)
- [x] ~~`fromMe` ketat~~ — sudah benar sebelumnya, DIPERKUAT jadi `=== true` eksplisit (bukan cuma truthy JS) + test nilai non-boolean
- [x] 22.3 `parseInboundWebhook`: abaikan group `@g.us` (`from.endsWith('@g.us')` → null, sebelum sempat di-strip jadi "nomor telepon" palsu) — balasan otomatis terarah benar karena pesan grup sekarang tidak diproses sama sekali
- [x] 22.4 `readBody` (dipindah ke `webhookParser.ts` supaya testable): limit 100KB + `PayloadTooLargeError` → wahaWebhookServer balas HTTP 413. **Bug ditemukan & diperbaiki saat verifikasi end-to-end**: implementasi awal pakai `req.destroy()` yang mematikan socket SEBELUM 413 sempat terkirim (klien cuma lihat connection reset) — diganti `req.pause()`, dikonfirmasi ulang lewat request HTTP asli ke server yang benar-benar berjalan
- [x] 22.5 `aggregateDaily`: sekarang filter komoditas + wilayah + grade (bukan cuma grade) — test baru membuktikan sumber wilayah/komoditas lain tidak lagi ikut tercampur ke rata-rata
- [x] 22.6 Nudge "Paspor lengkap" via Supabase — `mobile/server/pasporLookupSupabase.ts` (BARU, REST fetch, bukan AsyncStorage) diwire ke `wahaWebhookServer.ts` (sebelumnya benar-benar TIDAK dipanggil sama sekali, dikonfirmasi sekarang aktif + fail-soft kalau Supabase belum dikonfigurasi)
- [x] 22.7 Harga WA disambungkan ke `transaksi` Supabase (`mobile/server/transaksiSource.ts`, BARU) — fallback otomatis ke `SAMPLE_PRICE_SOURCES` berlabel DATA DEMO (dicatat via log eksplisit) kalau Supabase belum dikonfigurasi/kosong/gagal fetch, TIDAK PERNAH mengklaim sample sebagai data nyata
- [x] 22.8 Jest **13 suite / 93 test — semua PASS** (4 suite baru, 26 test baru). Verifikasi WAHA end-to-end: **tidak ada instance WAHA nyata tersedia** di lingkungan ini, jadi verifikasi dilakukan dengan menjalankan `wahaWebhookServer.ts` SUNGGUHAN (`npx tsx`, bukan mock) dan mengirim request HTTP asli — 5 skenario dikonfirmasi (pesan normal, grup diabaikan, oversized→413, fromMe:true diabaikan, server tetap hidup setelahnya)

---

## 6. Definition of Done (fase upgrade) — status akhir

- [x] Audit repo selesai; blueprint dikoreksi bila ada yang sudah ada/berbeda.
- [x] Polygon risk-score jalan (additif), disclosure tampil, nol regresi tier/STDB/hash-chain.
- [x] Harga referensi dari transaksi terverifikasi — rumus rata-rata dikonfirmasi SUDAH
      benar sejak awal (bukan bug, lihat §5 Sprint 22), tabel `transaksi` dibuat & aktif.
      Belum ada transaksi nyata cukup (>=3/kombinasi) → tampil "data belum cukup" (jujur,
      bukan `DATA DEMO` palsu, sesuai desain guard-nya).
- [~] RLS diperketat SEBAGIAN — append-only untuk `hashchain`/`access_log`/
      `petani_document` aktif & terbukti (dikonfirmasi lewat probe row nyata). Per-role
      penuh (`auth.uid()`) **DITUNDA** — butuh Supabase Auth sungguhan dulu (blocker
      ditemukan & dikonfirmasi ke user, bukan diabaikan). Gap produksi INI BELUM
      tertutup sepenuhnya — dicatat jelas di "Known issues" bagian Ringkasan Sprint 18-22.
- [x] Consent lintas-device via Supabase (fallback offline) — dibuktikan 2 browser
      context terpisah, bukan asumsi.
- [x] Semua bug WA yang di-flag DAN benar-benar ada (5/6) diperbaiki + Jest 13 suite/93
      test hijau + verifikasi end-to-end via server sungguhan (WAHA nyata tidak
      tersedia di lingkungan ini, dicatat jujur). 1 item ("fix" ke 61.500) ditolak
      sebagai salah hitung.
- [x] Offline tetap jalan (IndexedDB+outbox); TIDAK ada Redis ditambahkan.
- [x] `docs/06_PROGRESS_LOG.md` di-update (termasuk ringkasan penutup Sprint 18-22).

---

## 7. Yang SENGAJA Tidak Dikerjakan (dicatat, bukan diabaikan)

- **Redis / infra cache server** — tidak perlu untuk offline; skip.
- **Upload file asli ke Supabase Storage** — tetap stretch (butuh bucket+RLS+antrean file offline).
- **Company profile** — di-defer atas permintaan tim.
- **Fitur baru mobile app** — pause; fokus web dulu.
- **OCR/verifikasi identitas otomatis** — `verified` tetap manual (petugas), konsisten sejak awal.
- **Feed harga publik nyata (Bappebti/PIHPS)** — hanya bila feed benar tersedia; jangan diklaim ada kalau belum.

---

## 8. Catatan untuk Tim

Kalau saat Sprint 18 ternyata sebagian fitur di atas **sudah ada** di repo (mis. polygon sudah
dibuat, atau bug WA sudah difix), **hapus item itu dari tracker dan lompati** — jangan duplikasi.
Blueprint ini disusun dari dokumen, jadi audit repo adalah sumber kebenaran final.
