// Parsing untuk webhook masuk WAHA — dipisah dari server HTTP agar teruji tanpa I/O.
export interface InboundMessage {
  telepon: string;
  body: string;
}

/**
 * Ekstrak { telepon, body } dari event webhook WAHA. Mengembalikan null untuk
 * event non-pesan, pesan keluar kita sendiri (fromMe, mencegah echo loop), atau
 * payload yang tidak lengkap.
 */
export function parseInboundWebhook(payload: unknown): InboundMessage | null {
  if (!payload || typeof payload !== 'object') return null;
  const event = (payload as Record<string, unknown>).event;
  if (event !== 'message') return null;

  const msg = (payload as Record<string, unknown>).payload;
  if (!msg || typeof msg !== 'object') return null;
  const { from, fromMe, body } = msg as Record<string, unknown>;
  if (fromMe) return null;
  if (typeof from !== 'string' || typeof body !== 'string') return null;

  const telepon = from.replace(/@.*/, '').replace(/\D/g, '');
  if (!telepon) return null;
  return { telepon, body };
}

/** Bot hanya merespons pesan yang diawali kata kunci "harga" agar tidak membalas semua chat. */
export function shouldRespond(body: string): boolean {
  return body.trim().toLowerCase().startsWith('harga');
}
