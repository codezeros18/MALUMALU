import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { nanoid } from 'nanoid';
import type {
  Petani,
  Plot,
  Kartu,
  HashChainEntry,
  ConsentRecord,
  AccessLog,
  NotifItem,
} from '../types';

interface PasporPetaniDB extends DBSchema {
  petani: {
    key: string;
    value: Petani;
  };
  plot: {
    key: string;
    value: Plot;
    indexes: { 'by-petani': string };
  };
  kartu: {
    key: string;
    value: Kartu;
    indexes: { 'by-plot': string; 'by-petani': string };
  };
  hashchain: {
    key: string;
    value: HashChainEntry;
    indexes: { 'by-index': number };
  };
  consent: {
    key: string;
    value: ConsentRecord;
    indexes: { 'by-kartu': string };
  };
  accessLog: {
    key: string;
    value: AccessLog;
    indexes: { 'by-kartu': string };
  };
  notif: {
    key: string;
    value: NotifItem;
  };
}

const DB_NAME = 'paspor-petani';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PasporPetaniDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<PasporPetaniDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PasporPetaniDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('petani', { keyPath: 'id' });

        const plotStore = db.createObjectStore('plot', { keyPath: 'id' });
        plotStore.createIndex('by-petani', 'petaniId');

        const kartuStore = db.createObjectStore('kartu', { keyPath: 'id' });
        kartuStore.createIndex('by-plot', 'plotId');
        kartuStore.createIndex('by-petani', 'petaniId');

        const hashchainStore = db.createObjectStore('hashchain', { keyPath: 'id' });
        hashchainStore.createIndex('by-index', 'index');

        const consentStore = db.createObjectStore('consent', { keyPath: 'id' });
        consentStore.createIndex('by-kartu', 'kartuId');

        const accessLogStore = db.createObjectStore('accessLog', { keyPath: 'id' });
        accessLogStore.createIndex('by-kartu', 'kartuId');

        db.createObjectStore('notif', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

function dbError(op: string, err: unknown): Error {
  console.error(`[db] ${op} failed`, err);
  return new Error(`Operasi database gagal: ${op}`);
}

// ===== PETANI =====

export async function addPetani(input: Omit<Petani, 'id' | 'createdAt'>): Promise<Petani> {
  try {
    const db = await getDB();
    const petani: Petani = { ...input, id: nanoid(), createdAt: Date.now() };
    await db.put('petani', petani);
    return petani;
  } catch (err) {
    throw dbError('addPetani', err);
  }
}

export async function getPetani(id: string): Promise<Petani | undefined> {
  try {
    const db = await getDB();
    return await db.get('petani', id);
  } catch (err) {
    throw dbError('getPetani', err);
  }
}

export async function listPetani(): Promise<Petani[]> {
  try {
    const db = await getDB();
    return await db.getAll('petani');
  } catch (err) {
    throw dbError('listPetani', err);
  }
}

export async function updatePetani(
  id: string,
  patch: Partial<Omit<Petani, 'id'>>,
): Promise<Petani> {
  try {
    const db = await getDB();
    const existing = await db.get('petani', id);
    if (!existing) throw new Error(`Petani ${id} tidak ditemukan`);
    const updated: Petani = { ...existing, ...patch };
    await db.put('petani', updated);
    return updated;
  } catch (err) {
    throw dbError('updatePetani', err);
  }
}

// ===== PLOT =====

export async function addPlot(input: Omit<Plot, 'id'>): Promise<Plot> {
  try {
    const db = await getDB();
    const plot: Plot = { ...input, id: nanoid() };
    await db.put('plot', plot);
    return plot;
  } catch (err) {
    throw dbError('addPlot', err);
  }
}

export async function getPlot(id: string): Promise<Plot | undefined> {
  try {
    const db = await getDB();
    return await db.get('plot', id);
  } catch (err) {
    throw dbError('getPlot', err);
  }
}

export async function listPlotByPetani(petaniId: string): Promise<Plot[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('plot', 'by-petani', petaniId);
  } catch (err) {
    throw dbError('listPlotByPetani', err);
  }
}

export async function listAllPlot(): Promise<Plot[]> {
  try {
    const db = await getDB();
    return await db.getAll('plot');
  } catch (err) {
    throw dbError('listAllPlot', err);
  }
}

// ===== KARTU =====

export async function addKartu(input: Omit<Kartu, 'id' | 'createdAt'>): Promise<Kartu> {
  try {
    const db = await getDB();
    const kartu: Kartu = { ...input, id: nanoid(), createdAt: Date.now() };
    await db.put('kartu', kartu);
    return kartu;
  } catch (err) {
    throw dbError('addKartu', err);
  }
}

export async function getKartu(id: string): Promise<Kartu | undefined> {
  try {
    const db = await getDB();
    return await db.get('kartu', id);
  } catch (err) {
    throw dbError('getKartu', err);
  }
}

export async function getKartuByPlot(plotId: string): Promise<Kartu | undefined> {
  try {
    const db = await getDB();
    return await db.getFromIndex('kartu', 'by-plot', plotId);
  } catch (err) {
    throw dbError('getKartuByPlot', err);
  }
}

