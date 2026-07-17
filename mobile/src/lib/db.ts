import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AccessLog,
  ConsentRecord,
  HashChainEntry,
  Kartu,
  NotifItem,
  Petani,
  Plot,
  WaOutboxItem,
} from '../types';

const KEYS = {
  petani: 'pp.petani',
  plot: 'pp.plot',
  kartu: 'pp.kartu',
  chain: 'pp.chain',
  chainBackup: 'pp.chain.backup',
  consent: 'pp.consent',
  accessLog: 'pp.accessLog',
  notif: 'pp.notif',
  waOutbox: 'pp.waOutbox',
} as const;

async function readAll<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch (e) {
    console.error('db.readAll', key, e);
    return [];
  }
}

async function writeAll<T>(key: string, items: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('db.writeAll', key, e);
    throw new Error('Gagal menyimpan data. Coba lagi.');
  }
}

// Serializes read-modify-write cycles per storage key. AsyncStorage has no
// transactions, so two concurrent callers on the same key (e.g. two plot
// submissions, or an outbox enqueue racing a flush's status update) can each
// read the same pre-write snapshot and then overwrite one another's write —
// silently dropping whichever landed first. Queuing callers per key here
// keeps each read-modify-write atomic relative to others on that same key.
const keyLocks = new Map<string, Promise<unknown>>();

function withKeyLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = keyLocks.get(key) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  keyLocks.set(
    key,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

async function append<T>(key: string, item: T): Promise<void> {
  await withKeyLock(key, async () => {
    const items = await readAll<T>(key);
    await writeAll(key, [...items, item]);
  });
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const getPetani = () => readAll<Petani>(KEYS.petani);
export const addPetani = (p: Petani) => append(KEYS.petani, p);

export const getPlots = () => readAll<Plot>(KEYS.plot);
export const addPlot = (p: Plot) => append(KEYS.plot, p);

export const getKartus = () => readAll<Kartu>(KEYS.kartu);
export const addKartu = (k: Kartu) => append(KEYS.kartu, k);
export async function updateKartu(k: Kartu): Promise<void> {
  const all = await getKartus();
  await writeAll(KEYS.kartu, all.map(x => (x.id === k.id ? k : x)));
}

export const getConsents = () => readAll<ConsentRecord>(KEYS.consent);
export async function upsertConsent(c: ConsentRecord): Promise<void> {
  const all = await getConsents();
  const exists = all.some(x => x.kartuId === c.kartuId && x.pihak === c.pihak);
  await writeAll(
    KEYS.consent,
    exists ? all.map(x => (x.kartuId === c.kartuId && x.pihak === c.pihak ? c : x)) : [...all, c],
  );
}

export const getAccessLogs = () => readAll<AccessLog>(KEYS.accessLog);
export const addAccessLog = (a: AccessLog) => append(KEYS.accessLog, a);

export const getNotifs = () => readAll<NotifItem>(KEYS.notif);
export const addNotif = (n: NotifItem) => append(KEYS.notif, n);
export async function markNotifRead(id: string): Promise<void> {
  const all = await getNotifs();
  await writeAll(KEYS.notif, all.map(n => (n.id === id ? { ...n, read: true } : n)));
}

export const getWaOutbox = () => readAll<WaOutboxItem>(KEYS.waOutbox);
export const addWaOutbox = (i: WaOutboxItem) => append(KEYS.waOutbox, i);
export async function updateWaOutbox(i: WaOutboxItem): Promise<void> {
  await withKeyLock(KEYS.waOutbox, async () => {
    const all = await getWaOutbox();
    await writeAll(KEYS.waOutbox, all.map(x => (x.id === i.id ? i : x)));
  });
}

export const getChain = () => readAll<HashChainEntry>(KEYS.chain);
export const setChain = (entries: HashChainEntry[]) => writeAll(KEYS.chain, entries);
export const getChainBackup = () => readAll<HashChainEntry>(KEYS.chainBackup);
export const setChainBackup = (entries: HashChainEntry[]) => writeAll(KEYS.chainBackup, entries);

// Locked read-modify-write helper for the hash-chain specifically (see
// hashchain.ts's commitEntry) — exported rather than folded into a generic
// "append" here because appending a chain entry needs appendEntry()'s hashing
// logic between the read and the write, not just a plain item push.
export function withChainLock<T>(fn: () => Promise<T>): Promise<T> {
  return withKeyLock(KEYS.chain, fn);
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
