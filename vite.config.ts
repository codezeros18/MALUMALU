import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  // Port dikunci + strictPort: kalau 5173 masih dipakai proses `npm run dev` lama yang
  // belum benar-benar mati, Vite akan GAGAL START (error jelas) alih-alih diam-diam
  // pindah ke port lain (5174, dst). Ini penting karena IndexedDB/localStorage terikat
  // ke origin (host+port) — pindah port tanpa sadar = kelihatan seperti "data hilang"
  // padahal cuma buka origin/kotak penyimpanan browser yang berbeda.
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Paspor Petani',
        short_name: 'PasporTani',
        description: 'Paspor data milik-petani — offline-first, deterministik, hash-chain.',
        theme_color: '#1F5C3A',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Precache seluruh aset build + data/raster (termasuk pangalengan.json) supaya
        // point-in-raster & alur inti tetap jalan tanpa internet.
        globPatterns: ['**/*.{js,css,html,ico,svg,png,json}'],
      },
    }),
  ],
});
