# 🟦 SPRINT 6 — Hash-Chain (Tamper-Evident)

| | |
|---|---|
| **Role** | 🟦 **Fullstack (FS)** |
| **Prasyarat** | Sprint 2 (db) + Sprint 5 (generateKartu) selesai |
| **Estimasi** | ~2–3 jam |

---

## 🎯 Tujuan
Membangun rantai verifikasi (hash-chain) yang membuat kartu **tamper-evident**: kalau data diubah, rantai rusak & ketahuan. Plus viewer yang bisa mendemokan rantai rusak. **Ini money-moment demo — jadikan visual & meyakinkan.**

## ✅ Task
- [ ] 6.1 `hashchain.ts` — buat entri berantai
- [ ] 6.2 `appendEntry(payload)` + `verifyChain()`
- [ ] 6.3 Simpan rantai ke IndexedDB
- [ ] 6.4 `HashChainViewer.tsx`
- [ ] 6.5 Tombol "simulasi ubah data" → rantai RUSAK

---

## >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 6 — Hash-Chain untuk Paspor Petani v2 (aku role Fullstack).
Acuan: docs/02_TECH_ARCHITECTURE.md (tipe HashChainEntry) + docs/03_MVP_SCOPE.md (F6). Gunakan crypto-js (SHA-256). Simpan via src/lib/db.ts (addHashEntry, listHashEntries, getLastHashEntry).

PENTING KONSEP: hash-chain = rantai append-only. Tiap entri berisi index, timestamp, payload (snapshot kartu), dataHash (hash payload), previousHash (hash entri sebelumnya), dan hash (hash gabungan index+timestamp+dataHash+previousHash). Kalau payload diubah tapi hash lama dipertahankan, verifikasi akan gagal → tamper terdeteksi. Ini BUKAN blockchain (tanpa konsensus terdistribusi), cukup rantai kriptografis deterministik. Jangan sebut "blockchain" di UI.

Lakukan:

1. src/lib/hashchain.ts:
   - sha256(input: string): string memakai crypto-js.
   - computeDataHash(payload: unknown): string → sha256(JSON.stringify(payload) dengan urutan kunci stabil).
   - computeEntryHash(index, timestamp, dataHash, previousHash): string → sha256 gabungan.
   - appendEntry(payload: unknown): Promise<HashChainEntry>:
     * ambil getLastHashEntry() → previousHash (atau "GENESIS" bila kosong), index = last.index+1 (atau 0).
     * hitung dataHash, hash; buat entri; addHashEntry(); kembalikan entri.
   - verifyChain(): Promise<{ valid: boolean; brokenAtIndex: number | null }>:
     * ambil listHashEntries (urut index).
     * untuk tiap entri, hitung ulang dataHash & entryHash, bandingkan dengan tersimpan, dan cek previousHash cocok dengan hash entri sebelumnya.
     * kembalikan valid=false + brokenAtIndex bila ada ketidakcocokan.
   - simulateTamper(index, mutatedPayload): Promise<void> → fungsi KHUSUS DEMO: menimpa payload entri tertentu di DB TANPA menghitung ulang hash (supaya verifyChain mendeteksi rusak). Beri komentar jelas "hanya untuk demo tamper-evidence".

2. Integrasi dengan kartu: buat fungsi commitKartu(kartu: Kartu): Promise<Kartu> yang:
   - appendEntry({ type:"kartu", kartuId: kartu.id, snapshot: kartu }).
   - set kartu.hashChainRef = entry.id, simpan kartu via addKartu.
   - kembalikan kartu terbaru.

3. src/components/HashChainViewer.tsx:
   - Tampilkan daftar entri hash-chain (index, timestamp, potongan hash (8 char awal), status "✔ valid").
   - Tombol "Verifikasi Rantai" → jalankan verifyChain() → tampil hasil (hijau "Rantai utuh" / merah "Rantai rusak di entri #X").
   - Tombol DEMO "Simulasi ubah data" → panggil simulateTamper pada entri terakhir → lalu otomatis verifyChain → tunjukkan rantai jadi MERAH/rusak. Sertakan tombol "Reset demo" untuk membangun ulang rantai bersih.
   - Visual jelas: hijau = utuh, merah = rusak. Ini untuk momen wow di depan juri.

4. Tampilkan HashChainViewer di halaman PlotDetail atau di bawah KartuCard.

Setelah selesai:
- Uji: buat kartu → commit → viewer tampil entri valid → klik "Simulasi ubah data" → rantai jadi rusak (merah) → "Reset" → utuh lagi.
- Sarankan commit: `git commit -m "sprint-6: hash-chain tamper-evident + viewer + demo tamper"`.
```

## <<< AKHIR PROMPT <<<

---

## ✔️ Definition of Done
- `appendEntry` & `verifyChain` benar (rantai valid saat utuh).
- `simulateTamper` membuat `verifyChain` mendeteksi rusak + menunjuk index.
- Viewer menampilkan hijau (utuh) / merah (rusak) dengan jelas.
- Tombol "Reset demo" mengembalikan rantai bersih.
- UI tidak menyebut "blockchain".

## 📌 Setelah Selesai
1. Centang 6.1–6.5 di `TRACKER.md`.
2. Commit.
3. FS lanjut **Sprint 7** (consent & notif).
