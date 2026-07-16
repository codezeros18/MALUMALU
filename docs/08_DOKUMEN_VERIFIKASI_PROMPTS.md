# 📋 DOKUMEN VERIFIKASI + PANEL TERDEKAT PROMPTS — Sprint 16–17

> Semua prompt siap-tempel untuk fitur ini, digabung satu file (pola sama seperti
> `docs/05_FULL_PRODUCTION_PROMPTS.md`). Acuan teknis lengkap ada di
> `docs/07_DOKUMEN_VERIFIKASI_BLUEPRINT.md` — baca dulu sebelum eksekusi Sprint 16.
> State repo saat ini ada di `docs/06_PROGRESS_LOG.md`.
>
> Cara pakai: copy blok `>>> PROMPT UNTUK CLAUDE CODE <<<` satu sprint, paste ke Claude
> Code, tunggu selesai, cek Definition of Done, centang di
> `docs/07_DOKUMEN_VERIFIKASI_BLUEPRINT.md` §4, lanjut sprint berikutnya berurutan
> (16→17, jangan lompat — Sprint 17 bergantung pada fondasi Sprint 16).

---

## 🟦 SPRINT 16 — Dokumen Petani Terverifikasi (FS)

| | |
|---|---|
| **Prasyarat** | Sprint 9–15 (full production, Supabase+sync+role) selesai |
| **Aksi manual WAJIB** | User menjalankan SQL tabel `petani_document` + policy RLS di Supabase SQL Editor (langkah terakhir sprint ini, setelah kode siap) |

### 🎯 Tujuan
Agen bisa mencatat dokumen legalitas/identitas petani (KTP, bukti lahan, STDB, dst)
secara offline — hanya HASH+metadata yang disimpan/disinkron, dicatat ke hash-chain
sebagai bukti belum-diubah, dengan sinyal "Berkas Lengkap" terpisah dari tier/STDB yang
sudah ada.

### ✅ Task
- [ ] 16.1 `DocumentType` + `PetaniDocument` di `src/types/index.ts` (aditif)
- [ ] 16.2 Object store `petaniDocument` di `lib/db.ts` (migration `DB_VERSION` 2→3) +
      `addDocument`/`listDocumentsByPetani`/`markDocumentVerified`
- [ ] 16.3 `'petaniDocument'` di `lib/sync.ts` (`SyncEntityType`/`TABLE_NAME`/`ALLOWED_COLUMNS`)
- [ ] 16.4 `src/lib/documents.ts` BARU — `hashFile()` (Web Crypto SHA-256) +
      `registerDocument()` (reuse `appendEntry` dari `lib/hashchain.ts`)
- [ ] 16.5 `getDocumentCompleteness()` + `REQUIRED_DOCUMENT_TYPES` di `lib/ruleEngine.ts`
      (fungsi baru terpisah — `tentukanTier`/`tentukanStdbStatus` TIDAK disentuh)
- [ ] 16.6 `src/components/DocumentUpload.tsx` BARU — 10 tipe dokumen, 4 kategori, badge
      status, upload native `<input type="file">`
- [ ] 16.7 Wire ke `src/pages/PlotDetail.tsx` di bawah `ConsentPanel`
- [ ] 16.8 SQL `petani_document` + RLS (dijalankan manual oleh user di Supabase)

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 16 — Dokumen Petani Terverifikasi. Acuan:
docs/07_DOKUMEN_VERIFIKASI_BLUEPRINT.md §1 (Fase 1). Prasyarat: Sprint 9-15 (full
production) sudah selesai — baca docs/04_FULL_PRODUCTION_BLUEPRINT.md dan
docs/06_PROGRESS_LOG.md kalau perlu konteks arsitektur sync/role yang sudah ada.

GUARDRAIL WAJIB (baca dulu sebelum coding):
- lib/ruleEngine.ts: tentukanTier() dan tentukanStdbStatus() TIDAK BOLEH diubah sama
  sekali. Kelengkapan dokumen adalah fungsi PURE baru dan terpisah
  (getDocumentCompleteness), bukan menyusup ke logika tier/STDB yang sudah teruji sejak
  Sprint 5.
