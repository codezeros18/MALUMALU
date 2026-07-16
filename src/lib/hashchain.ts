import SHA256 from 'crypto-js/sha256';
import type { HashChainEntry, Kartu } from '../types';
import {
  addHashEntry,
  listHashEntries,
  getLastHashEntry,
  putHashEntryRaw,
  putKartu,
  enqueueSync,
  getDeviceAgentId,
} from './db';

const GENESIS_HASH = 'GENESIS';

export function sha256(input: string): string {
  return SHA256(input).toString();
}

// JSON.stringify biasa tidak menjamin urutan kunci stabil lintas-pemanggilan (tergantung
// urutan insersi objek). Di sini kunci diurutkan secara rekursif supaya payload yang sama
// secara semantik selalu menghasilkan dataHash yang sama persis.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`);
  return `{${entries.join(',')}}`;
}

export function computeDataHash(payload: unknown): string {
  return sha256(stableStringify(payload));
}

export function computeEntryHash(
  index: number,
  timestamp: number,
  dataHash: string,
  previousHash: string,
): string {
  return sha256(`${index}|${timestamp}|${dataHash}|${previousHash}`);
}

export async function appendEntry(payload: unknown): Promise<HashChainEntry> {
  const last = await getLastHashEntry();
  const previousHash = last ? last.hash : GENESIS_HASH;
  const index = last ? last.index + 1 : 0;
  const timestamp = Date.now();
  const dataHash = computeDataHash(payload);
  const hash = computeEntryHash(index, timestamp, dataHash, previousHash);
  const entry = await addHashEntry({
    index,
    timestamp,
    payload,
    dataHash,
    previousHash,
    hash,
    agentId: getDeviceAgentId(),
    syncStatus: 'local',
  });
  await enqueueSync('hashchain', entry.id, 'create', entry);
  return entry;
}

export interface VerifyChainResult {
  valid: boolean;
  brokenAtIndex: number | null;
}

// providedEntries opsional: dipakai dashboard Eksportir (Sprint 13) yang memverifikasi
// rantai dari data Supabase (bukan IndexedDB lokal). Kalau tidak diisi, perilaku persis
// seperti sebelumnya (fetch fresh dari IndexedDB via listHashEntries).
export async function verifyChain(providedEntries?: HashChainEntry[]): Promise<VerifyChainResult> {
  const entries = providedEntries
    ? [...providedEntries].sort((a, b) => a.index - b.index)
    : await listHashEntries(); // sudah terurut naik by-index
  let previousHash = GENESIS_HASH;

  for (const entry of entries) {
    const expectedDataHash = computeDataHash(entry.payload);
    const expectedHash = computeEntryHash(entry.index, entry.timestamp, expectedDataHash, previousHash);

    if (
      entry.previousHash !== previousHash ||
      entry.dataHash !== expectedDataHash ||
      entry.hash !== expectedHash
    ) {
      return { valid: false, brokenAtIndex: entry.index };
    }

    previousHash = entry.hash;
  }

  return { valid: true, brokenAtIndex: null };
}

// HANYA UNTUK DEMO tamper-evidence: menimpa payload entri tertentu TANPA menghitung ulang
// dataHash/hash, supaya verifyChain() sengaja mendeteksi rantai rusak. Jangan dipakai di
// alur produksi mana pun.
export async function simulateTamper(index: number, mutatedPayload: unknown): Promise<void> {
  const entries = await listHashEntries();
  const target = entries.find((entry) => entry.index === index);
  if (!target) {
    throw new Error(`Entri hash-chain index ${index} tidak ditemukan.`);
  }
  await putHashEntryRaw({ ...target, payload: mutatedPayload });
}

// HANYA UNTUK DEMO: kembalikan entri persis seperti sebelum di-tamper (dipakai tombol
// "Reset demo" di HashChainViewer).
export async function restoreEntry(entry: HashChainEntry): Promise<void> {
  await putHashEntryRaw(entry);
}

// Commit Kartu (hasil generateKartu Sprint 5) ke hash-chain + simpan versi final ke DB.
export async function commitKartu(kartu: Kartu): Promise<Kartu> {
  const entry = await appendEntry({ type: 'kartu', kartuId: kartu.id, snapshot: kartu });
  const committed: Kartu = { ...kartu, hashChainRef: entry.id };
  await putKartu(committed);
  return committed;
}
