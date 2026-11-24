import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [preact()],
  server: { host: true },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        midiTest: resolve(import.meta.dirname, 'midi-test.html'),
      },
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'] },
});
