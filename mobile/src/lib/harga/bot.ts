// BOT HARGA WHATSAPP — parsing pesan masuk petani & memformat balasan.
// Format balasan mengikuti brief: rentang + rata-rata + jumlah transaksi
// terverifikasi + nudge STDB+GPS + link cek status Paspor.
import { getReferencePrice, todayIso } from './aggregate';
import { normalize } from './aggregate';
import type { Komoditas, PriceSource, PriceReply, Wilayah } from './types';

/** Skema deep-link status Paspor (dibuka di app mobile) — dari env EXPO_PUBLIC_STATUS_SCHEME
 * (lihat .env.example), bukan hardcode, supaya build lain (mis. custom scheme/dev client)
 * bisa override tanpa ubah kode. */
export const STATUS_LINK_SCHEME = process.env.EXPO_PUBLIC_STATUS_SCHEME || 'pasporpetani://status';

export interface PasporStatus {
  /** Dokumen lengkap = STDB + GPS tersedia. */
  lengkap: boolean;
  tier: 'lokal' | 'export_ready';
}

/** Fungsi injeksi: bot meminta status Paspor berdasar nomor petani. */
export type PasporLookup = (telepon: string) => PasporStatus | null;

const KOMODITAS_ALIAS: Record<string, Komoditas> = {
  kopi: 'kopi',
  coffee: 'kopi',
  sawit: 'sawit',
  palm: 'sawit',
};

/**
 * Parse "harga kopi Pangalengan" -> { komoditas, wilayah }.
 * Pola: "harga" diikuti komoditas lalu wilayah (sisa kalimat).
 * Mengembalikan null bila tak diawali "harga".
 */
export function parsePriceQuery(
  message: string,
): { komoditas: Komoditas; wilayah: Wilayah } | null {
  // Normalisasi hanya untuk pencocokan; wilayah dipertahankan dalam huruf
  // asli agar tampil sebagai nama wilayah yang benar (Pangalengan, bukan pangalengan).
  const m = normalize(message);
  if (!m.startsWith('harga')) return null;
  const rest = m.slice('harga'.length).trim();
  if (rest.length === 0) return null;

  const parts = rest.split(' ');
  const komAlias = parts[0];
  const komoditas = KOMODITAS_ALIAS[komAlias] ?? komAlias;
  const wilayah = message.trim().slice('harga'.length).trim().split(' ').slice(1).join(' ').trim();
  if (!wilayah) return null;
  return { komoditas, wilayah };
}

function formatRp(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function buildReplyText(
  komoditas: Komoditas,
  wilayah: Wilayah,
  ref: { low: number; high: number; avg: number; txnCount: number },
  paspor: PasporStatus | null,
  telepon: string,
): string {
  const namaKomoditas = komoditas === 'kopi' ? 'kopi cherry' : komoditas;
  const lines = [
    `📊 Harga referensi ${namaKomoditas}, ${wilayah} (update hari ini):`,
    `${formatRp(ref.low)} - ${formatRp(ref.high)}/kg (rata-rata ${formatRp(ref.avg)})`,
    `Berdasarkan ${ref.txnCount} transaksi terverifikasi minggu ini.`,
  ];

  if (paspor) {
    // Menyertakan telepon di query string agar status.tsx tahu petani mana yang dicari.
    const statusLink = `${STATUS_LINK_SCHEME}?telepon=${encodeURIComponent(telepon)}`;
    if (paspor.lengkap) {
      lines.push(
        '',
        'Petani dengan Paspor lengkap (STDB+GPS) biasanya dapat harga di kisaran atas. Cek status dokumenmu:',
        statusLink,
      );
    } else {
      lines.push(
        '',
        'Lengkapi Paspor (STDB+GPS) untuk memperoleh harga di kisaran atas. Cek status dokumenmu:',
        statusLink,
      );
    }
  }
  return lines.join('\n');
}

/**
 * Proses pesan masuk petani. `lookup` opsional: bila diberikan dan nomor
 * dikenali, balasan menyertakan nudge STDB+GPS. Mengembalikan PriceReply
 * dengan `found=false` bila tak ada data terverifikasi.
 */
export function handlePriceMessage(
  message: string,
  telepon: string,
  sources: PriceSource[],
  lookup?: PasporLookup,
  today: string = todayIso(),
): PriceReply {
  const query = parsePriceQuery(message);
  if (!query) {
    return {
      found: false,
      text: 'Ketik "harga [komoditas] [wilayah]" — contoh: harga kopi Pangalengan.',
    };
  }

  const ref = getReferencePrice(sources, query.komoditas, query.wilayah, today);
  if (!ref) {
    return {
      found: false,
      text: `Belum ada data harga terverifikasi untuk ${query.komoditas} di ${query.wilayah}. Coba wilayah lain atau cek lagi besok.`,
    };
  }

  const paspor = lookup ? lookup(telepon) : null;
  return { found: true, text: buildReplyText(query.komoditas, query.wilayah, ref, paspor, telepon) };
}
