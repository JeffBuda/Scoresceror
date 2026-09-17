import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: '/Scoresceror/', // This should match the repository name
  plugins: [
    // SPA fallback: copy index.html to 404.html so GitHub Pages serves
    // the app for client-side routes like /debug.
    {
      name: 'spa-404-fallback',
      closeBundle() {
        copyFileSync(
          resolve(process.cwd(), 'dist', 'index.html'),
          resolve(process.cwd(), 'dist', '404.html'),
        );
      },
    },
    solid(),
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
