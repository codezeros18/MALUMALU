import { sha256 } from 'js-sha256';
import type { HashChainEntry } from '../types';
import { getChain, setChain, withChainLock } from './db';

export const GENESIS_HASH = '0'.repeat(64);

function hashEntry(index: number, timestamp: string, dataHash: string, previousHash: string): string {
  return sha256(`${index}|${timestamp}|${dataHash}|${previousHash}`);
}

// JSON.stringify tidak menjamin urutan kunci stabil lintas-pemanggilan (tergantung urutan
// insersi objek) — kunci diurutkan rekursif supaya payload yang secara semantik sama selalu
// menghasilkan dataHash yang sama persis.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`;
}

function computeDataHash(payload: unknown): string {
  return sha256(stableStringify(payload));
}

export function appendEntry(chain: HashChainEntry[], data: unknown, timestamp: string): HashChainEntry[] {
  const index = chain.length;
  const previousHash = index === 0 ? GENESIS_HASH : chain[index - 1].hash;
  const dataHash = computeDataHash(data);
  return [
    ...chain,
    {
      index,
      timestamp,
      payload: data,
      dataHash,
      previousHash,
      hash: hashEntry(index, timestamp, dataHash, previousHash),
    },
  ];
}

// Baca-ubah-tulis pp.chain terkunci per-key (lihat db.ts withChainLock) — tanpa ini, dua
// commit yang hampir bersamaan (mis. dua submit plot beruntun cepat) bisa membaca array
// chain lama yang sama lalu saling menimpa tulisan satu sama lain, diam-diam menghapus
// entri yang baru saja ditambahkan panggilan pertama.
export async function commitEntry(data: unknown, timestamp: string): Promise<HashChainEntry[]> {
  return withChainLock(async () => {
    const chain = await getChain();
    const next = appendEntry(chain, data, timestamp);
    await setChain(next);
    return next;
  });
}

export interface VerifyResult {
  valid: boolean;
  brokenAt: number | null;
}

// Menghitung ulang dataHash dari payload entri (bukan sekadar membandingkan field
// dataHash/hash yang tersimpan satu sama lain) — supaya data yang diam-diam diubah
// langsung terdeteksi, bukan cuma inkonsistensi internal antar-field hash itu sendiri.
export function verifyChain(chain: HashChainEntry[]): VerifyResult {
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const expectedPrev = i === 0 ? GENESIS_HASH : chain[i - 1].hash;
    const expectedDataHash = computeDataHash(e.payload);
    if (
      e.previousHash !== expectedPrev ||
      e.dataHash !== expectedDataHash ||
      e.hash !== hashEntry(e.index, e.timestamp, e.dataHash, e.previousHash)
    ) {
      return { valid: false, brokenAt: i };
    }
  }
  return { valid: true, brokenAt: null };
}
