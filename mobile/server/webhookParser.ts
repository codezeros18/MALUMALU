// Parsing untuk webhook masuk WAHA — dipisah dari server HTTP agar teruji tanpa I/O.
export interface InboundMessage {
  telepon: string;
  body: string;
}

/**
 * Ekstrak { telepon, body } dari event webhook WAHA. Mengembalikan null untuk
 * event non-pesan, pesan keluar kita sendiri (fromMe, mencegah echo loop), pesan
 * grup (@g.us — lihat catatan di bawah), atau payload yang tidak lengkap.
 */
export function parseInboundWebhook(payload: unknown): InboundMessage | null {
  if (!payload || typeof payload !== 'object') return null;
  const event = (payload as Record<string, unknown>).event;
  if (event !== 'message') return null;

  const msg = (payload as Record<string, unknown>).payload;
  if (!msg || typeof msg !== 'object') return null;
  const { from, fromMe, body } = msg as Record<string, unknown>;
  // Cek ketat === true (bukan truthy JS biasa) — nilai fromMe yang malformed/tipe
  // lain (mis. string non-boolean dari payload webhook yang tidak terduga) tidak
  // boleh diam-diam membuat SEMUA pesan ter-skip.
  if (fromMe === true) return null;
  if (typeof from !== 'string' || typeof body !== 'string') return null;
  // Abaikan pesan grup — JID grup WAHA berakhiran "@g.us". Tanpa cek ini, baris di
  // bawah men-strip suffix "@g.us" lalu memperlakukan ID grup sebagai "nomor telepon"
  // yang salah (bot mencoba balas ke chatId hasil parse yang keliru, bukan menolak).
  if (from.endsWith('@g.us')) return null;

  const telepon = from.replace(/@.*/, '').replace(/\D/g, '');
  if (!telepon) return null;
  return { telepon, body };
}

/** Bot hanya merespons pesan yang diawali kata kunci "harga" agar tidak membalas semua chat. */
export function shouldRespond(body: string): boolean {
  return body.trim().toLowerCase().startsWith('harga');
}

// Batas ukuran body request webhook — cegah memory exhaustion/DoS dari payload raksasa
// yang sengaja/tidak sengaja dikirim ke endpoint publik ini. 100KB jauh lebih besar dari
// event pesan WAHA normal (biasanya beberapa ratus byte - beberapa KB).
export const MAX_WEBHOOK_BODY_BYTES = 100 * 1024;

export class PayloadTooLargeError extends Error {
  constructor() {
    super('Payload webhook melebihi batas ukuran');
    this.name = 'PayloadTooLargeError';
  }
}

// Tipe struktural minimal (bukan import 'http') supaya fungsi ini bisa diuji dengan
// stream palsu (EventEmitter biasa) tanpa request HTTP sungguhan — konsisten dengan
// filosofi file ini "testable without real I/O".
interface ReadableLike {
  on(event: 'data', listener: (chunk: Buffer | string) => void): unknown;
  on(event: 'end', listener: () => void): unknown;
  on(event: 'error', listener: (err: Error) => void): unknown;
  pause?(): void;
}

/**
 * Akumulasi body request sampai `end`, tolak (reject PayloadTooLargeError) begitu
 * ukuran melebihi `maxBytes` — pemanggil (wahaWebhookServer.ts) bertanggung jawab
 * membalas HTTP 413 saat error ini ditangkap.
 *
 * SENGAJA tidak memanggil req.destroy() saat batas terlampaui — request & response
 * berbagi socket TCP yang sama; men-destroy request akan ikut mematikan socket
 * SEBELUM 413 sempat ditulis, sehingga klien cuma lihat connection reset mentah,
 * bukan error HTTP yang jelas. Cukup berhenti mengakumulasi (dijaga flag `rejected`,
 * mencegah memory growth) dan pause stream — koneksi ditutup wajar setelah pemanggil
 * menulis & mengakhiri response 413.
 */
export function readBody(req: ReadableLike, maxBytes = MAX_WEBHOOK_BODY_BYTES): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = '';
    let bytes = 0;
    let rejected = false;
    req.on('data', (chunk) => {
      if (rejected) return;
      bytes += Buffer.byteLength(chunk);
      if (bytes > maxBytes) {
        rejected = true;
        req.pause?.();
        reject(new PayloadTooLargeError());
        return;
      }
      raw += chunk;
    });
    req.on('end', () => {
      if (!rejected) resolve(raw);
    });
    req.on('error', (err) => {
      if (!rejected) reject(err);
    });
  });
}
