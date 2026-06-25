import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { isDstShiftDay } from '../lib/dstDetector';

/**
 * Compact DST indicator. Re-checks the week surrounding `referenceDate`
 * once per day and animates a small badge in/out when the offset shifts.
 */
export function DstBadge({ referenceDate }: { referenceDate: string }) {
  const { t } = useTranslation();
  const [shift, setShift] = useState(false);

  useEffect(() => {
    function check(): void {
      const today = new Date(referenceDate + 'T12:00:00Z');
      if (isNaN(today.getTime())) return setShift(false);
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      setShift(isDstShiftDay(today.toISOString().slice(0, 10), tomorrow.toISOString().slice(0, 10)));
    }
    check();
    const id = setInterval(check, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, [referenceDate]);

  return (
    <AnimatePresence>
      {shift && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border-[2px] border-ink bg-primary text-ink text-[10px] font-black uppercase tracking-widest shadow-neo-sm"
          aria-label={t('app.dst', 'DST shift today')}
        >
          <Clock className="w-3 h-3" /> {t('app.dst', 'DST')}
        </motion.span>
      )}
    </AnimatePresence>
  );
}