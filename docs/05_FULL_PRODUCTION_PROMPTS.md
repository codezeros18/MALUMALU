# 📋 FULL PRODUCTION PROMPTS — Sprint 9–15

> Semua prompt siap-tempel untuk fase full-production, digabung satu file (bukan
> dipisah per-file seperti `sprints/SPRINT_0X.md` di fase MVP). Acuan teknis lengkap
> ada di `docs/04_FULL_PRODUCTION_BLUEPRINT.md` — baca dulu sebelum eksekusi Sprint 9.
> State repo saat ini (apa yang sudah ada) ada di `docs/06_PROGRESS_LOG.md`.
>
> Cara pakai: sama seperti fase MVP — copy blok `>>> PROMPT UNTUK CLAUDE CODE <<<` satu
> sprint, paste ke Claude Code, tunggu selesai, cek Definition of Done, centang di
> `docs/04_FULL_PRODUCTION_BLUEPRINT.md` §7, lanjut sprint berikutnya berurutan (9→15,
> jangan lompat — tiap sprint bergantung pada sprint sebelumnya).

---

## 🟦 SPRINT 9 — Supabase Setup & Schema (FS)

| | |
|---|---|
| **Prasyarat** | Sprint 1–8 (MVP) selesai |
| **Aksi manual WAJIB sebelum mulai** | User membuat project di supabase.com, catat Project URL + anon public key |

### 🎯 Tujuan
Menyambungkan proyek ke Supabase sebagai backend terpusat, tanpa mengganggu apa pun
yang sudah jalan offline.

### ✅ Task
- [ ] 9.1 Buat project Supabase (**manual oleh user, LANGKAH PERTAMA** — jangan mulai
      coding sebelum ini beres, supaya kalau ada friksi ketahuan dari awal)
- [ ] 9.2 Jalankan SQL schema dari `docs/04_FULL_PRODUCTION_BLUEPRINT.md` §2 di
      Supabase SQL Editor
- [ ] 9.3 `npm install @supabase/supabase-js`
- [ ] 9.4 `src/lib/supabaseClient.ts`
- [ ] 9.5 `.env.example` (commit) + `.env.local` (gitignored, isi asli)
- [ ] 9.6 Extend `src/types/index.ts` dengan `SyncStatus` + kolom sync per entity

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 9 — Supabase Setup & Schema untuk fase full-production Paspor Petani v2.
Acuan: docs/04_FULL_PRODUCTION_BLUEPRINT.md (bagian 1 "Arsitektur Sync" dan bagian 2
"Skema Database Supabase"). Baca juga docs/06_PROGRESS_LOG.md untuk paham state repo
saat ini sebelum mulai. JANGAN ubah alur offline Agen yang sudah ada (Home.tsx,
PlotDetail.tsx, lib/db.ts, lib/hashchain.ts, lib/consent.ts, lib/geospatial.ts,
lib/ruleEngine.ts) — sprint ini murni menambah fondasi backend, tidak menyentuh logika
yang sudah terverifikasi.

PENTING: saya (user) sudah membuat project Supabase dan sudah menjalankan SQL schema
dari blueprint §2 di SQL Editor Supabase secara manual. Project URL dan anon key akan
saya berikan / saya isi sendiri ke .env.local setelah kamu siapkan .env.example.

Lakukan:

1. npm install @supabase/supabase-js (pakai registry npm yang sama seperti sprint-sprint
   sebelumnya — kalau registry.npmjs.org bermasalah lagi, pakai workaround .npmrc yang
   sudah ada di root project, JANGAN install ulang dari awal).

2. src/lib/supabaseClient.ts:
   - Buat instance client tunggal (singleton) dari createClient() memakai
     import.meta.env.VITE_SUPABASE_URL dan import.meta.env.VITE_SUPABASE_ANON_KEY.
   - Bungkus dengan pengecekan: kalau env var kosong, jangan crash — lempar Error yang
     jelas ("Supabase belum dikonfigurasi, isi .env.local") supaya gagalnya jelas saat
     runtime, bukan silent.

3. .env.example (commit ke git, TANPA nilai asli):
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   Pastikan .env.local ada di .gitignore (tambahkan kalau belum).

4. Extend src/types/index.ts — TAMBAH tanpa menghapus/mengubah field yang sudah ada
   (ini kontrak, sudah dipakai banyak file):
   - export type SyncStatus = 'local' | 'synced' | 'conflict';
   - Tambahkan field opsional berikut ke Petani, Plot, Kartu, ConsentRecord, AccessLog,
     NotifItem, HashChainEntry: syncStatus?: SyncStatus; remoteId?: string;
     updatedAt?: number; agentId?: string.
     (Opsional/`?` supaya data lama yang sudah ada di IndexedDB dari sprint sebelumnya
     tetap valid secara tipe tanpa migrasi paksa.)

