import {
  addConsent,
  listConsentByKartu,
  revokeConsent as dbRevokeConsent,
  addAccessLog,
  addNotif,
  getKartu,
  getPetani,
} from './db';
import { supabaseBackend, fromSupabaseRow } from './sync';
import {
  isWahaEnabled,
  sendWhatsAppText,
  buildUnauthorizedAccessMessage,
  normalizePhone,
} from './waha';
import type { ConsentRecord, NotifItem } from '../types';

export async function grantConsent(
  kartuId: string,
  grantedTo: string,
  scope: string[],
): Promise<ConsentRecord> {
  return addConsent({ kartuId, grantedTo, scope });
}

export async function revokeConsent(consentId: string): Promise<void> {
  await dbRevokeConsent(consentId);
}

// Dipakai ConsentPanel.tsx (grant/revoke/lihat izin) — SENGAJA tetap baca LOKAL saja,
// bukan Supabase. Ini alur "device yang sama baru saja menulis, langsung baca balik" —
// kalau dialihkan ke Supabase, ada jeda sinkron outbox yang bikin izin yang BARU SAJA
// diberikan sempat tidak kelihatan (stale read). Beda kasus dengan isAuthorized() di
// bawah, yang justru BUTUH baca lintas-device.
export async function listActiveConsents(kartuId: string): Promise<ConsentRecord[]> {
  const all = await listConsentByKartu(kartuId);
  return all.filter((consent) => !consent.revokedAt);
}

// Ambil consent aktif dari Supabase (Sprint 21 — lintas-device). Dipakai HANYA oleh
// isAuthorized() di bawah, bukan ConsentPanel.tsx, supaya UI grant/revoke tetap instan
// (lihat catatan di listActiveConsents).
async function fetchActiveConsentsRemote(kartuId: string): Promise<ConsentRecord[]> {
  const rows = await supabaseBackend.fetchAll('consent');
  const all = rows.map((r) => fromSupabaseRow<ConsentRecord>(r));
  return all.filter((c) => c.kartuId === kartuId && !c.revokedAt);
}

// Cek izin akses — INI yang perlu bekerja LINTAS-DEVICE (mis. Eksportir di laptop
// kantor mengecek izin yang diberikan Agen di HP lapangan, lihat catatan arsitektur
// docs/07 §2.2 dan docs/09 §4.3). Baca dari Supabase dulu (sumber kebenaran bersama);
// FALLBACK ke IndexedDB lokal kalau gagal (offline/network error) — supaya app tetap
// bisa menilai akses walau tanpa internet, mengorbankan visibilitas lintas-device untuk
// sementara (bukan gagal total).
export async function isAuthorized(kartuId: string, who: string): Promise<boolean> {
  const target = who.trim().toLowerCase();
  let active: ConsentRecord[];
  try {
    active = await fetchActiveConsentsRemote(kartuId);
  } catch (err) {
    console.warn('[consent] gagal cek consent via Supabase (offline/network), fallback ke lokal', err);
    active = await listActiveConsents(kartuId);
  }
  return active.some((consent) => consent.grantedTo.trim().toLowerCase() === target);
}

// Kirim notif WA ke petani pemilik kartu (fail-soft). Dipanggil dari attemptAccess.
async function notifyPetaniViaWaha(kartuId: string, accessedBy: string): Promise<void> {
  if (!isWahaEnabled()) return;

  try {
    const kartu = await getKartu(kartuId);
    if (!kartu) return;
    const petani = await getPetani(kartu.petaniId);
    if (!petani) return;

    const phone = normalizePhone(petani.telepon);
    if (!phone) return;

    const message = buildUnauthorizedAccessMessage(petani.nama, accessedBy);
    const result = await sendWhatsAppText(phone, message);
    if (!result.sent) {
      console.info('[WAHA] notif tidak terkirim:', result.reason, '(app tetap jalan)');
    }
  } catch (err) {
    console.warn('[WAHA] notify gagal (fail-soft)', err);
  }
}

export async function attemptAccess(
  kartuId: string,
  who: string,
): Promise<{ authorized: boolean; notif?: NotifItem }> {
  const authorized = await isAuthorized(kartuId, who);

  await addAccessLog({
    kartuId,
    accessedBy: who,
    authorized,
    triggeredNotif: !authorized,
  });

  if (!authorized) {
    const notif = await addNotif({
      message: `Akses tanpa izin terdeteksi: "${who}" mencoba membuka data kartu ${kartuId}`,
      severity: 'alert',
      kartuId,
    });

    // Notif WhatsApp ke petani (prototipe, fail-soft) — jalan paralel,
    // tidak memblokir return notif in-app.
    void notifyPetaniViaWaha(kartuId, who);

    return { authorized: false, notif };
  }

  return { authorized: true };
}
