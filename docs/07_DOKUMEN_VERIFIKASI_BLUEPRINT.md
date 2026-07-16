# 🚀 DOKUMEN VERIFIKASI + PANEL PETANI TERDEKAT — Blueprint (Sprint 16–17)

> Blueprint + tracker digabung satu file, mengikuti pola `docs/04_FULL_PRODUCTION_BLUEPRINT.md`.
> Fitur ini dibangun **di atas** fase full-production (Sprint 9–15) yang sudah selesai —
> baca `docs/04_FULL_PRODUCTION_BLUEPRINT.md` (arsitektur sync/role) dan
> `docs/06_PROGRESS_LOG.md` dulu kalau belum familiar dengan state repo. Prompt siap-tempel
> ada di `docs/08_DOKUMEN_VERIFIKASI_PROMPTS.md`.

---

## 0. Kenapa Fitur Ini Ada

User mengajukan dua fitur terkait lewat sesi Plan Mode (bukan langsung dieksekusi):

1. Panel Eksportir untuk melihat petani terdekat yang **berkasnya sudah lengkap**, supaya
   harga yang ditawarkan ke petani adil sesuai kesiapan ekspor — bukan tebakan.
2. Daftar dokumen verifikasi petani yang dipetakan ke kategori EUDR (identitas, legalitas
   lahan, data teknis kebun, dokumen pendukung), dengan penekanan eksplisit dari user:
   dokumen ini **rawan disalahgunakan** (KTP) dan **rawan tampering** (sertifikat/klaim
   lahan) — makanya perlu dicatat ke hash-chain, BUKAN sekadar disimpan.

### Verdict Plan Mode: TIDAK melenceng dari tesis proyek

- Tabel "Model Nilai Bertingkat" di proposal asli sudah menjanjikan tier Export-Ready
  membuka **"peluang premium harga dari pembeli"** — panel petani-terdekat-berkas-lengkap
  adalah pemenuhan langsung janji itu.
- Tabel "Rantai Nilai" proposal sudah memosisikan Eksportir sebagai pihak yang butuh
  "ketertelusuran rantai pasok otomatis" — panel ini persis itu, dalam bentuk konkret.
- Daftar dokumen EUDR yang user riset memetakan langsung ke syarat STDB/Export-Ready yang
  sudah jadi tulang punggung `lib/ruleEngine.ts` sejak Sprint 5 — memperdalam, bukan
  mengubah arah.

### 🔒 Guardrail Non-Negotiable (sama semangat dengan §"Guardrail" di `docs/04`)

1. `tentukanTier()` dan `tentukanStdbStatus()` (logika deterministik teruji sejak Sprint 5)
   **tidak boleh disentuh sama sekali** — kelengkapan dokumen jadi sinyal ADITIF terpisah
   (`getDocumentCompleteness()`), ditampilkan berdampingan, bukan menyusup ke keputusan
   tier/STDB yang sudah ada.
2. `lib/hashchain.ts` (`appendEntry`/`verifyChain`) **di-REUSE apa adanya**, tidak ada
   fungsi hash-chain paralel baru untuk dokumen.
3. Akses Eksportir ke kontak petani ("Hubungi") **wajib lewat `lib/consent.ts`'s
   `attemptAccess()`** yang sudah ada — bukan jalur pintas baru yang melewati sistem
   consent/notifikasi yang jadi inti fitur keamanan proyek ini.
4. Data publik/eksternal (cuaca, NDVI, harga pasar) **sengaja TIDAK** dicatat ke
   hash-chain — hanya data identitas/legalitas milik petani yang rawan disalahgunakan
   atau di-tampering yang masuk rantai. Keputusan ini eksplisit dari user, dicatat di sini
   supaya tidak "diperluas diam-diam" di sprint mendatang.

### Keputusan Desain (dikonfirmasi user di sesi Plan Mode)

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Dokumen sensitif (KTP, KK, dst) | **Hash + metadata saja**, file asli TIDAK diunggah ke server | Menghindari kompleksitas & risiko privasi menyimpan file identitas sungguhan sebelum ada Storage+RLS yang benar-benar diaudit; upload file sungguhan jadi stretch goal terpisah |
| Titik referensi "terdekat" | Eksportir **klik titik di peta** (Leaflet, zero dependency baru) | Simpel, tidak butuh geocoding alamat, konsisten dengan pola tap-peta yang sudah ada di Agen |
| Urutan pengerjaan | **Bertahap** — Fase 1 (capture dokumen) dulu, verifikasi penuh, baru Fase 2 (panel nearby) | Setiap fase punya guardrail sendiri yang perlu diverifikasi sebelum ditumpuk fitur berikutnya |

