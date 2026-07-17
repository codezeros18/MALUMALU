# 🚀 FULL PRODUCTION BLUEPRINT — JejakHijau v2 (Fase Pasca-MVP)

> Blueprint + daftar fitur + tracker digabung jadi satu file (sesuai permintaan — tidak
> dipisah-pisah seperti fase MVP). Acuan teknis untuk Sprint 9–15. Baca bersama
> `docs/06_PROGRESS_LOG.md` (state repo saat ini) sebelum mulai Sprint 9.

---

## 0. Kenapa Fase Ini Ada

MVP (Sprint 1–8) **selesai dan terverifikasi penuh** — lihat `docs/06_PROGRESS_LOG.md`
untuk bukti verifikasi tiap sprint. Killer flow 6 langkah jalan offline, hash-chain
tamper-evident bisa didemokan, consent+notif jalan, PWA installable.

Kompetisi masih menyisakan waktu jauh dari cukup untuk MVP saja. Fase ini mendorong
proyek dari **"MVP offline-only, client-side murni"** menuju **versi full-production**:
sinkron online (Supabase) di atas fondasi offline-first yang sudah ada, tiga role
(Petani/Agen/Eksportir) dengan dashboard masing-masing, sistem komponen reusable, dan
penerapan sadar Golden Rules/Gestalt di UI.

### Tabel Keputusan: MVP vs Sekarang

| Aspek | MVP (Sprint 1–8) | Full Production (Sprint 9–15) |
|---|---|---|
| Backend | Tidak ada (client-side murni, keputusan sadar "DI-CUT TOTAL") | **Supabase** (Postgres + Auth) |
| Data | 100% lokal per-device (IndexedDB) | Lokal-first + sinkron ke Supabase (outbox pattern) |
| Auth | Tidak ada (1 pengguna implisit = petugas) | **Demo role-selector** (localStorage) dulu → real Supabase Auth (magic-link) kalau waktu ada |
| Role | Tunggal (petugas/Agen implisit) | **Petani, Agen, Eksportir** — masing-masing dashboard |
| Komponen UI | Ad-hoc Tailwind per komponen | Sistem komponen reusable (`components/ui/*`) |
| Desain | Fungsional, belum ada prinsip eksplisit | Golden Rules (Nielsen) + Gestalt diterapkan sadar |

### ⚠️ Kejujuran Arsitektur (WAJIB dibaca, bukan basa-basi)

Blueprint MVP asli (`docs/03_MVP_SCOPE.md` §5) secara eksplisit mencatat
**"DI-CUT TOTAL: Backend server (semua client-side offline; kecuali deploy statis)"**
sebagai keputusan sadar. Menambah Supabase sekarang adalah **pembalikan sadar** dari
keputusan itu, bukan kelanjutan alami tanpa perubahan arah. Ini dinyatakan terbuka di
sini, bukan ditimpa diam-diam.

Ini **bukan berarti melenceng dari tesis inti proyek**. Proposal asli
(`docs/Proposal_Paspor_Petani_v2.docx`) sendiri menyebut **Agen/koperasi dan Eksportir**
sebagai pihak yang membayar dan paling berkepentingan — jadi membangun interface khusus
untuk mereka **sejalan dengan tesis "kedaulatan data petani"**, bukan fitur tempelan.

### 🔒 Guardrail Non-Negotiable

Alur inti MVP yang sudah terverifikasi **tidak boleh rusak atau di-downgrade**:

1. Agen tetap bisa tap peta → cek deforestasi → buat kartu → hash-chain → consent/notif
   **100% offline**, tanpa bergantung pada Supabase menyala.
2. Hash-chain tamper-evident demo (merah/hijau) tetap bisa didemokan tanpa internet.
3. Fitur baru (sync, role, dashboard) bersifat **aditif** — lapisan di atas yang sudah
   ada, bukan rewrite. Kalau sebuah perubahan mengharuskan alur offline Agen berhenti
   bekerja tanpa internet, itu tandanya salah arah — hentikan dan tinjau ulang.

### ✅ Feasibility & Mitigasi Risiko (sudah dikonfirmasi bersama user)

7 sprint baru (9–15) feasible dalam sisa waktu berdasarkan kecepatan eksekusi sprint
1–8 sebelumnya. Satu risiko nyata: **setup project Supabase adalah aksi manual di luar
kendali AI** (mirip insiden registry npm di Sprint 1, tanpa workaround yang bisa dicari
sendiri). Mitigasi:

