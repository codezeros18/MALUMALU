// WAHA client — kirim notifikasi WhatsApp ke petani (PROTOTIPE).
//
// Konteks: JejakHijau notif engine (consent.ts) memicu ini saat akses
// tak-terotorisasi terdeteksi. Petani gaptek tetap kejangkau lewat WA yang
// sudah dipakai sehari-hari.
//
// JUJUR / batasan (buat pitch & juri):
// - WAHA pakai protokol WhatsApp Web, BUKAN WhatsApp Business API resmi.
//   Risiko ban kalau scale-up -> produksi ganti ke WA Business API resmi.
// - Kirim WA butuh internet. Core app offline; notif WA butuh sinyal.
// - Semua call di sini fail-soft: kalau WAHA mati, app & banner tetap jalan.

const BASE_URL = import.meta.env.VITE_WAHA_BASE_URL ?? 'http://localhost:3000';
const SESSION = import.meta.env.VITE_WAHA_SESSION ?? 'default';
const API_KEY = import.meta.env.VITE_WAHA_API_KEY ?? '';
const ENABLED = (import.meta.env.VITE_WAHA_ENABLED ?? 'false') === 'true';

export function isWahaEnabled(): boolean {
  return ENABLED;
}

// Nomor WA harus format internasional, angka saja, tanpa "+" di awal
// (WAHA expect "62812xxxx"). Normalize dari input bebas.
export function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 8) return null;
  // Indonesia: "08..." -> "628..."; "62..." tetap; "+62" sudah dibersih.
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return digits; // negara lain: biarkan apa adanya
}

interface WahaSendResult {
  sent: boolean;
  reason?: string;
}

// Kirim pesan teks ke satu nomor. Fail-soft: return { sent:false } bukan throw.
export async function sendWhatsAppText(
  phone: string,
  message: string,
): Promise<WahaSendResult> {
  if (!ENABLED) return { sent: false, reason: 'disabled' };

  const chatId = normalizePhone(phone);
  if (!chatId) return { sent: false, reason: 'invalid-phone' };

  try {
    const res = await fetch(`${BASE_URL}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'X-Api-Key': API_KEY } : {}),
      },
      // timeout 5s biar demo nggak hang kalau WAHA lenyap
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        session: SESSION,
        chatId: `${chatId}@c.us`,
        text: message,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('[WAHA] send gagal', res.status, body);
      return { sent: false, reason: `http-${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    // Network error / timeout / WAHA mati -> jangan crash app.
    console.warn('[WAHA] send error (fail-soft)', err);
    return { sent: false, reason: 'network' };
  }
}

// Template pesan notif ke petani (bahasa Indonesia, jelas & singkat).
export function buildUnauthorizedAccessMessage(
  petaniNama: string,
  accessedBy: string,
): string {
  return [
    `🚨 JejakHijau — PERINGATAN`,
    `Data kebun Anda (${petaniNama}) baru saja dicoba diakses oleh "${accessedBy}" TANPA izin.`,
    `Ini bukan Anda? Segera hubungi petugas koperasi/penyuluh pendamping.`,
    `Jangan bagikan KTP atau data kebun ke pihak tak dikenal.`,
  ].join('\n');
}
