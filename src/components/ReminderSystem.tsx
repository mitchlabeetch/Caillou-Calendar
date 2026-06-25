import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useEvents } from '../lib/eventsContext';
import { useTranslation } from 'react-i18next';
import { CalendarEvent } from '../types';
import { parseISO, subMinutes, subHours, subDays, isBefore, isAfter } from 'date-fns';
import { Bell, X, BellRing } from 'lucide-react';

export function ReminderSystem() {
  const { events } = useEvents();
  const { t } = useTranslation();
  
  const [activeAlerts, setActiveAlerts] = useState<{ id: string, event: CalendarEvent, message: string }[]>([]);
  const [notified, setNotified] = useState<Set<string>>(new Set());
  const [perm, setPerm] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPerm(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const p = await Notification.requestPermission();
      setPerm(p);
    }
  };

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const newAlerts: { id: string, event: CalendarEvent, message: string }[] = [];

      events.forEach(event => {
        if (!event.reminders || event.reminders.length === 0) return;
        if (!event.date) return;
        
        let eventDateTimeStr = event.date;
        if (event.startTime) {
          eventDateTimeStr += `T${event.startTime}`;
        }
        const eventFullDate = parseISO(eventDateTimeStr);
        if (isNaN(eventFullDate.getTime())) return;

        event.reminders.forEach(reminder => {
          const reminderId = `${event.id}-${reminder}`;
          if (notified.has(reminderId)) return;

          let triggerTime = eventFullDate;
          if (reminder === '15m') triggerTime = subMinutes(eventFullDate, 15);
          else if (reminder === '1h') triggerTime = subHours(eventFullDate, 1);
          else if (reminder === '1d') triggerTime = subDays(eventFullDate, 1);
          
          // Trigger if the triggerTime is in the past, but not older than 5 minutes (to avoid stale alerts if app was closed)
          if (isBefore(triggerTime, now) && isAfter(triggerTime, subMinutes(now, 5))) {
            const message = reminder === '15m' ? t('app.reminder15mMessage', 'Starting in 15 minutes') : 
                            reminder === '1h' ? t('app.reminder1hMessage', 'Starting in 1 hour') : 
                            t('app.reminder1dMessage', 'Starting tomorrow');
            
            newAlerts.push({
              id: reminderId,
              event,
              message
            });
            setNotified(prev => new Set(prev).add(reminderId));

            if ('Notification' in window && Notification.permission === 'granted') {
              const notifTitle = event.title;
              const notifBody = message + (event.startTime ? ` at ${event.startTime}` : '');
              
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(reg => {
                  reg.showNotification(notifTitle, {
                    body: notifBody,
                    tag: reminderId,
                    vibrate: [200, 100, 200]
                  } as any);
                }).catch(() => {
                  new Notification(notifTitle, { body: notifBody });
                });
              } else {
                new Notification(notifTitle, { body: notifBody });
              }
            }
          }
        });
      });

      if (newAlerts.length > 0) {
        setActiveAlerts(prev => [...prev, ...newAlerts]);
      }
    };

    const interval = setInterval(checkReminders, 10000);
    checkReminders(); // check immediately
    
    return () => clearInterval(interval);
  }, [events, notified, t]);

  const dismissAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="fixed top-6 right-6 z-[400] flex flex-col gap-4">
      <AnimatePresence>
        {perm === 'default' && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="bg-primary text-white rounded-xl p-4 shadow-neo-lg w-72 md:w-80 relative overflow-hidden print-hide cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={requestPermission}
          >
            <div className="flex items-center gap-3">
              <BellRing className="w-6 h-6 animate-pulse" />
              <div className="flex-1">
                <h4 className="font-bold">{t('app.enableNotifications', 'Enable Push Notifications')}</h4>
                <p className="text-sm opacity-90">{t('app.enableNotificationsDesc', 'Get alerts even in background')}</p>
              </div>
            </div>
          </motion.div>
        )}
        {activeAlerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="bg-surface border-[3px] border-ink rounded-xl p-4 shadow-neo-lg w-72 md:w-80 relative overflow-hidden print-hide"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="flex items-start justify-between gap-3">
              <div className="bg-primary/10 p-2 rounded-full mt-0.5">
                <Bell className="w-5 h-5 text-primary" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-ink text-lg truncate">{alert.event.title}</h4>
                <p className="text-ink/70 font-medium text-sm mt-0.5">{alert.message}</p>
                {alert.event.startTime && (
                  <p className="text-ink/50 text-xs font-bold mt-1.5">{alert.event.startTime}</p>
                )}
              </div>
              <button 
                onClick={() => dismissAlert(alert.id)}
                className="text-ink/40 hover:text-ink hover:bg-black/5 p-1 rounded transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
