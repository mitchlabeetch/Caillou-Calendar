import { useTranslation } from 'react-i18next';
import { Printer, X } from 'lucide-react';
import { useEvents } from '../lib/eventsContext';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { useFocusTrap } from '../hooks/useFocusTrap';

export function PrintPreviewModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { events } = useEvents();
  const sorted = [...events].sort((a, b) => (a.date + (a.startTime ?? '')).localeCompare(b.date + (b.startTime ?? '')));

  const containerRef = useFocusTrap(isOpen);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t('app.printPreview', 'Print preview')}
        >
          <motion.div
            ref={containerRef}
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-3xl border-[3px] border-ink shadow-neo-xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden outline-none"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between p-4 border-b-[2px] border-ink/10 bg-bg-light no-print">
              <h2 className="text-lg font-display font-bold flex items-center gap-2">
                <Printer className="w-5 h-5" />
                {t('app.printPreview', 'Print preview')}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="h-10 px-4 bg-primary text-ink border-[2px] border-ink rounded-xl font-bold shadow-neo-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {t('app.print', 'Print')}
                </button>
                <button
                  onClick={onClose}
                  aria-label={t('app.close', 'Close')}
                  className="w-10 h-10 rounded-xl border-[2px] border-ink/20 hover:border-ink transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 print-only">
              <div className="text-xs uppercase tracking-widest font-black mb-1 opacity-60">
                {t('app.familySchedule', 'Family schedule')}
              </div>
              <h1 className="text-3xl font-display font-bold mb-4">
                {format(new Date(), 'PPP')}
              </h1>
              {sorted.length === 0 ? (
                <p className="text-ink/60 italic">{t('app.noEvents', 'No events yet.')}</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-[2px] border-ink">
                      <th className="text-left py-2 font-black uppercase tracking-widest text-xs">{t('app.date', 'Date')}</th>
                      <th className="text-left py-2 font-black uppercase tracking-widest text-xs">{t('app.time', 'Time')}</th>
                      <th className="text-left py-2 font-black uppercase tracking-widest text-xs">{t('app.title', 'Title')}</th>
                      <th className="text-left py-2 font-black uppercase tracking-widest text-xs">{t('app.location', 'Location')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((ev) => (
                      <tr key={ev.id} className="border-b border-ink/10">
                        <td className="py-2 font-bold">{format(parseISO(ev.date), 'PP')}</td>
                        <td className="py-2">{ev.allDay ? t('app.allDay', 'All day') : (ev.startTime ?? '—')}</td>
                        <td className="py-2 font-bold">{ev.title}</td>
                        <td className="py-2 text-ink/70">{ev.location ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}