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
      // `all` is a runtime option that lives outside the public
      // TypeScript surface for some vitest builds. We cast around
      // it so the gate compiles cleanly while still limiting the
      // coverage map to the lib + hooks modules we actually want to
      // score (otherwise the worker OOMs before reporting).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({ all: false } as any),
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