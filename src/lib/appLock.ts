// Gerbang demo publik: dinyalakan HANYA lewat env var Vercel (Production), bukan lokal.
// Rencana rilis saat ini: deploy publik = company profile saja, dashboard peran
// (Agen/Petani/Eksportir) belum dibuka ke umum. `.env.local`/dev TIDAK diset -> tim tetap
// bisa uji coba alur penuh di localhost tanpa terkunci.
export const APP_LOCKED = import.meta.env.VITE_APP_LOCKED === 'true';
