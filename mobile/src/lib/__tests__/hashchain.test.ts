import { appendEntry, GENESIS_HASH, verifyChain } from '../hashchain';
import type { HashChainEntry } from '../../types';

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
