import {
  addAccessLog,
  addNotif,
  getChain,
  getConsents,
  getKartus,
  getPetani,
  newId,
  setChain,
  updateKartu,
  upsertConsent,
} from './db';
import { appendEntry } from './hashchain';
import { enqueueWa } from './waOutbox';
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
  const chain = await getChain();
  await setChain(
    appendEntry(
      chain,
      { kartuId: updated.id, tier: updated.tier, stdbStatus: updated.stdbStatus, override: true },
      now,
    ),
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
