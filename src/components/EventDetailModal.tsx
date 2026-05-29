import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { X, CalendarIcon, Clock, MapPin, Users, Edit3, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEvents } from '../lib/eventsContext';

export function EventDetailModal({ isOpen, onClose, eventId }: { isOpen: boolean, onClose: () => void, eventId: string }) {
  const { t } = useTranslation();
  const { events, deleteEvent, setEvents, familyMembers } = useEvents();
  const event = events.find(e => e.id === eventId);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editMembers, setEditMembers] = useState<string[]>([]);
  
  const handleDownloadIcs = () => {
    if (!event) return;
    
    const formatIcsDate = (dateStr: string, timeStr?: string) => {
      if (!timeStr) {
        return dateStr.replace(/-/g, '');
      }
      // Add timezone offset to local time or create as UTC to be safe
      const dt = new Date(`${dateStr}T${timeStr}`);
      if (isNaN(dt.getTime())) return dateStr.replace(/-/g, '');
      return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
  
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Family Calendar//EN',
      'BEGIN:VEVENT',
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
      `DTSTART:${formatIcsDate(event.date, event.startTime)}`,
      event.endTime ? `DTEND:${formatIcsDate(event.date, event.endTime)}` : '',
      `SUMMARY:${event.title}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\n');
  
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if(!isOpen) {
      setIsEditing(false);
    } else if (event) {
      setEditTitle(event.title);
      setEditDate(event.date);
      setEditTime(event.startTime || '');
      setEditMembers(event.memberIds);
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const members = event.memberIds.map(id => familyMembers.find(m => m.id === id)).filter(Boolean);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editDate || editMembers.length === 0) return;
    
    setEvents(evs => evs.map(ev => 
      ev.id === event.id ? { 
        ...ev, 
        title: editTitle, 
        date: editDate, 
        startTime: editTime || undefined,
        memberIds: editMembers 
      } : ev
    ));
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto"
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative pointer-events-auto bg-surface border-[4px] border-ink sm:rounded-3xl rounded-none sm:shadow-[8px_8px_0px_#1A1A1A] w-full sm:max-w-md h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col"
        >
          {event.thumbnailUrl && (
            <div className="w-full h-48 border-b-[4px] border-ink relative">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${event.thumbnailUrl}')` }}></div>
              <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-surface border-[3px] border-ink rounded-full flex items-center justify-center shadow-neo hover:scale-105 transition-transform z-10">
                <X className="w-5 h-5 font-bold" />
              </button>
            </div>
          )}

          {!event.thumbnailUrl && (
             <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-surface border-[3px] border-ink rounded-full flex items-center justify-center shadow-neo hover:scale-105 transition-transform z-10">
               <X className="w-5 h-5 font-bold" />
             </button>
          )}

          <div className="p-6 overflow-y-auto">
            {isEditing ? (
              <form className="flex flex-col gap-4" onSubmit={handleSave}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.title')}</label>
                  <input 
                    autoFocus
                    className="w-full rounded-xl border-[2px] border-ink/20 focus:border-ink focus:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-surface p-3 font-bold text-lg outline-none"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.date')}</label>
                    <input 
                      type="date" 
                      value={editDate} onChange={e => setEditDate(e.target.value)}
                      className="w-full rounded-xl border-[2px] border-ink/20 focus:border-ink focus:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-surface p-3 text-base font-bold outline-none" 
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.time')}</label>
                    <input 
                      type="time" 
                      value={editTime} onChange={e => setEditTime(e.target.value)}
                      className="w-full rounded-xl border-[2px] border-ink/20 focus:border-ink focus:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-surface p-3 text-base font-bold outline-none" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mb-4">
                  <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.who')}</label>
                  <div className="flex flex-wrap gap-2">
                    {familyMembers.map(mem => {
                      const isSel = editMembers.includes(mem.id);
                      return (
                        <button 
                          type="button"
                          key={mem.id}
                          onClick={() => setEditMembers(s => s.includes(mem.id) ? s.filter(x => x !== mem.id) : [...s, mem.id])}
                          className={cn(
                            "w-8 h-8 rounded-full border-[2px] border-ink transition-all flex items-center justify-center font-bold text-xs uppercase",
                            isSel ? mem.bgClass : "bg-bg-light text-ink/30 hover:bg-gray-200"
                          )}
                          title={mem.name}
                        >
                          {mem.name[0]}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 h-14 bg-gray-200 rounded-xl border-[3px] border-ink font-bold hover:-translate-y-1 hover:shadow-neo transition-all"
                  >
                    {t('app.cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 h-14 bg-primary text-white border-[3px] border-ink shadow-neo rounded-xl font-bold flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-neo-hover active:translate-y-1 active:shadow-none transition-all"
                  >
                    {t('app.saveChanges')}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-3xl font-display font-bold mb-4 pr-12 leading-tight">{event.title}</h2>
                
                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-[2px] border-ink bg-mem-1 flex items-center justify-center shadow-sm">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.date')}</div>
                      <div className="font-bold text-lg">{event.date}</div>
                    </div>
                  </div>

                  {event.startTime && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-[2px] border-ink bg-mem-2 flex items-center justify-center shadow-sm">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.time')}</div>
                        <div className="font-bold text-lg">{event.startTime} {event.endTime ? `- ${event.endTime}` : ''}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-[2px] border-ink bg-mem-3 flex items-center justify-center shadow-sm">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-ink/60 mb-1.5">{t('app.members')}</div>
                      <div className="flex flex-wrap gap-2">
                        {members.map(m => (
                          <div key={m!.id} className={cn("px-3 py-1 rounded-full border-[2px] border-ink text-xs font-bold shadow-sm", m!.bgClass)}>
                            {m!.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      deleteEvent(event.id);
                      onClose();
                    }}
                    className="flex-1 h-14 bg-surface border-[3px] border-ink shadow-neo rounded-xl font-bold flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-neo-hover active:translate-y-1 active:shadow-none transition-all text-red-500"
                  >
                    <Trash2 className="w-5 h-5" /> 
                  </button>
                  <button 
                    onClick={handleDownloadIcs}
                    className="flex-1 h-14 bg-surface border-[3px] border-ink shadow-neo rounded-xl font-bold flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-neo-hover active:translate-y-1 active:shadow-none transition-all"
                    title={t('app.downloadIcs')}
                  >
                    <Download className="w-5 h-5" /> {t('app.ics')}
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 h-14 bg-primary text-white border-[3px] border-ink shadow-neo rounded-xl font-bold flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-neo-hover active:translate-y-1 active:shadow-none transition-all"
                  >
                    <Edit3 className="w-5 h-5" /> {t('app.edit')}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
