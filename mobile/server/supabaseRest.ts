// KLIEN SUPABASE REST MINIMAL — dipakai HANYA oleh mobile/server/ (proses Node
// standalone, terpisah dari bundle Expo, lihat wahaWebhookServer.ts). Sengaja fetch()
// polos, bukan @supabase/supabase-js penuh, supaya server webhook ini tetap ringan
// (dependency minimal, sesuai desain aslinya). App mobile itu sendiri MASIH sepenuhnya
// offline/AsyncStorage — Supabase di sini eksklusif untuk kebutuhan server (nudge Paspor
// lengkap + harga referensi nyata, Sprint 22).
function config() {
  return {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = config();
  return Boolean(url && anonKey);
}

/** `query` contoh: '?select=id,nama&telepon=eq.0812' (diikutkan apa adanya ke URL). */
export async function fetchSupabaseTable<T>(table: string, query = ''): Promise<T[]> {
  const { url, anonKey } = config();
  if (!url || !anonKey) {
    throw new Error('Supabase belum dikonfigurasi (SUPABASE_URL/SUPABASE_ANON_KEY di .env)');
  }
  const res = await fetch(`${url}/rest/v1/${table}${query}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${table} fetch gagal: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
