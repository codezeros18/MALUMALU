import {
  addAccessLog,
  addNotif,
  getConsents,
  getKartus,
  getPetani,
  newId,
  updateKartu,
  upsertConsent,
} from './db';
import { commitEntry } from './hashchain';
import { enqueueWa } from './waOutbox';
import { toChatId } from './waha';
import type { Kartu } from '../types';

export async function setConsent(kartuId: string, pihak: string, granted: boolean): Promise<void> {
  await upsertConsent({ id: newId(), kartuId, pihak, granted, updatedAt: new Date().toISOString() });
}

export async function simulateAccess(kartuId: string, pihak: string): Promise<{ authorized: boolean }> {
  const consents = await getConsents();
  const authorized = consents.some(c => c.kartuId === kartuId && c.pihak === pihak && c.granted);
  const now = new Date().toISOString();
  await addAccessLog({ id: newId(), kartuId, pihak, authorized, timestamp: now });
  if (!authorized) {
    const kartu = (await getKartus()).find(k => k.id === kartuId);
    const petani = (await getPetani()).find(p => p.id === kartu?.petaniId);
    const nama = petani?.nama ?? kartuId;
    await addNotif({
      id: newId(),
      pesan: `Akses TIDAK berizin oleh "${pihak}" ke kartu ${nama}`,
      severity: 'alert',
      read: false,
      createdAt: now,
    });
    await enqueueWa(
      `🚨 *PASPOR PETANI — Peringatan*\n\n` +
        `Akses TIDAK berizin ke kartu *${nama}*.\n` +
        `Pihak: ${pihak}\n` +
        `Waktu: ${now}`,
    );
    if (petani?.telepon) {
      await enqueueWa(
        `🚨 *Peringatan — Akses Tidak Berizin*\n\n` +
          `Ada pihak ("${pihak}") yang mencoba mengakses data Paspor Anda tanpa izin.\n` +
          `Waktu: ${now}\n\n` +
          `Jika Anda tidak mengenali pihak ini, hubungi petugas.`,
        toChatId(petani.telepon),
      );
    }
  }
  return { authorized };
}

export async function overrideKartu(kartu: Kartu): Promise<Kartu> {
  const now = new Date().toISOString();
  const updated: Kartu = {
    ...kartu,
    tier: kartu.tier === 'export_ready' ? 'lokal' : 'export_ready',
    overrideManual: true,
    alasan: [...kartu.alasan, 'Override manual oleh petugas'],
  };
  await updateKartu(updated);
  await commitEntry(
    { kartuId: updated.id, tier: updated.tier, stdbStatus: updated.stdbStatus, override: true },
    now,
  );
  const petani = (await getPetani()).find(p => p.id === updated.petaniId);
  await enqueueWa(
    `⚠️ *PASPOR PETANI — Override Manual*\n\n` +
      `Kartu *${petani?.nama ?? updated.id}* diubah oleh petugas.\n` +
      `Tier sekarang: ${updated.tier === 'export_ready' ? 'EXPORT-READY' : 'LOKAL'}\n` +
      `Waktu: ${now}`,
  );
  return updated;
}
