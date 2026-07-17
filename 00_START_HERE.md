# 🚀 START HERE — JejakHijau v2 (Paket Eksekusi Claude Code)

> Baca file ini **pertama kali**. Ini peta seluruh paket. Semua yang kamu butuh buat bangun MVP ada di sini.

---

## 📌 Apa Ini?

Paket blueprint + prompt siap-eksekusi untuk membangun **JejakHijau v2** (aplikasi PWA web, offline-first) dalam sprint 30 jam menggunakan **Claude Code di VS Code**.

Semua file di sini dirancang supaya kamu tinggal: **download → buka di VS Code → copy-paste prompt per sprint → Claude Code eksekusi.**

---

## 👥 Role (Siapa Ngerjain Apa)

Ada **2 role teknis** yang pakai Claude Code (dan 1 designer yang manual, tidak pakai file ini).

| Role | Kode | Siapa | Tanggung Jawab | Sprint yang Dipegang |
|---|---|---|---|---|
| **Fullstack** | 🟦 **FS** | Kamu | Bangun sistem end-to-end: setup, data layer, UI, hash-chain, consent/notif, offline, deploy | Sprint 1, 2, 4, 6, 7, 8 |
| **AI Engineer** | 🟩 **AI** | Partner | Geospatial (point-in-raster, GeoTIFF, GPS), rule engine STDB, preprocessing raster, draft dosir LLM | Sprint 3, 5 (+ assist 4 & 8) |
| **Designer** | ⬜ | Partner | Desain manual (Figma) — **tidak pakai paket ini** | — |

**Prinsip:** Kamu (FS) adalah pemilik repo & integrator utama. AI Engineer kerja di modul terpisah (folder `lib/geospatial`, `lib/raster`, `lib/ruleEngine`) supaya nggak konflik dengan kamu.

---

## 🗂️ Struktur File Paket Ini

```
jejakhijau-blueprint/
├── 00_START_HERE.md              ← kamu di sini
├── docs/
│   ├── 01_BLUEPRINT_FULL.md      ← ide lengkap dari awal sampai akhir
│   ├── 02_TECH_ARCHITECTURE.md   ← arsitektur, tech stack, data model, struktur folder
│   └── 03_MVP_SCOPE.md           ← batas MVP (yang dibangun vs di-cut)
├── TRACKER.md                    ← papan tracking semua sprint (centang di sini!)
├── prompts/
│   └── PROMPT_00_KICKOFF.md      ← prompt PERTAMA (baca semua file dulu)
├── sprints/
│   ├── SPRINT_01_SETUP.md        🟦 FS
│   ├── SPRINT_02_DATA_LAYER.md   🟦 FS
│   ├── SPRINT_03_GEOSPATIAL.md   🟩 AI
│   ├── SPRINT_04_MAP_UI.md       🟦 FS (+🟩 assist)
│   ├── SPRINT_05_RULE_ENGINE.md  🟩 AI
│   ├── SPRINT_06_HASHCHAIN.md    🟦 FS
│   ├── SPRINT_07_CONSENT_NOTIF.md🟦 FS
│   └── SPRINT_08_OFFLINE_DEPLOY.md 🟦 FS (+🟩 assist)
└── features/
    └── POST_MVP_FEATURES.md      ← fitur pelengkap (SETELAH MVP kelar)
```

---

## ▶️ Cara Pakai (Langkah demi Langkah)

### Langkah 0 — Persiapan (sekali saja)
1. Download seluruh folder `jejakhijau-blueprint/`.
2. Buka folder ini di **VS Code**.
3. Buka **Claude Code** di VS Code (kamu FS pakai 1 instance, AI Engineer pakai instance sendiri di mesinnya).
4. Baca `docs/01_BLUEPRINT_FULL.md` dan `docs/02_TECH_ARCHITECTURE.md` sekali biar paham konteks.

### Langkah 1 — Kickoff (WAJIB pertama)
1. Buka `prompts/PROMPT_00_KICKOFF.md`.
2. Copy seluruh isi prompt kickoff → paste ke Claude Code → enter.
3. Claude Code akan baca semua file konteks & konfirmasi paham. **Tunggu sampai selesai.**