- lib/hashchain.ts: appendEntry()/verifyChain() di-REUSE apa adanya, JANGAN buat fungsi
  hash-chain paralel baru untuk dokumen.
- Dokumen sensitif (KTP dkk): HANYA hash SHA-256 + metadata (nama file, ukuran, tipe,
  waktu) yang disimpan/disinkron. File aslinya TIDAK diunggah ke server — jangan
  tambahkan Supabase Storage atau logika upload file sungguhan di sprint ini.

Lakukan:

1. src/types/index.ts — tambah (aditif, jangan hapus/ubah field lain):
   export type DocumentType = 'ktp' | 'kk' | 'bukti-kepemilikan-lahan' | 'bukti-pbb'
     | 'surat-persetujuan-tetangga' | 'stdb' | 'foto-plot' | 'riwayat-panen'
     | 'riwayat-transaksi' | 'sertifikat-pelatihan';
   export interface PetaniDocument extends Syncable {
     id: string; petaniId: string; type: DocumentType; fileName: string;
     fileHash: string; fileSizeBytes: number; uploadedAt: number; verified: boolean;
     notes?: string;
   }

2. src/lib/db.ts:
   - Object store baru 'petaniDocument' + index 'by-petani' pada petaniId.
   - Naikkan DB_VERSION, tambah migration guard `if (oldVersion < versi-baru)` yang
     membuat store ini — JANGAN ubah migration guard versi sebelumnya.
   - addDocument(input): generate id/uploadedAt/verified:false, put ke store, enqueueSync.
   - listDocumentsByPetani(petaniId): getAllFromIndex by-petani.
   - markDocumentVerified(id): set verified:true, put ulang, enqueueSync update.

3. src/lib/sync.ts — tambah 'petaniDocument' ke SyncEntityType, TABLE_NAME (map ke
   'petani_document'), ALLOWED_COLUMNS (id, petani_id, type, file_name, file_hash,
   file_size_bytes, uploaded_at, verified, notes, agent_id). Pola sama seperti entity
   lain, tidak ada logika sync baru.

4. src/lib/documents.ts (BARU):
   - hashFile(file: File): Promise<string> — pakai crypto.subtle.digest('SHA-256', ...)
     (Web Crypto API bawaan browser, BUKAN crypto-js), convert ke hex string.
   - registerDocument(petaniId, type, file): hash file -> addDocument({...,fileHash}) ->
     appendEntry({ type: 'document', petaniId, documentId: doc.id, documentType: type,
     fileHash }) -> return doc.

5. src/lib/ruleEngine.ts — tambah di akhir file (JANGAN ubah baris lain):
   export const REQUIRED_DOCUMENT_TYPES: DocumentType[] =
     ['ktp', 'bukti-kepemilikan-lahan', 'stdb'];
   export function getDocumentCompleteness(documents: PetaniDocument[]):
     { complete: boolean; missing: DocumentType[] } { ... }

6. src/components/DocumentUpload.tsx (BARU):
   - Props: { petaniId: string }.
   - 10 tipe dokumen dikelompokkan 4 kategori (Identitas / Legalitas Lahan / Data
     Teknis Kebun / Dokumen Pendukung) — lihat tabel pengelompokan di blueprint §1.1.
   - Badge status per baris: Belum ada (neutral) / Tersimpan lokal (pending) /
     Tersinkron (synced) / Terverifikasi (aman) — reuse components/ui/Badge.tsx.
   - Upload pakai <input type="file" accept="image/*,.pdf" capture="environment"> yang
     disembunyikan (className hidden), dibungkus <label> supaya diklik.
   - Badge ringkasan "Berkas Lengkap"/"Berkas Belum Lengkap" di header komponen dari
     getDocumentCompleteness().

7. Wire ke src/pages/PlotDetail.tsx — render <DocumentUpload petaniId={petani.id} />
   di bawah <ConsentPanel />, HANYA kalau `petani` sudah ada.

