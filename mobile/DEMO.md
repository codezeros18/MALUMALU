# Skrip Demo — Paspor Petani (6 langkah, ±3 menit)

> Latihan minimal 2× sebelum demo. Semua langkah bekerja **tanpa internet** —
> offline adalah fiturnya, bukan keterbatasan.

## Persiapan (sebelum juri datang)

1. Buka app lewat Expo Go, pastikan semua tab pernah dibuka sekali (font & layar sudah ter-cache).
2. Tab **Lapangan** → tekan **Hapus Semua Data** (konfirmasi) supaya mulai dari kosong.
3. **Nyalakan airplane mode.** Tutup lalu buka lagi app-nya.

## Langkah demo

### 0. Buka app — tunjukkan indikator offline
Di kanan header ada chip **🔴 Offline (mode lapangan)**.
*Narasi: "Petugas lapangan di Pangalengan sering tanpa sinyal — seluruh alur ini offline."*

### 1. Muat data demo
Tab **Lapangan** → **Muat Data Demo** → 3 petani demo masuk (berlabel DATA DEMO).

### 2. Registrasi plot baru
Masih di **Lapangan**: karena offline, picker otomatis jadi **grid Pangalengan**.
Tap satu titik di grid → isi **Nama petani** (mis. "Pak Budi") → **Simpan Plot** →
muncul alert tier (EXPORT-READY / LOKAL) → "Lihat Kartu".
*Coba juga tombol 📍 Pakai GPS bila di luar ruangan.*

### 3. Kartu paspor
Tab **Kartu**: kartu bergaya paspor per petani — stempel tier miring, status
deforestasi, alasan keputusan, dan **fine print disclosure** di bawah
(akurasi peta ~91%, GPS point-primary, hash-chain bukan blockchain).
*Tunjuk fine print-nya — kejujuran data adalah selling point.*

### 4. Rantai — momen andalan 🧪
Tab **Rantai** → **Verifikasi Rantai** → ✅ hijau (rantai utuh).
Tekan **🧪 Simulasi Ubah Data** → verifikasi jadi ⛔ merah, rusak di entri yang
diubah (entri berwarna merah). Tekan **↩️ Pulihkan Data** → verifikasi hijau lagi.
*Narasi: "Data bisa diubah siapa pun di HP — tapi rantai hash langsung membongkarnya."*

### 5. Izin & akses tak-berizin
Tab **Izin** → pilih kartu → matikan semua izin (atau biarkan default kosong) →
tekan **🚨 Simulasi Akses Tak-Berizin** → **banner merah** muncul di atas layar
("Akses TIDAK berizin oleh …") → tekan **Tandai dibaca**.
Nyalakan izin **Koperasi** → **Simulasi Akses Berizin** → log ✅ berizin.
*Narasi: "Petani pegang kendali datanya sendiri — akses ilegal ketahuan real-time."*

### 6. Override manual + rantai bertambah
Tab **Kartu** → tekan **Override Manual (petugas)** pada satu kartu →
tier berubah + badge OVERRIDE MANUAL muncul.
Buka **Rantai** → entri baru tercatat. Keputusan manusia pun terekam permanen.

## Reset antar-latihan

Tab **Lapangan** → **Hapus Semua Data** → ulangi dari langkah 1.

## Jika ada yang macet

- Banner merah tidak muncul? Tunggu ±3 detik (polling), atau pindah tab.
- Grid picker tidak muncul saat offline? Pakai toggle **Grid ⇄** di kanan atas layar Lapangan.
- Font belum ke-load (teks default)? Tutup-buka app; font butuh sekali load saat online pertama.
