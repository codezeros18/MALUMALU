import {
  addConsent,
  listConsentByKartu,
  revokeConsent as dbRevokeConsent,
  addAccessLog,
  addNotif,
  getKartu,
  getPetani,
} from './db';
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

export async function listActiveConsents(kartuId: string): Promise<ConsentRecord[]> {
  const all = await listConsentByKartu(kartuId);
  return all.filter((consent) => !consent.revokedAt);
}

export async function isAuthorized(kartuId: string, who: string): Promise<boolean> {
  const active = await listActiveConsents(kartuId);
  const target = who.trim().toLowerCase();
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
