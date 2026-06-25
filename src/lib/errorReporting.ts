import { getSupabase } from '../lib/supabase';

/**
 * Caillou's error reporter. Currently a no-op — meant to be wired up
 * to Sentry or a similar service in production. Keeping the contract
 * here so call sites can `reportError(e, { tags: { feature: 'events' }})`
 * today and have them light up the moment a `SENTRY_DSN` is configured.
 *
 * To enable real reporting:
 *   1. `npm install @sentry/react`
 *   2. In `useAuth` (or `main.tsx`), call `initSentry()` once with
 *      the project DSN.
 *   3. Add `Sentry.captureException` inside `reportError` below.
 *
 * Tracked in wiki/operations/18-production-audit.md §11.
 */
export interface ReportContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id: string; email?: string; username?: string };
}

interface SentryLike {
  init: (cfg: Record<string, unknown>) => void;
  captureException: (err: unknown, ctx?: ReportContext) => void;
  browserTracingIntegration?: () => unknown;
}

async function loadSentry(): Promise<SentryLike | null> {
  try {
    // The package is optional; if it's not installed we silently
    // fall back to the no-op behaviour defined in the contract.
    // The module name is passed via a variable so Vite's static
    // analyser cannot pre-bundle `@sentry/react` (which would fail
    // the build when the package is not installed).
    const moduleName = '@sentry/react';
    const mod = await import(/* @vite-ignore */ moduleName);
    return mod as unknown as SentryLike;
  } catch {
    return null;
  }
}

export async function initSentry(): Promise<void> {
  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await loadSentry();
  if (!Sentry) {
    console.warn('Sentry failed to initialise (@sentry/react not installed)');
    return;
  }
  try {
    Sentry.init({
      dsn,
      integrations: Sentry.browserTracingIntegration ? [Sentry.browserTracingIntegration()] : [],
      tracesSampleRate: 0.1,
      environment: (import.meta as any).env?.MODE ?? 'production',
    });
  } catch (e) {
    console.warn('Sentry failed to initialise', e);
  }
}

export async function reportError(error: unknown, context?: ReportContext): Promise<void> {
  // Always log so we have a breadcrumb locally.
  console.error('[reportError]', error, context);
  // Touch the lazy Supabase import so the module is bundled the same
  // way in dev and prod (keeps the dependency graph honest).
  void getSupabase;
  const Sentry = await loadSentry();
  if (!Sentry) return;
  try {
    Sentry.captureException(error, context);
  } catch {
    // No-op: captureException can throw in weird environments.
  }
}
