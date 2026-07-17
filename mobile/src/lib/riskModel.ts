// Risk scoring supplier (v4) — regresi logistik + L2, pure TS, deterministik.
//
// JUJUR: model ini dilatih pada DATA DEMO berlabel buatan (~12 sampel), bukan
// data operasional brako/Ankop Trace. Akurasi hanya berlaku di data training.
// Untuk production butuh data historis berlabel asli. Output bertanda `demo: true`.
//
// Kenapa pindah dari random forest (v3) ke regresi logistik?
// Di 12 sampel, pohon keputusan menghafal training set. v3 menaruh ambang di
// gpsDrift 11.5m semata buat memisahkan Bu Rina (gpsAccuracyM 12m, dilabeli
// risky padahal sebabnya di luar area — bukan salah satu dari 4 fitur di bawah).
// Akibatnya 11m -> skor 4 tapi 12m -> skor 79, dan gpsDrift 12-20m divonis
// "risiko tinggi" walau faktorRisiko() belum menandai apa pun (ambangnya 20m).
// Regresi logistik monoton per fitur: skor naik landai, dan sampel berlabel
// bising jadi galat sisa — bukan ambang hafalan.
import type { Petani, Plot, RiskScore } from '../types';

export interface SupplierSample {
  petani: Petani;
  plot: Plot;
  // label buatan: true = risky (high/medium), false = aman (low)
  risky: boolean;
}

const YIELD_PER_HA = 700; // kg/ha, ambang wajar cherry kopi

// Hyperparameter training. Full-batch gradient descent dari bobot nol, jumlah
// iterasi tetap → deterministik, tanpa Math.random di mana pun.
const LEARNING_RATE = 0.1;
const ITERATIONS = 2000;
// L2 relatif kuat: sampel cuma 12 & nyaris terpisah sempurna, tanpa penalti ini
// bobot lari ke tak hingga (persis overfit yg mau dihindari).
const L2_LAMBDA = 1;
// Di bawah ini fitur dianggap konstan di training → jangan dibagi (hindari /0).
const VARIANCE_EPSILON = 1e-9;

// Ekstrak fitur numerik dari 1 supplier.
function extractFeatures(p: Petani, plot: Plot): number[] {
  const gpsDrift = plot.gpsAccuracyM ?? 0;
  const stdbExpired = p.stdbExpired ? 1 : 0;
  const duplicateId = p.duplicateId ? 1 : 0;
  const luas = plot.luasHa ?? 0;
  const volume = plot.volumeKg ?? 0;
  // rasio volume vs kapasitas lahan; >0 = suspicious (klaim lebih besar dr wajar)
  const overVolume = luas > 0 ? Math.max(0, volume / (luas * YIELD_PER_HA) - 1) : 0;
  return [gpsDrift, stdbExpired, duplicateId, overVolume];
}

// Skala tiap fitur ke mean 0 / std 1. Wajib: gpsDrift berkisar 6-26 sementara
// sisanya 0-1, tanpa penyetaraan gradient descent-nya pincang & L2 menghukum
// fitur berskala kecil jauh lebih berat.
interface Scaler {
  mean: number[];
  std: number[];
}

function fitScaler(rows: number[][]): Scaler {
  const n = rows.length;
  const dim = rows[0].length;
  const mean = Array.from({ length: dim }, (_, j) => rows.reduce((s, r) => s + r[j], 0) / n);
  const std = Array.from({ length: dim }, (_, j) => {
    const variance = rows.reduce((s, r) => s + (r[j] - mean[j]) ** 2, 0) / n;
    // Fitur konstan → std 1: nilai training jadi 0, bobotnya tetap 0 (gradient
    // selalu 0), jadi kontribusinya nol tanpa risiko Infinity/NaN.
    return variance > VARIANCE_EPSILON ? Math.sqrt(variance) : 1;
  });
  return { mean, std };
}

function standardize(feats: number[], scaler: Scaler): number[] {
  return feats.map((v, j) => (v - scaler.mean[j]) / scaler.std[j]);
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export class RiskModel {
  private weights: number[] | null = null;
  private bias = 0;
  private scaler: Scaler | null = null;

  fit(samples: SupplierSample[]): void {
    if (samples.length === 0) {
      throw new Error('RiskModel.fit: data training kosong');
    }
    const rows = samples.map(s => extractFeatures(s.petani, s.plot));
    const labels = samples.map(s => (s.risky ? 1 : 0));
    const scaler = fitScaler(rows);
    const scaled = rows.map(r => standardize(r, scaler));

    const n = samples.length;
    const dim = rows[0].length;
    const weights = new Array<number>(dim).fill(0); // init nol → deterministik
    let bias = 0;

    for (let iter = 0; iter < ITERATIONS; iter++) {
      const gradW = new Array<number>(dim).fill(0);
      let gradB = 0;
      for (let i = 0; i < n; i++) {
        const z = scaled[i].reduce((s, v, j) => s + v * weights[j], bias);
        const error = sigmoid(z) - labels[i];
        for (let j = 0; j < dim; j++) gradW[j] += error * scaled[i][j];
        gradB += error;
      }
      // L2 hanya di bobot, bias tidak dihukum (praktik standar: bias cuma
      // menggeser base rate, mengecilkannya malah bikin model bias ke 50/50).
      for (let j = 0; j < dim; j++) {
        weights[j] -= LEARNING_RATE * (gradW[j] / n + (L2_LAMBDA * weights[j]) / n);
      }
      bias -= LEARNING_RATE * (gradB / n);
    }

    this.weights = weights;
    this.bias = bias;
    this.scaler = scaler;
  }

  // prob risky 0..1
  predictProba(petani: Petani, plot: Plot): number {
    if (!this.weights || !this.scaler) {
      throw new Error('RiskModel.predictProba: model belum dilatih, panggil fit() dulu');
    }
    const feats = standardize(extractFeatures(petani, plot), this.scaler);
    const z = feats.reduce((s, v, j) => s + v * this.weights![j], this.bias);
    return sigmoid(z);
  }
}

function faktorRisiko(p: Petani, plot: Plot): string[] {
  const f: string[] = [];
  if ((plot.gpsAccuracyM ?? 0) > 20) f.push(`GPS drift ${plot.gpsAccuracyM}m (>20m)`);
  if (p.stdbExpired) f.push('STDB expired');
  if (p.duplicateId) f.push('identitas duplikat');
  const luas = plot.luasHa ?? 0;
  if (luas > 0 && plot.volumeKg && plot.volumeKg > luas * YIELD_PER_HA) {
    f.push('volume melebihi kapasitas lahan');
  }
  return f;
}

export function scoreSupplier(model: RiskModel, petani: Petani, plot: Plot): RiskScore {
  const proba = model.predictProba(petani, plot);
  const skor = Math.round(proba * 100);
  const label: RiskScore['label'] = skor >= 60 ? 'high' : skor >= 30 ? 'medium' : 'low';
  return { skor, label, faktor: faktorRisiko(petani, plot), demo: true };
}
