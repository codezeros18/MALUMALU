import { nanoid } from 'nanoid';
import { getSupabaseClient } from './supabaseClient';
import {
  listSyncQueue,
  removeSyncQueueItem,
  incrementSyncAttempt,
  markSynced,
  markSyncConflict,
  type SyncEntityType,
} from './db';

// Batas retry otomatis sebelum menyerah. Tanpa ini, item yang gagal permanen (mis.
// entity induk yang direferensikan tidak pernah berhasil sinkron) akan di-retry setiap
// interval SELAMANYA dan membanjiri console dengan error yang sama berulang-ulang.
const MAX_AUTO_RETRY_ATTEMPTS = 5;

export interface SyncBackend {
  upsert(entityType: SyncEntityType, payload: unknown): Promise<{ remoteId: string }>;
  fetchAll(entityType: SyncEntityType): Promise<unknown[]>;
}

const TABLE_NAME: Record<SyncEntityType, string> = {
  petani: 'petani',
  plot: 'plot',
  kartu: 'kartu',
  hashchain: 'hashchain',
  consent: 'consent',
  accessLog: 'access_log',
  notif: 'notif',
  petaniDocument: 'petani_document',
  transaksi: 'transaksi',
};

// Kolom yang benar-benar ada di tabel Supabase masing-masing (lihat
// docs/04_FULL_PRODUCTION_BLUEPRINT.md §2). Dipakai untuk menyaring payload sebelum
// upsert — field bookkeeping lokal (syncStatus/remoteId) dan field yang tidak relevan
// untuk tabel tertentu (mis. updated_at/agent_id di consent/access_log/notif) SENGAJA
// dibuang di sini supaya tidak menyebabkan error "column does not exist".
const ALLOWED_COLUMNS: Record<SyncEntityType, string[]> = {
  petani: [
    'id',
    'nama',
    'nik_hash',
    'telepon',
    'desa',
    'email',
    'registered_by_agent_id',
    'created_at',
    'updated_at',
    'agent_id',
  ],
  plot: [
    'id',
    'petani_id',
    'lat',
    'lng',
    'komoditas',
    'luas_estimasi_ha',
    'gps_accuracy_m',
    'captured_at',
    'updated_at',
    'agent_id',
    'boundary',
    'periode_produksi_mulai',
    'periode_produksi_selesai',
    'boundary_snapshot',
  ],
  kartu: [
    'id',
    'plot_id',
    'petani_id',
    'tier',
    'stdb_status',
    'alasan',
    'deforestasi',
    'hash_chain_ref',
    'created_at',
    'updated_at',
    'agent_id',
    'mitigasi_risiko',
    'mitigasi_risiko_updated_at',
  ],
  hashchain: ['id', 'index', 'timestamp', 'payload', 'data_hash', 'previous_hash', 'hash', 'agent_id'],
  consent: ['id', 'kartu_id', 'granted_to', 'scope', 'granted_at', 'revoked_at'],
  accessLog: ['id', 'kartu_id', 'accessed_by', 'authorized', 'timestamp', 'triggered_notif'],
  notif: ['id', 'message', 'kartu_id', 'severity', 'created_at', 'read'],
  petaniDocument: [
    'id',
    'petani_id',
    'type',
    'file_name',
    'file_hash',
    'file_size_bytes',
    'uploaded_at',
    'verified',
    'notes',
    'agent_id',
  ],
  transaksi: [
    'id',
    'komoditas',
    'wilayah',
    'grade',
    'harga_per_kg',
    'tanggal',
    'verified',
    'created_at',
    'agent_id',
  ],
};

function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

// Konversi baris mentah dari Supabase (kolom snake_case) balik ke bentuk camelCase yang
// dipakai src/types/index.ts — dipakai dashboard Eksportir (Sprint 13) yang baca
// langsung dari Supabase (bukan IndexedDB, sehingga tidak lewat lib/db.ts sama sekali).
export function fromSupabaseRow<T>(row: unknown): T {
  if (typeof row !== 'object' || row === null) return {} as T;
  const obj = row as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCase(key)] = value;
  }
  return result as T;
}

function toSupabaseRow(entityType: SyncEntityType, payload: unknown): Record<string, unknown> {
  if (typeof payload !== 'object' || payload === null) return {};
  const obj = payload as Record<string, unknown>;
  const allowed = new Set(ALLOWED_COLUMNS[entityType]);
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    if (allowed.has(snakeKey) && value !== undefined) {
      row[snakeKey] = value;
    }
  }
  return row;
}

export const supabaseBackend: SyncBackend = {
  async upsert(entityType, payload) {
    const client = getSupabaseClient();
    const table = TABLE_NAME[entityType];
    const row = toSupabaseRow(entityType, payload);
    const { data, error } = await client.from(table).upsert(row).select('id').single();
    if (error) {
      throw new Error(`Gagal sinkron ke Supabase (${table}): ${error.message}`);
    }
    return { remoteId: String((data as { id: unknown }).id) };
  },
  async fetchAll(entityType) {
    const client = getSupabaseClient();
    const table = TABLE_NAME[entityType];
    const { data, error } = await client.from(table).select('*');
    if (error) {
      throw new Error(`Gagal mengambil data dari Supabase (${table}): ${error.message}`);
    }
    return data ?? [];
  },
};

// Fallback tanpa network — dipakai kalau Supabase belum siap/bermasalah (lihat
// docs/04_FULL_PRODUCTION_BLUEPRINT.md §"Feasibility check"). Sengaja tidak menyimpan
// apa pun secara nyata; hanya membuat pushPendingSync() tidak macet menunggu Supabase.
export const mockLocalBackend: SyncBackend = {
  async upsert() {
    return { remoteId: `mock-${nanoid()}` };
  },
  async fetchAll() {
    return [];
  },
};

export interface PushResult {
  success: number;
  failed: number;
  gaveUp: number;
}

export async function pushPendingSync(backend: SyncBackend): Promise<PushResult> {
  const queue = await listSyncQueue();
  let success = 0;
  let failed = 0;
  let gaveUp = 0;

  for (const item of queue) {
    try {
      const { remoteId } = await backend.upsert(item.entityType, item.payload);
      await markSynced(item.entityType, item.entityId, remoteId);
      await removeSyncQueueItem(item.id);
      success++;
    } catch (err) {
      if (item.attempts + 1 >= MAX_AUTO_RETRY_ATTEMPTS) {
        // Menyerah: kemungkinan besar dependency-nya (mis. plot/petani/kartu induk)
        // tidak akan pernah berhasil sinkron (data orphan/rusak) — daripada retry
        // selamanya dan membanjiri console, hentikan di sini dan tandai jelas di UI.
        console.error(
          `[sync] menyerah setelah ${MAX_AUTO_RETRY_ATTEMPTS} percobaan untuk item`,
          item.id,
          item.entityType,
          err,
        );
        await markSyncConflict(item.entityType, item.entityId);
        await removeSyncQueueItem(item.id);
        gaveUp++;
      } else {
        console.error('[sync] gagal sinkron item', item.id, item.entityType, err);
        await incrementSyncAttempt(item.id);
        failed++;
      }
    }
  }

  return { success, failed, gaveUp };
}