8. Verifikasi TIDAK ADA regresi:
   - npx tsc -b --noEmit dan npm run build harus bersih.
   - node src/lib/ruleEngine.test-cases.ts — semua skenario existing (Kasus A/B/C,
     determinisme) HARUS tetap PASS setelah getDocumentCompleteness ditambah.
   - Browser test nyata (npm run build && npm run preview + Playwright, BUKAN npm run
     dev): buat plot+kartu OFFLINE -> unggah KTP+bukti-kepemilikan-lahan+STDB (file
     dummy) -> badge berubah ke "Berkas Lengkap" -> hash-chain bertambah TEPAT 3 entri
     -> "Verifikasi Rantai" tetap "Rantai utuh" (regresi hash-chain existing).

9. Siapkan (JANGAN jalankan sendiri) SQL untuk user jalankan manual di Supabase SQL
   Editor:
   create table petani_document (
     id text primary key, petani_id text not null references petani(id),
     type text not null, file_name text not null, file_hash text not null,
     file_size_bytes bigint not null, uploaded_at bigint not null,
     verified boolean not null default false, notes text, agent_id text not null
   );
   alter table petani_document enable row level security;
   create policy "demo_allow_all" on petani_document for all using (true) with check (true);

   Setelah user konfirmasi SQL berhasil jalan, verifikasi sinkron BENAR-BENAR sampai:
   trigger sync -> cek langsung lewat Supabase REST API (bukan cuma percaya IndexedDB
   lokal) bahwa baris muncul dengan HANYA metadata+hash (pastikan TIDAK ada kolom
   file/blob apa pun).

