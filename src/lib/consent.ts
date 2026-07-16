import {
  addConsent,
  listConsentByKartu,
  revokeConsent as dbRevokeConsent,
  addAccessLog,
  addNotif,
} from './db';
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
    return { authorized: false, notif };
  }

  return { authorized: true };
}
