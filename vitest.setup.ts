// Global setup for Vitest. Mocks for window.matchMedia,
// ResizeObserver and a minimal localStorage implementation so the
// persisted-state hooks can be tested without spinning up a real DOM
// environment.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './src/locales/en.json';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const memoryLocalStorage = new MemoryStorage();
const memorySessionStorage = new MemoryStorage();

// Expose on the global object so the bare `localStorage` identifier
// resolves to our mock.
(globalThis as any).localStorage = memoryLocalStorage;
(globalThis as any).sessionStorage = memorySessionStorage;

// Initialize i18next once with English so components rendered in
// tests can call useTranslation() without throwing.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    returnEmptyString: false,
    interpolation: { escapeValue: false },
    resources: { en: { translation: en } },
  });
}

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  if (!(window as any).ResizeObserver) {
    (window as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}