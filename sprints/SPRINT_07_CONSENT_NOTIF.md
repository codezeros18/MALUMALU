# 🟦 SPRINT 7 — Consent & Notif Engine

| | |
|---|---|
| **Role** | 🟦 **Fullstack (FS)** |
| **Prasyarat** | Sprint 2 (db) + Sprint 6 (kartu ber-hash) selesai |
| **Estimasi** | ~3 jam |

---

## 🎯 Tujuan
Membangun kedaulatan data: petani memberi/menarik izin akses per kartu; setiap akses dicatat; akses **tak-terotorisasi** memicu **notifikasi** (hero yang menjawab kasus Jember). Plus override manual. **Notif = versi demo-ringan berbasis log + alert di layar, BUKAN infrastruktur push produksi.**

## ✅ Task
- [ ] 7.1 `consent.ts` — grant/revoke izin
- [ ] 7.2 Catat AccessLog
- [ ] 7.3 Akses tak-terotorisasi → NotifItem (alert)
- [ ] 7.4 `ConsentPanel.tsx`
- [ ] 7.5 `NotifBanner.tsx`
- [ ] 7.6 Override manual pada kartu

---

## >>> PROMPT UNTUK CLAUDE CODE >>>

```
Kita mulai SPRINT 7 — Consent & Notif untuk JejakHijau v2 (aku role Fullstack).
Acuan: docs/03_MVP_SCOPE.md (F7) + tipe ConsentRecord, AccessLog, NotifItem di src/types/index.ts. Simpan via src/lib/db.ts. CATATAN: notif = simulasi berbasis log + alert di layar (in-app), bukan push notification produksi.

Lakukan:

1. src/lib/consent.ts:
   - grantConsent(kartuId, grantedTo, scope: string[]): Promise<ConsentRecord> → simpan consent.
   - revokeConsent(consentId): Promise<void> → set revokedAt.
   - listActiveConsents(kartuId): Promise<ConsentRecord[]> (yang belum di-revoke).
   - isAuthorized(kartuId, who): Promise<boolean> → true bila ada consent aktif untuk 'who'.
   - attemptAccess(kartuId, who): Promise<{ authorized: boolean; notif?: NotifItem }>:
     * cek isAuthorized.
     * catat AccessLog { kartuId, accessedBy: who, authorized, timestamp, triggeredNotif }.
     * bila TIDAK authorized → buat NotifItem { message: `Akses tanpa izin terdeteksi: "${who}" mencoba membuka data kartu ${kartuId}`, severity:'alert', kartuId, createdAt, read:false }, simpan via addNotif, set triggeredNotif=true, dan kembalikan notif.
     * bila authorized → triggeredNotif=false.

2. src/components/ConsentPanel.tsx (tampil di PlotDetail / bawah KartuCard):
   - Daftar pihak yang bisa diberi izin (preset: "Bank", "Eksportir", "Koperasi", + input custom).
   - Tombol beri izin (grantConsent) & tarik izin (revokeConsent). Tampilkan daftar izin aktif.
   - Panel DEMO "Simulasikan akses": input nama pihak + tombol "Coba akses" → panggil attemptAccess → bila tak-berizin, munculkan notif (lihat NotifBanner). Ini untuk momen wow: tunjukkan notif langsung muncul saat akses tanpa izin.

3. src/components/NotifBanner.tsx:
   - Ambil listNotif (terbaru dulu), tampilkan sebagai banner/toast di atas layar.
   - Notif severity 'alert' warna merah, mencolok. Tombol tandai terbaca (markNotifRead).
   - Update real-time setelah attemptAccess (pakai state global via context atau callback).

4. Override manual:
   - Di KartuCard, tambahkan tombol "Koreksi manual" yang membuka form kecil untuk mengubah field kartu (mis. ubah stdbStatus atau tier secara manual dengan alasan).
   - Saat disimpan, catat bahwa ini override manual (tambahkan ke alasan[] kartu: "Dikoreksi manual oleh petugas: <alasan>") DAN commit ulang ke hash-chain (appendEntry) supaya perubahan tercatat & tetap tamper-evident.

5. Integrasikan NotifBanner ke layout utama (App.tsx) supaya notif tampil di mana pun.

Setelah selesai:
- Uji: beri izin "Bank" → attemptAccess("Bank") authorized (tanpa notif). attemptAccess("Orang Asing") → TIDAK authorized → notif merah muncul.
- Uji override manual → kartu berubah + entri hash-chain baru tercatat.
- Sarankan commit: `git commit -m "sprint-7: consent-gated access, access log, notif engine, manual override"`.
```

## <<< AKHIR PROMPT <<<

---

## ✔️ Definition of Done
- Beri/tarik izin jalan; daftar izin aktif benar.
- `attemptAccess` oleh pihak berizin = tidak ada notif; pihak tak-berizin = **notif alert merah muncul**.
- AccessLog tercatat tiap percakapan akses.
- Override manual mengubah kartu + menambah entri hash-chain (tetap tamper-evident).
- NotifBanner tampil global.

## 📌 Setelah Selesai
1. Centang 7.1–7.6 di `TRACKER.md`.
2. Commit.
3. FS lanjut **Sprint 8** (offline, polish, deploy) — panggil AI Engineer untuk bantu bagian caching raster offline.
