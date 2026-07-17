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
  PetaniDocument,
  Transaksi,
} from '../types';
import { getItem, setItem, removeItem } from './storage';

const DEVICE_AGENT_ID_KEY = 'device-agent-id';

// ===== SYNC QUEUE (fase full-production, lihat docs/04_FULL_PRODUCTION_BLUEPRINT.md §1) =====

export type SyncEntityType =
  | 'petani'
  | 'plot'
  | 'kartu'
  | 'hashchain'
  | 'consent'
  | 'accessLog'
  | 'notif'
  | 'petaniDocument'
  | 'transaksi';

export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: 'create' | 'update';
  payload: unknown;
  createdAt: number;
  attempts: number;
}

interface JejakHijauDB extends DBSchema {
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
  syncQueue: {
    key: string;
    value: SyncQueueItem;
  };
  petaniDocument: {
    key: string;
    value: PetaniDocument;
    indexes: { 'by-petani': string };
  };
  transaksi: {
    key: string;
    value: Transaksi;
  };
}

// SENGAJA TIDAK diganti ke 'jejakhijau' meski rebranding — ini nama IndexedDB
// sungguhan di browser tiap user. Mengubah string ini bikin browser buka database BARU
// yang kosong di load berikutnya, menghilangkan (bukan cuma "menyembunyikan") seluruh
// data plot/petani/kartu/syncQueue yang sudah tersimpan lokal. Sama persis kelas bug
// yang baru diperbaiki untuk device-agent-id (lihat komentar di upgrade() bawah).
const DB_NAME = 'paspor-petani';
const DB_VERSION = 5;

