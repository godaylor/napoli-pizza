import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 32500, strictPort: true },
  preview: { host: '127.0.0.1', port: 32500, strictPort: true },
  build: {
    manifest: true,
  },
  test: {
    // Bound transform/coverage workers so lazy-route assertions are not starved.
    maxWorkers: 4,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
