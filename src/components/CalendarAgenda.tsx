import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { format, parseISO, isValid, isToday, isTomorrow } from 'date-fns';
import { useEvents } from '../lib/eventsContext';
import { cn } from '../lib/utils';
import { getDateLocale } from '../lib/dateLocale';
import { CalendarEvent } from '../types';

function groupEventsByDate(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {};
  events.forEach(evt => {
    if (!evt.date || !isValid(parseISO(evt.date))) return;
    const key = evt.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(evt);
  });
  return groups;
}

export function CalendarAgenda({ onDateClick }: { currentDate: Date; onDateClick?: (d: Date) => void }) {
  const { t, i18n } = useTranslation();
  const { events, selectedMembers, familyMembers, setSelectedEventId } = useEvents();
  const dateOptions = { locale: getDateLocale(i18n.language) };

  const filteredEvents = events.filter(e => {
    if (!e.date || !isValid(parseISO(e.date))) return false;
    if (!e.memberIds || !Array.isArray(e.memberIds) || !e.memberIds.some(id => selectedMembers.includes(id))) return false;
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''));

  const grouped = groupEventsByDate(filteredEvents);
  const sortedDates = Object.keys(grouped).sort();

  const formatDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return t('app.today', 'Today');
    if (isTomorrow(d)) return t('app.tomorrow', 'Tomorrow');
    return format(d, 'EEEE d MMM', dateOptions);
  };

  return (
    <main className="flex-1 flex flex-col bg-bg-app p-3 overflow-y-auto">
      {sortedDates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80">
          <h4 className="text-xl font-display font-bold mb-2">{t('app.noEventsToday')}</h4>
          <p className="text-ink/60 font-bold">{t('app.freeDayMsg')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedDates.map(dateStr => (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2"
            >
              <button
                onClick={() => onDateClick?.(parseISO(dateStr))}
                className="text-left"
              >
                <span className={cn(
                  "text-xs font-black uppercase tracking-widest",
                  isToday(parseISO(dateStr)) ? "text-primary" : "text-ink/50"
                )}>
                  {formatDateLabel(dateStr)}
                </span>
              </button>
              <div className="flex flex-col gap-2">
                {grouped[dateStr].map(evt => {
                  const mem = familyMembers.find(m => evt.memberIds[0] === m.id);
                  return (
                    <motion.div
                      key={evt.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedEventId(evt.id)}
                      className={cn(
                        "p-4 rounded-xl border-[3px] border-ink shadow-neo flex flex-col gap-1",
                        mem?.bgClass || "bg-surface"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-base leading-tight">{evt.title}</span>
                        {evt.startTime && (
                          <span className="font-bold text-xs opacity-70 shrink-0 ml-2">
                            {evt.startTime}
                          </span>
                        )}
                      </div>
                      {evt.location && (
                        <span className="font-bold text-xs opacity-60">ðŸ“ {evt.location}</span>
                      )}
                      <div className="flex gap-1 mt-1">
                        {evt.memberIds.map(mid => {
                          const m = familyMembers.find(f => f.id === mid);
                          if (!m) return null;
                          return (
                            <div
                              key={mid}
                              className={cn("w-5 h-5 rounded-full border border-ink", m.bgClass)}
                              title={m.name}
                            />
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
