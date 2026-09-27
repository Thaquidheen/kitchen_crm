import { defineConfig } from 'vitest/config';
import path from 'path';

// Unit tests only (pure TS modules) — no DOM needed, so the default node environment is used.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
