import { appendEntry, commitEntry, GENESIS_HASH, verifyChain } from '../hashchain';
import { clearAllData, getChain } from '../db';
import type { HashChainEntry } from '../../types';

beforeEach(() => clearAllData());

function buildChain(n: number): HashChainEntry[] {
  let chain: HashChainEntry[] = [];
  for (let i = 0; i < n; i++) chain = appendEntry(chain, { i }, `2026-07-16T0${i}:00:00Z`);
  return chain;
}

test('3-entry chain links previousHash and verifies valid', () => {
  const chain = buildChain(3);
  expect(chain[0].previousHash).toBe(GENESIS_HASH);
  expect(chain[2].previousHash).toBe(chain[1].hash);
  expect(verifyChain(chain)).toEqual({ valid: true, brokenAt: null });
});

test('tampering entry 1 dataHash breaks chain at index 1', () => {
  const chain = buildChain(3);
  const tampered = chain.map((e, i) => (i === 1 ? { ...e, dataHash: 'deadbeef' } : e));
  expect(verifyChain(tampered)).toEqual({ valid: false, brokenAt: 1 });
});

test('empty chain is valid', () => {
  expect(verifyChain([])).toEqual({ valid: true, brokenAt: null });
});

test('appendEntry does not mutate input chain', () => {
  const chain = buildChain(2);
  const before = chain.length;
  appendEntry(chain, { x: 1 }, 't');
  expect(chain.length).toBe(before);
});

test('appendEntry stores the payload on the entry', () => {
  const chain = appendEntry([], { kartuId: 'k1', tier: 'lokal' }, 't0');
  expect(chain[0].payload).toEqual({ kartuId: 'k1', tier: 'lokal' });
});

test('silently editing an entry payload (e.g. flipping a Kartu tier) is caught, not just editing dataHash/hash directly', () => {
  // This is the exact scenario the mobile hash-chain used to miss: verifyChain only
  // checked that dataHash/hash/previousHash were mutually consistent with each other,
  // never that dataHash still matched the actual data. Editing payload alone (leaving
  // the old dataHash/hash untouched, as a real tamper would) must now break the chain.
  const chain = appendEntry([], { kartuId: 'k1', tier: 'lokal' }, 't0');
  const tampered = chain.map((e) => ({ ...e, payload: { ...(e.payload as object), tier: 'export_ready' } }));
  expect(verifyChain(tampered)).toEqual({ valid: false, brokenAt: 0 });
});

test('dataHash is order-independent (stable stringify) so semantically identical payloads never falsely break the chain', () => {
  const a = appendEntry([], { tier: 'lokal', kartuId: 'k1' }, 't0');
  const b = appendEntry([], { kartuId: 'k1', tier: 'lokal' }, 't0');
  expect(a[0].dataHash).toBe(b[0].dataHash);
});

test('commitEntry persists to storage and links previousHash across calls', async () => {
  await commitEntry({ i: 0 }, 't0');
  await commitEntry({ i: 1 }, 't1');
  const chain = await getChain();
  expect(chain).toHaveLength(2);
  expect(chain[1].previousHash).toBe(chain[0].hash);
  expect(verifyChain(chain)).toEqual({ valid: true, brokenAt: null });
});

test('concurrent commitEntry calls do not silently drop chain entries (read-modify-write race)', async () => {
  await Promise.all([
    commitEntry({ i: 0 }, 't0'),
    commitEntry({ i: 1 }, 't1'),
    commitEntry({ i: 2 }, 't2'),
  ]);
  const chain = await getChain();
  expect(chain).toHaveLength(3);
  expect(verifyChain(chain)).toEqual({ valid: true, brokenAt: null });
});