- Setup Supabase jadi **langkah pertama Sprint 9**, bukan di akhir — friksi ketahuan
  di awal saat runway masih panjang.
- `lib/sync.ts` didesain di belakang **interface tipis** (`SyncBackend`) dengan dua
  implementasi: `supabaseBackend` (asli) dan `mockLocalBackend` (fallback tanpa
  network). Kalau setup Supabase lambat/bermasalah, Sprint 10+ tetap bisa lanjut pakai
  mock, disambung ke Supabase asli begitu siap — tanpa menulis ulang sync engine.

---

## 1. Arsitektur Sync — Outbox Pattern (bukan "cache")

Pertanyaan yang mendasari bagian ini: *"apakah offline itu semacam sinkron — data yang
disimpan offline jadi antrean lalu terkirim otomatis saat online, dan apakah itu pakai
cache?"* — jawabannya: **prinsipnya benar, tapi itu bukan cache**. Cache (Workbox, sudah
dipakai Sprint 8) hanya untuk menyimpan **respons GET aset statis** (JS/CSS/HTML/JSON)
supaya bisa dipakai ulang offline. Yang dibutuhkan di sini adalah pola berbeda untuk
**data yang DITULIS saat offline**: **outbox / sync-queue pattern**.

### Cara Kerja

1. Semua penulisan (tambah petani, plot, kartu, dst) **selalu sukses ke IndexedDB
   lokal dulu** — ini sudah begini sejak Sprint 2 (`src/lib/db.ts`), tidak berubah.
2. Object store baru `syncQueue` di `src/lib/db.ts`:
   ```typescript
   interface SyncQueueItem {
     id: string;
     entityType: 'petani' | 'plot' | 'kartu' | 'hashchain' | 'consent' | 'accessLog' | 'notif';
     entityId: string;
     operation: 'create' | 'update';
     payload: unknown;
     createdAt: number;
     attempts: number;
   }
   ```
3. Setiap entity yang bisa disinkron (`Petani`, `Plot`, `Kartu`, `ConsentRecord`,
   `AccessLog`, `NotifItem`, `HashChainEntry`) dapat field baru di `src/types/index.ts`:
   ```typescript
   export type SyncStatus = 'local' | 'synced' | 'conflict';

   // ditambahkan ke tiap interface entity yang sync-able:
   syncStatus: SyncStatus;
   remoteId?: string;
   updatedAt: number;
   agentId: string; // device/agen mana yang input — penting untuk atribusi Eksportir
   ```
4. Setiap fungsi `add*`/`put*` di `src/lib/db.ts` (mis. `addPetani`, `addPlot`,
   `addKartu`, `putKartu`) **selain menulis ke store aslinya, juga menulis satu baris
   ke `syncQueue`** dengan `operation` yang sesuai.
5. `src/lib/sync.ts` (BARU):
   ```typescript
   export interface SyncBackend {
     upsert(entityType: string, payload: unknown): Promise<{ remoteId: string }>;
     fetchAll(entityType: string): Promise<unknown[]>;
   }

   export const supabaseBackend: SyncBackend = { /* pakai lib/supabaseClient.ts */ };
   export const mockLocalBackend: SyncBackend = { /* no-op / simulasi lokal, untuk fallback */ };

   export async function pushPendingSync(backend: SyncBackend): Promise<void> {
     // iterasi syncQueue, panggil backend.upsert per item,
     // sukses -> hapus dari queue + update syncStatus:'synced'+remoteId pada entity asli,
     // gagal -> naikkan attempts, biarkan di queue untuk retry berikutnya.
   }
   ```
6. Trigger sinkron: transisi `useOnlineStatus()` (sudah ada, `src/hooks/useOnlineStatus.ts`)
   dari offline→online, tombol manual "Sinkron sekarang" di UI Agen, dan retry ringan
   berkala (mis. tiap 30 detik) selama online DAN queue tidak kosong — bukan polling
   terus-menerus.
7. Badge status per-record di UI: **"Tersimpan lokal"** (abu-abu) / **"Tersinkron"**
   (hijau) / **"Gagal sinkron"** (merah, dengan tombol retry manual) — memenuhi Golden
   Rule *visibility of system status* (lihat §4).

### Kenapa Eksportir Baca Langsung dari Supabase (bukan IndexedDB)

