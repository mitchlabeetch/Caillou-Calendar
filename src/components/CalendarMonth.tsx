import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { format, startOfMonth, startOfWeek, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isToday, parseISO, isSameDay, isValid } from 'date-fns';
import { cn } from '../lib/utils';
import { CalendarEvent, FamilyMember } from '../types';
import { useEvents } from '../lib/eventsContext';
import { X, Clock, Repeat, BellRing, CheckSquare, GripVertical, Gift } from 'lucide-react';
import { EventHoverCard } from './EventHoverCard';
import { useIsMobile } from '../hooks/useIsMobile';

export function CalendarMonth({ currentDate, onDateClick }: { currentDate: Date, onDateClick?: (d: Date) => void }) {
  const { t } = useTranslation();
  const { events, setEvents, moveEvent, selectedMembers, familyMembers, settings, triggerDropAnimation } = useEvents();
  const isMobile = useIsMobile();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: settings.startOfWeek as any });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: settings.startOfWeek as any });

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [quickAddDay, setQuickAddDay] = useState<Date | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const clickTimeoutRef = React.useRef<any>(null);

  const getDayEvents = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events.filter(e => {
      if (!e || !e.date || !isValid(parseISO(e.date))) return false;
      if (!e.memberIds || !Array.isArray(e.memberIds) || !e.memberIds.some(id => selectedMembers.includes(id))) return false;
      if (e.exceptionDates?.includes(dayStr)) return false;
      
      const eDate = parseISO(e.date);
      
      if (e.isBirthday || e.recurrence?.type === 'yearly') {
        return eDate.getMonth() === day.getMonth() && eDate.getDate() === day.getDate() && dayStr >= e.date;
      }

      if (e.recurrence?.type === 'monthly') {
        return eDate.getDate() === day.getDate() && dayStr >= e.date;
      }
      
      if (e.recurrence?.type === 'weekly') {
        return eDate.getDay() === day.getDay() && dayStr >= e.date;
      }

      if (e.recurrence?.type === 'daily') {
        return dayStr >= e.date;
      }
      
      if (e.endDate && isValid(parseISO(e.endDate))) {
        return dayStr >= e.date && dayStr <= e.endDate;
      }
      return e.date === dayStr;
    });
  };

  return (
    <main className="flex-1 flex flex-col relative bg-[#fcffe4] p-2 h-full min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden">
        <div className="grid grid-cols-7 mb-1 sm:mb-2 shrink-0 min-w-[500px] md:min-w-[700px]">
          {(t('app.daysShort', { returnObjects: true }) as string[]).map((d) => (
            <div key={d} className="py-2 sm:py-3 text-center font-bold text-ink uppercase text-xs sm:text-base tracking-wider">
              {d}
            </div>
          ))}
        </div>
        
        <div className="flex-1 grid grid-cols-7 pb-6 overflow-y-auto overflow-x-hidden min-w-[500px] md:min-w-[700px]">
        {days.map((day, i) => {
          const formattedDate = format(day, dateFormat);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);
          const isFocusedDate = isSameDay(day, currentDate);
          const dayEvents = getDayEvents(day);

          return (
            <motion.div 
              layout
              key={day.toString()} 
              onClick={(e) => {
                if (e.detail === 1) {
                  clickTimeoutRef.current = setTimeout(() => {
                    onDateClick?.(day);
                  }, 250);
                } else if (e.detail === 2) {
                  clearTimeout(clickTimeoutRef.current);
                  setQuickAddDay(day);
                  setQuickAddTitle('');
                }
              }}
              onDragOver={(e: any) => { 
                e.preventDefault(); 
                e.dataTransfer.dropEffect = "move"; 
                if (dragOverDay !== day.toString()) setDragOverDay(day.toString());
              }}
              onDragLeave={(e: any) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
                  setDragOverDay(null);
                }
              }}
              onDrop={(e: any) => {
                e.preventDefault();
                setDragOverDay(null);
                const eventId = e.dataTransfer.getData("text/plain");
                if (eventId) {
                  moveEvent(eventId, format(day, 'yyyy-MM-dd'));
                  triggerDropAnimation(eventId);
                }
              }}
              whileHover={{ scale: dragOverDay === day.toString() ? 1 : 1.02, zIndex: 5 }}
              animate={{ 
                scale: dragOverDay === day.toString() ? 1.05 : 1,
                boxShadow: dragOverDay === day.toString() ? "0px 10px 20px rgba(0,0,0,0.2)" : "4px 4px 0px rgba(26,26,26,0.05)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "calendar-grid-cell pt-3 pr-4 pb-2 pl-2 sm:pt-4 sm:pr-5 sm:pb-3 sm:pl-3 flex flex-col gap-1 sm:gap-2 cursor-pointer transition-colors min-h-[100px] sm:min-h-[150px] md:min-h-[200px] border-2",
                dragOverDay === day.toString() ? "bg-primary/20 border-primary ring-2 ring-primary ring-inset z-20" : 
                isFocusedDate ? "border-primary/50 ring-2 ring-primary/30 ring-inset bg-surface/80 shadow-[inset_0_0_10px_rgba(0,0,0,0.05)] z-10" : "border-transparent",
                !dragOverDay || dragOverDay !== day.toString() ? (
                  isTodayDate ? "bg-mem-3/40" :
                  !isCurrentMonth ? "bg-surface/50 text-ink/50" : "bg-surface"
                ) : ""
              )}
            >
              <div className={cn("flex justify-end mb-1")}>
                {isTodayDate ? (
                  <div className="w-7 h-7 sm:w-10 sm:h-10 bg-mem-3 border-[2px] sm:border-[3px] border-ink rounded-full flex items-center justify-center font-bold text-sm sm:text-xl shadow-[2px_2px_0px_#1A1A1A] sm:shadow-[3px_3px_0px_#1A1A1A]">
                    {formattedDate}
                  </div>
                ) : (
                  <div className="text-right font-bold text-sm sm:text-xl mb-1">{formattedDate}</div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 mt-1 overflow-visible">
                {dayEvents.map(event => (
                  <React.Fragment key={event.id}>
                    <EventPill event={event} dayStr={format(day, 'yyyy-MM-dd')} isMobile={isMobile} />
                  </React.Fragment>
                ))}
              </div>
              
              {quickAddDay && quickAddDay.getTime() === day.getTime() && (
                  <div
                    className="absolute z-50 bg-surface border-[2px] sm:border-[3px] border-primary rounded-lg sm:rounded-xl shadow-[4px_4px_0px_#1A1A1A] p-2 flex flex-col justify-center animate-in zoom-in-95 duration-200"
                    style={{ 
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 'calc(100% - 10px)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder={t('app.titlePlaceholder')}
                      className="w-full bg-transparent outline-none font-black text-xs sm:text-sm text-ink placeholder:text-ink/40 focus:ring-2 focus:ring-primary focus:border-primary border-transparent rounded px-1 transition-all"
                      value={quickAddTitle}
                      onChange={e => setQuickAddTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && quickAddTitle.trim()) {
                           const newEvent: CalendarEvent = {
                             id: Math.random().toString(36).substring(7),
                             title: quickAddTitle.trim(),
                             date: format(day, 'yyyy-MM-dd'),
                             memberIds: selectedMembers.length > 0 ? [selectedMembers[0]] : familyMembers.map(m=>m.id),
                             recurrence: { type: 'none' },
                             reminders: []
                           };
                           setEvents(prev => [...prev, newEvent]);
                           setQuickAddDay(null);
                           setQuickAddTitle('');
                        } else if (e.key === 'Escape') {
                           setQuickAddDay(null);
                           setQuickAddTitle('');
                        }
                      }}
                      onBlur={() => {
                        setQuickAddDay(null);
                        setQuickAddTitle('');
                      }}
                    />
                  </div>
                )}
            </motion.div>
          );
        })}
      </div>
      </div>
    </main>
  );
}

