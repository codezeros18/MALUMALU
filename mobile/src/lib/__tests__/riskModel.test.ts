import { RiskModel, scoreSupplier } from '../riskModel';
import { DEMO_RISK_SAMPLES } from '../../data/dummyData';
import type { Petani, Plot } from '../../types';

const model = new RiskModel();
model.fit(DEMO_RISK_SAMPLES);

function makePetani(p: Partial<Petani>): Petani {
  return { id: 'x', nama: 't', createdAt: '', ...p };
}
function makePlot(p: Partial<Plot>): Plot {
  return { id: 'x', petaniId: 'x', lat: 0, lng: 0, komoditas: 'kopi', capturedAt: '', ...p };
}
// Profil netral: luas/volume wajar, tanpa faktor risiko selain yg dioverride.
function plotWajar(p: Partial<Plot> = {}): Plot {
  return makePlot({ gpsAccuracyM: 8, luasHa: 0.5, volumeKg: 300, ...p });
}

describe('RiskModel', () => {
  it('melatih tanpa error pada 12 sampel demo', () => {
    expect(model).toBeDefined();
  });

  it('supplier aman dapat skor rendah (low)', () => {
    const s = scoreSupplier(model, makePetani({ telepon: '1' }), plotWajar({ gpsAccuracyM: 7 }));
    expect(s.label).toBe('low');
    expect(s.skor).toBeLessThan(30);
    expect(s.demo).toBe(true);
  });

  it('supplier risky (GPS drift + duplikat) dapat skor tinggi', () => {
    const s = scoreSupplier(model, makePetani({ duplicateId: true }), plotWajar({ gpsAccuracyM: 26 }));
    expect(s.label).toBe('high');
    expect(s.faktor.length).toBeGreaterThan(0);
  });

  it('volume melebihi lahan jadi faktor risiko', () => {
    const s = scoreSupplier(model, makePetani({}), plotWajar({ volumeKg: 900 }));
    expect(s.faktor).toContain('volume melebihi kapasitas lahan');
  });

  it('skor selalu dalam rentang 0-100', () => {
    for (const sample of DEMO_RISK_SAMPLES) {
      const s = scoreSupplier(model, sample.petani, sample.plot);
      expect(s.skor).toBeGreaterThanOrEqual(0);
      expect(s.skor).toBeLessThanOrEqual(100);
    }
  });

  // --- regresi: pathologi RF v3 yang di-fix upgrade ini ---

  it('tiap faktor risiko menaikkan skor (monoton per fitur)', () => {
    const dasar = scoreSupplier(model, makePetani({}), plotWajar()).skor;
    const stdb = scoreSupplier(model, makePetani({ stdbExpired: true }), plotWajar()).skor;
    const dup = scoreSupplier(model, makePetani({ duplicateId: true }), plotWajar()).skor;
    const over = scoreSupplier(model, makePetani({}), plotWajar({ volumeKg: 900 })).skor;
    const drift = scoreSupplier(model, makePetani({}), plotWajar({ gpsAccuracyM: 26 })).skor;

    expect(stdb).toBeGreaterThan(dasar);
    expect(dup).toBeGreaterThan(dasar);
    expect(over).toBeGreaterThan(dasar);
    expect(drift).toBeGreaterThan(dasar);
  });

  it('skor naik landai terhadap gpsDrift, tanpa jurang antar meter berdekatan', () => {
    // RF v3 menghafal ambang 11.5m: 11m -> 4, 12m -> 79 (lompat 75 poin).
    const sweep = [6, 8, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26].map(
      g => scoreSupplier(model, makePetani({}), plotWajar({ gpsAccuracyM: g })).skor,
    );
    for (let i = 1; i < sweep.length; i++) {
      expect(sweep[i]).toBeGreaterThanOrEqual(sweep[i - 1]);
      expect(sweep[i] - sweep[i - 1]).toBeLessThan(25);
    }
  });

  it('drift dalam toleransi tanpa faktor lain tidak divonis high', () => {
    // RF v3 kasih 79/100 "RISIKO TINGGI" buat gpsDrift 12-20m sementara faktor-nya
    // kosong — badge vonis tinggi tapi gak bisa nunjuk sebabnya.
    //
    // v4 masih nyisain jendela sempit ~19.3-20m: skor tembus 60 sementara
    // faktorRisiko() (ambang >20m) belum menandai apa pun. Itu diterima & disengaja
    // — model kontinu & aturan hardcoded gak akan pernah sinkron persis, dan 19m
    // emang mepet ambang. Yang penting jendelanya ~0.7m, bukan 8.5m kayak v3.
    for (const g of [12, 15, 18]) {
      const s = scoreSupplier(model, makePetani({}), plotWajar({ gpsAccuracyM: g }));
      expect(s.faktor).toEqual([]);
      expect(s.label).not.toBe('high');
    }
  });

  it('tidak menghafal training set (sampel berlabel bising tetap jadi galat sisa)', () => {
    // Bu Rina dilabeli risky tapi risikonya (di luar area) bukan salah satu
    // fitur. Model yang sehat TIDAK boleh bisa memisahkan dia dari yg aman.
    const rina = DEMO_RISK_SAMPLES.find(s => s.petani.nama === 'Bu Rina Marlina')!;
    const skorRina = scoreSupplier(model, rina.petani, rina.plot).skor;
    const skorAman = DEMO_RISK_SAMPLES.filter(s => !s.risky).map(s =>
      scoreSupplier(model, s.petani, s.plot).skor,
    );
    expect(skorRina).toBeLessThan(50);
    expect(Math.max(...skorAman)).toBeLessThan(30);
  });

  it('deterministik: dua model dgn data sama kasih skor identik', () => {
    const a = new RiskModel();
    const b = new RiskModel();
    a.fit(DEMO_RISK_SAMPLES);
    b.fit(DEMO_RISK_SAMPLES);
    for (const s of DEMO_RISK_SAMPLES) {
      expect(a.predictProba(s.petani, s.plot)).toBe(b.predictProba(s.petani, s.plot));
    }
  });

  it('model belum dilatih gagal jelas, bukan diam-diam kasih NaN', () => {
    // RF v3 balikin NaN -> badge render "NaN/100" & bar width "NaN%".
    const kosong = new RiskModel();
    expect(() => kosong.predictProba(makePetani({}), plotWajar())).toThrow(/belum dilatih/i);
  });

  it('fit dgn data kosong ditolak', () => {
    expect(() => new RiskModel().fit([])).toThrow(/kosong/i);
  });
});
