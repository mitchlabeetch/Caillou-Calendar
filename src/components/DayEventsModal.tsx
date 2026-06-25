import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../lib/dateLocale';
import { motion } from 'motion/react';
import { format, isSameDay, parseISO, isValid } from 'date-fns';
import { useEvents } from '../lib/eventsContext';
import { CalendarHeart } from 'lucide-react';
import { cn } from '../lib/utils';
import { ModalShell } from './ModalShell';

export function DayEventsModal({ isOpen, date, onClose }: { isOpen: boolean, date: Date | null, onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { events, selectedMembers, familyMembers } = useEvents();

  const dateOptions = { locale: getDateLocale(i18n.language) };

  const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
  const dayEvents = events.filter(e => {
    if (!e || !e.date || !isValid(parseISO(e.date))) return false;
    if (!e.memberIds || !Array.isArray(e.memberIds) || !e.memberIds.some(id => selectedMembers.includes(id))) return false;

    if (e.endDate && isValid(parseISO(e.endDate))) {
      return dateStr >= e.date && dateStr <= e.endDate;
    }
    return isSameDay(parseISO(e.date), date!);
  }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  return (
    <ModalShell
      isOpen={isOpen && !!date}
      onClose={onClose}
      maxWidth="sm:max-w-md"
      wrapperClassName="p-0 sm:p-4"
      backdropClassName="bg-ink/40 backdrop-blur-sm"
      panelClassName="w-full sm:w-auto h-[100dvh] sm:h-auto sm:max-h-[80vh] rounded-none sm:rounded-3xl p-6 lg:p-8 pt-12 sm:pt-6 flex flex-col overflow-hidden bg-surface border-[4px] border-ink sm:shadow-neo-xl"
    >
      <h2 className="text-3xl font-display font-bold mb-1 capitalize">{date && format(date, 'EEEE', dateOptions)}</h2>
      <h3 className="text-xl font-bold text-ink/60 mb-6 capitalize">{date && format(date, 'PPP', dateOptions)}</h3>

      <div className="flex-1 overflow-y-auto min-h-[200px] flex flex-col gap-3 pb-4">
        {dayEvents.length > 0 ? (
          dayEvents.map(evt => {
            const activeMem = familyMembers.find(m => evt.memberIds[0] === m.id);
            return (
              <div key={evt.id} className={cn("p-4 rounded-xl border-[3px] border-ink flex flex-col gap-1 shadow-neo", activeMem?.bgClass || "bg-bg-app")}>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-lg leading-tight">{evt.title}</span>
                  <span className="font-bold text-sm opacity-70 shrink-0 ml-2">{evt.startTime} {evt.endTime && `- ${evt.endTime}`}</span>
                </div>
                {evt.location && <span className="font-bold text-xs opacity-60 flex items-center gap-1">ðŸ“ {evt.location}</span>}
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 mt-8 mb-8">
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute inset-0 bg-warning rounded-full border-[4px] border-ink shadow-neo z-0 opacity-80 mix-blend-multiply"
              />
              <motion.div
                animate={{ x: [0, 10, 0], y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
                className="absolute inset-4 bg-[#EF476F]/20 rounded-full z-10"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.6, duration: 1 }}
                className="w-24 h-24 bg-surface rounded-3xl border-[4px] border-ink shadow-neo z-20 flex items-center justify-center rotate-3"
              >
                <CalendarHeart className="w-12 h-12 text-[#EF476F]" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute -top-2 right-4 text-warning z-30"
              >
                âœ¨
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-2 -left-2 text-[#EF476F] z-30"
              >
                âœ¨
              </motion.div>
            </div>
            <h4 className="text-2xl font-display font-bold mb-2">{t('app.noEventsToday')}</h4>
            <p className="text-ink/60 font-bold max-w-[200px]">{t('app.freeDayMsg')}</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
