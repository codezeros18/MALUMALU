# 🟦 SPRINT 2 — Data Layer (IndexedDB)

| | |
|---|---|
| **Role** | 🟦 **Fullstack (FS / kamu)** |
| **Prasyarat** | Sprint 1 selesai |
| **Estimasi** | ~2–3 jam |
| **Paralel dengan** | AI Engineer mengerjakan Sprint 3 |

---

## 🎯 Tujuan
Membangun lapisan penyimpanan offline (IndexedDB via `idb`) untuk semua entitas, plus wrapper localStorage & hook status online. Ini fondasi data yang dipakai semua sprint berikutnya.

## ✅ Task
- [ ] 2.1 Setup IndexedDB + object stores
- [ ] 2.2 CRUD Petani
- [ ] 2.3 CRUD Plot & Kartu
- [ ] 2.4 CRUD HashChainEntry, ConsentRecord, AccessLog, NotifItem
- [ ] 2.5 `storage.ts` + `useOnlineStatus.ts`

---

## >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 2 — Data Layer untuk Paspor Petani v2.
Acuan: docs/02_TECH_ARCHITECTURE.md (data model + konvensi). Gunakan library `idb`.

Lakukan:

1. Buat src/lib/db.ts:
   - Inisialisasi database IndexedDB bernama "paspor-petani" versi 1 memakai `openDB` dari `idb`.
   - Buat object store untuk tiap entitas dengan keyPath "id":
     petani, plot, kartu, hashchain, consent, accessLog, notif.
   - Tambahkan index yang berguna: plot.by-petani (petaniId), kartu.by-plot (plotId), kartu.by-petani (petaniId), consent.by-kartu (kartuId), accessLog.by-kartu (kartuId), hashchain.by-index (index).
   - Ekspor satu fungsi getDB() yang mengembalikan instance db (singleton).

2. Buat CRUD helper generik + spesifik, semua async + try/catch, mengembalikan tipe dari src/types/index.ts:
   - Petani: addPetani, getPetani(id), listPetani, updatePetani
   - Plot: addPlot, getPlot(id), listPlotByPetani(petaniId)
   - Kartu: addKartu, getKartu(id), getKartuByPlot(plotId), listKartu
   - HashChainEntry: addHashEntry, listHashEntries (urut by index), getLastHashEntry
   - ConsentRecord: addConsent, listConsentByKartu(kartuId), revokeConsent(id)
   - AccessLog: addAccessLog, listAccessLogByKartu(kartuId)
   - NotifItem: addNotif, listNotif (urut terbaru), markNotifRead(id)
   Gunakan nanoid untuk generate id bila belum ada.

3. Buat src/lib/storage.ts: wrapper tipis untuk localStorage (getItem/setItem/removeItem dengan JSON parse/stringify aman + try/catch). Hanya untuk flags kecil (mis. "onboarding-done", "active-petani-id"). JANGAN untuk data besar.

4. Buat src/hooks/useOnlineStatus.ts: hook yang mengembalikan boolean isOnline (pakai navigator.onLine + event online/offline).

5. Buat file kecil src/lib/__db_smoke.ts (opsional, boleh dihapus nanti) atau tambahkan fungsi devSeed() yang bisa menambah 1 petani + 1 plot dummy untuk uji cepat, TANPA dijalankan otomatis.

6. Pastikan semua tipe konsisten dengan src/types/index.ts. Jangan pakai `any` (kecuali payload: unknown).

Setelah selesai:
- Verifikasi TypeScript tidak ada error (`npx tsc --noEmit` bila perlu).
- Berikan ringkasan fungsi yang diekspor tiap file.
- Sarankan commit: `git commit -m "sprint-2: indexeddb data layer + storage + online hook"`.
```

## <<< AKHIR PROMPT <<<

---

## ✔️ Definition of Done
- `src/lib/db.ts` punya object store semua entitas + index + CRUD lengkap, semua try/catch.
- `storage.ts` & `useOnlineStatus.ts` jalan.
- `npx tsc --noEmit` bersih (tidak ada error tipe).
- Bisa add & get petani/plot dummy tanpa error (uji manual via console/devSeed).

## 📌 Setelah Selesai
1. Centang 2.1–2.5 di `TRACKER.md`.
2. Commit.
3. Lanjut ke **Sprint 4** (tapi cek dulu: Sprint 3 dari AI Engineer sebaiknya sudah selesai/hampir, karena Sprint 4 butuh `lib/geospatial` & `lib/gps`). Kalau Sprint 3 belum kelar, koordinasi dulu.