let dbPromise: Promise<IDBPDatabase<JejakHijauDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<JejakHijauDB>> {
  if (!dbPromise) {
    dbPromise = openDB<JejakHijauDB>(DB_NAME, DB_VERSION, {
      // Setiap createObjectStore dijaga dengan objectStoreNames.contains() (bukan cuma
      // digerbang oldVersion < N) -- kalau versi tercatat di IndexedDB browser pernah
      // "kepakai" (mis. koneksi lama sempat naik versi sebelum store baru selesai dibuat,
      // upgrade sempat gagal di tengah jalan) tanpa store yang seharusnya ikut terbuat,
      // upgrade berikutnya tetap bisa self-heal alih-alih permanen macet dengan store hilang.
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // IndexedDB benar-benar baru di browser ini (bukan cuma migrasi versi biasa).
          // Kalau localStorage kebetulan masih menyimpan device-agent-id LAMA (mis. user
          // "Clear site data" di DevTools yang menghapus IndexedDB tapi tidak selalu
          // menghapus localStorage secara bersamaan, tergantung browser), agentId lama
          // itu akan dipakai lagi oleh getDeviceAgentId() padahal riwayat hash-chain
          // lokalnya sudah hilang -> appendEntry() menulis ulang index 0/GENESIS di
          // BAWAH agentId yang sama, membuat rantai orang itu (dilihat per-agentId,
          // pola EksportirDashboard/PaketBuktiEudr) terpecah jadi beberapa "generasi"
          // yang masing-masing kelihatan "rusak" saat digabung. Reset agentId di sini
          // supaya IndexedDB baru SELALU dapat identitas baru juga — tidak pernah
          // menimpa index 0 di bawah agentId yang sudah pernah dipakai.
          removeItem(DEVICE_AGENT_ID_KEY);
          if (!db.objectStoreNames.contains('petani')) {
            db.createObjectStore('petani', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('plot')) {
            const plotStore = db.createObjectStore('plot', { keyPath: 'id' });
            plotStore.createIndex('by-petani', 'petaniId');
          }
          if (!db.objectStoreNames.contains('kartu')) {
            const kartuStore = db.createObjectStore('kartu', { keyPath: 'id' });
            kartuStore.createIndex('by-plot', 'plotId');
            kartuStore.createIndex('by-petani', 'petaniId');
          }
          if (!db.objectStoreNames.contains('hashchain')) {
            const hashchainStore = db.createObjectStore('hashchain', { keyPath: 'id' });
            hashchainStore.createIndex('by-index', 'index');
          }
          if (!db.objectStoreNames.contains('consent')) {
            const consentStore = db.createObjectStore('consent', { keyPath: 'id' });
            consentStore.createIndex('by-kartu', 'kartuId');
          }
          if (!db.objectStoreNames.contains('accessLog')) {
            const accessLogStore = db.createObjectStore('accessLog', { keyPath: 'id' });
            accessLogStore.createIndex('by-kartu', 'kartuId');
          }
          if (!db.objectStoreNames.contains('notif')) {
            db.createObjectStore('notif', { keyPath: 'id' });
          }
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('syncQueue')) {
            db.createObjectStore('syncQueue', { keyPath: 'id' });
          }
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('petaniDocument')) {
            const documentStore = db.createObjectStore('petaniDocument', { keyPath: 'id' });
            documentStore.createIndex('by-petani', 'petaniId');
          }
        }
        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('transaksi')) {
            db.createObjectStore('transaksi', { keyPath: 'id' });
          }
        }
      },
      // Tab lain (mis. sesi lama sebelum penambahan store petaniDocument di sprint ini)
      // masih memegang koneksi versi lama -> upgrade di tab ini akan macet menunggu.
      // Tutup koneksi lama itu sendiri supaya upgrade bisa lanjut tanpa perlu user
      // manual menutup tab lain.
      blocking() {
        void (async () => {
          const stale = await dbPromise;
          stale?.close();
        })();
      },
      blocked(currentVersion, blockedVersion) {
        console.warn(
          `[db] upgrade ke versi ${blockedVersion} diblokir oleh koneksi versi ${currentVersion} yang masih terbuka di tab lain.`,
        );
      },
      terminated() {
        // Browser mematikan paksa koneksi (mis. tab lain crash) -> reset cache supaya
        // panggilan berikutnya membuka koneksi baru, bukan menggantung selamanya.
        dbPromise = null;
      },
    }).catch((err) => {
      // JANGAN cache promise yang gagal — kalau di-cache, SEMUA pemanggilan getDB()
      // berikutnya (lintas fitur: consent, petani, dst) akan gagal identik sampai
      // reload penuh, walau penyebab aslinya cuma satu upgrade yang sempat gagal.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

function dbError(op: string, err: unknown): Error {
  console.error(`[db] ${op} failed`, err);
  const detail = err instanceof Error ? err.message : String(err);
  return new Error(`Operasi database gagal: ${op} (${detail})`);
}

// Identitas device/agen sementara (demo-auth) — dipakai sampai Sprint 11 memasang role
// sungguhan. Konsisten per-browser (persist di localStorage), supaya dashboard Eksportir
// (Sprint 13) bisa membedakan data antar device walau belum ada login sungguhan.
export function getDeviceAgentId(): string {
  let id = getItem<string>(DEVICE_AGENT_ID_KEY);
  if (!id) {
    id = nanoid();
    setItem(DEVICE_AGENT_ID_KEY, id);
  }
  return id;
}

// Tambahkan entri ke syncQueue. Sengaja SOFT-FAIL (tidak melempar error) — kegagalan
// antre sinkron tidak boleh menggagalkan penyimpanan lokal yang jadi prioritas utama.
export async function enqueueSync(
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncQueueItem['operation'],
  payload: unknown,
): Promise<void> {
  try {
    const db = await getDB();
    const item: SyncQueueItem = {
      id: nanoid(),
      entityType,
      entityId,
      operation,
      payload,
      createdAt: Date.now(),
      attempts: 0,
    };
    await db.put('syncQueue', item);
  } catch (err) {
    console.error('[db] enqueueSync failed (non-fatal, data lokal tetap tersimpan)', err);
  }
}

export async function listSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const db = await getDB();
    const all = await db.getAll('syncQueue');
    // Urutkan by createdAt (BUKAN urutan key/nanoid, yang acak) — penting supaya entity
    // "induk" (mis. plot) selalu tersinkron sebelum entity "anak" yang mereferensikannya
    // (mis. kartu), sesuai foreign key constraint di skema Supabase.
    return all.sort((a, b) => a.createdAt - b.createdAt);
  } catch (err) {
    throw dbError('listSyncQueue', err);
  }
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('syncQueue', id);
  } catch (err) {
    throw dbError('removeSyncQueueItem', err);
  }
}