Role Eksportir memonitor data **lintas-agen/lintas-device** — sesuatu yang secara
fundamental tidak mungkin dari IndexedDB satu device saja. Maka:
- Agen (field, butuh offline) → baca/tulis IndexedDB lokal, sync ke Supabase saat online.
- Eksportir (kantor, monitoring) → baca LANGSUNG dari Supabase, online-only, karena
  memang perannya online-only secara alami (tidak ada kebutuhan bisnis untuk Eksportir
  bekerja offline di lapangan).

### Catatan Integritas Hash-Chain di Konteks Multi-Device

Ini penting dan harus jujur dinyatakan: begitu ada banyak device (banyak Agen), **hash-
chain per-device saja tidak lagi cukup** untuk klaim tamper-evident lintas-user — seorang
Agen bisa mengubah IndexedDB-nya sendiri dan rantai di device-nya sendiri konsisten
dengan perubahan itu (self-consistent tapi sudah "ditata ulang", bukan dideteksi rusak).

**Rekomendasi (stretch/opsional, BUKAN blocker Sprint 9-15)**: pertahankan hash-chain
lokal untuk demo instan tamper-evidence yang sudah jalan (money-moment tetap valid untuk
demo single-device), lalu **tambahkan verifikasi ulang di sisi server** (Supabase Edge
Function yang menghitung ulang SHA-256 chain saat data disinkron) sebagai lapisan kedua
untuk klaim integritas lintas-device yang sesungguhnya. Kalau waktu tidak cukup, jangan
diklaim di UI/demo bahwa hash-chain sudah tamper-evident lintas-device — cukup nyatakan
ia tamper-evident per-device (yang benar dan sudah terbukti).

---

## 2. Skema Database Supabase (Postgres)

SQL berikut mengikuti struktur `src/types/index.ts` yang sudah ada + kolom sync. Jalankan
di Supabase SQL Editor (Sprint 9, langkah pertama).

```sql
-- profiles: role & identitas dasar (dipakai Phase B / real auth nanti;
-- Phase A/demo-auth tidak wajib mengisi tabel ini dari backend, cukup localStorage)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('petani', 'agen', 'eksportir')),
  nama text not null,
  email text,
  created_at timestamptz not null default now()
);

create table petani (
  id text primary key,
  nama text not null,
  nik_hash text,
  telepon text,
  desa text,
  email text,
  registered_by_agent_id text,
  created_at bigint not null,
  updated_at bigint not null,
  agent_id text not null
);

create table plot (
  id text primary key,
  petani_id text not null references petani(id),
  lat double precision not null,
  lng double precision not null,
  komoditas text not null,
  luas_estimasi_ha double precision,
  gps_accuracy_m double precision,
  captured_at bigint not null,
  updated_at bigint not null,
  agent_id text not null
);

create table kartu (
  id text primary key,
  plot_id text not null references plot(id),
  petani_id text not null references petani(id),
  tier text not null check (tier in ('lokal', 'export-ready')),
  stdb_status text not null check (stdb_status in ('stdb-ready', 'belum-lengkap')),
  alasan jsonb not null default '[]',
  deforestasi text not null,
  hash_chain_ref text not null default '',
  created_at bigint not null,
  updated_at bigint not null,
  agent_id text not null
);

create table hashchain (
  id text primary key,
  "index" integer not null,
  timestamp bigint not null,
  payload jsonb not null,
  data_hash text not null,
  previous_hash text not null,
  hash text not null,
  agent_id text not null
);

create table consent (
  id text primary key,
  kartu_id text not null references kartu(id),
  granted_to text not null,
  scope jsonb not null default '[]',
  granted_at bigint not null,
  revoked_at bigint
);

create table access_log (
  id text primary key,
  kartu_id text not null references kartu(id),
  accessed_by text not null,
  authorized boolean not null,
  timestamp bigint not null,
  triggered_notif boolean not null
);

create table notif (
  id text primary key,
  message text not null,
  kartu_id text not null,
  severity text not null check (severity in ('info', 'warning', 'alert')),
  created_at bigint not null,
  read boolean not null default false
);
```

**RLS (Row Level Security)**: untuk Phase A (demo-auth), aktifkan RLS dengan policy
**permissive** (`using (true)`) supaya tidak memblokir demo. Ini ditandai jelas di sini
sebagai **PERKETAT SEBELUM PRODUKSI SUNGGUHAN** — policy permisif hanya untuk kebutuhan
demo hackathon, bukan rekomendasi keamanan produksi nyata.

`.env.example` (di root project, commit ke git — TANPA nilai asli):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
`.env.local` (isi nilai asli, **gitignored**, dibuat manual oleh user setelah project
Supabase jadi).

