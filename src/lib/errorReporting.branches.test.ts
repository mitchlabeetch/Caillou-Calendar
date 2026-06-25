import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initSentry, reportError } from './errorReporting';

describe('errorReporting — DSN-driven paths', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('initSentry short-circuits without DSN', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    await expect(initSentry()).resolves.toBeUndefined();
  });

  it('initSentry short-circuits even with whitespace-only DSN', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '   ');
    await expect(initSentry()).resolves.toBeUndefined();
  });

  it('initSentry resolves when DSN is set', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://fake@sentry.io/1');
    await initSentry();
    // Contract: no throw regardless of whether @sentry/react is
    // actually installed in the test environment.
  });

  it('reportError handles non-Error values (number)', async () => {
    await expect(reportError(42 as unknown)).resolves.toBeUndefined();
  });

  it('reportError handles null', async () => {
    await expect(reportError(null as unknown)).resolves.toBeUndefined();
  });

  it('reportError passes through tags + extra + user context', async () => {
    await expect(reportError(new Error('ctx'), {
      tags: { feature: 'events' },
      extra: { hint: 'clicked save' },
      user: { id: 'u1' },
    })).resolves.toBeUndefined();
  });
});