export async function incrementSyncAttempt(id: string): Promise<void> {
  try {
    const db = await getDB();
    const item = await db.get('syncQueue', id);
    if (!item) return;
    await db.put('syncQueue', { ...item, attempts: item.attempts + 1 });
  } catch (err) {
    throw dbError('incrementSyncAttempt', err);
  }
}

const SYNC_STORE_BY_ENTITY_TYPE = {
  petani: 'petani',
  plot: 'plot',
  kartu: 'kartu',
  hashchain: 'hashchain',
  consent: 'consent',
  accessLog: 'accessLog',
  notif: 'notif',
  petaniDocument: 'petaniDocument',
  transaksi: 'transaksi',
} as const;

// Tandai entity lokal sebagai 'synced' setelah backend.upsert() sukses (dipanggil dari
// lib/sync.ts). Soft-fail — kegagalan menandai status tidak boleh menggagalkan proses sync.
export async function markSynced(
  entityType: SyncEntityType,
  entityId: string,
  remoteId: string,
): Promise<void> {
  try {
    const db = await getDB();
    const storeName = SYNC_STORE_BY_ENTITY_TYPE[entityType];
    const record = await db.get(storeName, entityId);
    if (!record) return; // entity sudah tidak ada secara lokal, abaikan
    await db.put(storeName, { ...record, syncStatus: 'synced', remoteId, updatedAt: Date.now() });
  } catch (err) {
    console.error('[db] markSynced failed (non-fatal)', err);
  }
}

// Tandai entity lokal sebagai 'conflict' — dipakai lib/sync.ts saat sebuah item sudah
// gagal sinkron berkali-kali berturut-turut (lihat MAX_AUTO_RETRY_ATTEMPTS) dan
// dianggap menyerah otomatis, supaya badge UI menunjukkan "Gagal sinkron" secara
// persisten alih-alih retry tanpa henti setiap interval.
export async function markSyncConflict(entityType: SyncEntityType, entityId: string): Promise<void> {
  try {
    const db = await getDB();
    const storeName = SYNC_STORE_BY_ENTITY_TYPE[entityType];
    const record = await db.get(storeName, entityId);
    if (!record) return;
    await db.put(storeName, { ...record, syncStatus: 'conflict', updatedAt: Date.now() });
  } catch (err) {
    console.error('[db] markSyncConflict failed (non-fatal)', err);
  }
}

// Antre ulang entity yang sudah "menyerah" (syncStatus 'conflict') supaya tombol
// "Coba lagi" di UI benar-benar memicu percobaan baru — item yang sudah give-up
// dibuang dari syncQueue (lihat markSyncConflict di lib/sync.ts), jadi tanpa ini
// tombol retry tidak akan melakukan apa pun untuknya.
export async function requeueForSync(entityType: SyncEntityType, entityId: string): Promise<void> {
  try {
    const db = await getDB();
    const storeName = SYNC_STORE_BY_ENTITY_TYPE[entityType];
    const record = await db.get(storeName, entityId);
    if (!record) return;
    await db.put(storeName, { ...record, syncStatus: 'local' });
    await enqueueSync(entityType, entityId, 'update', { ...record, syncStatus: 'local' });
  } catch (err) {
    console.error('[db] requeueForSync failed (non-fatal)', err);
  }
}

// ===== PETANI =====