function EventPill({ event, dayStr, isMobile }: { event: CalendarEvent, dayStr?: string, isMobile: boolean }) {
  const { deleteEvent, swapEvents, setSelectedEventId, isMultiSelectMode, selectedEventIdsForDelete, toggleEventSelectionForDelete, familyMembers, droppedEventId, userRole } = useEvents();
  const members = event.memberIds.map(id => familyMembers.find(m => m.id === id)).filter(Boolean) as FamilyMember[];

  const isSelected = selectedEventIdsForDelete.includes(event.id);

  let spanClass = "rounded-lg sm:rounded-xl";
  let spanClassNonThumb = "rounded-full";
  if (dayStr && event.endDate && event.date !== event.endDate) {
    if (dayStr === event.date) {
      spanClass = "rounded-r-none border-r-0 mr-[-8px] z-[5] pe-2";
      spanClassNonThumb = "rounded-r-none border-r-0 mr-[-8px] z-[5] pe-4";
    } else if (dayStr === event.endDate) {
      spanClass = "rounded-l-none border-l-0 ml-[-8px] z-[5] ps-2";
      spanClassNonThumb = "rounded-l-none border-l-0 ml-[-8px] z-[5] ps-4";
    } else if (dayStr > event.date && dayStr < event.endDate) {
      spanClass = "rounded-none border-x-0 mx-[-8px] z-[4] px-2";
      spanClassNonThumb = "rounded-none border-x-0 mx-[-8px] z-[4] px-4";
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", event.id);
    e.dataTransfer.effectAllowed = "move";
  };
  
  if(event.thumbnailUrl) {
    return (
      <motion.div 
        layout
        layoutId={`event-${event.id}-${dayStr || ''}`}
        initial={{ opacity: 0.8, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: droppedEventId === event.id ? [1, 1.15, 1] : 1 
        }}
        transition={{ 
          scale: { duration: 0.4, ease: "easeInOut" },
          layout: { type: "spring", stiffness: 350, damping: 25 }
        }}
        draggable={!isMultiSelectMode && userRole !== 'child'}
        onDragStart={(e: any) => handleDragStart(e)}
        onDragOver={(e: any) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "move"; }}
        onDrop={(e: any) => {
          e.preventDefault();
          e.stopPropagation();
          const draggedId = e.dataTransfer.getData("text/plain");
          if (draggedId && draggedId !== event.id) {
            swapEvents(draggedId, event.id);
          }
        }}
        onClick={(e) => { 
          e.stopPropagation(); 
          if (isMultiSelectMode) {
            toggleEventSelectionForDelete(event.id);
          } else {
            setSelectedEventId(event.id); 
          }
        }}
        className={cn(`h-[70px] sm:h-[100px] w-full border-[2px] sm:border-[3px] p-1 sm:p-1.5 flex flex-col gap-1 shadow-[2px_2px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A] transition-all cursor-pointer relative group pill-hover-effect mt-1`, 
          spanClass,
          members[0]?.bgClass || "bg-mem-3",
          isSelected ? "border-primary opacity-90 scale-95" : "border-ink",
          event.recurrence && event.recurrence.type !== 'none' ? "border-dashed" : "border-solid"
        )}
      >
        {!isMultiSelectMode && userRole !== 'child' && (
          <button 
            onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-400 text-white rounded-full border-[2px] border-ink opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 hover:scale-110 transition-all shadow-neo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isSelected && (
          <div className="absolute top-1 left-1 bg-primary text-white rounded-md z-20">
            <CheckSquare className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 w-full overflow-hidden rounded-lg relative">
           <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${event.thumbnailUrl}')` }}></div>
        </div>
        <div className="text-[10px] font-bold truncate px-1 shrink-0 flex gap-1 items-center">
          <GripVertical className="w-3 h-3 opacity-40 shrink-0 cursor-grab active:cursor-grabbing" />
          {event.title}
          {event.isBirthday ? (
            <Gift className="w-3 h-3 text-pink-500 fill-pink-500/20 ml-auto" />
          ) : (
            event.recurrence && event.recurrence.type !== 'none' && <Repeat className="w-2.5 h-2.5 opacity-50 ml-auto" />
          )}
        </div>
        {!isMobile && <EventHoverCard event={event} />}
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      layoutId={`event-${event.id}-${dayStr || ''}`}
      initial={{ opacity: 0.8, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: droppedEventId === event.id ? [1, 1.15, 1] : 1 
      }}
      transition={{ 
        scale: { duration: 0.4, ease: "easeInOut" },
        layout: { type: "spring", stiffness: 350, damping: 25 }
      }}
      draggable={!isMultiSelectMode && userRole !== 'child'}
      onDragStart={(e: any) => handleDragStart(e)}
      onDragOver={(e: any) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "move"; }}
      onDrop={(e: any) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData("text/plain");
        if (draggedId && draggedId !== event.id) {
          swapEvents(draggedId, event.id);
        }
      }}
      className={cn(
        "h-[36px] w-full border-[3px] px-4 flex justify-between items-center shadow-[3px_3px_0px_#1A1A1A] transition-all cursor-pointer relative group pill-hover-effect overflow-visible z-10",
        spanClassNonThumb,
        members.length === 1 ? members[0].bgClass : "bg-bg-light",
        isSelected ? "border-primary opacity-90 scale-95" : "border-ink",
        event.recurrence && event.recurrence.type !== 'none' ? "border-dashed" : "border-solid"
      )}
      style={members.length > 1 ? { background: 'repeating-linear-gradient(45deg, #B39DDB, #B39DDB 10px, #80CBC4 10px, #80CBC4 20px, #FFAB91 20px, #FFAB91 30px, #F48FB1 30px, #F48FB1 40px)' } : {}}
      onClick={(e) => { 
        e.stopPropagation(); 
        if (isMultiSelectMode) {
          toggleEventSelectionForDelete(event.id);
        } else {
          setSelectedEventId(event.id); 
        }
      }}
    >
      <div className="flex items-center gap-2 overflow-hidden w-full">
        {!isMultiSelectMode && <GripVertical className="w-3.5 h-3.5 opacity-40 shrink-0 cursor-grab active:cursor-grabbing" />}
        {isSelected && <CheckSquare className="w-4 h-4 text-primary shrink-0" />}
        <span className="text-sm font-bold text-ink truncate whitespace-nowrap text-ellipsis mr-1 max-w-full">
          {event.title}
        </span>
      </div>
      <div className="flex gap-1 shrink-0">
        {event.reminders && event.reminders.length > 0 && <BellRing className="w-3.5 h-3.5 opacity-60" />}
        {event.isBirthday ? (
          <Gift className="w-3.5 h-3.5 text-pink-500 fill-pink-500/20" />
        ) : (
          event.recurrence && event.recurrence.type !== 'none' && <Repeat className="w-3.5 h-3.5 opacity-60" />
        )}
      </div>
      
      {!isMultiSelectMode && userRole !== 'child' && (
        <button 
          onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-red-400 text-white rounded-full border-[2px] border-ink opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 hover:scale-110 transition-all shadow-neo"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      {!isMobile && <EventHoverCard event={event} />}
    </motion.div>
  );
}