5. Verifikasi TIDAK ADA regresi: jalankan npx tsc -b --noEmit (harus bersih), npm run
   build (harus sukses), lalu jalankan app (npm run dev), pastikan alur lama masih
   jalan: tap peta -> simpan plot -> buat kartu -> hash-chain -> consent, TANPA error,
   walau Supabase belum terpakai di UI manapun sama sekali di sprint ini.

Setelah selesai:
- Konfirmasi koneksi Supabase jalan (mis. panggil supabase.from('petani').select('count')
  sekali dari console browser atau script kecil, tunjukkan hasilnya).
- Sarankan commit: `git commit -m "sprint-9: supabase setup, schema, env config, sync types"`.
```

### ✔️ Definition of Done
- `npx tsc -b --noEmit` dan `npm run build` bersih.
- Alur offline MVP (Sprint 1-8) masih 100% jalan tanpa perubahan perilaku.
- Koneksi ke Supabase project terbukti jalan (query test sederhana berhasil).
- `.env.local` TIDAK ter-commit (cek `git status`).

---

## 🟦 SPRINT 10 — Sync Engine / Outbox Pattern (FS)

| | |
|---|---|
| **Prasyarat** | Sprint 9 selesai |

### 🎯 Tujuan
Data yang dibuat Agen offline otomatis masuk antrean, dan terkirim ke Supabase begitu
online — tanpa Agen perlu melakukan apa pun secara manual (kecuali retry kalau gagal).

### ✅ Task
- [ ] 10.1 Object store `syncQueue` di `lib/db.ts`
- [ ] 10.2 `lib/sync.ts` — interface `SyncBackend` + `supabaseBackend` + `mockLocalBackend`
- [ ] 10.3 `pushPendingSync()` + trigger otomatis saat online + tombol manual
- [ ] 10.4 Badge status sync di UI (Home.tsx plot list, PlotDetail.tsx KartuCard)
- [ ] 10.5 Wire `add*`/`put*` di `lib/db.ts` supaya ikut mengisi `syncQueue`

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 10 — Sync Engine (Outbox Pattern) untuk fase full-production.
Acuan: docs/04_FULL_PRODUCTION_BLUEPRINT.md bagian 1 "Arsitektur Sync — Outbox Pattern".
Prasyarat: Sprint 9 (src/lib/supabaseClient.ts, types sync sudah ada) sudah selesai.

PENTING KONSEP (ulangi supaya tidak salah desain): ini BUKAN cache aset statis (itu
sudah ditangani Workbox/vite-plugin-pwa sejak Sprint 8). Ini adalah outbox pattern untuk
DATA YANG DITULIS: tulis ke IndexedDB lokal selalu sukses duluan (sudah begini sejak
Sprint 2, JANGAN diubah), lalu antre di syncQueue, baru dikirim ke Supabase saat online.

Lakukan:

1. src/lib/db.ts — tambah object store baru "syncQueue" (keyPath 'id') di getDB()
   upgrade callback (tambah, JANGAN hapus/ubah store yang sudah ada). Tambah fungsi:
   - enqueueSync(entityType, entityId, operation, payload): Promise<void>
   - listSyncQueue(): Promise<SyncQueueItem[]>
   - removeSyncQueueItem(id): Promise<void>
   - incrementSyncAttempt(id): Promise<void>
   Definisikan interface SyncQueueItem sesuai blueprint §1 (index/timestamp TIDAK perlu,
   cukup id, entityType, entityId, operation, payload, createdAt, attempts).

2. Wire enqueueSync() ke fungsi-fungsi existing yang menulis entity sync-able:
   addPetani, addPlot, addKartu, putKartu (lib/db.ts), appendEntry (lib/hashchain.ts),
   addConsent, revokeConsent (lib/consent.ts lewat db.ts), addAccessLog, addNotif.
   Pola: setelah tulis lokal sukses, panggil enqueueSync(...) dengan payload snapshot
   entity yang baru ditulis. JANGAN bikin kegagalan enqueueSync menggagalkan operasi
   utama (bungkus try/catch terpisah, log error, tapi operasi lokal tetap dianggap sukses
   — prinsip local-first: sync boleh gagal, penyimpanan lokal tidak boleh).

3. src/lib/sync.ts (BARU):
   - interface SyncBackend { upsert(entityType, payload): Promise<{remoteId:string}>;
     fetchAll(entityType): Promise<unknown[]>; }
   - supabaseBackend: SyncBackend — implementasi pakai supabaseClient dari Sprint 9
     (map nama tabel snake_case sesuai skema SQL, mis. entityType 'accessLog' -> tabel
     'access_log').
   - mockLocalBackend: SyncBackend — upsert() langsung resolve sukses dengan remoteId
     dummy TANPA network sama sekali (fallback kalau Supabase belum siap/bermasalah).
   - pushPendingSync(backend: SyncBackend): Promise<{success:number; failed:number}> —
     iterasi listSyncQueue(), panggil backend.upsert per item; sukses -> update entity
     asli (syncStatus:'synced', remoteId) lewat fungsi put yang sesuai + hapus dari
     queue; gagal -> incrementSyncAttempt, biarkan di queue.

4. Trigger otomatis: di App.tsx atau AppContext, tambahkan useEffect yang memanggil
   pushPendingSync(supabaseBackend) setiap kali useOnlineStatus() berubah dari false ke
   true. Tambah juga interval ringan (mis. 30 detik) yang HANYA jalan kalau isOnline
   true DAN queue tidak kosong (jangan polling terus tanpa syarat).

5. UI: tambah badge status sync kecil di item plot (Home.tsx) dan di KartuCard.tsx —
   "Tersimpan lokal" (abu-abu) / "Tersinkron" (hijau) / "Gagal sinkron" (merah, dengan
   tombol retry manual yang memanggil pushPendingSync ulang untuk item itu saja atau
   semua).

6. Tombol manual "Sinkron sekarang" di Home.tsx (dekat OfflineIndicator) yang memanggil
   pushPendingSync(supabaseBackend) dan menampilkan hasil (berapa sukses/gagal).

7. PENTING — jangan sampai regresi: seluruh alur offline yang sudah ada (tap peta, buat
   kartu, hash-chain, consent, notif) HARUS tetap 100% jalan tanpa Supabase menyala
   sama sekali (matikan network sepenuhnya, semua tetap harus bisa dipakai, cuma data
   menumpuk di syncQueue menunggu online).

Setelah selesai:
- Uji: matikan network -> tap peta -> simpan plot -> buat kartu -> cek syncQueue ada
  isinya (lewat devtools Application > IndexedDB) -> nyalakan network -> tunggu sebentar
  atau klik "Sinkron sekarang" -> cek badge berubah jadi "Tersinkron" -> cek row muncul
  di Supabase table editor.
- Uji retry: matikan Supabase URL sementara (env salah) -> coba sync -> pastikan gagal
  dengan baik (badge "Gagal sinkron", tidak crash app) -> betulkan -> retry manual sukses.
- Sarankan commit: `git commit -m "sprint-10: outbox sync engine, sync status badges"`.
```

