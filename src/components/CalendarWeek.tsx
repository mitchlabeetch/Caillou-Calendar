import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../lib/dateLocale';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isSameDay, isValid, isToday } from 'date-fns';
import { cn } from '../lib/utils';
import { CalendarEvent } from '../types';
import { useEvents } from '../lib/eventsContext';
import { X, CheckSquare, GripVertical, Layers, Gift } from 'lucide-react';
import { EventHoverCard } from './EventHoverCard';

export function CalendarWeek({ currentDate, onDateClick }: { currentDate: Date, onDateClick?: (d: Date) => void }) {
  const { t, i18n } = useTranslation();
  const { events, setEvents, moveEvent, deleteEvent, swapEvents, selectedMembers, setSelectedEventId, isMultiSelectMode, selectedEventIdsForDelete, toggleEventSelectionForDelete, familyMembers, settings, droppedEventId, triggerDropAnimation } = useEvents();

  const startDate = startOfWeek(currentDate, { weekStartsOn: settings.startOfWeek as any });
  const endDate = endOfWeek(currentDate, { weekStartsOn: settings.startOfWeek as any });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const dateOptions = { locale: getDateLocale(i18n.language) };

  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

  const [quickAdd, setQuickAdd] = useState<{ day: Date, hour: number } | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [dragOverSlot, setDragOverSlot] = useState<{ day: Date, hour: number } | null>(null);
  const [resizingEvent, setResizingEvent] = useState<{ id: string, newEndMins: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Memoised timed-event lookup keyed by `YYYY-MM-DD`. Recurrence
  // expansion is expensive; recomputing it for every cell on every render
  // is wasteful. Recomputes only when events or the member filter change.
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const visibleMembers = new Set(selectedMembers);

    const matchesDay = (e: CalendarEvent, dayStr: string, day: Date): boolean => {
      if (!e.date || !isValid(parseISO(e.date))) return false;
      if (!e.startTime || typeof e.startTime !== 'string') return false;
      if (e.exceptionDates?.includes(dayStr)) return false;
      if (!e.memberIds || !Array.isArray(e.memberIds)) return false;
      if (!e.memberIds.some(id => visibleMembers.has(id))) return false;
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
    };

    for (const day of days) {
      const dayStr = format(day, 'yyyy-MM-dd');
      map.set(dayStr, events.filter(e => matchesDay(e, dayStr, day)));
    }
    return map;
  }, [events, selectedMembers, days]);

  const getDayEvents = (day: Date): CalendarEvent[] => {
    return eventsByDay.get(format(day, 'yyyy-MM-dd')) ?? [];
  };

  return (
    <main className="flex-1 flex flex-col relative bg-bg-app p-1.5 sm:p-2 h-full min-h-0 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden rounded-xl sm:rounded-3xl shadow-neo-sm sm:shadow-neo border-[2px] sm:border-[4px] border-ink bg-surface relative">
        <div className="flex flex-col h-full min-w-[500px] md:min-w-[700px]">
          <div className="grid grid-cols-[30px_repeat(7,1fr)] sm:grid-cols-8 border-b-[2px] sm:border-b-[4px] border-ink shrink-0 bg-surface rounded-t-xl sm:rounded-t-3xl">
            <div className="flex items-end justify-center pb-2 text-ink/50 text-[10px] sm:text-xs font-bold uppercase border-r-[2px] sm:border-r-[4px] border-ink pt-2 sm:pt-3">{t('app.time')}</div>
            {days.map((day) => (
              <div 
                key={day.toString()} 
                className={cn(
                  "flex flex-col items-center border-r-[2px] sm:border-r-[4px] border-ink last:border-r-0 pt-2 sm:pt-3 pb-1 sm:pb-2 cursor-pointer transition-colors relative",
                  isSameDay(day, currentDate) ? "bg-primary/5 shadow-[inset_0_0_10px_rgba(0,0,0,0.05)] border-b-[2px] sm:border-b-[4px] border-b-primary z-10" : "hover:bg-black/5"
                )}
                onClick={() => onDateClick?.(day)}
              >
                <span className="text-[10px] sm:text-xs font-black text-ink uppercase opacity-60">{format(day, 'EEE', dateOptions)}</span>
                <span className={cn(
                  "text-sm sm:text-lg font-black w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full mt-0.5 sm:mt-1",
                  isToday(day) ? "bg-primary text-white border-[2px] sm:border-[3px] border-ink shadow-neo-sm" : ""
                )}>
                  {format(day, 'd')}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-surface rounded-b-xl sm:rounded-b-3xl">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-[30px_repeat(7,1fr)] sm:grid-cols-8 h-[60px] group relative">
            <div className="relative border-r-[2px] sm:border-r-[4px] border-ink pr-1 sm:pr-4 flex justify-end bg-surface">
              <span className="text-[9px] sm:text-sm font-bold text-ink/50 translate-y-[-50%] bg-surface px-0.5 sm:px-1 absolute top-0 mt-[2px] sm:mt-[2px]">
                {settings.timeFormat === '24h' ? `${hour.toString().padStart(2, '0')}:00` : (hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`)}
              </span>
            </div>
            {/* Hour lines */}
            {days.map((_, i) => (
              <div key={i} className="border-b-[1px] sm:border-b-[4px] border-ink/10 relative"></div>
            ))}
          </div>
        ))}
        
        {/* Absolute placed events overlay */}
        <div className="absolute top-0 left-[30px] sm:left-[12.5%] right-0 h-[900px] grid grid-cols-7 pointer-events-none">
          {days.map((day, i) => {
            const dayEvents = getDayEvents(day);
            return (
              <div 
                key={i} 
                className="col-span-1 relative pointer-events-auto border-r-[2px] sm:border-r-[4px] border-transparent cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const MathFloor = Math.floor(y / 60);
                  const targetHour = Math.max(7, Math.min(21, 7 + MathFloor));
                  
                  if (!dragOverSlot || dragOverSlot.day.getTime() !== day.getTime() || dragOverSlot.hour !== targetHour) {
                    setDragOverSlot({ day, hour: targetHour });
                  }
                }}
                onDragLeave={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
                    setDragOverSlot(null);
                  }
                }}
                onDoubleClick={(e) => {
                  if (e.target !== e.currentTarget) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const targetHour = Math.max(7, Math.min(21, 7 + Math.floor(y / 60)));
                  setQuickAdd({ day, hour: targetHour });
                  setQuickAddTitle('');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverSlot(null);
                  const eventId = e.dataTransfer.getData("text/plain");
                  if (eventId) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const MathFloor = Math.floor(y / 60);
                    const targetHour = Math.max(7, Math.min(21, 7 + MathFloor));
                    const timeStr = `${targetHour.toString().padStart(2, '0')}:00`;
                    moveEvent(eventId, format(day, 'yyyy-MM-dd'), timeStr);
                    triggerDropAnimation(eventId);
                  }
                }}
              >
                {(() => {
                  const sortedEvents = dayEvents
                    .map(evt => {
                      const startParts = evt.startTime!.split(':').map(Number);
                      const startMins = startParts[0] * 60 + (startParts[1] || 0);
                      
                      let endMins = startMins + 60; // default 1 hour
                      if (evt.endTime && typeof evt.endTime === 'string') {
                        const endParts = evt.endTime.split(':').map(Number);
                        endMins = Math.max(startMins + 30, endParts[0] * 60 + (endParts[1] || 0));
                      }
                      
                      return { evt, startMins, endMins };
                    })
                    .sort((a, b) => a.startMins - b.startMins || b.endMins - a.endMins);

                  const clusters: (typeof sortedEvents)[] = [];
                  let currentCluster: typeof sortedEvents = [];
                  let clusterEnd = 0;
                  
                  sortedEvents.forEach(item => {
                    if (currentCluster.length === 0) {
                      currentCluster.push(item);
                      clusterEnd = item.endMins;
                    } else if (item.startMins < clusterEnd) {
                      currentCluster.push(item);
                      clusterEnd = Math.max(clusterEnd, item.endMins);
                    } else {
                      clusters.push(currentCluster);
                      currentCluster = [item];
                      clusterEnd = item.endMins;
                    }
                  });
                  if (currentCluster.length > 0) {
                    clusters.push(currentCluster);
                  }
                  
                  return clusters.flatMap(cluster => {
                     const cols: typeof sortedEvents[] = [];
                     cluster.forEach(item => {
                       let placed = false;
                       for (let i = 0; i < cols.length; i++) {
                         const col = cols[i];
                         if (col[col.length - 1].endMins <= item.startMins) {
                           col.push(item);
                           placed = true;
                           break;
                         }
                       }
                       if (!placed) cols.push([item]);
                     });
                     
                     return cols.flatMap((col, colIdx) => {
                       return col.map(item => {
                         const evt = item.evt;
                         const top = ((item.startMins - 7 * 60) / 60) * 60;
                         let height = ((item.endMins - item.startMins) / 60) * 60;
                         if (resizingEvent?.id === evt.id) {
                           height = ((resizingEvent.newEndMins - item.startMins) / 60) * 60;
                         }
                         // Prevent events from overflowing past 9 PM (14 * 60 + 60) = 900px max height
                         if (top + height > 900) height = 900 - top;
                         
                         const activeMem = familyMembers.find(m => evt.memberIds[0] === m.id);
                         const widthPercent = 100 / cols.length;
                         const leftPercent = colIdx * widthPercent;
                         
                         const isSelected = selectedEventIdsForDelete.includes(evt.id);

                         return (
                           <motion.div 
                             layout
                             layoutId={`event-${evt.id}-${format(day, 'yyyy-MM-dd')}`}
                             initial={{ opacity: 0.8, scale: 0.95 }}
                             animate={{ 
                               opacity: 1, 
                               scale: droppedEventId === evt.id ? [1, 1.15, 1] : 1 
                             }}
                             transition={{ 
                               scale: { duration: 0.4, ease: "easeInOut" },
                               layout: { type: "spring", stiffness: 350, damping: 25 }
                             }}
                             key={evt.id} 
                             draggable={!isMobile && !isMultiSelectMode}
                             drag={isMobile && !isMultiSelectMode ? "x" : false}
                             dragConstraints={{ left: 0, right: 0 }}
                             dragElastic={0.8}
                             onDragEnd={isMobile ? (_e, info) => {
                               if (info.offset.x < -80 || info.offset.x > 80) {
                                 deleteEvent(evt.id);
                               }
                             } : undefined}
                             onDragStart={(e: any) => {
                               if (isMobile) return e.preventDefault();
                               e.dataTransfer.setData("text/plain", evt.id);
                               e.dataTransfer.effectAllowed = "move";
                             }}
                             onDragOver={(e: any) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "move"; }}
                             onDrop={(e: any) => {
                               e.preventDefault();
                               e.stopPropagation();
                               const draggedId = e.dataTransfer.getData("text/plain");
                               if (draggedId && draggedId !== evt.id) {
                                 swapEvents(draggedId, evt.id);
                               }
                             }}
                             onClick={(e) => {
                               e.stopPropagation();
                               if (isMultiSelectMode) {
                                 toggleEventSelectionForDelete(evt.id);
                               } else {
                                 setSelectedEventId(evt.id);
                               }
                             }}
                             className={cn(
                               "absolute rounded-lg sm:rounded-xl border-[2px] sm:border-[3px] p-1 sm:p-2 shadow-neo-sm sm:shadow-neo cursor-pointer transition-transform hover:scale-[1.02] hover:z-50 group overflow-visible flex flex-col items-start justify-start text-left",
                               activeMem?.bgClass || "bg-surface text-ink",
                               isSelected ? "border-primary opacity-90 scale-95" : "border-ink",
                               evt.recurrence && evt.recurrence.type !== 'none' ? "border-dashed" : "border-solid"
                             )}
                             style={{ 
                               top: `${top}px`, 
                               left: cols.length > 1 ? `calc(${leftPercent}% + 2px)` : '2px',
                               width: cols.length > 1 ? `calc(${widthPercent}% - 4px)` : 'calc(100% - 4px)',
                               height: `${height}px`,
                               minHeight: '24px', 
                               zIndex: 10 + colIdx 
                             }}
                           >
                              {cols.length > 1 && (
                                <div className="absolute top-1 right-1 opacity-60 z-10 w-5 h-5 flex items-center justify-center bg-white/20 border border-ink/10 rounded-md pointer-events-none group-hover:opacity-0 transition-opacity backdrop-blur-sm" title="Overlapping event">
                                  <Layers className="w-3 h-3" />
                                </div>
                              )}
                              {!isMultiSelectMode && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteEvent(evt.id); }}
                                  className="absolute top-1 right-1 w-5 h-5 bg-red-400 text-white rounded-full border-[2px] border-ink opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 transition-all hover:scale-110 shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                              {isSelected && (
                                <div className="absolute top-1 right-1 bg-primary text-white rounded-md z-20">
                                  <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                              )}
                              <div className="text-[9px] sm:text-[10px] font-bold opacity-70 leading-none mb-0.5 flex items-center gap-1 shrink-0">
                                 {!isMultiSelectMode && <GripVertical className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-60 shrink-0 cursor-grab active:cursor-grabbing" />}
                                 {evt.startTime} {resizingEvent?.id === evt.id ? `- ${Math.floor(resizingEvent.newEndMins / 60).toString().padStart(2, '0')}:${(resizingEvent.newEndMins % 60).toString().padStart(2, '0')}` : (evt.endTime ? `- ${evt.endTime}` : '')}
                              </div>
                              <div className="text-[10px] sm:text-xs font-bold leading-tight line-clamp-2 w-full flex items-start gap-1">
                                {evt.title}
                                {evt.isBirthday && <Gift className="w-3 h-3 text-pink-500 fill-pink-500/20 shrink-0 inline-block mt-0.5" />}
                              </div>
                              {/* Hover Card acts as tooltip, positioned absolutely so it won't be clamped by event bounds */}
                              <EventHoverCard event={evt} />
                              
                              {!isMultiSelectMode && (
                                <div 
                                  className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-4 w-12 cursor-ns-resize z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity lg:hover:scale-110 touch-none"
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    const target = e.currentTarget;
                                    target.setPointerCapture(e.pointerId);
                                    
                                    const startY = e.clientY;
                                    const initialEndMins = item.endMins;
                                    
                                    const handlePointerMove = (moveEvent: PointerEvent) => {
                                      const deltaY = moveEvent.clientY - startY;
                                      const newEndMins = Math.max(item.startMins + 15, Math.min(24 * 60, initialEndMins + deltaY));
                                      const snappedEndMins = Math.round(newEndMins / 15) * 15;
                                      setResizingEvent({ id: evt.id, newEndMins: snappedEndMins });
                                    };
                                    
                                    const handlePointerUp = (upEvent: PointerEvent) => {
                                      target.releasePointerCapture(upEvent.pointerId);
                                      target.removeEventListener('pointermove', handlePointerMove);
                                      target.removeEventListener('pointerup', handlePointerUp);
                                      
                                      setResizingEvent(current => {
                                        if (current && current.id === evt.id) {
                                          const hrs = Math.floor(current.newEndMins / 60);
                                          const mins = current.newEndMins % 60;
                                          const newEndTime = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                                          setEvents(prev => prev.map(e => e.id === evt.id ? { ...e, endTime: newEndTime } : e));
                                        }
                                        return null;
                                      });
                                    };
                                    
                                    target.addEventListener('pointermove', handlePointerMove);
                                    target.addEventListener('pointerup', handlePointerUp);
                                  }}
                                >
                                  <div className={cn("w-8 h-2.5 border-[2px] border-ink rounded-full shadow-neo-sm flex items-center justify-center gap-[2px]", activeMem?.bgClass || "bg-surface")}>
                                    <div className="w-[3px] h-[3px] bg-ink rounded-full opacity-60"></div>
                                    <div className="w-[3px] h-[3px] bg-ink rounded-full opacity-60"></div>
                                    <div className="w-[3px] h-[3px] bg-ink rounded-full opacity-60"></div>
                                  </div>
                                </div>
                              )}
                           </motion.div>
                         )
                       });
                     });
                  });
                })()}
                
                {dragOverSlot && dragOverSlot.day.getTime() === day.getTime() && (
                  <div
                    className="absolute z-10 bg-primary/20 border-2 border-primary rounded-xl pointer-events-none transition-all duration-75"
                    style={{ 
                      top: `${(dragOverSlot.hour - 7) * 60}px`, 
                      height: '60px',
                      left: '2px',
                      width: 'calc(100% - 4px)'
                    }}
                  />
                )}
                
                {quickAdd && quickAdd.day.getTime() === day.getTime() && (
                  <div
                    className="absolute z-50 bg-bg-app border-[2px] sm:border-[3px] border-primary rounded-lg sm:rounded-xl shadow-neo p-2 flex flex-col justify-center animate-in zoom-in-95 duration-200"
                    style={{ 
                      top: `${(quickAdd.hour - 7) * 60}px`, 
                      height: '60px',
                      left: '2px',
                      width: 'calc(100% - 4px)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[9px] sm:text-[10px] font-black opacity-60 uppercase mb-0.5 tracking-wider">
                      {settings.timeFormat === '24h' 
                        ? `${quickAdd.hour.toString().padStart(2, '0')}:00` 
                        : (quickAdd.hour > 12 ? `${quickAdd.hour - 12} PM` : quickAdd.hour === 12 ? '12 PM' : `${quickAdd.hour} AM`)
                      }
                    </div>
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
                             startTime: `${quickAdd.hour.toString().padStart(2, '0')}:00`,
                             memberIds: selectedMembers.length > 0 ? [selectedMembers[0]] : familyMembers.map(m=>m.id),
                             recurrence: { type: 'none' },
                             reminders: []
                           };
                           setEvents(prev => [...prev, newEvent]);
                           setQuickAdd(null);
                           setQuickAddTitle('');
                        } else if (e.key === 'Escape') {
                           setQuickAdd(null);
                           setQuickAddTitle('');
                        }
                      }}
                      onBlur={() => {
                        setQuickAdd(null);
                        setQuickAddTitle('');
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      </div>
      </div>
    </main>
  );
}
