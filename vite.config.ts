import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
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
        ],
      },
      // Caching detail (precache raster, offline strategy) dikerjakan di Sprint 8.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
      },
    }),
  ],
});