Setelah selesai, sarankan commit:
`git commit -m "sprint-16: dokumen petani terverifikasi (hash+metadata, badge kelengkapan)"`.
```

### ✔️ Definition of Done
- `npx tsc -b --noEmit` dan `npm run build` bersih.
- `ruleEngine.test-cases.ts` nol regresi.
- Upload dokumen offline -> badge kelengkapan berubah benar -> hash-chain bertambah
  sesuai jumlah dokumen -> verifyChain tetap valid.
- Baris tersinkron ke Supabase dikonfirmasi via REST API, hanya metadata+hash.

---

## 🟦 SPRINT 17 — Panel "Petani Terverifikasi Terdekat" (FS)

| | |
|---|---|
| **Prasyarat** | Sprint 16 selesai & terverifikasi penuh |

### 🎯 Tujuan
Eksportir bisa klik satu titik di peta dan melihat petani dengan berkas lengkap paling
dekat, terurut jarak, dengan akses kontak yang tetap tunduk pada sistem consent yang
sudah ada — bukan pintu belakang baru.

### ✅ Task
- [ ] 17.1 `src/components/NearbyMap.tsx` BARU — klik-pilih titik referensi + marker
      hasil (dibedakan visual dari titik referensi)
- [ ] 17.2 `src/pages/PetaniTerdekat.tsx` BARU — fetch Supabase, filter berkas lengkap,
      hitung jarak `@turf/turf`, sort, render list+peta
- [ ] 17.3 Route `/eksportir/terdekat` di `App.tsx` + nav item di `DashboardShell.tsx`
- [ ] 17.4 Tombol "Hubungi" wired lewat `lib/consent.ts`'s `attemptAccess()`

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 17 — Panel "Petani Terverifikasi Terdekat" untuk Eksportir. Acuan:
docs/07_DOKUMEN_VERIFIKASI_BLUEPRINT.md §2 (Fase 2). Prasyarat: Sprint 16 (petani_document
+ getDocumentCompleteness) sudah selesai dan terverifikasi.

GUARDRAIL WAJIB:
- Akses ke kontak petani ("Hubungi") WAJIB lewat attemptAccess() dari lib/consent.ts
  yang sudah ada sejak Sprint 7. JANGAN buat jalur akses baru yang melewati sistem
  consent/AccessLog/notif yang sudah jadi inti fitur keamanan proyek ini.
- Halaman ini online-only (baca langsung dari Supabase via supabaseBackend.fetchAll(),
  pola identik EksportirDashboard.tsx) — BUKAN dari IndexedDB, karena perlu data
  lintas-agen.
- Filter HANYA petani dengan getDocumentCompleteness().complete === true — jangan
  tampilkan yang belum lengkap sama sekali (bukan cuma diberi label beda).

Lakukan:

1. src/components/NearbyMap.tsx (BARU, terpisah dari MapView.tsx karena beda kebutuhan):
   - Props: { referencePoint, onPickReference(lat,lng), markers: {id,lat,lng,label}[] }.
   - Leaflet MapContainer center Pangalengan (sama seperti MapView.tsx), klik peta ->
     onPickReference. Marker referensi pakai pin default (biru). Marker hasil pakai
     L.divIcon warna hijau kecil supaya tidak tertukar visual dengan titik referensi.
   - Replikasi fix icon default Leaflet yang sama seperti di MapView.tsx (idempotent,
     aman dijalankan dua kali).

2. src/pages/PetaniTerdekat.tsx (BARU):
   - Fetch kartu, petani, plot, petaniDocument dari Supabase (supabaseBackend.fetchAll
     + fromSupabaseRow, pola sama persis EksportirDashboard.tsx).
   - Kelompokkan petaniDocument by petaniId, hitung getDocumentCompleteness() per
     petani (BUKAN per dokumen/kartu individual).
   - State referencePoint (lat,lng) dari klik peta. Kalau null, tampilkan EmptyState
     "klik satu titik di peta".
   - Kalau referencePoint terisi: filter kartu yang petaninya complete===true DAN
     py punya plot -> hitung jarak dari referencePoint ke plot pakai
     distance(point([refLng,refLat]), point([plotLng,plotLat]), {units:'kilometers'})
     dari '@turf/turf' -> sort ascending -> render sebagai list (nama, desa, jarak km,
     Badge tier, Badge "Berkas Lengkap") + marker di NearbyMap.
   - Tombol "Hubungi" per baris -> panggil attemptAccess(kartu.id, 'Eksportir') dari
     lib/consent.ts -> tampilkan hasil ("Akses diizinkan"/"Akses ditolak, notif
     terkirim") di bawah tombol.

3. src/App.tsx — tambah route:
   <Route path="/eksportir/terdekat" element={<RequireRole role="eksportir">
     <PetaniTerdekat /></RequireRole>} />

4. src/components/DashboardShell.tsx — tambah nav item baru di grup 'Monitoring' role
   eksportir: { label: 'Petani Terdekat', to: '/eksportir/terdekat', icon: Navigation }
   (import Navigation dari lucide-react, sudah jadi dependency).

5. Verifikasi TIDAK ADA regresi:
   - npx tsc -b --noEmit dan npm run build harus bersih.
   - Browser test nyata (build+preview+Playwright): satu alur penuh — Agen buat
     petani+plot+kartu -> beri consent ke "Eksportir" lewat ConsentPanel -> unggah 3
     dokumen wajib -> sinkron manual sampai queue kosong -> ganti role ke Eksportir ->
     buka /eksportir (dashboard existing) pastikan MASIH memuat baris seperti biasa
     (regresi) -> buka Petani Terdekat -> klik titik peta -> petani yang baru dibuat
     HARUS muncul di daftar dengan jarak + badge tier + "Berkas Lengkap" -> klik
     "Hubungi" -> harus muncul "Akses diizinkan" (karena consent sudah diberikan).
   - Uji juga kasus petani TANPA dokumen lengkap TIDAK muncul di daftar (filter benar
     bekerja, bukan cuma kebetulan kosong).

Setelah selesai, sarankan commit:
`git commit -m "sprint-17: panel petani terverifikasi terdekat untuk eksportir"`.
```

### ✔️ Definition of Done
- `npx tsc -b --noEmit` dan `npm run build` bersih.
- Filter berkas-lengkap dikonfirmasi benar (petani lengkap muncul, tidak lengkap tidak).
- Jarak dihitung benar via `@turf/turf`, terurut ascending.
- "Hubungi" tunduk pada consent existing (`attemptAccess`), tercatat di `AccessLog`.
- Dashboard Eksportir existing (`/eksportir`) nol regresi.