### ✔️ Definition of Done
- Data dibuat offline → otomatis masuk `syncQueue` → tersinkron ke Supabase saat online
  (terbukti muncul di Supabase table editor).
- Alur offline penuh (tanpa Supabase menyala sama sekali) tetap 100% berfungsi.
- Badge status sync terlihat jelas dan berubah sesuai kondisi nyata.
- Retry manual berfungsi setelah kegagalan sync.

---

## 🟦 SPRINT 11 — Demo Auth & Role Routing (FS)

| | |
|---|---|
| **Prasyarat** | Sprint 9-10 selesai (tidak wajib, tapi lebih baik sync dulu jalan) |

### 🎯 Tujuan
Tiga role (Petani/Agen/Eksportir) bisa "login" (demo, tanpa password) dan diarahkan ke
dashboard masing-masing, tanpa merusak route/alur yang sudah ada (cuma dipindah).

### ✅ Task
- [ ] 11.1 `pages/Login.tsx` (BARU) — role selector, jadi route `/`
- [ ] 11.2 Extend `AppContext` dengan `currentRole` + persist ke `storage.ts`
- [ ] 11.3 `components/RequireRole.tsx` (BARU) — route guard
- [ ] 11.4 Pindah `Home.tsx` alur ke route `/agen`, `PlotDetail.tsx` ke `/agen/plot/:id`
- [ ] 11.5 Update `App.tsx` routing + nav header per-role

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 11 — Demo Auth & Role Routing untuk fase full-production.
Acuan: docs/04_FULL_PRODUCTION_BLUEPRINT.md bagian 3 "Role & Routing". Auth di sprint
ini adalah DEMO (tanpa backend auth sungguhan, sesuai keputusan yang sudah dikonfirmasi)
— jangan pasang Supabase Auth di sprint ini, itu stretch goal terpisah kalau ada waktu.

PENTING: ini sprint paling berresiko regresi karena menyentuh routing & AppContext yang
dipakai banyak komponen (NotifBanner sudah pakai AppContext dari Sprint 7). Lakukan
hati-hati, dan WAJIB re-verifikasi seluruh alur Agen (yang cuma pindah alamat route,
bukan berubah logika) masih identik perilakunya setelah dipindah.

