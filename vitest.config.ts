import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'audit-screenshots', 'test-*.{cjs,tsx,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      // Only instrument files matching `include` below. The default
      // instruments the entire import graph (including the full App
      // component tree) which exhausts the worker heap before tests
      // finish reporting. With `all: false`, the coverage map is
      // restricted to the lib + hooks modules we actually want to gate.
      all: false,
      thresholds: {
        // Lines / statements / functions gate scoped to business
        // logic (lib + hooks). Components are exercised by the
        // Playwright visual-regression suite (see #6) — they pull
        // coverage down because most JSX is impossible to unit-test
        // without duplicating the Playwright assertions.
        lines: 70,
        statements: 70,
        functions: 70,
      },
      include: ['src/lib/**/*.ts', 'src/hooks/**/*.ts'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types.ts',
        'src/**/*.d.ts',
      ],
    },
  },
});