---

## 3. Role & Routing

| Route | Role | Isi |
|---|---|---|
| `/` | (semua) | **Login/RoleSelect** (baru) — pilih Petani/Agen/Eksportir |
| `/agen` | Agen | `Home.tsx` dipindah ke sini (alur tap-peta/form/kartu yang sudah ada) |
| `/agen/plot/:id` | Agen | `PlotDetail.tsx` dipindah ke sini |
| `/petani` | Petani | Portal baru — email lookup → lihat Kartu sendiri + kelola consent + unduh PDF |
| `/eksportir` | Eksportir | Dashboard baru — monitoring lintas-agen dari Supabase |

- `AppContext` (`src/context/AppContext.tsx`, sudah ada dari Sprint 7) diperluas dengan
  `currentRole: 'petani' | 'agen' | 'eksportir' | null` + `setRole()`, disimpan ke
  `lib/storage.ts` (`setItem('current-role', ...)`, sudah ada dari Sprint 2) supaya
  bertahan across reload.
- `RequireRole` (komponen baru, wrapper sederhana): redirect ke `/` kalau
  `currentRole` tidak cocok dengan role yang dibutuhkan route tersebut.
- Login/RoleSelect (Phase A/demo): tiga kartu besar (Petani/Agen/Eksportir), klik →
  set role → navigate ke route masing-masing. Tidak ada password di Phase A.

---

## 4. Sistem Komponen Reusable + Golden Rules/Gestalt

### Komponen Primitif Baru (`src/components/ui/`)

| Komponen | Kegunaan |
|---|---|
| `Button.tsx` | variant `primary`/`secondary`/`danger`, size, disabled state konsisten |
| `Card.tsx` | container border+padding konsisten (dipakai semua panel) |
| `Badge.tsx` | prop `tone`: `aman`/`perlu-audit`/`berisiko`/`alert`/`synced`/`pending` → satu sumber warna dipakai SEMUA dashboard |
| `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Checkbox.tsx` | form field konsisten |
| `EmptyState.tsx` | pesan "belum ada data" konsisten (dashboard Eksportir, list kosong, dst) |

Migrasi bertahap (bukan rewrite sekaligus): `PlotForm.tsx`, `ConsentPanel.tsx`,
`KartuCard.tsx`, `HashChainViewer.tsx` diganti pakai primitif ini satu-per-satu di
Sprint 12, sambil re-verifikasi tiap komponen masih berfungsi sama seperti sebelumnya
(regression check, bukan cuma "terlihat sama").

### Golden Rules (Nielsen) & Gestalt → Keputusan Desain Konkret

| Prinsip | Keputusan UI konkret |
|---|---|
| Visibility of system status (Nielsen) | Badge sync per-record ("Tersimpan lokal"/"Tersinkron"/"Gagal"), `OfflineIndicator` yang sudah ada (Sprint 8) |
| Consistency & standards (Nielsen) | Satu `Badge tone` dipakai di KartuCard, HashChainViewer, dashboard Eksportir — warna aman=hijau/perlu-audit=amber/berisiko=merah TIDAK BOLEH beda arti antar halaman |
| Error prevention (Nielsen) | Nav discoped per-role — Agen tidak pernah melihat menu Eksportir sama sekali (bukan disembunyikan tapi masih bisa diakses) |
| Recognition over recall (Nielsen) | Role aktif selalu terlihat di header (nama role + tombol ganti role), bukan tersembunyi di menu |
| Proximity (Gestalt) | Field terkait dikelompokkan dalam satu `Card` (sudah pola existing — dipertahankan) |
| Similarity (Gestalt) | Semua status pakai bentuk `Badge` yang sama persis (bukan campur pill/teks-polos/warna-inline seperti sebelumnya) |
| Common region (Gestalt) | Border+background per section (`Card`) memisahkan widget dashboard Eksportir secara visual jelas |
| Figure-ground (Gestalt) | Header sticky dengan role+indicator selalu kontras di atas konten yang scroll |

---

## 5. Petani Portal & Ekspor PDF

- **Akses (Phase A)**: input email → cocokkan ke field `Petani.email` (field baru,
  diisi Agen saat registrasi di `/agen`) pada data lokal+synced. **Tidak ada verifikasi
  identitas sungguhan di Phase A** — ini CELAH KEAMANAN yang harus dinyatakan terbuka
  di UI ("mode demo, bukan portal aman produksi") dan wajib ditutup di Phase B (magic-
  link email lewat Supabase Auth) sebelum dipakai sungguhan dengan data asli.
