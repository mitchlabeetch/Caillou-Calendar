import { useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'synoptic-theme';

function applyTheme(t: Theme): void {
  if (typeof document === 'undefined') return;
  if (t === 'system') {
    document.documentElement.dataset.theme = 'system';
  } else {
    document.documentElement.dataset.theme = t;
  }
}

/**
 * Persists the user's theme choice (`light` / `dark` / `system`) and
 * applies it to the document element. The actual palette switching is
 * driven by CSS tokens in `src/index.css`.
 *
 * `system` defers to `prefers-color-scheme` via a media query in CSS.
 */
export function useTheme(): [Theme, (t: Theme) => void] {
  // Initial read from storage (or fallback to "system")
  useEffect(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
      applyTheme(saved);
    } catch {
      applyTheme('system');
    }
  }, []);

  // Re-apply if the user changes their OS preference while in "system".
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      try {
        const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system';
        if (saved === 'system') applyTheme('system');
      } catch {}
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const setTheme = (t: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
    applyTheme(t);
  };

  // Read current value (best-effort; the persisted value is the
  // source of truth, with the DOM mirror used at apply time).
  let current: Theme = 'system';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      current = saved;
    }
  } catch {}

  return [current, setTheme];
}