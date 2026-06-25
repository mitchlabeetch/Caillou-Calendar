import { useCallback, useEffect, useState } from 'react';

/**
 * Simple toast manager. Replaces prop-drilled `showToast` and the
 * imperative DOM calls previously sprinkled around the app.
 *
 * Usage:
 *   const { toasts, showToast, dismissToast } = useToasts();
 */
export interface Toast {
  id: string;
  message: string;
  /** Auto-dismiss after this many ms (default 3500). Set 0 to disable. */
  duration?: number;
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, duration = 3500) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, message, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Auto-dismiss effect
  useEffect(() => {
    if (toasts.length === 0) return undefined;
    const timers = toasts.map(t =>
      t.duration && t.duration > 0
        ? setTimeout(() => dismissToast(t.id), t.duration)
        : null,
    );
    return () => {
      for (const t of timers) if (t) clearTimeout(t);
    };
  }, [toasts, dismissToast]);

  return { toasts, showToast, dismissToast };
}