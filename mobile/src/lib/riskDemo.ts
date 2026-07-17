// Helper demo: latih RiskModel SEKALI (cached) pakai data dummy berlabel buatan,
// lalu expose scoreSupplier. Ini supaya UI bisa tampilin skor tanpa retrain tiap render.
//
// JUJUR: model dilatih data DEMO (12 sampel buatan), bukan operasional brako.
// Field `demo: true` di RiskScore menandai itu.
import { RiskModel, scoreSupplier } from './riskModel';
import { DEMO_RISK_SAMPLES } from '../data/dummyData';
import type { Petani, Plot, RiskScore } from '../types';

let cached: RiskModel | null = null;

function getModel(): RiskModel {
  if (!cached) {
    cached = new RiskModel();
    cached.fit(DEMO_RISK_SAMPLES);
  }
  return cached;
}

export function scoreSupplierDemo(petani: Petani, plot: Plot): RiskScore {
  return scoreSupplier(getModel(), petani, plot);
}
