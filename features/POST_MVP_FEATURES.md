# 🧩 POST-MVP FEATURES — JejakHijau v2

> **HANYA kerjakan setelah 8 sprint MVP hijau semua di `TRACKER.md`.** Tiap fitur berdiri sendiri, punya prompt copy-paste sendiri, dan role-nya ditandai. Kerjakan berurutan sesuai prioritas (P1 dulu). Jangan sentuh ini kalau MVP belum selesai.

---

## Prioritas Post-MVP

| # | Fitur | Role | Prioritas | Status |
|---|---|---|---|---|
| P1 | Draf dosir via LLM (+ templat fallback) | 🟩 AI | ⭐⭐⭐ | ⬜ |
| P2 | Multi-plot per petani + list management | 🟦 FS | ⭐⭐ | ⬜ |
| P3 | Ekspor kartu ke PDF | 🟦 FS | ⭐⭐ | ⬜ |
| P4 | Mock sinkron e-STDB (berlabel) | 🟦 FS | ⭐ | ⬜ |
| P5 | Ringkasan/statistik koperasi | 🟦 FS | ⭐ | ⬜ |
| P6 | Multi-bahasa (ID/EN) | 🟦 FS | ⭐ | ⬜ |

---

## 🟩 P1 — Draf Dosir via LLM (+ Templat Fallback)

**Tujuan:** dari data kartu, hasilkan draf ringkas "dosir petani" (teks siap diprint) untuk pengajuan program. LLM hanya menyusun draf; ada templat cadangan; diungkap terbuka. LLM BUKAN pengambil keputusan.

### >>> PROMPT >>>
```
Post-MVP P1 — Draf Dosir via LLM untuk JejakHijau v2 (aku AI Engineer).
MVP sudah selesai. Sekarang tambahkan fitur draf dosir. Prinsip: deterministik dulu (templat), LLM sebagai peningkat opsional, diungkap terbuka, ada fallback.

Lakukan:
1. src/lib/dosir.ts:
   - generateDosirTemplate(kartu, petani, plot): string → susun dosir dari TEMPLAT statis deterministik (tanpa LLM): identitas petani, lokasi, komoditas, status STDB, alasan, status deforestasi + disclaimer, timestamp. Ini fallback yang SELALU jalan offline.
   - (Opsional online) enhanceDosirWithLLM(templateText): Promise<string> → bila ADA koneksi & API key tersedia (baca dari env, jangan hardcode), kirim template ke LLM untuk dirapikan bahasanya. Bila gagal/offline → kembalikan template apa adanya. Beri label di UI "Draf dirapikan AI" vs "Draf templat".
2. Komponen DosirView: tampilkan draf + tombol "Salin" + "Cetak". Tampilkan badge sumber (Templat / AI-enhanced) secara jujur.
3. JANGAN biarkan LLM mengubah keputusan status (tier/stdbStatus) — LLM hanya merapikan bahasa naratif.
4. Uji offline: tanpa internet → template tetap keluar.
Commit: `git commit -m "post-mvp-p1: dosir template + optional llm enhance + fallback"`.
```
### <<< AKHIR >>>

---

## 🟦 P2 — Multi-Plot per Petani + List Management

**Tujuan:** satu petani bisa punya banyak plot; ada halaman kelola daftar plot & kartu.

### >>> PROMPT >>>
```
Post-MVP P2 — Multi-Plot Management untuk JejakHijau v2 (aku Fullstack).
Lakukan:
1. Perluas PetaniList.tsx: tampilkan daftar petani + jumlah plot masing-masing.
2. Halaman detail petani: daftar semua plot + kartunya, tombol tambah plot baru (reuse alur Sprint 4).
3. PlotDetail: navigasi antar plot milik petani yang sama.
4. Pastikan query DB pakai index by-petani (sudah ada dari Sprint 2). Semua tetap offline.
Commit: `git commit -m "post-mvp-p2: multi-plot management + petani detail"`.
```
### <<< AKHIR >>>

---

## 🟦 P3 — Ekspor Kartu ke PDF

**Tujuan:** kartu petani bisa diekspor jadi PDF untuk diserahkan ke bank/koperasi.

### >>> PROMPT >>>
```
Post-MVP P3 — Ekspor PDF untuk JejakHijau v2 (aku Fullstack).
Lakukan:
1. Install jspdf (atau html2canvas + jspdf).
2. Fungsi exportKartuPDF(kartu, petani, plot): render kartu + status + alasan + hash-chain ref + disclaimer keterbatasan → PDF, trigger download.
3. Tombol "Unduh PDF" di KartuCard. Sertakan catatan disclosure di footer PDF (akurasi peta, point-primary, data demo bila relevan).
4. Pastikan jalan offline (jspdf client-side).
Commit: `git commit -m "post-mvp-p3: export kartu to pdf"`.
```
### <<< AKHIR >>>

---

## 🟦 P4 — Mock Sinkron e-STDB (Berlabel)

**Tujuan:** tombol "Kirim ke e-STDB" yang mensimulasikan integrasi (belum ada API publik) — jujur berlabel mock.

### >>> PROMPT >>>
```
Post-MVP P4 — Mock Sinkron e-STDB untuk JejakHijau v2 (aku Fullstack).
Lakukan:
1. Tombol "Kirim ke e-STDB (simulasi)" pada kartu stdb-ready.
2. Simulasikan: tampilkan modal "Andai tersambung ke e-STDB pemerintah, data ini akan dikirim: [ringkasan]". Beri BADGE JELAS "SIMULASI — belum ada API publik e-STDB".
3. Catat status "diajukan (simulasi)" di kartu + entri hash-chain.
4. JANGAN mengklaim benar-benar terkirim. Jujur berlabel.
Commit: `git commit -m "post-mvp-p4: mock e-stdb sync (labeled)"`.
```
### <<< AKHIR >>>

---

## 🟦 P5 — Ringkasan/Statistik Koperasi

**Tujuan:** dashboard sederhana untuk petugas koperasi: berapa petani terdata, berapa stdb-ready, berapa perlu-audit.

### >>> PROMPT >>>
```
Post-MVP P5 — Ringkasan Koperasi untuk JejakHijau v2 (aku Fullstack).
Lakukan:
1. Halaman "Ringkasan": hitung dari DB → total petani, total plot, jumlah stdb-ready vs belum-lengkap, jumlah per tier, jumlah perlu-audit.
2. Tampilkan kartu statistik sederhana + (opsional) chart ringan. Semua offline dari IndexedDB.
3. Jangan tampilkan angka Rp proyeksi sebagai fakta; kalau ada, beri label "skenario".
Commit: `git commit -m "post-mvp-p5: cooperative summary dashboard"`.
```
### <<< AKHIR >>>

---

## 🟦 P6 — Multi-Bahasa (ID/EN)

**Tujuan:** toggle bahasa Indonesia/Inggris (submission lomba English, demo lapangan Indonesia).

### >>> PROMPT >>>
```
Post-MVP P6 — Multi-Bahasa untuk JejakHijau v2 (aku Fullstack).
Lakukan:
1. Setup i18n ringan (mis. objek dictionary sederhana, tanpa library berat) untuk ID & EN.
2. Toggle bahasa di header. Terjemahkan label utama + disclosure.
3. Default: Indonesia. Simpan pilihan di localStorage.
Commit: `git commit -m "post-mvp-p6: id/en i18n toggle"`.
```
### <<< AKHIR >>>

---

## Setelah Tiap Fitur
1. Uji tetap offline & tidak merusak MVP.
2. Centang di tabel prioritas atas + di `TRACKER.md` bagian POST-MVP.
3. Commit.