export async function listKartu(): Promise<Kartu[]> {
  try {
    const db = await getDB();
    return await db.getAll('kartu');
  } catch (err) {
    throw dbError('listKartu', err);
  }
}

// Simpan Kartu utuh (id sudah ada, mis. dari generateKartu) — dipakai commitKartu (Sprint 6)
// setelah hashChainRef diisi, berbeda dari addKartu yang selalu men-generate id baru.
export async function putKartu(kartu: Kartu): Promise<Kartu> {
  try {
    const db = await getDB();
    await db.put('kartu', kartu);
    return kartu;
  } catch (err) {
    throw dbError('putKartu', err);
  }
}

// ===== HASH-CHAIN =====

export async function addHashEntry(input: Omit<HashChainEntry, 'id'>): Promise<HashChainEntry> {
  try {
    const db = await getDB();
    const entry: HashChainEntry = { ...input, id: nanoid() };
    await db.put('hashchain', entry);
    return entry;
  } catch (err) {
    throw dbError('addHashEntry', err);
  }
}

export async function listHashEntries(): Promise<HashChainEntry[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('hashchain', 'by-index');
  } catch (err) {
    throw dbError('listHashEntries', err);
  }
}

export async function getLastHashEntry(): Promise<HashChainEntry | undefined> {
  try {
    const db = await getDB();
    const cursor = await db
      .transaction('hashchain')
      .store.index('by-index')
      .openCursor(null, 'prev');
    return cursor?.value;
  } catch (err) {
    throw dbError('getLastHashEntry', err);
  }
}

// Overwrite entri hash-chain APA ADANYA (id dipertahankan) — dipakai hashchain.ts untuk
// simulateTamper/restoreEntry (demo tamper-evidence). Tidak menghitung ulang hash apa pun.
export async function putHashEntryRaw(entry: HashChainEntry): Promise<HashChainEntry> {
  try {
    const db = await getDB();
    await db.put('hashchain', entry);
    return entry;
  } catch (err) {
    throw dbError('putHashEntryRaw', err);
  }
}

// ===== CONSENT =====

export async function addConsent(
  input: Omit<ConsentRecord, 'id' | 'grantedAt'>,
): Promise<ConsentRecord> {
  try {
    const db = await getDB();
    const consent: ConsentRecord = { ...input, id: nanoid(), grantedAt: Date.now() };
    await db.put('consent', consent);
    return consent;
  } catch (err) {
    throw dbError('addConsent', err);
  }
}

export async function listConsentByKartu(kartuId: string): Promise<ConsentRecord[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('consent', 'by-kartu', kartuId);
  } catch (err) {
    throw dbError('listConsentByKartu', err);
  }
}

export async function revokeConsent(id: string): Promise<ConsentRecord> {
  try {
    const db = await getDB();
    const existing = await db.get('consent', id);
    if (!existing) throw new Error(`ConsentRecord ${id} tidak ditemukan`);
    const updated: ConsentRecord = { ...existing, revokedAt: Date.now() };
    await db.put('consent', updated);
    return updated;
  } catch (err) {
    throw dbError('revokeConsent', err);
  }
}

// ===== ACCESS LOG =====

export async function addAccessLog(
  input: Omit<AccessLog, 'id' | 'timestamp'>,
): Promise<AccessLog> {
  try {
    const db = await getDB();
    const log: AccessLog = { ...input, id: nanoid(), timestamp: Date.now() };
    await db.put('accessLog', log);
    return log;
  } catch (err) {
    throw dbError('addAccessLog', err);
  }
}

export async function listAccessLogByKartu(kartuId: string): Promise<AccessLog[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('accessLog', 'by-kartu', kartuId);
  } catch (err) {
    throw dbError('listAccessLogByKartu', err);
  }
}

// ===== NOTIF =====

export async function addNotif(
  input: Omit<NotifItem, 'id' | 'createdAt' | 'read'>,
): Promise<NotifItem> {
  try {
    const db = await getDB();
    const notif: NotifItem = { ...input, id: nanoid(), createdAt: Date.now(), read: false };
    await db.put('notif', notif);
    return notif;
  } catch (err) {
    throw dbError('addNotif', err);
  }
}

export async function listNotif(): Promise<NotifItem[]> {
  try {
    const db = await getDB();
    const all = await db.getAll('notif');
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    throw dbError('listNotif', err);
  }
}

export async function markNotifRead(id: string): Promise<NotifItem> {
  try {
    const db = await getDB();
    const existing = await db.get('notif', id);
    if (!existing) throw new Error(`NotifItem ${id} tidak ditemukan`);
    const updated: NotifItem = { ...existing, read: true };
    await db.put('notif', updated);
    return updated;
  } catch (err) {
    throw dbError('markNotifRead', err);
  }
}

// ===== DEV SEED (manual, tidak dipanggil otomatis) =====

export async function devSeed(): Promise<{ petani: Petani; plot: Plot }> {
  const petani = await addPetani({ nama: 'Bu Ani (dummy)', desa: 'Pangalengan' });
  const plot = await addPlot({
    petaniId: petani.id,
    lat: -7.1667,
    lng: 107.6167,
    komoditas: 'kopi',
    capturedAt: Date.now(),
  });
  return { petani, plot };
}
