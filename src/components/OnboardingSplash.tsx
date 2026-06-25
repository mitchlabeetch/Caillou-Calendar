import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Calendar, X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const STORAGE_KEY = 'synoptic-onboarding-dismissed';

export function OnboardingSplash({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const containerRef = useFocusTrap(visible);

  // Allow Escape to dismiss the splash for keyboard users.
  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, '1');
        }
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] bg-bg-app flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <motion.div
            ref={containerRef}
            initial={{ y: 20, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            className="max-w-md w-full bg-surface border-[3px] border-ink rounded-3xl p-8 shadow-neo-xl text-center relative outline-none"
            tabIndex={-1}
          >
            <button
              type="button"
              aria-label={t('app.close')}
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg border-[2px] border-ink/20 hover:bg-ink/5"
            >
              <X className="w-4 h-4" />
            </button>
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.1 }}
              className="mx-auto w-20 h-20 mb-5 rounded-2xl bg-primary border-[3px] border-ink shadow-neo-md flex items-center justify-center"
            >
              <Calendar className="w-10 h-10 text-ink" />
            </motion.div>
            <h2 id="onboarding-title" className="text-2xl font-display font-bold mb-2 text-ink">
              {t('app.onboardingTitle', 'Welcome to Synoptic')}
            </h2>
            <p className="text-sm font-medium text-ink/70 mb-6 leading-relaxed">
              {t('app.onboardingBody', "Your family's shared calendar — fully offline-ready, with optional Google sync and push reminders.")}
            </p>
            <button
              type="button"
              onClick={() => {
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem(STORAGE_KEY, '1');
                }
                onClose();
              }}
              className="px-6 h-12 bg-primary text-ink border-[3px] border-ink rounded-xl font-bold shadow-neo-md hover:-translate-y-0.5 active:translate-y-0 transition-transform"
            >
              {t('app.gotIt', 'Got it')}
            </button>
            <p className="mt-4 text-[10px] uppercase tracking-widest opacity-50 font-bold">
              ⌘ K · {t('app.search', 'Search')} · Drag-and-drop · {t('app.allDay', 'All-day')} · {t('app.dark')}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function shouldShowOnboarding(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== '1';
}