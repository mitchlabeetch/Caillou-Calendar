import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Tailwind max-width utility, default `max-w-lg`. */
  maxWidth?: string;
  /** Additional class names for the inner panel. */
  className?: string;
  /** Override default panel chrome (border, shadow, bg, radius). */
  panelClassName?: string;
  /** Additional class names for the outer wrapper. */
  wrapperClassName?: string;
  /** Override the title's typography. */
  titleClassName?: string;
  /** Close when clicking the backdrop. Default true. */
  closeOnBackdropClick?: boolean;
  /** Hide the default X button in the top-right (when the modal uses its own). */
  showCloseButton?: boolean;
  /** Hide the semi-opaque backdrop (rarely used). */
  showBackdrop?: boolean;
  /** z-index of the modal wrapper. Default 50. */
  zIndex?: number;
  /** Background colour of the backdrop. Default `bg-black/50`. */
  backdropClassName?: string;
  children: React.ReactNode;
}

/**
 * Shared modal chrome for every Caillou modal. Provides:
 *
 *  - `role="dialog"` and `aria-modal="true"` for screen readers.
 *  - A real focus trap (Tab/Shift+Tab stay inside the panel).
 *  - Initial focus on the first focusable element or the panel itself.
 *  - Restore focus to the previously-focused element on close.
 *  - Escape key handling.
 *  - A11y-friendly labelled close button.
 *  - Backdrop click closes (configurable).
 *  - `motion` entry/exit animations consistent with the rest of the app.
 *
 * Replaces the inconsistent per-modal focus behaviour flagged in
 * wiki/operations/18-production-audit.md §7.
 */
export function ModalShell({
  isOpen,
  onClose,
  title,
  maxWidth = 'max-w-lg',
  className,
  panelClassName,
  wrapperClassName,
  titleClassName,
  closeOnBackdropClick = true,
  showCloseButton = true,
  showBackdrop = true,
  zIndex = 50,
  backdropClassName = 'bg-black/50',
  children,
}: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Save/restore focus + trap focus while open
  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    if (!panel) return undefined;

    const focusFirst = () => {
      const focusables = getFocusableElements(panel);
      if (focusables[0]) {
        focusables[0].focus();
      } else {
        panel.focus();
      }
    };

    // Defer to next frame so the panel has been laid out and its
    // tabbable children are visible before we move focus.
    const id = requestAnimationFrame(focusFirst);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = getFocusableElements(panel);
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', onKeyDown, true);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  // If `panelClassName` is supplied we treat the modal as fully custom:
  // no default chrome is applied and the caller is responsible for
  // border / background / shadow / radius / padding.
  const useDefaultChrome = !panelClassName;
  const panelClass = useDefaultChrome
    ? cn(
        'relative w-full bg-surface border-[4px] border-ink shadow-neo rounded-2xl p-6 outline-none max-h-[90vh] overflow-y-auto',
        maxWidth,
        className,
      )
    : cn('relative w-full outline-none', maxWidth, panelClassName, className);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex }}
          className={cn(
            'fixed inset-0 flex items-center justify-center p-4',
            showBackdrop && backdropClassName,
            wrapperClassName,
          )}
          onClick={() => closeOnBackdropClick && onClose()}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className={panelClass}
            onClick={e => e.stopPropagation()}
          >
            {title && (
              <h2 className={cn(
                useDefaultChrome ? 'text-xl font-bold text-ink pr-10 mb-4' : '',
                titleClassName,
              )}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className={cn(
                  'absolute top-4 right-4 p-1.5 rounded-full hover:bg-bg-light border-[3px] border-transparent hover:border-ink transition-colors',
                  !useDefaultChrome && 'z-20',
                )}
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    el => !el.hasAttribute('disabled') && el.offsetParent !== null,
  );
}