---

## 1. Fase 1 — Dokumen Petani (Sprint 16)

### 1.1 Tipe Data (`src/types/index.ts`, aditif)

```typescript
export type DocumentType =
  | 'ktp' | 'kk' | 'bukti-kepemilikan-lahan' | 'bukti-pbb'
  | 'surat-persetujuan-tetangga' | 'stdb' | 'foto-plot'
  | 'riwayat-panen' | 'riwayat-transaksi' | 'sertifikat-pelatihan';

export interface PetaniDocument extends Syncable {
  id: string;
  petaniId: string;
  type: DocumentType;
  fileName: string;
  fileHash: string;      // SHA-256 isi file — INI yang masuk hash-chain, bukan file-nya
  fileSizeBytes: number;
  uploadedAt: number;
  verified: boolean;     // dikonfirmasi petugas/koperasi manual, BUKAN otomatis/OCR
  notes?: string;
}
```

Dokumen wajib minimum untuk status **"Berkas Lengkap"** (dasar legalitas STDB):
`ktp`, `bukti-kepemilikan-lahan`, `stdb` — didefinisikan sebagai konstanta
`REQUIRED_DOCUMENT_TYPES` di `lib/ruleEngine.ts`. Sisanya (kk, pbb, surat-persetujuan-
tetangga, foto-plot, riwayat-panen, riwayat-transaksi, sertifikat-pelatihan) tercatat
sebagai nilai tambah, bukan syarat wajib — sesuai pengelompokan yang user buat sendiri.

Pengelompokan tampilan (4 kategori, `components/DocumentUpload.tsx`):

| Kategori | Dokumen |
|---|---|
| Identitas | KTP*, Kartu Keluarga |
| Legalitas Lahan | Bukti Kepemilikan/Penguasaan Lahan*, Bukti Bayar PBB, Surat Persetujuan Tetangga, STDB* |
| Data Teknis Kebun | Foto Plot & Tanaman, Riwayat Panen |
| Dokumen Pendukung | Bukti Transaksi/Histori Jual, Sertifikat Pelatihan/Kelompok Tani |

(`*` = wajib untuk "Berkas Lengkap")

### 1.2 Backend

**Supabase** — tabel baru, HANYA metadata + hash (tidak ada kolom file/blob):

```sql
create table petani_document (
  id text primary key,
  petani_id text not null references petani(id),
  type text not null,
  file_name text not null,
  file_hash text not null,
  file_size_bytes bigint not null,
  uploaded_at bigint not null,
  verified boolean not null default false,
  notes text,
  agent_id text not null
);

alter table petani_document enable row level security;
create policy "demo_allow_all" on petani_document for all using (true) with check (true);
```

RLS aktif + policy permisif — pola identik dengan semua tabel lain sejak Sprint 9
(lihat `docs/04_FULL_PRODUCTION_BLUEPRINT.md` §2), **PERKETAT SEBELUM PRODUKSI
SUNGGUHAN**, bukan celah baru khusus fitur ini.

**IndexedDB** (`src/lib/db.ts`): object store `petaniDocument` + index `by-petani`
(`DB_VERSION` 2→3, migration guard `if (oldVersion < 3)`), fungsi `addDocument`,
`listDocumentsByPetani`, `markDocumentVerified` — pola CRUD identik store lain.

**Sync** (`src/lib/sync.ts`): `'petaniDocument'` ditambah ke `SyncEntityType`,
`TABLE_NAME` (map ke `petani_document`), `ALLOWED_COLUMNS` — tidak ada logika sync baru,
murni reuse `pushPendingSync()` yang sudah ada sejak Sprint 10 (termasuk retry-cutoff
`MAX_AUTO_RETRY_ATTEMPTS` dari fix pasca-Sprint-15).

**Hashing** (`src/lib/documents.ts`, BARU):
- `hashFile(file: File): Promise<string>` — pakai **Web Crypto API** bawaan browser
  (`crypto.subtle.digest('SHA-256', ...)`), BUKAN `crypto-js` yang sudah dipakai
  hash-chain — lebih cocok untuk file besar (foto/PDF) dan zero dependency baru.
- `registerDocument(petaniId, type, file)`: hash file → `addDocument()` (metadata+hash
  ke IndexedDB) → **`appendEntry({ type: 'document', petaniId, documentType, fileHash })`**
  — reuse penuh `lib/hashchain.ts` Sprint 6, tidak ada perubahan ke
  `verifyChain`/`appendEntry` sama sekali. Setiap dokumen yang diunggah = 1 entri
  hash-chain baru, bukti hash file tidak berubah sejak diunggah.

