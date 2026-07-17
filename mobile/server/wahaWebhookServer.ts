// SERVER WEBHOOK WAHA — proses independen (bukan bagian bundle Expo) yang
// menerima event pesan masuk dari WAHA dan membalas otomatis lewat bot harga.
// Jalankan: npm run waha:webhook (lihat README bagian "Layanan Harga (WA Bot)").
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { handlePriceMessage } from '../src/lib/harga/bot';
import { SAMPLE_PRICE_SOURCES } from '../src/lib/harga/prices';
import { sendText, toChatId } from '../src/lib/waha';
import { parseInboundWebhook, shouldRespond, readBody, PayloadTooLargeError } from './webhookParser';
import { lookupPasporByPhoneSupabase } from './pasporLookupSupabase';
import { fetchTransaksiPriceSources } from './transaksiSource';
import { isSupabaseConfigured } from './supabaseRest';
import type { PriceSource } from '../src/lib/harga/types';

const PORT = Number(process.env.WEBHOOK_PORT) || 3001;

// Sumber harga: coba data transaksi NYATA (Sprint 20, via Supabase) dulu — fallback ke
// SAMPLE_PRICE_SOURCES (berlabel DATA DEMO secara eksplisit di komentar prices.ts) kalau
// Supabase belum dikonfigurasi, fetch gagal, atau tabel masih kosong. Tidak pernah
// mengklaim data sample sebagai data nyata (prinsip Sprint 20: agregat transparan atau
// jujur berlabel demo, bukan overclaim).
async function resolvePriceSources(): Promise<{ sources: PriceSource[]; isDemo: boolean }> {
  if (!isSupabaseConfigured()) {
    return { sources: SAMPLE_PRICE_SOURCES, isDemo: true };
  }
  try {
    const real = await fetchTransaksiPriceSources();
    if (real.length === 0) {
      return { sources: SAMPLE_PRICE_SOURCES, isDemo: true };
    }
    return { sources: real, isDemo: false };
  } catch (e) {
    console.error('wahaWebhookServer: gagal ambil transaksi dari Supabase, fallback ke DATA DEMO', e);
    return { sources: SAMPLE_PRICE_SOURCES, isDemo: true };
  }
}

// Nudge "Paspor lengkap": lookup lewat Supabase (server standalone ini tidak bisa
// menjangkau AsyncStorage milik app Expo — lihat pasporLookupSupabase.ts). Fail-soft:
// kalau Supabase belum dikonfigurasi atau lookup gagal, bot tetap balas harga TANPA
// nudge, bukan gagal total.
async function resolvePasporLookup(telepon: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    return await lookupPasporByPhoneSupabase(telepon);
  } catch (e) {
    console.error('wahaWebhookServer: lookup Paspor gagal (fail-soft, balas tanpa nudge)', e);
    return null;
  }
}

async function handleWebhook(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let raw: string;
  try {
    raw = await readBody(req);
  } catch (e) {
    if (e instanceof PayloadTooLargeError) {
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'payload too large' }));
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'bad request' }));
    }
    return;
  }

  // Balas WAHA lebih dulu (WAHA tidak menunggu balasan kita untuk lanjut).
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const inbound = parseInboundWebhook(payload);
  if (!inbound || !shouldRespond(inbound.body)) return;

  const [{ sources, isDemo }, pasporStatus] = await Promise.all([
    resolvePriceSources(),
    resolvePasporLookup(inbound.telepon),
  ]);
  if (isDemo) {
    console.info('wahaWebhookServer: membalas dengan DATA DEMO (belum ada transaksi terverifikasi nyata)');
  }

  const reply = handlePriceMessage(inbound.body, inbound.telepon, sources, () => pasporStatus);
  try {
    await sendText(toChatId(inbound.telepon), reply.text);
  } catch (e) {
    console.error('wahaWebhookServer: gagal membalas', e);
  }
}

createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    handleWebhook(req, res).catch((e) => console.error('wahaWebhookServer: error', e));
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => {
  console.log(`WAHA webhook server listening on :${PORT} (POST /webhook)`);
});
