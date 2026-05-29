import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { X, ImagePlus, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEvents } from '../lib/eventsContext';
import { CalendarEvent, Recurrence, Reminder } from '../types';

export function AddEventModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [selectedMems, setSelectedMems] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<Recurrence['type']>('none');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isBirthday, setIsBirthday] = useState(false);
  
  const { setEvents, showToast, events, familyMembers } = useEvents();
  
  const uniqueLocations = Array.from(new Set(events.filter(e => e.location).map(e => e.location as string))).slice(0, 5);

  const suggestedEvents = title.length > 1 
    ? events
        .filter(e => e.title.toLowerCase().includes(title.toLowerCase()) && e.title.toLowerCase() !== title.toLowerCase())
        .reduce((acc, current) => {
          if (!acc.find(item => item.title.toLowerCase() === current.title.toLowerCase())) {
            acc.push(current);
          }
          return acc;
        }, [] as CalendarEvent[])
        .slice(0, 3)
    : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  if(!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center lg:items-end lg:justify-end lg:p-8 p-0 sm:p-4 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto"
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative pointer-events-auto bg-surface border-[4px] border-ink sm:rounded-3xl rounded-none sm:shadow-[8px_8px_0px_#1A1A1A] w-full h-[100dvh] sm:h-auto sm:max-w-md p-6 lg:p-8 sm:max-h-[90vh] overflow-y-auto flex flex-col pt-12 sm:pt-6"
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-black">{t('app.addEvent')}</h2>
            <button onClick={onClose} className="text-2xl font-bold opacity-30 hover:opacity-100 transition-opacity">
              <X className="w-6 h-6" />
            </button>
          </div>

          <motion.form 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4" 
            onSubmit={e => { 
            e.preventDefault(); 
            if (!title || !date || selectedMems.length === 0) return;
            const newEvent: CalendarEvent = {
              id: Math.random().toString(36).substring(7),
              title,
              date,
              endDate: endDate || undefined,
              startTime: time || undefined,
              location: location || undefined,
              memberIds: selectedMems,
              recurrence: { type: isBirthday ? 'yearly' : recurrence },
              reminders,
              isBirthday,
            };
            
            import('../lib/eventsService').then(s => s.addEventToFirestore(newEvent));
            setEvents(prev => [...prev, newEvent]);
            
            if (reminders.length > 0) {
              showToast(t('app.reminderSet', { title }));
            }

            // reset
            setTitle('');
            setDate('');
            setEndDate('');
            setTime('');
            setLocation('');
            setSelectedMems([]);
            setRecurrence('none');
            setReminders([]);
            setIsBirthday(false);

            onClose(); 
          }}>
            <motion.div variants={itemVariants} className="flex flex-col gap-1 relative z-50">
              <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.title')}</label>
              <input 
                autoFocus
                placeholder={t('app.titlePlaceholderEvent', 'e.g. Soccer Practice')}
                className="w-full rounded-xl border-[2px] border-ink/20 focus:border-ink focus:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-surface p-3 font-bold text-lg outline-none relative z-10"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              {suggestedEvents.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border-[2px] border-ink shadow-[4px_4px_0px_#1A1A1A] rounded-xl overflow-hidden z-50 flex flex-col max-h-[150px] overflow-y-auto">
                  {suggestedEvents.map(evt => (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => {
                          setTitle(evt.title);
                          if (evt.startTime) setTime(evt.startTime);
                          if (evt.location) setLocation(evt.location);
                          if (evt.memberIds) setSelectedMems(evt.memberIds);
                        }}
                        className="text-left px-3 py-2 border-b-[2px] border-ink/10 last:border-b-0 hover:bg-ink/5 transition-colors flex items-center justify-between"
                      >
                        <span className="font-bold flex-1 truncate pr-2">{evt.title}</span>
                        <div className="text-[10px] sm:text-xs text-ink/60 font-medium font-mono flex items-center gap-2 shrink-0">
                          {evt.startTime && <span>{evt.startTime}</span>}
                          {evt.memberIds && evt.memberIds.length > 0 && (
                            <div className="flex gap-0.5">
                               {evt.memberIds.map(mId => {
                                 const mem = familyMembers.find(f => f.id === mId);
                                 if (!mem) return null;
                                 return (
                                   <div key={mId} className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-ink font-black border-[1px] border-ink", mem.bgClass)}>
                                     {mem.name[0]}
                                   </div>
                                 )
                               })}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.location')}</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                <input 
                  placeholder={t('app.locationPlaceholder', 'Where is it?')}
                  className="w-full rounded-xl border-[2px] border-ink/20 focus:border-ink focus:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-surface p-3 pl-11 font-bold text-base outline-none placeholder:font-medium"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
              {uniqueLocations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {uniqueLocations.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className="text-[10px] font-bold px-2 py-1 bg-ink/5 rounded-md hover:bg-ink/10 transition-colors border border-ink/10"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.startDate', 'Start')}</label>
                <input 
                  type="date" 
                  value={date} onChange={e => {
                    setDate(e.target.value);
                    if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full rounded-xl border-[2px] border-ink/20 focus:border-ink focus:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-surface p-2 sm:p-3 text-sm sm:text-base font-bold outline-none" 
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-ink/60">{t('app.endDate', 'End (Opt)')}</label>
                <input 
                  type="date" 
                  min={date}
                  value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded-xl border-[2px] border-ink/20 focus:border-ink focus:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-surface p-2 sm:p-3 text-sm sm:text-base font-bold outline-none" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.time')}</label>
                <input 
                  type="time" 
                  value={time} onChange={e => setTime(e.target.value)}
                  className="w-full rounded-xl border-[2px] border-ink/20 focus:border-ink focus:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-surface p-2 sm:p-3 text-sm sm:text-base font-bold outline-none" 
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 cursor-pointer group w-max">
                <div className={cn(
                  "w-5 h-5 rounded-md border-[2px] transition-all flex items-center justify-center relative shadow-[2px_2px_0px_#1A1A1A]",
                  isBirthday ? "bg-primary border-ink" : "bg-surface border-ink/40 group-hover:border-ink/80"
                )}>
                  {isBirthday && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-ink rounded-sm transform rotate-45" />
                    </motion.div>
                  )}
                </div>
                <input 
                  type="checkbox"
                  className="hidden"
                  checked={isBirthday}
                  onChange={e => setIsBirthday(e.target.checked)}
                />
                <span className="font-bold text-sm text-ink/80 select-none">Mark as Birthday (Repeats Yearly)</span>
              </label>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
              <div className={cn("flex flex-col gap-1.5", isBirthday && "opacity-50 pointer-events-none")}>
                <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.recurrence')}</label>
                <select 
                  value={isBirthday ? 'yearly' : recurrence} onChange={e => setRecurrence(e.target.value as any)}
                  className="w-full rounded-xl border-[2px] border-ink/20 focus:border-ink focus:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-surface p-3 text-base font-bold outline-none appearance-none cursor-pointer hover:border-ink/50"
                  disabled={isBirthday}
                >
                  <option value="none">{t('app.doesNotRepeat')}</option>
                  <option value="daily">{t('app.daily')}</option>
                  <option value="weekly">{t('app.weekly')}</option>
                  <option value="monthly">{t('app.monthly')}</option>
                  <option value="yearly">{t('app.yearly')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.reminder')}</label>
                <select 
                  value={reminders[0] || 'none'} 
                  onChange={e => setReminders(e.target.value === 'none' ? [] : [e.target.value as Reminder])}
                  className="w-full rounded-xl border-[2px] border-ink/20 focus:border-ink focus:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-surface p-3 text-base font-bold outline-none appearance-none cursor-pointer hover:border-ink/50"
                >
                  <option value="none">{t('app.noReminder')}</option>
                  <option value="15m">{t('app.minsBefore15')}</option>
                  <option value="1h">{t('app.hourBefore1')}</option>
                  <option value="1d">{t('app.dayBefore1')}</option>
                </select>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.who')}</label>
              <div className="flex flex-wrap gap-2">
                {familyMembers.map(mem => {
                  const isSel = selectedMems.includes(mem.id);
                  return (
                    <button 
                      type="button"
                      key={mem.id}
                      onClick={() => setSelectedMems(s => s.includes(mem.id) ? s.filter(x => x !== mem.id) : [...s, mem.id])}
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
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
               <label className="text-xs font-black uppercase tracking-widest text-ink/60">{t('app.memoryPhoto')}</label>
               <div className="w-full h-24 border-[2px] border-dashed border-ink/40 rounded-xl flex items-center justify-center bg-transparent cursor-pointer hover:bg-ink/5 hover:border-ink/80 transition-all">
                  <span className="text-sm font-black text-ink/40">{t('app.uploadThumbnail')}</span>
               </div>
            </motion.div>

            <motion.button variants={itemVariants} type="submit" className="w-full py-3 bg-primary text-white border-[3px] border-ink shadow-[4px_4px_0px_#1A1A1A] rounded-xl font-black text-sm uppercase hover:shadow-[6px_6px_0px_#1A1A1A] hover:-translate-y-0.5 active:shadow-[0px_0px_0px_#1A1A1A] active:translate-y-1 transition-all">
              {t('app.saveToCalendar')}
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
