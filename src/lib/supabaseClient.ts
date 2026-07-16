import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

// Lazy singleton — inisialisasi hanya saat benar-benar dipanggil, supaya mengimpor
// modul ini tidak langsung crash walau .env.local belum diisi (baru dipakai Sprint 10+).
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error(
        'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local (lihat .env.example).',
      );
    }
    client = createClient(url, anonKey);
  }
  return client;
}