- **Isi portal**: Kartu milik petani tsb (read-only, versi sederhana — tanpa tombol
  "Koreksi manual"), status hash-chain (proof, tanpa tombol simulasi tamper), daftar
  `ConsentRecord` aktif dengan tombol **cabut izin sendiri** (ini justru memperkuat
  tesis "kedaulatan data" — petani benar-benar bisa mencabut akses pihak lain).
- **Ekspor PDF**: pendekatan utama = stylesheet `@media print` + `window.print()` —
  **zero dependency baru**, jalan offline, robust di semua browser. `jspdf` disebut
  sebagai upgrade opsional HANYA kalau waktu & akses registry npm stabil (lihat catatan
  insiden registry di `docs/06_PROGRESS_LOG.md` — jangan taruh dependency baru di jalur
  kritis kalau tidak perlu).

---

## 6. Dashboard Eksportir

- Sumber data: Supabase langsung (`supabaseBackend.fetchAll('kartu')` dkk), bukan
  IndexedDB — online-only, sesuai §1.
- Tabel semua Kartu lintas-agen: kolom petani, agen (dari `agentId`), tier, stdbStatus,
  deforestasi, status sync, indikator alert (ada `AccessLog` tak-terotorisasi terkait).
- Filter: tier, stdbStatus, pencarian nama/desa.
- Drill-in per baris: `KartuCard` + `HashChainViewer` read-only (tombol simulasi tamper
  disembunyikan untuk role ini — itu alat demo internal, bukan fitur monitoring).
- Ringkasan di atas tabel: total petani terdaftar, % export-ready, jumlah alert akses
  tak sah yang belum ditinjau.

---

## 7. Tracker Sprint 9–15

| # | Sprint | Role | Status |
|---|---|---|---|
| 9 | Supabase Setup & Schema | 🟦 FS | ✅ |
| 10 | Sync Engine (Outbox Pattern) | 🟦 FS | ✅ |
| 11 | Demo Auth & Role Routing | 🟦 FS | ✅ |
| 12 | Reusable UI Component Library | 🟦 FS (+🟩 assist) | ✅ |
| 13 | Eksportir Dashboard | 🟦 FS +🟩 | ✅ |
| 14 | Petani Portal + PDF Export | 🟦 FS | ✅ |
| 15 | Polish, Hardening, Rehearsal | 🟦 FS +🟩 | ✅ |

Centang manual di sini (`[ ]` → `[x]`) setelah tiap sprint lolos verifikasi — sama
seperti kebiasaan `TRACKER.md` di fase MVP. Detail prompt tiap sprint ada di
`docs/05_FULL_PRODUCTION_PROMPTS.md`.

---

## 8. Definition of Done — Full Production

- [x] Data yang dibuat Agen offline otomatis masuk `syncQueue`, dan tersinkron ke
      Supabase begitu online (didemokan nyata: matikan wifi → input data → nyalakan
      wifi → badge berubah jadi "Tersinkron"). Verifikasi Sprint 10 & 15.
- [x] Alur inti Agen (tap peta → kartu → hash-chain tamper/reset → consent/notif) tetap
      100% jalan offline TANPA Supabase menyala — regresi nol dari MVP. Verifikasi
      penuh Sprint 15 (satu alur offline utuh, browser test nyata).
- [x] 3 role bisa login-demo dan masing-masing hanya melihat dashboard sesuai perannya
      (role guard redirect dikonfirmasi). Verifikasi Sprint 11 & 15.
- [x] Eksportir bisa melihat data dari LEBIH DARI SATU agen/device (dikonfirmasi nyata
      dengan 2 browser context terpisah = 2 identitas agen berbeda). Verifikasi
      Sprint 13 & 15.
- [x] Petani bisa lookup via email, lihat kartunya, cabut consent sendiri, dan unduh PDF
      (print stylesheet dikonfirmasi via emulateMedia). Verifikasi Sprint 14 & 15.
- [x] Komponen UI (Button/Card/Badge/dst) dipakai konsisten di ketiga dashboard —
      audit Sprint 15 menemukan & memperbaiki 1 inkonsistensi (status deforestasi
      tampil teks polos, bukan Badge, di KartuCard & EksportirDashboard).
- [x] UI men-disclose keterbatasan Phase A (auth demo, portal petani belum diverifikasi
      identitas) — bukan diklaim sebagai auth produksi sungguhan. Banner permanen di
      `/petani` (Sprint 14).