**Rule Engine** (`src/lib/ruleEngine.ts`, aditif — `tentukanTier`/`tentukanStdbStatus`
TIDAK diubah):

```typescript
export const REQUIRED_DOCUMENT_TYPES: DocumentType[] = ['ktp', 'bukti-kepemilikan-lahan', 'stdb'];

export function getDocumentCompleteness(documents: PetaniDocument[]): {
  complete: boolean;
  missing: DocumentType[];
} {
  const presentTypes = new Set(documents.map((d) => d.type));
  const missing = REQUIRED_DOCUMENT_TYPES.filter((type) => !presentTypes.has(type));
  return { complete: missing.length === 0, missing };
}
```

### 1.3 UI (Agen)

`src/components/DocumentUpload.tsx` — daftar 10 tipe dokumen terkelompok 4 kategori,
badge status per baris (**Belum ada** neutral / **Tersimpan lokal** pending /
**Tersinkron** synced / **Terverifikasi** aman — reuse `components/ui/Badge.tsx`),
tombol upload native `<input type="file" accept="image/*,.pdf" capture="environment">`
(jalan offline, tanpa dependency kamera baru). Badge ringkasan **"Berkas Lengkap" /
"Berkas Belum Lengkap"** di header komponen berdasar `getDocumentCompleteness()`.
Ditampilkan di `src/pages/PlotDetail.tsx` di bawah `ConsentPanel`.

### 1.4 Verifikasi Fase 1 (browser test nyata, Playwright)

- `npx tsc -b --noEmit` + `npm run build` bersih.
- `node src/lib/ruleEngine.test-cases.ts` — semua skenario existing (Kasus A/B/C,
  determinisme) tetap PASS setelah `getDocumentCompleteness` ditambah → **regresi nol**.
- Offline: buat plot+kartu → unggah KTP + Bukti Kepemilikan Lahan + STDB (file dummy) →
  badge berubah **"Berkas Belum Lengkap" → "Berkas Lengkap"** → hash-chain bertambah
  **tepat 3 entri** (1 per dokumen) → **"Verifikasi Rantai" tetap "Rantai utuh"**
  (regresi hash-chain nol).
- Online: sinkron otomatis → dicek langsung via Supabase REST API → **3 baris muncul**
  di `petani_document` dengan **hanya metadata+hash** (dikonfirmasi tidak ada kolom
  file/blob) — bukan cuma dipercaya dari IndexedDB lokal.

---

## 2. Fase 2 — Panel "Petani Terverifikasi Terdekat" (Sprint 17)

Dikerjakan SETELAH Fase 1 terverifikasi lolos penuh.

### 2.1 Desain

- Halaman baru `src/pages/PetaniTerdekat.tsx`, route `/eksportir/terdekat`, nav item
  baru "Petani Terdekat" di `DashboardShell.tsx` (grup Monitoring, ikon `Navigation`).
- `src/components/NearbyMap.tsx` (BARU, terpisah dari `MapView.tsx` karena kebutuhan
  beda): Eksportir klik satu titik di peta (Leaflet) → titik referensi (pin biru,
  simulasi lokasi gudang/fasilitas), hasil petani terdekat ditandai marker hijau kecil
  (`L.divIcon`) supaya tidak tertukar visual dengan titik referensi.
- Sumber data: `supabaseBackend.fetchAll()` untuk `kartu`, `petani`, `plot`,
  `petaniDocument` — pola identik `EksportirDashboard.tsx` (online-only, baca langsung
  dari Supabase, BUKAN IndexedDB, karena perlu lintas-agen).
- Kelengkapan dihitung **per-petani** (`getDocumentCompleteness` dikelompokkan per
  `petaniId` dari seluruh `petani_document` milik petani itu) — filter HANYA petani
  dengan `complete === true`.
- Jarak dihitung pakai **`@turf/turf`'s `distance()`** (dependency sudah terpasang sejak
  awal proyek, baru dipakai pertama kali di fitur ini) dari titik klik ke koordinat plot.
- Hasil diurutkan ascending by jarak, ditampilkan sebagai list (nama, desa, jarak km,
  badge tier + "Berkas Lengkap") + marker di peta.
- Tombol **"Hubungi"** per baris memanggil **`attemptAccess(kartu.id, 'Eksportir')`**
  dari `lib/consent.ts` yang sudah ada sejak Sprint 7 — akses tetap tercatat ke
  `AccessLog` dan tunduk pada consent yang sudah diberikan petani (lewat
  `ConsentPanel`), BUKAN pintu belakang baru.