Lakukan:

1. src/context/AppContext.tsx — extend (JANGAN hapus notifVersion/refreshNotif yang
   sudah ada dari Sprint 7):
   - Tambah state currentRole: 'petani' | 'agen' | 'eksportir' | null, di-inisialisasi
     dari getItem<string>('current-role') via lib/storage.ts (sudah ada).
   - Tambah setRole(role) yang update state DAN setItem('current-role', role).

2. src/pages/Login.tsx (BARU): 3 kartu besar (Petani/Agen/Eksportir) pakai styling
   konsisten dengan tema hijau brand yang sudah ada. Klik kartu -> panggil setRole(role)
   dari AppContext -> navigate ke '/agen' atau '/petani' atau '/eksportir' sesuai pilihan.
   Ini akan jadi route "/" yang baru.

3. src/components/RequireRole.tsx (BARU): komponen wrapper
   `<RequireRole role="agen"><Home /></RequireRole>` — baca currentRole dari
   useAppContext(), kalau tidak cocok/null, <Navigate to="/" replace />, kalau cocok
   render children.

4. src/App.tsx — restrukturisasi routing (PERHATIKAN: ini mengubah struktur Routes yang
   sudah ada, lakukan dengan hati-hati):
   - "/" -> <Login />
   - "/agen" -> <RequireRole role="agen"><Home /></RequireRole>
   - "/agen/plot/:id" -> <RequireRole role="agen"><PlotDetail /></RequireRole>
   - "/petani" -> placeholder sementara (diisi penuh Sprint 14) dibungkus
     RequireRole role="petani"
   - "/eksportir" -> placeholder sementara (diisi penuh Sprint 13) dibungkus
     RequireRole role="eksportir"
   - Header nav: tampilkan link cuma yang relevan dengan currentRole (mis. Agen lihat
     "Home"/"Petani List", bukan link Eksportir). Tambah tombol kecil "Ganti Role" yang
     panggil setRole(null) lalu navigate('/').
   - src/pages/PetaniList.tsx yang sudah ada (masih placeholder dari Sprint 1) -- boleh
     tetap di /agen/petani atau dihapus link-nya sementara, sesuaikan biar tidak error.

5. Perbaiki semua Link internal yang masih mengarah ke path lama (mis. Home.tsx yang
   Link ke `/plot/${plot.id}` HARUS jadi `/agen/plot/${plot.id}`).

6. Verifikasi TIDAK ADA regresi fungsional: jalankan seluruh alur Agen end-to-end
   (idealnya browser test nyata seperti sprint-sprint sebelumnya): buka '/' -> pilih
   Agen -> masuk /agen -> tap peta -> simpan plot -> klik plot -> masuk
   /agen/plot/:id -> buat kartu -> hash-chain verify -> consent+notif -- SEMUA harus
   identik perilakunya dengan sebelum sprint ini, cuma alamat URL yang beda.

