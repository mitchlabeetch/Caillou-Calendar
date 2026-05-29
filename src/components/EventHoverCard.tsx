import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, MapPin, Repeat, BellRing, Gift } from 'lucide-react';
import { CalendarEvent } from '../types';
import { cn } from '../lib/utils';
import { useEvents } from '../lib/eventsContext';

export function EventHoverCard({ event }: { event: CalendarEvent }) {
  const { t } = useTranslation();
  const { setSelectedEventId, familyMembers } = useEvents();
  const members = event.memberIds.map(id => familyMembers.find(m => m.id === id)).filter(Boolean);

  return (
    <div 
      className="absolute hidden group-hover:flex flex-col bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface text-ink border-[3px] border-ink rounded-2xl shadow-[4px_4px_0px_#1A1A1A] p-3 z-50 pointer-events-auto cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="font-black text-lg truncate mb-1 cursor-pointer hover:underline text-primary flex items-start gap-1"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedEventId(event.id);
        }}
      >
        <span>{event.title}</span>
        {event.isBirthday && <Gift className="w-4 h-4 text-pink-500 fill-pink-500/20 shrink-0 mt-1" />}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Clock className="w-4 h-4 text-ink/70" />
          <span>{event.startTime || t('app.allDay')} {event.endTime ? `- ${event.endTime}` : ''}</span>
        </div>
        
        {event.location && (
          <div className="flex items-center gap-2 text-sm font-bold">
            <MapPin className="w-4 h-4 text-ink/70" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-1">
          {members.map(m => m && (
            <div key={m.id} className={cn("px-2 py-0.5 rounded-full border-[2px] border-ink text-xs font-bold shadow-neo flex items-center gap-1", m.bgClass)}>
              <span className="text-[10px] uppercase font-black">{m.name[0]}</span> {m.name}
            </div>
          ))}
        </div>

        {(event.recurrence?.type !== 'none' || (event.reminders && event.reminders.length > 0) || event.isBirthday) && (
          <div className="flex gap-3 mt-1 pt-2 border-t-[2px] border-ink/10">
            {event.isBirthday ? (
              <div className="flex items-center gap-1 text-xs font-bold text-pink-600">
                <Gift className="w-3.5 h-3.5" />
                <span>Birthday (Annually)</span>
              </div>
            ) : event.recurrence && event.recurrence.type !== 'none' && (
              <div className="flex items-center gap-1 text-xs font-bold text-ink/60">
                <Repeat className="w-3.5 h-3.5" />
                <span className="capitalize">{event.recurrence.type}</span>
              </div>
            )}
            {event.reminders && event.reminders.length > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-ink/60">
                <BellRing className="w-3.5 h-3.5" />
                <span>{t('app.reminderCount', { count: event.reminders.length })}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
