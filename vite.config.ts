import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/Scoresceror/', // This should match the repository name
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Scoresceror',
        short_name: 'Scoresceror',
        description: 'An idle wizard game where you accumulate points over time',
        start_url: '.',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            src: 'scoresceror-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: 'scoresceror-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'scoresceror-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