Setelah selesai:
- Screenshot/laporkan hasil re-test alur Agen penuh (regression check).
- Uji role guard: coba akses /eksportir tanpa pilih role dulu -> harus ter-redirect ke '/'.
- Sarankan commit: `git commit -m "sprint-11: demo role login, role-scoped routing"`.
```

### ✔️ Definition of Done
- `/` menampilkan Login/RoleSelect, bukan lagi Home langsung.
- Alur Agen (dipindah ke `/agen`) **identik perilakunya** dengan sebelum dipindah —
  regresi nol, dibuktikan dengan re-test end-to-end.
- Akses route yang salah role ter-redirect ke `/`.
- Role bertahan setelah reload (persisted via `storage.ts`).

---

## 🟦 SPRINT 12 — Reusable UI Component Library (FS + 🟩 assist)

| | |
|---|---|
| **Prasyarat** | Tidak bergantung sprint 9-11, bisa paralel kalau ada 2 sesi Claude Code |

### 🎯 Tujuan
Satu sistem komponen (`components/ui/`) dipakai konsisten di semua dashboard —
mengurangi duplikasi Tailwind class dan menegakkan Golden Rules *consistency*.

### ✅ Task
- [ ] 12.1 `components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx`
- [ ] 12.2 `components/ui/Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Checkbox.tsx`
- [ ] 12.3 `components/ui/EmptyState.tsx`
- [ ] 12.4 Migrasi `PlotForm.tsx`, `ConsentPanel.tsx`, `KartuCard.tsx`, `HashChainViewer.tsx`

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 12 — Reusable UI Component Library untuk fase full-production.
Acuan: docs/04_FULL_PRODUCTION_BLUEPRINT.md bagian 4 "Sistem Komponen Reusable +
Golden Rules/Gestalt". Ini sprint REFACTOR VISUAL, bukan fitur baru — perilaku semua
komponen yang dimigrasi harus identik seperti sebelumnya, cuma cara menulis JSX-nya yang
berubah jadi pakai primitif bersama.

Lakukan:

1. Buat src/components/ui/Button.tsx: props `variant: 'primary'|'secondary'|'danger'`,
   `size?: 'sm'|'md'`, standard HTML button props lain diteruskan. Styling ambil dari
   pola warna yang SUDAH dipakai (brand-800 untuk primary, slate untuk secondary, red
   untuk danger) supaya tampilan tidak berubah drastis, cuma disatukan sumbernya.

2. Buat src/components/ui/Card.tsx: wrapper `bg-white rounded-lg border
   border-slate-200 p-4` (persis pola yang sudah dipakai berulang di KartuCard,
   HashChainViewer, ConsentPanel) supaya SATU sumber untuk container ini.

3. Buat src/components/ui/Badge.tsx: props `tone: 'aman'|'perlu-audit'|'berisiko'|
   'alert'|'synced'|'pending'|'neutral'`, map ke warna KONSISTEN (aman=hijau,
   perlu-audit=amber, berisiko/alert=merah, synced=hijau, pending=abu-abu). Ini akan
   dipakai ulang di Sprint 10 (badge sync) dan Sprint 13 (dashboard Eksportir) — desain
   API-nya supaya cukup generik untuk kedua kebutuhan itu.

4. Buat src/components/ui/Input.tsx, Select.tsx, Textarea.tsx, Checkbox.tsx: styling
   konsisten (border-slate-300, rounded-md, px-3 py-2) mengikuti pola yang sudah dipakai
   di PlotForm.tsx dan KartuCard.tsx saat ini.

5. Buat src/components/ui/EmptyState.tsx: props `message: string`, tampilan sederhana
   teks abu-abu di tengah, dipakai untuk kondisi "belum ada data" (akan dipakai di
   dashboard Eksportir Sprint 13 dan tempat lain yang relevan).

6. Migrasi (satu per satu, verifikasi tsc setelah tiap file):
   - src/components/PlotForm.tsx -> pakai Button, Input, Card
   - src/components/ConsentPanel.tsx -> pakai Button, Card, Badge (untuk badge "DATA
     DEMO" kalau relevan), Input, Checkbox
   - src/components/KartuCard.tsx -> pakai Card, Badge (tier/stdbStatus), Button,
     Select, Textarea (form koreksi manual)
   - src/components/HashChainViewer.tsx -> pakai Card, Button, Badge (hasil verifikasi
     valid/rusak)
   PENTING: JANGAN ubah logika/handler/state di komponen-komponen ini, HANYA ganti
   elemen JSX mentah (<button>, <input>, <div className="bg-white...">) jadi
   pemanggilan komponen ui/ yang setara. Behavior harus identik.

7. Verifikasi TIDAK ADA regresi: npx tsc -b --noEmit bersih, npm run build sukses, lalu
   re-test alur Agen penuh (sprint 4,6,7 punya browser test — ulangi skenario yang sama:
   tap peta+simpan, buat+commit kartu, verify+tamper+reset hash-chain, grant consent+
   attempt access+notif) untuk pastikan tampilan berubah rapi TAPI fungsi sama persis.

Setelah selesai:
- Screenshot before/after salah satu komponen (mis. KartuCard) untuk bukti visual
  konsisten tapi tidak berubah drastis.
- Sarankan commit: `git commit -m "sprint-12: reusable ui component library, migrate existing components"`.
```

### ✔️ Definition of Done
- `components/ui/*` dipakai oleh minimal 4 komponen existing (PlotForm, ConsentPanel,
  KartuCard, HashChainViewer).
- Tidak ada perubahan behavior/regresi — semua browser test dari Sprint 4/6/7 lolos ulang.
- Warna status (`Badge tone`) konsisten dan bersumber dari satu tempat.

---

## 🟦 SPRINT 13 — Eksportir Dashboard (FS + 🟩 assist)

| | |
|---|---|
| **Prasyarat** | Sprint 9-12 selesai (butuh sync jalan + komponen ui + role routing) |

### 🎯 Tujuan
Eksportir bisa memonitor seluruh data lintas-agen dari satu dashboard, online, langsung
dari Supabase.

