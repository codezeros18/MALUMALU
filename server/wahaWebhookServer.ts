// SERVER WEBHOOK WAHA — proses independen (bukan bagian bundle Expo) yang
// menerima event pesan masuk dari WAHA dan membalas otomatis lewat bot harga.
// Jalankan: npm run waha:webhook (lihat README bagian "Layanan Harga (WA Bot)").
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { handlePriceMessage } from '../src/lib/harga/bot';
import { SAMPLE_PRICE_SOURCES } from '../src/lib/harga/prices';
import { sendText, toChatId } from '../src/lib/waha';
import { parseInboundWebhook, shouldRespond } from './webhookParser';

const PORT = Number(process.env.WEBHOOK_PORT) || 3001;
// Payload webhook WAHA (pesan teks + metadata) biasanya beberapa KB; 100kb
// jauh lebih dari cukup dan mencegah body tak terbatas (memory exhaustion).
const MAX_BODY_BYTES = 100 * 1024;

class PayloadTooLargeError extends Error {}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = '';
    let bytes = 0;
    let rejected = false;
    req.on('data', chunk => {
      if (rejected) return; // sudah ditolak — biarkan sisa data mengalir & drop, jangan putus socket
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        rejected = true;
        reject(new PayloadTooLargeError());
        return;
      }
      raw += chunk;
    });
    req.on('end', () => { if (!rejected) resolve(raw); });
    req.on('error', reject);
  });
}

async function handleWebhook(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let raw: string;
  try {
    raw = await readBody(req);
  } catch (e) {
    const status = e instanceof PayloadTooLargeError ? 413 : 400;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e instanceof PayloadTooLargeError ? 'Payload too large' : 'Bad request' }));
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

  // NB: tanpa lookup Paspor — server ini tidak bisa membaca AsyncStorage milik
  // app mobile. Lihat pasporLookup.ts untuk catatan penggantian ke datastore
  // platform saat bot berjalan di backend terpisah.
  const reply = handlePriceMessage(inbound.body, inbound.telepon, SAMPLE_PRICE_SOURCES);
  try {
    await sendText(toChatId(inbound.telepon), reply.text);
  } catch (e) {
    console.error('wahaWebhookServer: gagal membalas', e);
  }
}

createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    handleWebhook(req, res).catch(e => console.error('wahaWebhookServer: error', e));
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => {
  console.log(`WAHA webhook server listening on :${PORT} (POST /webhook)`);
});
