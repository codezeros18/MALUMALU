import { sha256 } from 'js-sha256';
import type { HashChainEntry } from '../types';

export const GENESIS_HASH = '0'.repeat(64);

function hashEntry(index: number, timestamp: string, dataHash: string, previousHash: string): string {
  return sha256(`${index}|${timestamp}|${dataHash}|${previousHash}`);
}

export function appendEntry(chain: HashChainEntry[], data: unknown, timestamp: string): HashChainEntry[] {
  const index = chain.length;
  const previousHash = index === 0 ? GENESIS_HASH : chain[index - 1].hash;
  const dataHash = sha256(JSON.stringify(data));
  return [
    ...chain,
    { index, timestamp, dataHash, previousHash, hash: hashEntry(index, timestamp, dataHash, previousHash) },
  ];
}

export interface VerifyResult {
  valid: boolean;
  brokenAt: number | null;
}

export function verifyChain(chain: HashChainEntry[]): VerifyResult {
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const expectedPrev = i === 0 ? GENESIS_HASH : chain[i - 1].hash;
    if (e.previousHash !== expectedPrev || e.hash !== hashEntry(e.index, e.timestamp, e.dataHash, e.previousHash)) {
      return { valid: false, brokenAt: i };
    }
  }
  return { valid: true, brokenAt: null };
}