### ✅ Task
- [ ] 13.1 `pages/EksportirDashboard.tsx` — fetch dari Supabase via `sync.ts` backend
- [ ] 13.2 Tabel + filter (tier, stdbStatus, cari nama/desa)
- [ ] 13.3 Drill-in read-only (`KartuCard` + `HashChainViewer` tanpa tombol tamper)
- [ ] 13.4 Ringkasan stat (total petani, % export-ready, alert belum ditinjau)

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 13 — Eksportir Dashboard untuk fase full-production.
Acuan: docs/04_FULL_PRODUCTION_BLUEPRINT.md bagian 6 "Dashboard Eksportir". Prasyarat:
sync engine (Sprint 10) dan komponen ui (Sprint 12) sudah ada — pakai ulang, jangan
bikin gaya baru.

Lakukan:

1. src/pages/EksportirDashboard.tsx (ganti placeholder dari Sprint 11), diakses lewat
   route /eksportir (sudah dibungkus RequireRole role="eksportir" dari Sprint 11):
   - Saat mount, panggil supabaseBackend.fetchAll('kartu') (dan 'petani', 'plot' untuk
     join data tampilan) dari src/lib/sync.ts. Ini BUKAN baca dari IndexedDB lokal --
     role ini online-only sesuai desain di blueprint.
   - State loading/error yang jelas kalau Supabase tidak terjangkau (pesan: "Dashboard
     ini butuh koneksi internet").

2. Tabel: kolom nama petani, agen (agentId), tier, stdbStatus, deforestasi, syncStatus,
   indikator alert (query access_log where authorized=false untuk kartu tsb, tampilkan
   badge merah kalau ada).

3. Filter: dropdown tier (semua/lokal/export-ready), dropdown stdbStatus, input
   pencarian nama/desa (client-side filter di atas data yang sudah di-fetch, tidak perlu
   query ulang tiap ketik).

4. Drill-in: klik baris -> tampilkan KartuCard (dari components/KartuCard.tsx, MODE
   READ-ONLY -- sembunyikan tombol "Koreksi manual" lewat prop baru mis. `readOnly?:
   boolean` yang kalau true menyembunyikan tombol override) + HashChainViewer (MODE
   READ-ONLY juga -- sembunyikan tombol "Simulasi ubah data" & "Reset demo" lewat prop
   serupa, hanya tombol "Verifikasi Rantai" yang tetap ada).
   PENTING: tambahkan prop readOnly ke KartuCard.tsx dan HashChainViewer.tsx (default
   false supaya /agen tidak berubah perilakunya), JANGAN duplikasi komponen.

5. Ringkasan stat di atas tabel (pakai Card dari components/ui): total petani terdaftar,
   persentase export-ready, jumlah alert akses tak sah yang belum ditinjau. Pakai
   EmptyState kalau data kosong.

6. Verifikasi: pastikan /agen (KartuCard, HashChainViewer dengan tombol lengkap) TIDAK
   berubah perilakunya setelah penambahan prop readOnly (defaultnya harus false).

Setelah selesai:
- Uji dengan minimal 2 kartu dari 2 "agentId" berbeda (buat manual lewat /agen dua kali
  dengan localStorage berbeda/browser profile berbeda kalau perlu) supaya dashboard
  benar-benar menunjukkan data LINTAS-AGEN, bukan cuma satu device.
- Sarankan commit: `git commit -m "sprint-13: eksportir monitoring dashboard"`.
```

### ✔️ Definition of Done
- Dashboard Eksportir menampilkan data dari lebih dari satu agen/device (bukti nyata
  data terpusat).
- Filter & drill-in berfungsi, mode read-only benar-benar menyembunyikan tombol
  destruktif/demo (tamper, override).
- `/agen` tidak mengalami regresi (prop `readOnly` default `false`).

---

## 🟦 SPRINT 14 — Petani Portal + PDF Export (FS)

| | |
|---|---|
| **Prasyarat** | Sprint 9-12 selesai |

### 🎯 Tujuan
Petani (yang punya HP & email terdaftar) bisa melihat paspor datanya sendiri, kelola
consent, dan unduh sebagai PDF — tanpa perlu Agen mendampingi.

### ✅ Task
- [ ] 14.1 Tambah field opsional `email` ke `Petani` (`types/index.ts`) + form Agen
      (`PlotForm.tsx`) untuk mengisinya saat registrasi
- [ ] 14.2 `pages/PetaniPortal.tsx` — email lookup
- [ ] 14.3 Tampilan read-only Kartu + consent self-manage
- [ ] 14.4 Tombol "Unduh PDF" (`@media print`)
- [ ] 14.5 Disclosure jelas: mode demo, bukan portal terverifikasi identitas

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 14 — Petani Portal + PDF Export untuk fase full-production.
Acuan: docs/04_FULL_PRODUCTION_BLUEPRINT.md bagian 5 "Petani Portal & Ekspor PDF".
PENTING: akses di sprint ini adalah LOOKUP EMAIL TANPA VERIFIKASI SUNGGUHAN (Phase A,
sesuai keputusan yang sudah dikonfirmasi) — WAJIB tampilkan disclosure jelas di UI
tentang keterbatasan ini, jangan diam-diam terkesan aman padahal tidak.

Lakukan:

1. src/types/index.ts — tambah field opsional `email?: string` ke interface Petani
   (menambah, tidak mengubah field yang sudah ada -- ini kontrak, hati-hati).

2. src/components/PlotForm.tsx — tambah 1 input opsional "Email petani (opsional,
   untuk akses portal)" di form registrasi, diteruskan ke handleSubmit di Home.tsx lalu
   ke addPetani (lib/db.ts, tambahkan email ke payload yang sudah ada, field ini optional
   jadi tidak mematahkan pemanggilan lain yang tidak menyertakan email).

3. src/pages/PetaniPortal.tsx (ganti placeholder Sprint 11, route /petani, dibungkus
   RequireRole role="petani" yang sudah ada):
   - Banner disclosure permanen di atas: "Mode demo — akses berdasarkan email tanpa
     verifikasi identitas sungguhan. Bukan portal produksi aman."
   - Form: input email -> tombol "Cari data saya" -> panggil listPetani() (lib/db.ts,
     data lokal) DAN/ATAU supabaseBackend.fetchAll('petani') (data sinkron dari agen
     lain), cocokkan field email (case-insensitive), ambil petani yang match.
   - Kalau ketemu: tampilkan semua Kartu milik petani itu (getKartuByPlot per plot dari
     listPlotByPetani -- fungsi-fungsi ini sudah ada di lib/db.ts) pakai KartuCard mode
     readOnly={true} (prop dari Sprint 13) + HashChainViewer readOnly={true}.
   - ConsentPanel (existing, src/components/ConsentPanel.tsx) ditampilkan TAPI dalam
     mode "petani" -- petani boleh MELIHAT dan MENCABUT (revokeConsent) izin yang ada,
     tapi TIDAK boleh memberi izin baru atau memakai panel "Simulasikan akses" (itu alat
     demo untuk Agen). Tambahkan prop mis. `mode: 'agen' | 'petani'` ke ConsentPanel.tsx
     yang menyembunyikan bagian "beri izin" dan "simulasikan akses" kalau mode==='petani'.

4. Tombol "Unduh sebagai PDF": buat CSS print stylesheet (bisa di index.css dengan
   @media print, atau file terpisah) yang menyembunyikan header/nav/tombol saat print,
   menyisakan cuma konten Kartu+hash-chain+consent dalam layout rapi untuk dicetak.
   Tombol memanggil window.print() -- TIDAK perlu dependency baru (jspdf dkk) untuk
   sprint ini.

5. Verifikasi tidak ada regresi ke ConsentPanel.tsx dipakai di /agen/plot/:id (mode
   default harus 'agen', perilaku existing tidak berubah).

Setelah selesai:
- Uji: registrasi petani baru lewat /agen dengan email terisi -> buka /petani (role
  berbeda) -> cari pakai email tsb -> pastikan data yang benar muncul -> coba cabut
  consent dari portal petani -> cek hilang dari daftar aktif -> coba window.print() ->
  screenshot preview print.
- Sarankan commit: `git commit -m "sprint-14: petani portal, self-service consent, pdf export"`.
```

### ✔️ Definition of Done
- Petani bisa lookup via email dan melihat kartunya sendiri (termasuk yang dibuat oleh
  Agen di device lain, kalau sudah tersinkron).
- Petani bisa mencabut consent sendiri, tidak bisa memberi izin baru/simulasi akses.
- PDF/print view rapi, tanpa elemen UI yang tidak relevan (nav, tombol admin).
- Disclosure keterbatasan akses tampil jelas, bukan tersembunyi.
- `/agen` (ConsentPanel mode default) tidak mengalami regresi.

---

## 🟦 SPRINT 15 — Polish, Hardening, Rehearsal (FS + 🟩 assist)

| | |
|---|---|
| **Prasyarat** | Sprint 9-14 selesai |

### 🎯 Tujuan
Semua 3 dashboard konsisten secara visual (Golden Rules/Gestalt benar-benar diterapkan,
bukan cuma didokumentasikan), siap didemokan, dan ter-deploy ulang.

### ✅ Task
- [ ] 15.1 Pass konsistensi visual di 3 dashboard (warna, spacing, empty/loading states)
- [ ] 15.2 Uji regresi penuh: offline Agen + sync + 3 role + petani portal
- [ ] 15.3 Re-build + re-deploy (Vercel)
- [ ] 15.4 Skrip demo baru (multi-role) untuk rehearsal

### >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 15 — Polish, Hardening, Rehearsal (sprint terakhir fase full-production).
Acuan: docs/04_FULL_PRODUCTION_BLUEPRINT.md bagian 4 (Golden Rules/Gestalt) dan bagian 8
(Definition of Done Full Production) — jadikan checklist §8 sebagai acuan utama sprint ini.

Lakukan:

1. Audit visual cepat di 3 dashboard (/agen, /eksportir, /petani): pastikan SEMUA badge
   status (sync, tier, stdbStatus, deforestasi, alert) memakai components/ui/Badge.tsx
   yang sama (Sprint 12) -- tidak ada warna/istilah yang beda arti antar halaman. Perbaiki
   kalau ketemu inkonsistensi.

2. Tambah/lengkapi EmptyState (components/ui/EmptyState.tsx) di semua tempat yang bisa
   kosong: dashboard Eksportir belum ada data, hasil pencarian petani portal tidak
   ketemu, daftar plot Home.tsx kosong, dst.

3. Tambah loading state yang jelas (bukan blank/flicker) di titik-titik yang fetch dari
   Supabase (dashboard Eksportir, petani portal lookup).

4. Jalankan ULANG seluruh regression suite manual dari sprint-sprint sebelumnya (ideal:
   browser test nyata seperti pola sprint 4/6/7/8):
   - Alur Agen offline penuh (matikan wifi total): tap peta -> kartu -> hash-chain
     tamper/reset -> consent/notif -- semua harus tetap 100% jalan tanpa Supabase.
   - Sync: buat data offline -> online -> cek masuk Supabase.
   - 3 role login-demo -> masing-masing lihat dashboard yang benar, tidak bisa akses
     dashboard role lain.
   - Petani portal -> lookup, lihat kartu, cabut consent, print/PDF.
   - Eksportir -> lihat data lintas-agen, filter, drill-in read-only.

5. npm run build, lalu npm run preview, uji ulang PWA offline (pola sama seperti Sprint
   8: load online dulu supaya SW aktif, lalu matikan network, reload, pastikan app
   shell + alur Agen tetap jalan).

6. Update docs/04_FULL_PRODUCTION_BLUEPRINT.md bagian 7 (Tracker) -- centang semua
   sprint yang sudah lolos verifikasi nyata di atas.

7. Siapkan (JANGAN jalankan tanpa persetujuan) langkah re-deploy ke Vercel yang sudah
   ada dari Sprint 8 (vercel.json masih berlaku, tidak perlu diubah kecuali ada env var
   baru -- kalau ada, tambahkan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di
   Vercel project settings, BUKAN di vercel.json, supaya tidak ke-commit).

Setelah selesai:
- Berikan laporan checklist Definition of Done Full Production (blueprint §8) --
  tandai mana yang lolos.
- Berikan skrip demo baru (multi-role) untuk rehearsal, mirip skrip 6-langkah MVP tapi
  diperluas: mulai dari Login (pilih role) -> alur Agen (seperti skrip MVP) -> ganti
  role ke Eksportir -> tunjukkan data lintas-agen -> ganti role ke Petani -> lookup
  email -> lihat kartu -> cabut consent -> unduh PDF.
- Sarankan commit: `git commit -m "sprint-15: polish, hardening, full production rehearsal"`.
```

### ✔️ Definition of Done
- Semua item Definition of Done Full Production (`docs/04_FULL_PRODUCTION_BLUEPRINT.md`
  §8) tercentang atau dinyatakan jujur mana yang belum (dengan alasan realistis).
- Regression suite penuh (offline Agen + sync + 3 role + petani portal) lolos.
- Build+preview PWA offline test masih lolos seperti Sprint 8.
- Skrip demo multi-role siap dipakai rehearsal.

---

## 📌 Catatan Penutup

- Kalau waktu habis sebelum Sprint 15 selesai, **prioritas berhenti di titik teraman**:
  Sprint 9-10 (sync jalan) > Sprint 11 (role routing) > Sprint 12 (komponen, nilai
  tambah visual, resiko rendah kalau di-skip) > Sprint 13/14 (dashboard, nilai demo
  tinggi) > Sprint 15 (polish, boleh sebagian).
- Kapan pun berhenti, pastikan **alur offline Agen (MVP) tidak dalam keadaan rusak** —
  itu adalah fallback demo yang paling aman dan sudah 100% terbukti jalan.
- Auth sungguhan (Supabase Auth/magic-link, RLS ketat) adalah **stretch goal di luar
  Sprint 9-15** — jangan dikerjakan kalau mengorbankan salah satu sprint di atas.
