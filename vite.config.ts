import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA, type VitePWAOptions } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

export const pwaOptions: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  includeAssets: ['icon-192.png', 'icon-512.png'],
  manifest: {
    name: 'Piano Stars',
    short_name: 'Piano Stars',
    display: 'fullscreen',
    orientation: 'landscape',
    theme_color: '#43A047',
    background_color: '#43A047',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
};

export default defineConfig({
  plugins: [preact(), VitePWA(pwaOptions)],
  server: { host: true },
  // midi-test.html is a dev-only tool: the dev server still serves it, the production build leaves it out.
  build: {
    rollupOptions: {
      input: { main: resolve(import.meta.dirname, 'index.html') },
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'] },
});
