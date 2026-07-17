# 📘 BLUEPRINT LENGKAP — JejakHijau v2

> Ide dari awal sampai akhir. Ini konteks utuh supaya Claude Code (dan siapa pun) paham APA yang dibangun dan KENAPA. File ini dibaca saat kickoff.

---

## 1. Satu Kalimat

**JejakHijau** adalah aplikasi (PWA web, offline-first) untuk **petugas koperasi/penyuluh** yang mengubah kebun petani berlahan kecil menjadi **identitas data milik petani** yang: terlindungi dari penyalahgunaan (notifikasi akses), membuka akses program domestik (KUR, pupuk subsidi), dan menyiapkan kesiapan ekspor (ketertelusuran) — semuanya **tanpa internet**, dengan inti **deterministik** dan **jejak anti-palsu (hash-chain)**.

---

## 2. Masalah yang Diselesaikan

Petani berlahan kecil "tidak terlihat" oleh sistem yang menentukan akses mereka ke kredit, subsidi, dan pasar, karena kebunnya tidak tercatat resmi. Lebih parah, data tentang mereka dipegang pihak lain sehingga rentan dieksploitasi (contoh nyata: kasus Jember Juli 2026, ~900 identitas petani dipakai kredit fiktif).

**Akar masalah:** petani tidak *terbaca* sistem **DAN** tidak *berdaulat* atas datanya.

---

## 3. Fokus Track (Agriculture GH7.0)

Dari 5 challenge question Agriculture, JejakHijau fokus KUAT ke **2**:

- **Challenge #4 — Financial Inclusion (HERO):** KUR Pertanian butuh surat keterangan usaha + lokasi terverifikasi + survei bank. JejakHijau menyediakan profil kebun terverifikasi → akses kredit lebih cepat.
- **Challenge #3 — Rural-Urban Bridge:** data milik petani + tertelusur → pembeli/pengekspor percaya asal → petani dapat akses pasar & premium.

**Di-reframe (bukan hero):** Challenge #5 (sustainability) → "audit-trail sebagai bukti kepatuhan", bukan monitoring aktif.
**Di-exclude (jangan diklaim):** Challenge #1 (post-harvest) & #2 (pest/yield) — beda domain.

---

## 4. Pengguna & Model Nilai Bertingkat

**Pengguna utama:** petugas koperasi/penyuluh (bukan petani langsung, karena keterbatasan HP di petani).

**Dua tingkat nilai:**

| Tingkat | Syarat minimal | Yang dibuka |
|---|---|---|
| **Lokal/Program** (massal) | Identitas + titik GPS + klaim kepemilikan dasar | Akses KUR, pupuk subsidi, program + perlindungan identitas (notif akses) |
| **Export-Ready** (premium) | + dokumen STDB + cek deforestasi + hash-chain | Kesiapan ketertelusuran ekspor + peluang premium harga |

---

## 5. Siapa yang Membayar (Payer)

**Pengekspor/agen**, BUKAN petani miskin. Pengekspor menghadapi tekanan pembeli + kewajiban ketertelusuran → butuh pemasoknya tercatat & tertelusur → hemat biaya verifikasi manual. Bukti nyata: relasi tim ke usaha ekspor kopi (brako.id) + pemasok petani di Pangalengan (status: akses + minat uji coba, **bukan kontrak**).

---

## 6. Alur Inti (Killer Flow) — Ini yang Dibangun

1. **Tap plot** — petugas tandai satu titik koordinat kebun via GPS HP.
2. **Point-in-raster** — titik dicek ke peta risiko deforestasi (JRC GFC2020) yang tersimpan offline di device.
3. **Kartu data milik-petani** — keluar kartu (tier Lokal atau Export-Ready): lokasi, status risiko, perkiraan luas, status STDB-ready.
4. **Hash-chain** — kartu dibubuhi rantai kode berantai; kalau data diubah, rantai rusak & ketahuan (tamper-evident).
5. **Consent + notif** — akses dokumen hanya atas izin petani; akses tak-terotorisasi memicu **notifikasi**.
6. **Override manual** — petugas bisa koreksi; keputusan akhir di manusia.

---

## 7. Yang Deterministik (Otak) vs Pendukung

**Otak (pasti, dapat diaudit):**
- Point-in-raster (cek titik di peta) — deterministik.
- Rule engine STDB (aturan kondisi → status) — deterministik.
- Hash-chain provenance — moat kriptografis.
- Mesin consent/notif — deterministik (akses tak-terdaftar → alert).

**Pendukung (bukan pengambil keputusan):**
- Model bahasa (LLM) HANYA untuk menyusun draf dosir, dengan templat cadangan, diungkap terbuka. **OPSIONAL / post-MVP.**

---

## 8. Kejujuran Teknis (WAJIB dipertahankan di UI & pitch)

- Peta JRC GFC2020: akurasi ~91%, **commission error 18%** (kebun kopi bernaung kadang terbaca hutan) → **di-disclose** + ada audit manual.
- Penandaan **berbasis titik (point-primary)**, bukan poligon presisi, karena GPS di bawah kanopi meleset 3–11 meter.
- Angka dampak Rp = **skenario berlabel**, bukan janji.
- Hash-chain, **bukan blockchain** — pilihan sadar (ringan, offline, deterministik).
- Teknologi ~40% solusi; 60% = insentif + regulasi + integrasi pembayaran (di luar 30 jam).

---

## 9. Kesesuaian Regulasi (Tailwind, bukan Fondasi)

- **Domestik:** KUR & pupuk subsidi (e-RDKK) mensyaratkan data lahan terverifikasi.
- **Ekspor:** regulasi antideforestasi Uni Eropa (EUDR) mencakup kopi, menuntut geolokasi + bebas-deforestasi + jejak audit tak-dapat-diubah (persis yang hash-chain berikan).
- **Anti-fragile:** kalau tenggat/aturan bergeser, nilai inti tetap hidup (legalitas juga buka peremajaan/subsidi/pembiayaan).

---

## 10. Dampak (Dipisah Jujur)

**Terukur sekarang:** waktu penyiapan berkas turun; jumlah petani legible & terlindungi naik; lahir dataset pemasok baru.
**Proyeksi (skenario berlabel):** biaya verifikasi rantai pasok pengekspor turun; premium pasar terbuka bila syarat ekspor terpenuhi.

---

## 11. Bentuk Produk (Keputusan Final)

**PWA Web App** (React + Vite + TypeScript), offline-first. Alasan: realistis 30 jam, demo lintas-device via browser, tanpa pipeline build native yang rawan gagal saat demo. (Detail stack di `02_TECH_ARCHITECTURE.md`.)

---

## 12. Skenario Demo (Target Akhir)

"Ini Pangalengan, kebun kopi Bu Ani. Petugas tap lokasi → sistem cek offline → 'kebun aman deforestasi, siap STDB' → kartu milik Bu Ani + hash-chain proof. Bu Ani kasih izin akses ke bank; kalau ada yang akses tanpa izin → notif muncul. Matikan wifi → tetap jalan. Develop: 30 jam."

---

## 13. Batas Tegas (Anti Over-Scope)

**DIBANGUN (MVP):** killer flow 6 langkah + offline + demo data.
**DITUNDA (post-MVP):** draf dosir LLM, multi-plot dashboard, ekspor PDF, mode poligon, sinkron e-STDB nyata (MVP pakai mock berlabel).
**DI-CUT:** fitur harga/premium, dashboard agregat, poligon presisi.

---

Lanjut baca: `02_TECH_ARCHITECTURE.md`.
