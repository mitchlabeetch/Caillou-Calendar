/**
 * Calendar colour schemes.
 *
 * Four neo-brutalist presets the user can switch between in Settings.
 * Each scheme rewrites the `--color-*` CSS custom properties that drive
 * Tailwind tokens — no component code needs to change.
 */
export type ColorSchemeId = 'tangerine' | 'mint' | 'berry' | 'slate';

export interface ColorScheme {
  id: ColorSchemeId;
  name: string;
  primary: string;
  bgApp: string;
  surface: string;
  ink: string;
  // Member pill colours (mem-1 .. mem-4). Schemes swap these so the
  // event palette stays cohesive with the rest of the UI.
  memberColors: [string, string, string, string];
}

export const COLOR_SCHEMES: Record<ColorSchemeId, ColorScheme> = {
  tangerine: {
    id: 'tangerine',
    name: 'Tangerine',
    primary: '#ff4d15',
    bgApp: '#fcffe4',
    surface: '#FFFFFF',
    ink: '#1A1A1A',
    memberColors: ['#B39DDB', '#80CBC4', '#FFAB91', '#F48FB1'],
  },
  mint: {
    id: 'mint',
    name: 'Mint',
    primary: '#10b981',
    bgApp: '#ecfdf5',
    surface: '#FFFFFF',
    ink: '#0f172a',
    memberColors: ['#a7f3d0', '#bae6fd', '#fde68a', '#fbcfe8'],
  },
  berry: {
    id: 'berry',
    name: 'Berry',
    primary: '#a855f7',
    bgApp: '#fdf2f8',
    surface: '#FFFFFF',
    ink: '#1f0a30',
    memberColors: ['#f0abfc', '#c4b5fd', '#fda4af', '#fcd34d'],
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    primary: '#f97316',
    bgApp: '#f8fafc',
    surface: '#FFFFFF',
    ink: '#0f172a',
    memberColors: ['#94a3b8', '#64748b', '#475569', '#334155'],
  },
};

const STORAGE_KEY = 'synoptic-color-scheme';

export function getActiveColorScheme(): ColorScheme {
  if (typeof localStorage === 'undefined') return COLOR_SCHEMES.tangerine;
  const id = localStorage.getItem(STORAGE_KEY) as ColorSchemeId | null;
  return id && COLOR_SCHEMES[id] ? COLOR_SCHEMES[id] : COLOR_SCHEMES.tangerine;
}

export function setActiveColorScheme(id: ColorSchemeId): void {
  if (typeof localStorage === 'undefined') return;
  const scheme = COLOR_SCHEMES[id];
  if (!scheme) return;
  localStorage.setItem(STORAGE_KEY, id);
  const root = document.documentElement;
  root.style.setProperty('--color-primary', scheme.primary);
  root.style.setProperty('--color-bg-app', scheme.bgApp);
  root.style.setProperty('--color-surface', scheme.surface);
  root.style.setProperty('--color-ink', scheme.ink);
  root.style.setProperty('--color-mem-1', scheme.memberColors[0]);
  root.style.setProperty('--color-mem-2', scheme.memberColors[1]);
  root.style.setProperty('--color-mem-3', scheme.memberColors[2]);
  root.style.setProperty('--color-mem-4', scheme.memberColors[3]);
  root.dataset.colorScheme = id;
}

/** Apply the persisted scheme on boot so the first paint is correct. */
export function bootstrapColorScheme(): void {
  setActiveColorScheme(getActiveColorScheme().id);
}