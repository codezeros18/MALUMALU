# Paspor Petani Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Expo/Android app running the full 6-step Paspor Petani demo (farmer → plot → deforestation check → tiered card → tamper-evident hash-chain → consent/notif), fully offline, in the "Paspor" theme.

**Architecture:** Expo managed workflow + expo-router tabs. Pure logic lives in `src/lib/*` (mirrors the MALUMALU website blueprint's contracts so files can be copied between projects), UI in `src/components/*` + `app/(tabs)/*`, storage in AsyncStorage behind `src/lib/db.ts`.

**Tech Stack:** Expo SDK (latest), TypeScript, expo-router, AsyncStorage, js-sha256 (pure-JS SHA-256 — sync + Jest-testable; supersedes the spec's expo-crypto mention), expo-location, react-native-maps, @react-native-community/netinfo, @expo-google-fonts (Plus Jakarta Sans, Lora, Space Mono), jest-expo.

## Global Constraints

- All UI text in Indonesian. Big touch targets (≥48dp), high contrast.
- Offline-first: every core flow must work in airplane mode (map tiles exempt — fallback grid picker exists).
- Palette (exact): cover `#1F5C3A`, action `#2E7D4F`, paper `#F7F3E8`, ink `#26241F`; semantic ok/warn/alert per `src/theme/tokens.ts` in Task 2.
- Disclosure fine print (verbatim, on Kartu): "Peta risiko: JRC GFC2020, akurasi ~91%, commission error ~18% (kebun kopi bernaung bisa terbaca hutan). Titik lokasi point-primary (GPS di bawah kanopi meleset 3–11 m). Rantai verifikasi = hash-chain (bukan blockchain). Data demo berlabel."
- Demo raster and seeded farmers are always labeled "DATA DEMO".
- Commits: conventional format `<type>: <description>`, no attribution footer (user setting).
- Cut order if time runs out: Task 10 (consent/notif) → Task 9's map (keep GPS + grid picker) → polish. Tasks 1–8 are never cut.

---

### Task 1: Scaffold + dependencies + test harness

**Files:**
- Create: entire Expo scaffold at repo root (app/, package.json, tsconfig.json, app.json, …)
- Create: `jest.setup.js`
- Modify: `package.json` (test script + jest preset), `app.json` (identity + colors)

**Interfaces:**
- Produces: a bootable Expo app (`npx expo start`) and a runnable Jest harness (`npm test`).

- [ ] **Step 1: Verify environment** — `node -v` (need ≥18) and `git status` (repo exists with docs commit).
- [ ] **Step 2: Scaffold into temp dir and merge** (create-expo-app refuses non-empty dirs):

```bash
cd ~/Projects/paspor-petani-mobile
npx create-expo-app@latest scaffold-tmp --template default --no-install
rsync -a --exclude .git scaffold-tmp/ .
rm -rf scaffold-tmp
npm install
npm run reset-project   # default template script: moves example code to app-example/, leaves blank app/
rm -rf app-example
```

- [ ] **Step 3: Install dependencies**

```bash
npx expo install expo-location @react-native-async-storage/async-storage react-native-maps @react-native-community/netinfo expo-font
npm install js-sha256 @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/lora @expo-google-fonts/space-mono
npm install -D jest jest-expo @types/jest
```

- [ ] **Step 4: Wire Jest** — in `package.json` add `"test": "jest"` to scripts plus:

```json
"jest": { "preset": "jest-expo", "setupFiles": ["<rootDir>/jest.setup.js"] }
```

`jest.setup.js`:

```js
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

- [ ] **Step 5: App identity** — in `app.json` set `"name": "Paspor Petani"`, `"slug": "paspor-petani"`, `"android": { "package": "com.malumalu.pasporpetani", "adaptiveIcon": { "backgroundColor": "#1F5C3A" } }`, splash `backgroundColor` `#1F5C3A`.
- [ ] **Step 6: Verify** — `npm test` runs (0 tests is fine, must not error on config); `npx expo start` boots and shows QR (then kill it).
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: scaffold expo app with deps and jest harness"`

### Task 2: Types, theme tokens, fonts, 4-tab shell

**Files:**
- Create: `src/types/index.ts`, `src/theme/tokens.ts`
- Create: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx` (Lapangan stub), `app/(tabs)/kartu.tsx` (stub), `app/(tabs)/rantai.tsx` (stub), `app/(tabs)/izin.tsx` (stub)

**Interfaces:**
- Produces: all shared types (below, verbatim — every later task imports from `src/types`), `colors`/`fonts` tokens, and a navigable 4-tab app.

- [ ] **Step 1: Write `src/types/index.ts`** (contract — identical shape to website blueprint):

```ts
export type Tier = 'lokal' | 'export_ready';
export type StdbStatus = 'lengkap' | 'belum_lengkap';
export type DeforestasiStatus = 'aman' | 'terindikasi' | 'di_luar_area';

export interface Petani { id: string; nama: string; desa?: string; telepon?: string; createdAt: string; }
export interface Plot { id: string; petaniId: string; lat: number; lng: number; komoditas: string; gpsAccuracyM?: number; capturedAt: string; }
export interface DeforestasiCheck { status: DeforestasiStatus; cellValue: number | null; source: string; catatan: string; }
export interface Kartu {
  id: string; petaniId: string; plotId: string;
  tier: Tier; stdbStatus: StdbStatus; alasan: string[];
  deforestasi: DeforestasiCheck; overrideManual: boolean; createdAt: string;
}
export interface HashChainEntry { index: number; timestamp: string; dataHash: string; previousHash: string; hash: string; }
export interface ConsentRecord { id: string; kartuId: string; pihak: string; granted: boolean; updatedAt: string; }
export interface AccessLog { id: string; kartuId: string; pihak: string; authorized: boolean; timestamp: string; }
export interface NotifItem { id: string; pesan: string; severity: 'info' | 'alert'; read: boolean; createdAt: string; }
```

- [ ] **Step 2: Write `src/theme/tokens.ts`**:

```ts
export const colors = {
  cover: '#1F5C3A', action: '#2E7D4F', paper: '#F7F3E8', card: '#FFFDF6',
  ink: '#26241F', inkMuted: '#6B675C', line: '#DED8C8',
  ok: '#2E7D4F', okBg: '#E3EFE5', warn: '#B7791F', warnBg: '#F8EDD8',
  alert: '#B3261E', alertBg: '#F9E2DF', onCover: '#F7F3E8',
};
export const fonts = {
  ui: 'PlusJakartaSans_400Regular', uiMedium: 'PlusJakartaSans_500Medium', uiBold: 'PlusJakartaSans_700Bold',
  display: 'Lora_600SemiBold', mono: 'SpaceMono_400Regular',
};
```

- [ ] **Step 3: Root layout** `app/_layout.tsx` — load fonts with `useFonts` (from each @expo-google-fonts package + `Lora_600SemiBold`, `SpaceMono_400Regular`), render `<Stack screenOptions={{ headerShown: false }} />` once loaded (null while loading).
- [ ] **Step 4: Tabs layout** `app/(tabs)/_layout.tsx` — `<Tabs>` with 4 screens: `index` "Lapangan" (🌱/map icon), `kartu` "Kartu", `rantai` "Rantai", `izin` "Izin". Style: `tabBarActiveTintColor: colors.cover`, header shown with `headerStyle: { backgroundColor: colors.cover }`, `headerTintColor: colors.onCover`, `headerTitle: 'Paspor Petani'`, `sceneStyle/contentStyle` background `colors.paper`. Use `@expo/vector-icons` Ionicons for tab icons.
- [ ] **Step 5: Stub screens** — each screen file renders a centered `<Text>` with its name on `colors.paper` background.
- [ ] **Step 6: Verify** — `npx expo start`, check 4 tabs render with green header/cream body on device or just confirm bundling succeeds without errors.
- [ ] **Step 7: Commit** — `git commit -m "feat: types, paspor theme tokens, fonts, 4-tab shell"`

### Task 3: Data layer (`db.ts`) — TDD

**Files:**
- Create: `src/lib/db.ts`
- Test: `src/lib/__tests__/db.test.ts`

**Interfaces:**
- Produces: `newId(): string`; per collection (Petani, Plot, Kartu, ConsentRecord, AccessLog, NotifItem, HashChainEntry): `getPetani(): Promise<Petani[]>`, `addPetani(p: Petani): Promise<void>` (same pattern: `getPlots/addPlot`, `getKartus/addKartu/updateKartu(k: Kartu)`, `getConsents/upsertConsent(c: ConsentRecord)`, `getAccessLogs/addAccessLog`, `getNotifs/addNotif/markNotifRead(id: string)`, `getChain(): Promise<HashChainEntry[]>/setChain(entries: HashChainEntry[])`); `clearAllData(): Promise<void>`.

- [ ] **Step 1: Write failing tests** — `src/lib/__tests__/db.test.ts`:

```ts
import { addPetani, getPetani, updateKartu, addKartu, getKartus, clearAllData, newId, markNotifRead, addNotif, getNotifs } from '../db';
import type { Kartu, Petani } from '../../types';

const petani = (over: Partial<Petani> = {}): Petani =>
  ({ id: newId(), nama: 'Bu Sari', desa: 'Margamukti', telepon: '0812', createdAt: '2026-07-16T00:00:00Z', ...over });

beforeEach(() => clearAllData());

test('addPetani then getPetani returns saved record', async () => {
  const p = petani();
  await addPetani(p);
  expect(await getPetani()).toEqual([p]);
});

test('updateKartu replaces by id without mutating others', async () => {
  const base: Kartu = { id: 'k1', petaniId: 'p1', plotId: 'pl1', tier: 'lokal', stdbStatus: 'belum_lengkap', alasan: [], deforestasi: { status: 'aman', cellValue: 0, source: 's', catatan: 'c' }, overrideManual: false, createdAt: 'now' };
  await addKartu(base);
  await addKartu({ ...base, id: 'k2' });
  await updateKartu({ ...base, tier: 'export_ready' });
  const all = await getKartus();
  expect(all.find(k => k.id === 'k1')?.tier).toBe('export_ready');
  expect(all.find(k => k.id === 'k2')?.tier).toBe('lokal');
});

test('markNotifRead flips read flag', async () => {
  await addNotif({ id: 'n1', pesan: 'x', severity: 'alert', read: false, createdAt: 'now' });
  await markNotifRead('n1');
  expect((await getNotifs())[0].read).toBe(true);
});
```

- [ ] **Step 2: Run** `npm test -- db` → FAIL (module not found).
- [ ] **Step 3: Implement `src/lib/db.ts`** — generic core + typed wrappers:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AccessLog, ConsentRecord, HashChainEntry, Kartu, NotifItem, Petani, Plot } from '../types';

const KEYS = {
  petani: 'pp.petani', plot: 'pp.plot', kartu: 'pp.kartu', chain: 'pp.chain',
  chainBackup: 'pp.chain.backup', consent: 'pp.consent', accessLog: 'pp.accessLog', notif: 'pp.notif',
} as const;

async function readAll<T>(key: string): Promise<T[]> {
  try { const raw = await AsyncStorage.getItem(key); return raw ? (JSON.parse(raw) as T[]) : []; }
  catch (e) { console.error('db.readAll', key, e); return []; }
}
async function writeAll<T>(key: string, items: T[]): Promise<void> {
  try { await AsyncStorage.setItem(key, JSON.stringify(items)); }
  catch (e) { console.error('db.writeAll', key, e); throw new Error('Gagal menyimpan data. Coba lagi.'); }
}
async function append<T>(key: string, item: T): Promise<void> {
  const items = await readAll<T>(key);
  await writeAll(key, [...items, item]);
}

export function newId(): string { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

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
  await writeAll(KEYS.consent, exists ? all.map(x => (x.kartuId === c.kartuId && x.pihak === c.pihak ? c : x)) : [...all, c]);
}
export const getAccessLogs = () => readAll<AccessLog>(KEYS.accessLog);
export const addAccessLog = (a: AccessLog) => append(KEYS.accessLog, a);
export const getNotifs = () => readAll<NotifItem>(KEYS.notif);
export const addNotif = (n: NotifItem) => append(KEYS.notif, n);
export async function markNotifRead(id: string): Promise<void> {
  const all = await getNotifs();
  await writeAll(KEYS.notif, all.map(n => (n.id === id ? { ...n, read: true } : n)));
}
export const getChain = () => readAll<HashChainEntry>(KEYS.chain);
export const setChain = (entries: HashChainEntry[]) => writeAll(KEYS.chain, entries);
export const getChainBackup = () => readAll<HashChainEntry>(KEYS.chainBackup);
export const setChainBackup = (entries: HashChainEntry[]) => writeAll(KEYS.chainBackup, entries);
export async function clearAllData(): Promise<void> { await AsyncStorage.multiRemove(Object.values(KEYS)); }
```

- [ ] **Step 4: Run** `npm test -- db` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: asyncstorage data layer with typed collection helpers"`

### Task 4: Geospatial — demo raster + `cekDeforestasi` — TDD

**Files:**
- Create: `scripts/gen-raster.js`, `src/data/pangalengan.json` (generated), `src/lib/geospatial.ts`
- Test: `src/lib/__tests__/geospatial.test.ts`

**Interfaces:**
- Produces: `cekDeforestasi(lat: number, lng: number): DeforestasiCheck`. Raster format (documented for the website team's real JRC file to swap in): `{ source: string, bbox: {latMin,latMax,lngMin,lngMax}, rows: number, cols: number, cells: number[][] }` where cell value 1 = deforestation indicated post-2020, 0 = clear. Row 0 = north edge.

- [ ] **Step 1: Generator** `scripts/gen-raster.js` (run once: `node scripts/gen-raster.js`):

```js
const fs = require('fs');
const rows = 20, cols = 20;
const cells = Array.from({ length: rows }, (_, r) =>
  Array.from({ length: cols }, (_, c) =>
    (r < 5 && c >= 14) || (r >= 12 && r <= 14 && c >= 3 && c <= 6) ? 1 : 0
  )
);
const raster = {
  source: 'JRC GFC2020 (DATA DEMO — ilustratif)',
  bbox: { latMin: -7.25, latMax: -7.05, lngMin: 107.52, lngMax: 107.72 },
  rows, cols, cells,
};
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/pangalengan.json', JSON.stringify(raster));
console.log('wrote src/data/pangalengan.json');
```

- [ ] **Step 2: Failing tests** `src/lib/__tests__/geospatial.test.ts`:

```ts
import { cekDeforestasi } from '../geospatial';

test('center of Pangalengan is aman', () => {
  const r = cekDeforestasi(-7.15, 107.62);
  expect(r.status).toBe('aman'); expect(r.cellValue).toBe(0);
});
test('northeast risk cluster is terindikasi', () => {
  expect(cekDeforestasi(-7.07, 107.69).status).toBe('terindikasi');
});
test('outside bbox is di_luar_area with null cell', () => {
  const r = cekDeforestasi(-6.2, 106.8);
  expect(r.status).toBe('di_luar_area'); expect(r.cellValue).toBeNull();
});
test('exact edge coordinates clamp into grid, not crash', () => {
  expect(() => cekDeforestasi(-7.05, 107.72)).not.toThrow();
});
```

- [ ] **Step 3: Run** `npm test -- geospatial` → FAIL.
- [ ] **Step 4: Implement `src/lib/geospatial.ts`**:

```ts
import raster from '../data/pangalengan.json';
import type { DeforestasiCheck } from '../types';

export const DISCLOSURE =
  'Peta risiko: JRC GFC2020, akurasi ~91%, commission error ~18% (kebun kopi bernaung bisa terbaca hutan). ' +
  'Titik lokasi point-primary (GPS di bawah kanopi meleset 3–11 m). Rantai verifikasi = hash-chain (bukan blockchain). Data demo berlabel.';

export function cekDeforestasi(lat: number, lng: number): DeforestasiCheck {
  const { bbox, rows, cols, cells, source } = raster;
  if (lat < bbox.latMin || lat > bbox.latMax || lng < bbox.lngMin || lng > bbox.lngMax) {
    return { status: 'di_luar_area', cellValue: null, source, catatan: DISCLOSURE };
  }
  const row = Math.min(rows - 1, Math.max(0, Math.floor(((bbox.latMax - lat) / (bbox.latMax - bbox.latMin)) * rows)));
  const col = Math.min(cols - 1, Math.max(0, Math.floor(((lng - bbox.lngMin) / (bbox.lngMax - bbox.lngMin)) * cols)));
  const value = cells[row][col];
  return { status: value === 1 ? 'terindikasi' : 'aman', cellValue: value, source, catatan: DISCLOSURE };
}
```

- [ ] **Step 5: Run** `npm test -- geospatial` → PASS. **Commit** `feat: demo risk raster and offline point-in-raster check`.

### Task 5: Rule engine — TDD

**Files:**
- Create: `src/lib/ruleEngine.ts`
- Test: `src/lib/__tests__/ruleEngine.test.ts`

**Interfaces:**
- Consumes: `DeforestasiCheck`, `Petani`, `Plot` types.
- Produces: `evaluateKartu(petani: Petani, plot: Plot, cek: DeforestasiCheck): { tier: Tier; stdbStatus: StdbStatus; alasan: string[] }`.

- [ ] **Step 1: Failing tests** — matrix:

```ts
import { evaluateKartu } from '../ruleEngine';
import type { DeforestasiCheck, Petani, Plot } from '../../types';

const petani = (o: Partial<Petani> = {}): Petani => ({ id: 'p', nama: 'Bu Sari', desa: 'Margamukti', telepon: '0812', createdAt: 't', ...o });
const plot = (o: Partial<Plot> = {}): Plot => ({ id: 'pl', petaniId: 'p', lat: -7.15, lng: 107.62, komoditas: 'kopi', gpsAccuracyM: 8, capturedAt: 't', ...o });
const cek = (status: DeforestasiCheck['status']): DeforestasiCheck => ({ status, cellValue: status === 'terindikasi' ? 1 : 0, source: 's', catatan: 'c' });

test('aman + complete data + good gps => export_ready / lengkap', () => {
  const r = evaluateKartu(petani(), plot(), cek('aman'));
  expect(r.tier).toBe('export_ready'); expect(r.stdbStatus).toBe('lengkap');
});
test('terindikasi forces lokal even with complete data', () => {
  expect(evaluateKartu(petani(), plot(), cek('terindikasi')).tier).toBe('lokal');
});
test('missing telepon => belum_lengkap + lokal, reason mentions data', () => {
  const r = evaluateKartu(petani({ telepon: undefined }), plot(), cek('aman'));
  expect(r.tier).toBe('lokal'); expect(r.stdbStatus).toBe('belum_lengkap');
  expect(r.alasan.join(' ')).toMatch(/belum lengkap/i);
});
test('gps accuracy > 20m forces lokal with point-primary reason', () => {
  const r = evaluateKartu(petani(), plot({ gpsAccuracyM: 35 }), cek('aman'));
  expect(r.tier).toBe('lokal'); expect(r.alasan.join(' ')).toMatch(/akurasi gps/i);
});
test('di_luar_area forces lokal', () => {
  expect(evaluateKartu(petani(), plot(), cek('di_luar_area')).tier).toBe('lokal');
});
```

- [ ] **Step 2: Run → FAIL. Step 3: Implement `src/lib/ruleEngine.ts`**:

```ts
import type { DeforestasiCheck, Petani, Plot, StdbStatus, Tier } from '../types';

export interface RuleResult { tier: Tier; stdbStatus: StdbStatus; alasan: string[]; }

export function evaluateKartu(petani: Petani, plot: Plot, cek: DeforestasiCheck): RuleResult {
  const alasan: string[] = [];
  if (cek.status === 'aman') alasan.push('Bebas indikasi deforestasi pasca-2020 (peta risiko, data demo)');
  else if (cek.status === 'terindikasi') alasan.push('Terindikasi deforestasi pasca-2020 pada peta risiko');
  else alasan.push('Plot di luar cakupan peta risiko');

  const dataLengkap = Boolean(petani.nama && petani.desa && petani.telepon && plot.komoditas);
  alasan.push(dataLengkap ? 'Data petani lengkap (siap STDB)' : 'Data petani belum lengkap (desa/telepon kosong)');

  const gpsOk = plot.gpsAccuracyM === undefined || plot.gpsAccuracyM <= 20;
  if (!gpsOk) alasan.push(`Akurasi GPS rendah (${plot.gpsAccuracyM} m > 20 m, point-primary)`);

  const stdbStatus: StdbStatus = dataLengkap ? 'lengkap' : 'belum_lengkap';
  const tier: Tier = cek.status === 'aman' && dataLengkap && gpsOk ? 'export_ready' : 'lokal';
  return { tier, stdbStatus, alasan };
}
```

- [ ] **Step 4: Run → PASS. Step 5: Commit** `feat: stdb rule engine with tier decision and reasons`.

### Task 6: Hash-chain — TDD

**Files:**
- Create: `src/lib/hashchain.ts`
- Test: `src/lib/__tests__/hashchain.test.ts`

**Interfaces:**
- Produces: `GENESIS_HASH: string`; `appendEntry(chain: HashChainEntry[], data: unknown, timestamp: string): HashChainEntry[]` (returns NEW array); `verifyChain(chain: HashChainEntry[]): { valid: boolean; brokenAt: number | null }`.

- [ ] **Step 1: Failing tests**:

```ts
import { appendEntry, verifyChain, GENESIS_HASH } from '../hashchain';
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
```

- [ ] **Step 2: Run → FAIL. Step 3: Implement `src/lib/hashchain.ts`**:

```ts
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
  return [...chain, { index, timestamp, dataHash, previousHash, hash: hashEntry(index, timestamp, dataHash, previousHash) }];
}

export function verifyChain(chain: HashChainEntry[]): { valid: boolean; brokenAt: number | null } {
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const expectedPrev = i === 0 ? GENESIS_HASH : chain[i - 1].hash;
    if (e.previousHash !== expectedPrev || e.hash !== hashEntry(e.index, e.timestamp, e.dataHash, e.previousHash)) {
      return { valid: false, brokenAt: i };
    }
  }
  return { valid: true, brokenAt: null };
}
```

- [ ] **Step 4: Run → PASS. Step 5: Commit** `feat: tamper-evident sha-256 hash chain`.

### Task 7: Orchestrator + demo seed + Kartu screen

**Files:**
- Create: `src/lib/prosesPlot.ts`, `src/data/dummyData.ts`, `src/components/KartuCard.tsx`, `src/components/Badge.tsx`
- Modify: `app/(tabs)/kartu.tsx`, `app/(tabs)/index.tsx` (seed + reset buttons on the stub)
- Test: `src/lib/__tests__/prosesPlot.test.ts`

**Interfaces:**
- Consumes: db helpers, `cekDeforestasi`, `evaluateKartu`, `appendEntry`.
- Produces: `prosesPlotBaru(input: { nama: string; desa?: string; telepon?: string; komoditas: string; lat: number; lng: number; gpsAccuracyM?: number }): Promise<Kartu>` — creates Petani+Plot+Kartu, appends chain entry, persists all. `seedDummyData(): Promise<number>` (seeds 3 farmers if petani collection empty; returns count seeded, 0 if skipped).

- [ ] **Step 1: Failing test** (orchestrator persists everything and chains grow):

```ts
import { prosesPlotBaru } from '../prosesPlot';
import { clearAllData, getChain, getKartus, getPetani, getPlots } from '../db';

beforeEach(() => clearAllData());

test('prosesPlotBaru persists petani, plot, kartu and appends chain entry', async () => {
  const kartu = await prosesPlotBaru({ nama: 'Bu Sari', desa: 'Margamukti', telepon: '0812', komoditas: 'kopi', lat: -7.15, lng: 107.62, gpsAccuracyM: 8 });
  expect(kartu.tier).toBe('export_ready');
  expect(await getPetani()).toHaveLength(1);
  expect(await getPlots()).toHaveLength(1);
  expect(await getKartus()).toHaveLength(1);
  expect(await getChain()).toHaveLength(1);
});
```

- [ ] **Step 2: Run → FAIL. Step 3: Implement `src/lib/prosesPlot.ts`**:

```ts
import { addKartu, addPetani, addPlot, getChain, newId, setChain } from './db';
import { cekDeforestasi } from './geospatial';
import { evaluateKartu } from './ruleEngine';
import { appendEntry } from './hashchain';
import type { Kartu, Petani, Plot } from '../types';

export interface PlotInput { nama: string; desa?: string; telepon?: string; komoditas: string; lat: number; lng: number; gpsAccuracyM?: number; }

export async function prosesPlotBaru(input: PlotInput): Promise<Kartu> {
  const now = new Date().toISOString();
  const petani: Petani = { id: newId(), nama: input.nama, desa: input.desa, telepon: input.telepon, createdAt: now };
  const plot: Plot = { id: newId(), petaniId: petani.id, lat: input.lat, lng: input.lng, komoditas: input.komoditas, gpsAccuracyM: input.gpsAccuracyM, capturedAt: now };
  const cek = cekDeforestasi(input.lat, input.lng);
  const rule = evaluateKartu(petani, plot, cek);
  const kartu: Kartu = { id: newId(), petaniId: petani.id, plotId: plot.id, ...rule, deforestasi: cek, overrideManual: false, createdAt: now };
  await addPetani(petani); await addPlot(plot); await addKartu(kartu);
  await setChain(appendEntry(await getChain(), { kartuId: kartu.id, tier: kartu.tier, stdbStatus: kartu.stdbStatus, lat: plot.lat, lng: plot.lng }, now));
  return kartu;
}
```

`src/data/dummyData.ts` — 3 farmers, DATA DEMO labeled: Bu Sari (complete, safe cell −7.15/107.62 → export_ready), Pak Dedi (no telepon, safe −7.16/107.60 → lokal), Bu Rina (complete but risk cell −7.07/107.69 → lokal). `seedDummyData()` no-ops (returns 0) when `getPetani()` non-empty; otherwise runs the three through `prosesPlotBaru` and returns 3.

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Kartu UI** — `Badge.tsx` (rounded pill, variant ok/warn/alert using token bg+fg). `KartuCard.tsx`: passport data page on `colors.card` with `colors.line` hairline border; Lora heading "PASPOR PETANI · KARTU DATA"; ruled rows (label mono-small muted / value uiBold): Nama, Desa, Telepon, Komoditas, Koordinat (5-decimal), Akurasi GPS; rotated stamp-style tier badge ("EXPORT-READY" ok / "LOKAL" warn, thick 2px border, slight `transform: rotate(-6deg)`); deforestasi status badge; alasan bullet list; "DATA DEMO" small alert-outline badge; `catatan` fine print (11px, inkMuted). `app/(tabs)/kartu.tsx`: `useFocusEffect` loads kartus+petani+plots, renders FlatList of KartuCard (latest first), empty-state text "Belum ada kartu. Tandai plot di tab Lapangan atau muat data demo."
- [ ] **Step 6: Seed buttons on Lapangan stub** — "Muat Data Demo" (action bg) calls `seedDummyData()` + alert with count; "Hapus Semua Data" (alert-outline, `Alert.alert` confirm) calls `clearAllData()`.
- [ ] **Step 7: Verify on device** — seed → Kartu tab shows 3 passport cards with correct tiers. **Commit** `feat: plot orchestrator, demo seed, passport kartu screen`.

### Task 8: Rantai screen — chain viewer + tamper demo

**Files:**
- Create: `src/components/HashChainViewer.tsx`
- Modify: `app/(tabs)/rantai.tsx`

**Interfaces:**
- Consumes: `getChain/setChain/getChainBackup/setChainBackup`, `verifyChain`.

- [ ] **Step 1: Implement viewer** — loads chain on focus. Header row: "Verifikasi Rantai" button → runs `verifyChain`, shows result banner: ok "✅ Rantai utuh (N entri)" green / alert "⛔ Rantai RUSAK di entri #X" red. Entry list: mono text, each card shows `#index`, timestamp, `dataHash` (first 16 chars + …), `previousHash` (16 + …), `hash` (16 + …); entries ≥ brokenAt tinted `alertBg` after a failed verify.
- [ ] **Step 2: Tamper simulation** — "🧪 Simulasi Ubah Data" button: backs up chain (`setChainBackup`), then writes chain with middle entry's `dataHash` replaced by `sha256('data-diubah-diam-diam')`, re-runs verify (→ broken, red). "↩️ Pulihkan Data" button restores from backup, re-verifies (→ green). Buttons disabled when chain empty; helper text explains what's happening in one sentence each.
- [ ] **Step 3: Verify on device** — seed data → Rantai: verify green → tamper → red at correct index → restore → green. This is the money moment; rehearse it twice. **Commit** `feat: hash chain viewer with tamper simulation`.

### Task 9: Lapangan — map picker, GPS, plot form, full save flow

**Files:**
- Create: `src/hooks/useOnlineStatus.ts`, `src/components/MapPicker.tsx`, `src/components/GridPicker.tsx`, `src/components/PlotForm.tsx`
- Modify: `app/(tabs)/index.tsx` (replace stub: picker + form + saved plot list + seed/reset buttons)

**Interfaces:**
- Consumes: `prosesPlotBaru`, `getPlots`, raster bbox from `src/data/pangalengan.json`.
- Produces: `useOnlineStatus(): boolean` (NetInfo listener). `MapPicker`/`GridPicker` props: `{ plots: Plot[]; selected: { lat: number; lng: number } | null; onPick(lat: number, lng: number): void }`.

- [ ] **Step 1: `useOnlineStatus`** — `NetInfo.addEventListener`, state defaults true, returns `isConnected && isInternetReachable !== false`.
- [ ] **Step 2: `MapPicker`** — `react-native-maps` `<MapView>` (height ~300, initialRegion lat -7.15 lng 107.62, latitudeDelta 0.08), `onPress` → `onPick(coordinate)`, `<Marker>` per saved plot (green pin) + selected point (default pin). Overlay translucent chip "Tap peta untuk memilih titik plot".
- [ ] **Step 3: `GridPicker` (offline fallback)** — a `Pressable` `View` (height 300, paper bg, thin grid lines drawn as absolutely-positioned Views every 10%), `onPress` uses `event.nativeEvent.locationX/Y` ÷ layout size → interpolate into raster bbox → `onPick(lat, lng)`. Saved plots + selected point rendered as absolutely-positioned dots via inverse interpolation. Label: "Mode offline — grid Pangalengan (peta dasar butuh internet)".
- [ ] **Step 4: `PlotForm`** — fields: Nama petani (required), Desa, Telepon, Komoditas (default "kopi"); shows selected coordinate (or "Belum ada titik — tap peta / pakai GPS"); "📍 Pakai GPS" button → `getCurrentPosition()` from `src/lib/gps.ts` (implement here):

```ts
import * as Location from 'expo-location';
export interface GpsFix { lat: number; lng: number; accuracyM: number | null; }
export async function getCurrentPosition(): Promise<GpsFix> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Izin lokasi ditolak. Tap peta untuk memilih titik.');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy ?? null };
}
```

Show accuracy; if > 20 m show warn note "Akurasi rendah di bawah kanopi (point-primary)". GPS errors render as an inline warn banner (never crash). "Simpan Plot" (large, action bg, ≥48dp) disabled until nama + coordinate present → `prosesPlotBaru(...)` → success `Alert.alert('Tersimpan', 'Kartu dibuat: tier <TIER>')` → clear form → `router.push('/kartu')`.
- [ ] **Step 5: Assemble screen** — `ScrollView`: `useOnlineStatus() ? MapPicker : GridPicker` (plus a small manual toggle "Pakai grid offline" so the fallback is always demoable), PlotForm, saved plots list (nama — koordinat — tier via kartu lookup), seed/reset buttons from Task 7 moved to bottom.
- [ ] **Step 6: Verify on device** — tap map → form → simpan → alert → Kartu tab has new card; chain grew by 1 in Rantai; GPS button fills coordinates; airplane mode → grid picker appears and full save still works. **Commit** `feat: lapangan screen with map/grid picker, gps, and full save flow`.

### Task 10: Izin — consent, access log, notifications, override

**Files:**
- Create: `src/lib/consent.ts`, `src/components/NotifBanner.tsx`
- Modify: `app/(tabs)/izin.tsx`, `app/(tabs)/_layout.tsx` (mount NotifBanner above tabs), `src/components/KartuCard.tsx` (override button)
- Test: `src/lib/__tests__/consent.test.ts`

**Interfaces:**
- Produces: `setConsent(kartuId: string, pihak: string, granted: boolean): Promise<void>`; `simulateAccess(kartuId: string, pihak: string): Promise<{ authorized: boolean }>` — writes AccessLog; when unauthorized also writes NotifItem (severity 'alert', pesan mentions pihak + kartu owner); `overrideKartu(kartu: Kartu): Promise<Kartu>` — flips tier, sets `overrideManual: true`, appends alasan "Override manual oleh petugas", appends chain entry, persists via `updateKartu`.

- [ ] **Step 1: Failing tests**:

```ts
import { setConsent, simulateAccess, overrideKartu } from '../consent';
import { clearAllData, getAccessLogs, getChain, getKartus, getNotifs } from '../db';
import { prosesPlotBaru } from '../prosesPlot';

beforeEach(() => clearAllData());
const seed = () => prosesPlotBaru({ nama: 'Bu Sari', desa: 'D', telepon: '08', komoditas: 'kopi', lat: -7.15, lng: 107.62, gpsAccuracyM: 5 });

test('access with consent is authorized, no notif', async () => {
  const k = await seed();
  await setConsent(k.id, 'Koperasi', true);
  expect((await simulateAccess(k.id, 'Koperasi')).authorized).toBe(true);
  expect(await getNotifs()).toHaveLength(0);
  expect(await getAccessLogs()).toHaveLength(1);
});
test('access without consent logs unauthorized and raises alert notif', async () => {
  const k = await seed();
  expect((await simulateAccess(k.id, 'Eksportir X')).authorized).toBe(false);
  const notifs = await getNotifs();
  expect(notifs).toHaveLength(1); expect(notifs[0].severity).toBe('alert');
});
test('override flips tier, marks manual, extends chain', async () => {
  const k = await seed();
  const before = (await getChain()).length;
  const after = await overrideKartu(k);
  expect(after.tier).toBe('lokal'); expect(after.overrideManual).toBe(true);
  expect((await getKartus())[0].overrideManual).toBe(true);
  expect((await getChain()).length).toBe(before + 1);
});
```

- [ ] **Step 2: Run → FAIL. Step 3: Implement `src/lib/consent.ts`** (uses `upsertConsent`, `getConsents`, `addAccessLog`, `addNotif`, `updateKartu`, `getChain/setChain`, `appendEntry`, `newId`; petani name looked up via `getPetani` for the notif message: `Akses TIDAK berizin oleh "<pihak>" ke kartu <nama petani>`). Run → PASS.
- [ ] **Step 4: Izin screen** — kartu selector (chips per kartu: petani name), per selected kartu: consent toggles for fixed pihak list `['Koperasi', 'Dinas Pertanian', 'Eksportir X']` (Switch + label), buttons "Simulasi Akses Berizin" (uses first granted pihak or Koperasi) and "🚨 Simulasi Akses Tak-Berizin" (uses a pihak with no/revoked consent), AccessLog list below (timestamp, pihak, ✅ berizin / ⛔ tak-berizin).
- [ ] **Step 5: `NotifBanner`** — mounted in `(tabs)/_layout.tsx` above `<Tabs>`; polls `getNotifs()` every 3 s; renders newest unread alert as a red banner (pesan + "Tandai dibaca" → `markNotifRead`). Nothing rendered when no unread.
- [ ] **Step 6: Override button on KartuCard** — "Override Manual (petugas)" secondary button → `overrideKartu` → refresh list. Verify all flows on device. **Commit** `feat: consent panel, access log, alert notifications, manual override`.

### Task 11: Offline indicator, polish, rehearsal

**Files:**
- Create: `src/components/OfflineIndicator.tsx`, `DEMO.md`
- Modify: `app/(tabs)/_layout.tsx` (headerRight), any screen needing polish

**Interfaces:**
- Consumes: `useOnlineStatus`.

- [ ] **Step 1: OfflineIndicator** — headerRight chip: online → "🟢 Online" subtle; offline → "🔴 Offline (mode lapangan)" on `alertBg`. Offline framed as a feature.
- [ ] **Step 2: Polish pass** — consistent spacing (16/24), fonts applied everywhere (no default font leaks), button press states (`opacity`/`android_ripple`), FlatList empty states, keyboard-avoiding on the form.
- [ ] **Step 3: Full test suite** — `npm test` → all green.
- [ ] **Step 4: `DEMO.md`** — the 6-step rehearsal script: (0) airplane mode ON, open app, note 🔴 indicator; (1) Muat Data Demo; (2) Lapangan: tap grid → form → Simpan → tier alert; (3) Kartu: passport cards, point at disclosure fine print; (4) Rantai: verify green → Simulasi Ubah Data → red → Pulihkan → green; (5) Izin: revoke consent → Simulasi Akses Tak-Berizin → red banner appears → mark read; (6) Kartu: Override Manual → tier flips, chain grew. Include reset instructions (Hapus Semua Data) between rehearsals.
- [ ] **Step 5: Run the rehearsal on a real Android phone in airplane mode.** Fix anything that breaks.
- [ ] **Step 6: Commit** `feat: offline indicator, polish, demo script` — then optionally push to GitHub / EAS build if time remains.