export async function addPetani(input: Omit<Petani, 'id' | 'createdAt'>): Promise<Petani> {
  try {
    const db = await getDB();
    const now = Date.now();
    const petani: Petani = {
      ...input,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
      agentId: input.agentId ?? getDeviceAgentId(),
      syncStatus: 'local',
    };
    await db.put('petani', petani);
    await enqueueSync('petani', petani.id, 'create', petani);
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
    const plot: Plot = {
      ...input,
      id: nanoid(),
      updatedAt: Date.now(),
      agentId: input.agentId ?? getDeviceAgentId(),
      syncStatus: 'local',
    };
    await db.put('plot', plot);
    await enqueueSync('plot', plot.id, 'create', plot);
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
    const now = Date.now();
    const kartu: Kartu = {
      ...input,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
      agentId: input.agentId ?? getDeviceAgentId(),
      syncStatus: 'local',
    };
    await db.put('kartu', kartu);
    await enqueueSync('kartu', kartu.id, 'create', kartu);
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
    const final: Kartu = {
      ...kartu,
      updatedAt: Date.now(),
      agentId: kartu.agentId ?? getDeviceAgentId(),
      syncStatus: 'local', // data baru saja ditulis + di-enqueue -> selalu pending, walau versi sebelumnya sudah 'synced'
    };
    await db.put('kartu', final);
    await enqueueSync('kartu', final.id, 'update', final);
    return final;
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
    const consent: ConsentRecord = {
      ...input,
      id: nanoid(),
      grantedAt: Date.now(),
      syncStatus: 'local',
    };
    await db.put('consent', consent);
    await enqueueSync('consent', consent.id, 'create', consent);
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
    const updated: ConsentRecord = { ...existing, revokedAt: Date.now(), syncStatus: 'local' };
    await db.put('consent', updated);
    await enqueueSync('consent', updated.id, 'update', updated);
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
    const log: AccessLog = { ...input, id: nanoid(), timestamp: Date.now(), syncStatus: 'local' };
    await db.put('accessLog', log);
    await enqueueSync('accessLog', log.id, 'create', log);
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
    const notif: NotifItem = {
      ...input,
      id: nanoid(),
      createdAt: Date.now(),
      read: false,
      syncStatus: 'local',
    };
    await db.put('notif', notif);
    await enqueueSync('notif', notif.id, 'create', notif);
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

// ===== DOKUMEN PETANI =====

export async function addDocument(
  input: Omit<PetaniDocument, 'id' | 'uploadedAt' | 'verified'>,
): Promise<PetaniDocument> {
  try {
    const db = await getDB();
    const doc: PetaniDocument = {
      ...input,
      id: nanoid(),
      uploadedAt: Date.now(),
      verified: false,
      agentId: input.agentId ?? getDeviceAgentId(),
      syncStatus: 'local',
    };
    await db.put('petaniDocument', doc);
    await enqueueSync('petaniDocument', doc.id, 'create', doc);
    return doc;
  } catch (err) {
    throw dbError('addDocument', err);
  }
}

export async function listDocumentsByPetani(petaniId: string): Promise<PetaniDocument[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex('petaniDocument', 'by-petani', petaniId);
  } catch (err) {
    throw dbError('listDocumentsByPetani', err);
  }
}

export async function markDocumentVerified(id: string): Promise<PetaniDocument> {
  try {
    const db = await getDB();
    const existing = await db.get('petaniDocument', id);
    if (!existing) throw new Error(`PetaniDocument ${id} tidak ditemukan`);
    const updated: PetaniDocument = { ...existing, verified: true, syncStatus: 'local' };
    await db.put('petaniDocument', updated);
    await enqueueSync('petaniDocument', updated.id, 'update', updated);
    return updated;
  } catch (err) {
    throw dbError('markDocumentVerified', err);
  }
}

// ===== TRANSAKSI (Sprint 20 — harga referensi) =====

export async function addTransaksi(
  input: Omit<Transaksi, 'id' | 'createdAt'>,
): Promise<Transaksi> {
  try {
    const db = await getDB();
    const transaksi: Transaksi = {
      ...input,
      id: nanoid(),
      createdAt: Date.now(),
      agentId: input.agentId ?? getDeviceAgentId(),
      syncStatus: 'local',
    };
    await db.put('transaksi', transaksi);
    await enqueueSync('transaksi', transaksi.id, 'create', transaksi);
    return transaksi;
  } catch (err) {
    throw dbError('addTransaksi', err);
  }
}

export async function listTransaksi(): Promise<Transaksi[]> {
  try {
    const db = await getDB();
    return await db.getAll('transaksi');
  } catch (err) {
    throw dbError('listTransaksi', err);
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
