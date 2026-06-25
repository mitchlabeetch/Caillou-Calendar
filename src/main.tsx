import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initSentry } from './lib/errorReporting';
import './index.css';
import './lib/i18n';

import { polyfill } from "mobile-drag-drop";
// optionally import default styles
import "mobile-drag-drop/default.css";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";

polyfill({
  dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
  holdToDrag: 300,
});

// Initialise Sentry before mounting the app. The function is a no-op
// unless `VITE_SENTRY_DSN` is set at build time.
void initSentry();

// A workaround for some mobile browsers that require a touch listener to overcome
// scrolling issues during drag and drop.
window.addEventListener('touchmove', function() {}, {passive: false});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('SW registered!', reg);
    }).catch(err => {
      console.log('SW registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="Caillou">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