### 2.2 ⚠️ Catatan Kejujuran Arsitektur (analog §"Catatan Integritas Hash-Chain" di `docs/04`)

`isAuthorized()`/`attemptAccess()` mengecek consent dari **IndexedDB lokal**, bukan dari
Supabase. Di demo ini (satu browser, satu IndexedDB dipakai bersama lintas ganti-role),
ini bekerja benar karena consent yang Agen berikan langsung terlihat oleh Eksportir di
device yang sama. **Untuk deployment sungguhan lintas-device** (Eksportir di laptop
kantor, consent diberikan Agen di HP lapangan), pengecekan ini perlu diarahkan ke
Supabase (baca tabel `consent` yang sudah tersinkron), bukan IndexedDB lokal Eksportir
yang kosong. Ini **BUKAN bug baru** — ini keterbatasan yang sudah melekat pada
`lib/consent.ts` sejak dibuat (Sprint 7), dinyatakan terbuka di sini karena fitur ini
adalah pemakai pertamanya dalam konteks lintas-device. Stretch goal, bukan blocker.

### 2.3 Verifikasi Fase 2 (browser test nyata, Playwright)

- `npx tsc -b --noEmit` + `npm run build` bersih.
- Alur penuh satu browser: Agen buat petani+plot+kartu → beri consent ke "Eksportir" →
  unggah 3 dokumen wajib → sinkron manual (queue 0) → ganti role ke Eksportir → buka
  **Petani Terdekat** → klik titik peta → petani yang baru dibuat **muncul di daftar**
  dengan jarak + badge tier + "Berkas Lengkap" → klik **"Hubungi"** →
  **"Akses diizinkan"** (cocok dengan consent yang diberikan sebelumnya).
- **Regresi**: dashboard Eksportir existing (`/eksportir`, tabel utama lintas-agen)
  dicek masih memuat baris dengan benar setelah nav baru ditambahkan — tidak berubah
  perilaku.

---

## 3. Yang SENGAJA Tidak Dikerjakan (dicatat, bukan diabaikan)

- **Upload file sungguhan ke Supabase Storage** — stretch goal terpisah. Kalau
  dikerjakan nanti: butuh bucket Storage + RLS + antrean sinkron file offline (lebih
  besar dari scope Sprint 16/17 ini).
- **Verifikasi identitas otomatis/OCR** — `verified: boolean` tetap manual (petugas
  koperasi yang tandai), konsisten dengan prinsip "koreksi manual di tangan manusia"
  sejak awal proyek (lihat override manual `KartuCard.tsx` Sprint 7).
- **Consent check lintas-device via Supabase** — lihat §2.2, keterbatasan existing
  yang diwariskan, bukan sesuatu yang diperkenalkan fitur ini.

---

## 4. Tracker Sprint 16–17

| # | Sprint | Role | Status |
|---|---|---|---|
| 16 | Dokumen Petani Terverifikasi (hash+metadata, badge kelengkapan) | 🟦 FS | ✅ |
| 17 | Panel "Petani Terverifikasi Terdekat" (Eksportir) | 🟦 FS | ✅ |

---

## 5. Definition of Done

- [x] Dokumen yang diunggah Agen offline tersimpan sebagai hash+metadata (bukan file),
      tercatat ke hash-chain, dan badge kelengkapan berubah benar berdasar 3 dokumen
      wajib. Verifikasi Sprint 16 (Playwright, offline penuh).
- [x] `tentukanTier`/`tentukanStdbStatus` (Sprint 5) nol regresi — dikonfirmasi lewat
      re-run `ruleEngine.test-cases.ts` setelah `getDocumentCompleteness` ditambah.
- [x] Hash-chain existing (`verifyChain`) nol regresi setelah entri dokumen ditambahkan
      — dikonfirmasi "Rantai utuh" tetap muncul.
- [x] Sinkron dokumen ke Supabase dikonfirmasi LANGSUNG lewat REST API (bukan cuma
      IndexedDB lokal) — hanya metadata+hash yang mendarat, tanpa kolom file/blob.
- [x] Panel Eksportir hanya menampilkan petani dengan **berkas lengkap** (dikonfirmasi
      lewat data campuran: petani lengkap muncul, yang tidak lengkap tidak muncul).
- [x] Jarak dihitung benar via `@turf/turf` dan diurutkan ascending.
- [x] "Hubungi" tunduk pada consent yang sudah ada (`attemptAccess`) — dikonfirmasi
      authorized ketika consent "Eksportir" sudah diberikan sebelumnya.
- [x] Dashboard Eksportir existing (`/eksportir`) nol regresi setelah nav & route baru
      ditambahkan.