### Langkah 2 — Eksekusi Sprint (berurutan)
1. Buka file sprint sesuai urutan (mulai `sprints/SPRINT_01_SETUP.md`).
2. Di dalam tiap sprint ada blok **`>>> PROMPT UNTUK CLAUDE CODE <<<`**.
3. Copy blok prompt itu → paste ke Claude Code → enter.
4. Setelah Claude Code selesai, cek **"Definition of Done"** di file sprint.
5. Kalau lolos → buka `TRACKER.md`, ganti `[ ]` jadi `[x]` (✅) untuk task itu.
6. Lanjut sprint berikutnya.

### Langkah 3 — Parallel (2 orang)
- **Sprint 1 harus selesai duluan** (FS bangun fondasi).
- Setelah Sprint 1 kelar: **FS jalan Sprint 2** sementara **AI Engineer jalan Sprint 3** (paralel, folder beda).
- Titik gabung (merge) ada di Sprint 4. Ikuti catatan dependency di tiap file.

### Langkah 4 — Setelah MVP Kelar
- Kalau 8 sprint MVP sudah ✅ semua **dan masih ada waktu** → buka `features/POST_MVP_FEATURES.md`.

---

## 🔢 Urutan & Dependency Sprint

```
SPRINT 1 (FS: Setup) ──────────────┐
                                    ▼
        ┌──────────────────────────────────────────┐
        │                                           │
        ▼                                           ▼
SPRINT 2 (FS: Data Layer)          SPRINT 3 (AI: Geospatial)   ← PARALEL
        │                                           │
        └──────────────────┬────────────────────────┘
                           ▼
                SPRINT 4 (FS+AI: Map UI & Plot Tagging)
                           ▼
                SPRINT 5 (AI: Rule Engine & Kartu)
                           ▼
                SPRINT 6 (FS: Hash-Chain)
                           ▼
                SPRINT 7 (FS: Consent & Notif)
                           ▼
                SPRINT 8 (FS+AI: Offline, Polish, Deploy)
                           ▼
                    ✅ MVP SELESAI
                           ▼
        (kalau ada waktu) POST-MVP FEATURES
```

---

## ⚠️ Aturan Main Penting

1. **Jangan skip Sprint 1.** Semua bergantung padanya.
2. **Selalu centang TRACKER.md** setelah tiap sprint. Ini sumber kebenaran progres.
3. **FS & AI kerja di folder berbeda** biar nggak konflik git (lihat pembagian file di tiap sprint).
4. **MVP dulu, fitur nanti.** Jangan tergoda bikin fitur pelengkap sebelum 8 sprint MVP hijau semua.
5. **Commit tiap sprint selesai** (`git commit -m "sprint-X: <ringkasan>"`). Repo publik, commit pertama BLANK (aturan lomba).
6. **Demo harus jalan offline.** Uji matikan wifi tiap sprint yang menyentuh data.
7. **Jangan overclaim di UI.** Angka akurasi peta (~91%, error 18%) di-disclose apa adanya.

---

## 🎯 Target Akhir MVP (Definition of MVP Done)

MVP dianggap SELESAI kalau demo berikut jalan **offline, live, tanpa error**:

1. Petugas buka app → pilih/registrasi petani.
2. Tap plot di peta → koordinat GPS tertangkap.
3. Sistem cek point-in-raster (offline) → status deforestasi keluar.
4. Kartu data milik-petani muncul (tier Lokal atau Export-Ready).
5. Kartu dibubuhi hash-chain (bisa ditunjukkan tamper-evident: ubah data → rantai rusak).
6. Consent panel: petani kasih izin akses → akses tak-terotorisasi memicu notif.
7. Override manual jalan.
8. Semua tetap jalan saat wifi mati.
9. Deploy ke Vercel (atau localhost siap-demo).

---

Lanjut ke: **`prompts/PROMPT_00_KICKOFF.md`** setelah baca `docs/`.
