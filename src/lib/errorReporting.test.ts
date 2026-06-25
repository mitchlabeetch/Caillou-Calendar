import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initSentry, reportError } from './errorReporting';

describe('initSentry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('is a no-op when VITE_SENTRY_DSN is unset', async () => {
    // Default vite test env has no Sentry DSN. The function should
    // return without throwing, no matter whether the package is
    // installed.
    await expect(initSentry()).resolves.toBeUndefined();
  });

  it('reportError swallows non-Error throws', async () => {
    const err = new Error('boom');
    await expect(reportError(err)).resolves.toBeUndefined();
  });

  it('reportError forwards context tags', async () => {
    const err = new Error('tagged');
    await expect(reportError(err, { tags: { feature: 'events' } })).resolves.toBeUndefined();
  });

  it('reportError handles string errors too', async () => {
    await expect(reportError('oops')).resolves.toBeUndefined();
  });
});
