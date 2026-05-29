/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, createContext, useContext, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CalendarMonth } from './components/CalendarMonth';
import { CalendarWeek } from './components/CalendarWeek';
import { AddEventModal } from './components/AddEventModal';
import { EventDetailModal } from './components/EventDetailModal';
import { DayEventsModal } from './components/DayEventsModal';
import { ReminderSystem } from './components/ReminderSystem';
import { format, addMonths, subMonths, addWeeks, subWeeks, isSameMonth, isSameWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, AlertCircle, BellRing, CheckSquare, Trash2, Download, Printer, Menu, RefreshCw } from 'lucide-react';
import { cn } from './lib/utils';
import { exportEventsToICS } from './lib/exportIcs';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from './lib/dateLocale';
import { mockEvents, familyMembers } from './data/mockData';
import { CalendarEvent, FamilyMember, AppSettings, UserRole } from './types';
import { EventsContext, useEvents } from './lib/eventsContext';
import { localDb, flushOutboundSyncQueue } from './lib/localDb';
import { syncInsert, syncUpdate, syncDelete } from './lib/syncEngine';
import { canBulkDelete, canManageFamily, canManageSettings } from './lib/permissions';
import { useIsMobile } from './hooks/useIsMobile';
import { CalendarAgenda } from './components/CalendarAgenda';
import { MemberFilterBar } from './components/MemberFilterBar';

interface AppProps {
  timeZone?: string;
}

function InteractiveLogo({ onClick, familyMembers = [] }: { onClick?: () => void, familyMembers?: any[] }) {
  const lastTrigger = useRef(0);
  const [rotation, setRotation] = useState(0);

  const handleMouseEnter = () => {
    const now = Date.now();
    if (now - lastTrigger.current >= 2000) {
      lastTrigger.current = now;
      setRotation(prev => prev + 360);
    }
  };

  const colors = familyMembers.map(m => m.color || m.bgClass || 'bg-surface').slice(0, 4);

  return (
    <div className="relative group flex items-center justify-center">
      <motion.div 
        className="w-14 h-14 grid grid-cols-2 grid-rows-2 p-1 gap-0.5 cursor-pointer origin-center"
        onMouseEnter={handleMouseEnter}
        onClick={onClick}
        animate={{ rotate: rotation }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        {colors.map((color, i) => (
           <div key={`color-${i}`} className={cn("rounded-full w-full h-full border-[1.5px] border-ink", color)}></div>
        ))}
        {[...Array(Math.max(0, 4 - colors.length))].map((_, i) => (
           <div key={`empty-${i}`} className="bg-surface rounded-full w-full h-full border-[1.5px] border-ink/30"></div>
        ))}
      </motion.div>
      <div className="absolute top-0 left-full ml-4 -mt-1 bg-ink text-surface text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity delay-[2000ms] whitespace-nowrap pointer-events-none z-[100]">
        {useTranslation().t('app.backToToday')}
        <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 border-[4px] border-transparent border-r-ink w-0 h-0"></div>
      </div>
    </div>
  );
}

export default function App({ timeZone = 'Europe/Paris' }: AppProps) {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'month'|'week'>(() => {
    try {
      return (localStorage.getItem('calendarView') as 'month'|'week') || 'month';
    } catch {
      return 'month';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('calendarView', view);
    } catch {}
  }, [view]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [direction, setDirection] = useState(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const isMobile = useIsMobile();

  useEffect(() => {
    import('./lib/supabase').then(s => {
      const sb = s.getSupabase();
      if (!sb) {
        setUser({ uid: 'local-user', email: 'local@example.com' });
        setAuthLoading(false);
        return;
      }
      sb.auth.getSession().then(async ({ data: { session } }) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
        if (session?.user && 'serviceWorker' in navigator && 'PushManager' in window) {
          try {
            let permGranted = Notification.permission === 'granted';
            if (!permGranted && Notification.permission === 'default') {
              permGranted = (await Notification.requestPermission()) === 'granted';
            }
            if (permGranted) {
              const { subscribeToPush } = await import('./lib/pushNotifications');
              await subscribeToPush();
            }
          } catch (e) {
            console.warn('Push registration failed', e);
          }
        }
      }).catch(err => {
        console.warn("Failed to get Supabase session.", err);
        setUser(null);
        setAuthLoading(false);
      });
      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => {
        subscription.unsubscribe();
      };
    });
  }, []);

  const handleSignOut = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const { unsubscribeFromPush } = await import('./lib/pushNotifications');
        await unsubscribeFromPush();
      }
    } catch (e) {
      console.warn('Push unsubscribe failed during sign-out', e);
    }
    const { getSupabase } = await import('./lib/supabase');
    const sb = getSupabase();
    if (sb) {
      await sb.auth.signOut();
    }
    setUser(null);
  };

  useEffect(() => {
    (async () => {
      const dbEvents = await localDb.getEvents();
      if (dbEvents.length > 0) {
        setEvents(dbEvents);
      } else {
        const saved = localStorage.getItem('synoptic-events');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setEvents(parsed);
            await localDb.setEvents(parsed);
          } catch (e) {
            console.error(e);
          }
        }
      }
    })();
  }, []);

  useEffect(() => {
    localDb.setEvents(events);
    localStorage.setItem('synoptic-events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    if (!user || user.uid === 'local-user') return;

    import('./lib/supabase').then(s => {
      const sb = s.getSupabase();
      if (!sb) return;

      const fetchEvents = async () => {
        try {
          const { data, error } = await sb
            .from('events')
            .select('*')
            .eq('ownerId', user.id);
          
          if (!error && data) {
            setEvents(data as CalendarEvent[]);
          }
        } catch (e) {
          console.warn('Failed to fetch events from Supabase', e);
        }
      };
      
      fetchEvents();

      const subscription = sb
        .channel('events_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `ownerId=eq.${user.id}` }, (payload) => {
          fetchEvents();
        })
        .subscribe();

      return () => {
        sb.removeChannel(subscription);
      };
    });
  }, [user]);

  // Network state watcher: flush outbound sync queue when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      if (navigator.onLine) await flushOutboundSyncQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedEventIdsForDelete, setSelectedEventIdsForDelete] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const toggleEventSelectionForDelete = (id: string) => {
    setSelectedEventIdsForDelete(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const [droppedEventId, setDroppedEventId] = useState<string | null>(null);
  const triggerDropAnimation = (id: string) => {
    setDroppedEventId(id);
    setTimeout(() => {
      setDroppedEventId(currentId => currentId === id ? null : currentId);
    }, 600);
  };

  // Deletion state
  const [eventsToDelete, setEventsToDelete] = useState<string[] | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [familyMembersState, setFamilyMembersState] = useState<FamilyMember[]>([]);
  const [placesState, setPlacesState] = useState<{id: string, name: string, icon?: string}[]>([]);
  const [settingsState, setSettingsState] = useState<AppSettings>({
    startOfWeek: 1,
    timeFormat: '24h'
  });

  // Load from IndexedDB (with localStorage migration fallback)
  useEffect(() => {
    (async () => {
      const dbFamily = await localDb.getFamilyMembers();
      if (dbFamily.length > 0) {
        setFamilyMembersState(dbFamily);
      } else {
        const saved = localStorage.getItem('synoptic-family');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setFamilyMembersState(parsed);
            await localDb.setFamilyMembers(parsed);
          } catch {}
        }
      }

      const dbPlaces = await localDb.getPlaces();
      if (dbPlaces.length > 0) {
        setPlacesState(dbPlaces);
      } else {
        const saved = localStorage.getItem('synoptic-places');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setPlacesState(parsed);
            await localDb.setPlaces(parsed);
          } catch {}
        } else {
          setPlacesState([
            { id: '1', name: t('app.home'), icon: 'Home' },
            { id: '2', name: t('app.school'), icon: 'BookOpen' },
            { id: '3', name: t('app.work'), icon: 'Briefcase' },
            { id: '4', name: t('app.gym'), icon: 'Dumbbell' }
          ]);
        }
      }

      const dbSettings = await localDb.getSettings();
      if (dbSettings) {
        setSettingsState(dbSettings);
      } else {
        const saved = localStorage.getItem('synoptic-settings');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setSettingsState(parsed);
            await localDb.setSettings(parsed);
          } catch {}
        }
      }
    })();
  }, [t]);

  // Keep selected members in sync
  useEffect(() => {
    if (familyMembersState.length > 0 && selectedMembers.length === 0) {
      if (!localStorage.getItem('synoptic-selected-members-init')) {
        setSelectedMembers(familyMembersState.map(m => m.id));
        localStorage.setItem('synoptic-selected-members-init', 'true');
      }
    }
  }, [familyMembersState]);

  useEffect(() => {
    localDb.setFamilyMembers(familyMembersState);
    localStorage.setItem('synoptic-family', JSON.stringify(familyMembersState));
  }, [familyMembersState]);

  useEffect(() => {
    localDb.setPlaces(placesState);
    localStorage.setItem('synoptic-places', JSON.stringify(placesState));
  }, [placesState]);

  useEffect(() => {
    localDb.setSettings(settingsState);
    localStorage.setItem('synoptic-settings', JSON.stringify(settingsState));
  }, [settingsState]);

  useEffect(() => {
    if (!user || user.uid === 'local-user') return;
    import('./lib/supabase').then(s => {
      const sb = s.getSupabase();
      if (!sb) return;

      const fetchFamily = async () => {
        const { data } = await sb.from('family_members').select('*').eq('ownerId', user.id);
        if (data && data.length > 0) setFamilyMembersState(data);
      };
      const fetchPlaces = async () => {
        const { data } = await sb.from('places').select('*').eq('ownerId', user.id);
        if (data && data.length > 0) setPlacesState(data);
      };
      const fetchSettings = async () => {
        const { data } = await sb.from('settings').select('*').eq('ownerId', user.id).single();
        if (data) {
          setSettingsState(prev => ({ ...prev, ...data }));
        }
      };

      fetchFamily();
      fetchPlaces();
      fetchSettings();
    });
  }, [user]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...updates };
      if (user && user.uid !== 'local-user') {
        syncUpdate('settings', 'app-settings', next);
      }
      return next;
    });
  };

  const addFamilyMember = (m: FamilyMember) => {
    setFamilyMembersState(prev => [...prev, m]);
    if (user && user.uid !== 'local-user') {
      syncInsert('family_members', m);
    }
  };
  const updateFamilyMember = (id: string, updates: Partial<FamilyMember>) => {
    setFamilyMembersState(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    if (user && user.uid !== 'local-user') {
      syncUpdate('family_members', id, updates);
    }
  };
  const deleteFamilyMember = (id: string) => {
    setFamilyMembersState(prev => prev.filter(m => m.id !== id));
    if (user && user.uid !== 'local-user') {
      syncDelete('family_members', id);
    }
  };

  const addPlace = (p: {id: string, name: string, icon?: string}) => {
    setPlacesState(prev => [...prev, p]);
    if (user && user.uid !== 'local-user') {
      syncInsert('places', p);
    }
  };
  const updatePlace = (id: string, updates: Partial<{id: string, name: string, icon?: string}>) => {
    setPlacesState(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (user && user.uid !== 'local-user') {
      syncUpdate('places', id, updates);
    }
  };
  const deletePlace = (id: string) => {
    setPlacesState(prev => prev.filter(p => p.id !== id));
    if (user && user.uid !== 'local-user') {
      syncDelete('places', id);
    }
  };

  const triggerGoogleSync = async () => {
    try {
      setIsSyncing(true);
      const { pushEventsToGoogleCalendar } = await import('./lib/googleCalendar');
      await pushEventsToGoogleCalendar(events);
      showToast(t('app.syncSuccess'));
      setIsSyncModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(t('app.syncError'));
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteEvent = (id: string) => setEventsToDelete([id]);
  const triggerBulkDelete = () => setEventsToDelete(selectedEventIdsForDelete);
  const confirmDelete = async () => {
    if (eventsToDelete) {
      if (eventsToDelete.length === 1) {
        syncDelete('events', eventsToDelete[0]);
      } else {
        syncDelete('events', eventsToDelete);
      }
      setEvents(prev => prev.filter(e => !eventsToDelete.includes(e.id)));
      setEventsToDelete(null);
      if (isMultiSelectMode) {
        setIsMultiSelectMode(false);
        setSelectedEventIdsForDelete([]);
      }
    }
  };
  
  const moveEvent = (id: string, newDate: string, newTime?: string) => {
    const updates = { date: newDate, ...(newTime ? { startTime: newTime } : {}) };
    syncUpdate('events', id, updates);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const swapEvents = (idA: string, idB: string) => {
    const eventA = events.find(e => e.id === idA);
    const eventB = events.find(e => e.id === idB);
    if (!eventA || !eventB) return;
    
    syncUpdate('events', idA, { date: eventB.date, startTime: eventB.startTime, endTime: eventB.endTime });
    syncUpdate('events', idB, { date: eventA.date, startTime: eventA.startTime, endTime: eventA.endTime });
    setEvents(prev => prev.map(e => {
      if (e.id === idA) {
        return { ...e, date: eventB.date, startTime: eventB.startTime, endTime: eventB.endTime };
      }
      if (e.id === idB) {
        return { ...e, date: eventA.date, startTime: eventA.startTime, endTime: eventA.endTime };
      }
      return e;
    }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const prev = () => {
    setDirection(-1);
    setCurrentDate(c => view === 'month' ? subMonths(c, 1) : subWeeks(c, 1));
  };
  
  const next = () => {
    setDirection(1);
    setCurrentDate(c => view === 'month' ? addMonths(c, 1) : addWeeks(c, 1));
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }
      
      // If a modal is open, prevent navigation
      if (isAddModalOpen || selectedEventId || selectedDay || document.querySelector('[role="dialog"]')) {
        if (e.key === 'Escape') {
          setIsAddModalOpen(false);
          setSelectedEventId(null);
          setSelectedDay(null);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (e.shiftKey) {
            setDirection(-1);
            setCurrentDate(c => view === 'month' ? subMonths(c, 1) : subWeeks(c, 1));
          } else {
            setCurrentDate(c => new Date(c.getFullYear(), c.getMonth(), c.getDate() - 1));
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            setDirection(1);
            setCurrentDate(c => view === 'month' ? addMonths(c, 1) : addWeeks(c, 1));
          } else {
            setCurrentDate(c => new Date(c.getFullYear(), c.getMonth(), c.getDate() + 1));
          }
          break;
        case 'ArrowUp':
          setView('month');
          break;
        case 'ArrowDown':
          setView('week');
          break;
        case 'm':
        case 'M':
          setView('month');
          break;
        case 'w':
        case 'W':
          setView('week');
          break;
        case 't':
        case 'T':
          setDirection(0);
          setCurrentDate(new Date());
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, isAddModalOpen, selectedEventId, selectedDay]);

  const now = new Date();
  let formattedTitle = '';
  const dateOptions = { locale: getDateLocale(i18n.language) };
  
  if (view === 'month') {
    if (isSameMonth(currentDate, now)) {
      formattedTitle = format(currentDate, 'PPP', dateOptions);
    } else {
      formattedTitle = format(currentDate, 'MMMM yyyy', dateOptions);
    }
  } else {
    if (isSameWeek(currentDate, now, { weekStartsOn: settingsState.startOfWeek as any })) {
      formattedTitle = `${t('app.weekOf', 'Week of')} ${format(currentDate, 'PPP', dateOptions)}`;
    } else {
      formattedTitle = format(currentDate, 'MMMM yyyy', dateOptions);
    }
  }

  return (
    <EventsContext.Provider value={{ 
      events, setEvents, deleteEvent, moveEvent, swapEvents, showToast, selectedMembers, toggleMember, setSelectedEventId,
      isMultiSelectMode, selectedEventIdsForDelete, toggleEventSelectionForDelete, droppedEventId, triggerDropAnimation,
      familyMembers: familyMembersState, addFamilyMember, updateFamilyMember, deleteFamilyMember, reorderFamilyMembers: setFamilyMembersState,
      places: placesState, addPlace, updatePlace, deletePlace,
      settings: settingsState, updateSettings,
      userRole
    }}>
      <div className="font-body bg-[#fcffe4] min-h-screen text-ink flex flex-col overflow-x-hidden">
        <header className="h-[60px] md:h-[90px] bg-surface border-b-[4px] border-ink flex items-center justify-between px-1.5 md:px-8 z-10 shrink-0 gap-2">
          <div className="flex items-center gap-1.5 md:gap-6 flex-1 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full border-[2px] border-ink bg-surface shadow-[2px_2px_0px_#1A1A1A] shrink-0"
            >
              <Menu className="w-4 h-4 font-bold text-ink" strokeWidth={3} />
            </button>
            <div className="flex items-center gap-1.5 md:gap-4 text-ink font-bold text-lg sm:text-xl md:text-3xl tracking-tight relative min-w-0">
              <div className="hidden sm:block shrink-0">
                <InteractiveLogo 
                  onClick={() => {
                    setDirection(-1);
                    setCurrentDate(new Date());
                  }} 
                  familyMembers={familyMembersState}
                />
              </div>
              <div className="relative overflow-hidden flex items-center min-w-0">
                <AnimatePresence mode="popLayout" custom={direction}>
                  <motion.div
                    key={formattedTitle}
                    custom={direction}
                    initial={(dir) => ({ opacity: 0, y: dir * 15 })}
                    animate={{ opacity: 1, y: 0 }}
                    exit={(dir) => ({ opacity: 0, y: -dir * 15 })}
                    transition={{ duration: 0.3 }}
                    className="whitespace-nowrap truncate min-w-0"
                  >
                    <span className="hidden sm:block truncate capitalize">{formattedTitle}</span>
                    <span className="sm:hidden text-sm block truncate cursor-pointer capitalize" onClick={() => {
                      setDirection(-1);
                      setCurrentDate(new Date());
                    }}>{formattedTitle}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="print-hide flex gap-1.5 md:gap-4 items-center shrink-0">
            {/* Desktop View Switcher */}
            <div className="hidden sm:flex items-center bg-surface border-[2px] md:border-thick rounded-full p-1 shadow-[2px_2px_0px_#1A1A1A] md:shadow-neo h-[36px] sm:h-[40px] md:h-[52px]">
              <button 
                onClick={() => { setDirection(0); setView('month'); }}
                className={cn(
                  "h-full px-3 sm:px-4 lg:px-8 rounded-full font-bold text-xs sm:text-sm tracking-widest transition-all uppercase",
                  view === 'month' ? "bg-primary text-white border-[2px] border-ink shadow-[2px_2px_0px_#1A1A1A]" : "text-ink hover:bg-bg-light"
                )}
              >
                {t('app.month')}
              </button>
              <button 
                onClick={() => { setDirection(0); setView('week'); }}
                className={cn(
                  "h-full px-3 sm:px-4 lg:px-8 rounded-full font-bold text-xs sm:text-sm tracking-widest transition-all uppercase",
                  view === 'week' ? "bg-primary text-white border-[2px] border-ink shadow-[2px_2px_0px_#1A1A1A]" : "text-ink hover:bg-bg-light"
                )}
              >
                {t('app.week')}
              </button>
            </div>
            
            {/* Mobile View Switcher */}
            <button
              onClick={() => { setDirection(0); setView(view === 'month' ? 'week' : 'month'); }}
              className="sm:hidden flex items-center justify-center px-2.5 h-8 rounded-full border-[2px] border-ink bg-surface shadow-[2px_2px_0px_#1A1A1A] font-bold text-xs uppercase"
            >
              {view === 'month' ? t('app.m') : t('app.w')}
            </button>

            {userRole !== 'child' && (
              <button 
                onClick={() => setIsSyncModalOpen(true)}
                title={t('app.syncGoogleCalendar')}
                className="flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink bg-surface shadow-[2px_2px_0px_#1A1A1A] md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all hidden sm:flex"
              >
                <RefreshCw className="w-4 h-4 md:w-7 md:h-7 font-bold text-ink" strokeWidth={3} />
              </button>
            )}
            {userRole !== 'child' && (
              <>
                <button 
                  onClick={() => {
                    exportEventsToICS(events, familyMembersState);
                    showToast(t('app.calendarExported'));
                  }}
                  title={t('app.exportCalendar')}
                  className="print-hide flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink bg-surface shadow-[2px_2px_0px_#1A1A1A] md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all hidden sm:flex"
                >
                  <Download className="w-4 h-4 md:w-7 md:h-7 font-bold" strokeWidth={3} />
                </button>
                <button 
                  onClick={() => window.print()}
                  title={t('app.printCalendar', 'Print Calendar')}
                  className="print-hide flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink bg-surface shadow-[2px_2px_0px_#1A1A1A] md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all hidden sm:flex"
                >
                  <Printer className="w-4 h-4 md:w-7 md:h-7 font-bold" strokeWidth={3} />
                </button>
                <button 
                  onClick={() => {
                    setIsMultiSelectMode(!isMultiSelectMode);
                    if (isMultiSelectMode) setSelectedEventIdsForDelete([]);
                  }}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink shadow-[2px_2px_0px_#1A1A1A] md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all",
                    isMultiSelectMode ? "bg-primary text-white" : "bg-surface"
                  )}
                >
                  <CheckSquare className="w-4 h-4 md:w-8 md:h-8 font-bold" strokeWidth={3} />
                </button>
              </>
            )}
            <button onClick={prev} className="flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink bg-surface shadow-[2px_2px_0px_#1A1A1A] md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all">
              <ChevronLeft className="w-4 h-4 md:w-8 md:h-8 font-bold" strokeWidth={3} />
            </button>
            <button onClick={next} className="flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink bg-surface shadow-[2px_2px_0px_#1A1A1A] md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all">
              <ChevronRight className="w-4 h-4 md:w-8 md:h-8 font-bold" strokeWidth={3} />
            </button>
          </div>
        </header>
        
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar isOpenOnMobile={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} onSignOut={handleSignOut} />
          
          <main className="flex-1 flex flex-col relative bg-[#fcffe4] p-2 overflow-hidden">
             {authLoading ? (
               <div className="flex-1 flex items-center justify-center">
                 <div className="animate-spin w-12 h-12 border-[4px] border-ink border-t-transparent rounded-full" />
               </div>
             ) : !user ? (
               <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#fcffe4]/90 backdrop-blur-md">
                  <div className="p-8 bg-surface border-[4px] border-ink shadow-[8px_8px_0px_#1A1A1A] rounded-3xl flex flex-col items-center max-w-sm w-full mx-4 text-center">
                    <div className="w-20 h-20 bg-mem-2 rounded-full border-[3px] border-ink flex items-center justify-center shadow-neo mb-6">
                      <InteractiveLogo />
                    </div>
                    <h2 className="text-2xl font-black mb-4">{t('app.synopticFamily')}</h2>
                    <p className="text-ink/60 font-bold mb-8 text-sm">{t('app.signInRequired')}</p>
                    <button 
                      onClick={() => import('./lib/supabase').then(async s => {
                        try {
                          const { error } = await s.signInWithGoogle();
                          if (error) throw error;
                        } catch (err) {
                          console.error("Supabase OAuth failed. Falling back to local mode.", err);
                          setUser({ uid: 'local-user', email: 'local@example.com' });
                        }
                      })}
                      className="bg-primary w-full text-white font-black text-lg px-8 py-4 rounded-xl border-[4px] border-ink hover:-translate-y-1 hover:shadow-neo transition-all shadow-[4px_4px_0px_#1A1A1A] active:translate-y-0 active:shadow-none"
                    >
                      {t('app.signInWithGoogle')}
                    </button>
                  </div>
               </div>
             ) : null}

             <MemberFilterBar />
             <AnimatePresence mode="wait" custom={direction}>
               <motion.div 
                 key={view + currentDate.toISOString()}
                 custom={direction}
                 initial={(dir) => ({ opacity: 0, x: dir * 30 })}
                 animate={{ opacity: authLoading || !user ? 0 : 1, x: 0 }}
                 exit={(dir) => ({ opacity: 0, x: -dir * 30 })}
                 transition={{ duration: 0.3, ease: 'easeOut' }}
                 className="h-full flex flex-col"
               >
                  {isMobile ? (
                    <CalendarAgenda currentDate={currentDate} onDateClick={setSelectedDay} />
                  ) : view === 'month' ? (
                    <CalendarMonth currentDate={currentDate} onDateClick={setSelectedDay} />
                  ) : (
                    <CalendarWeek currentDate={currentDate} onDateClick={setSelectedDay} />
                  )}
               </motion.div>
             </AnimatePresence>
          
            {userRole !== 'child' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="absolute bottom-6 right-6 w-16 h-16 md:bottom-10 md:right-10 md:w-24 md:h-24 bg-primary rounded-full border-[3px] md:border-[5px] border-ink shadow-[4px_4px_0px_#1A1A1A] md:shadow-[6px_6px_0px_#1A1A1A] flex items-center justify-center cursor-pointer z-40 group tracking-widest active:translate-y-1"
              >
                <Plus className="w-8 h-8 md:w-14 md:h-14 text-ink font-bold group-hover:rotate-90 transition-transform duration-300" strokeWidth={4} />
              </button>
            )}
          </main>
        </div>
        
        <AddEventModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        <EventDetailModal 
          isOpen={!!selectedEventId} 
          onClose={() => setSelectedEventId(null)} 
          eventId={selectedEventId!} 
        />
        <AnimatePresence>
          {selectedDay && (
            <DayEventsModal isOpen={!!selectedDay} date={selectedDay} onClose={() => setSelectedDay(null)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isMultiSelectMode && selectedEventIdsForDelete.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] flex gap-4"
            >
              <button 
                onClick={triggerBulkDelete}
                className="bg-[#FF5722] text-white px-8 py-4 rounded-full border-[4px] border-ink font-bold shadow-[6px_6px_0px_#1A1A1A] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_#1A1A1A] active:translate-y-[2px] active:shadow-[2px_2px_0px_#1A1A1A] transition-all flex items-center gap-2 text-lg"
              >
                <Trash2 className="w-6 h-6" /> {t('app.deleteSelected', { count: selectedEventIdsForDelete.length })}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reminder Alert System */}
        <ReminderSystem />

        {/* Global Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-surface border-[3px] border-ink rounded-full px-6 py-3 shadow-neo flex items-center gap-3 font-bold text-ink"
            >
              <BellRing className="w-5 h-5 text-primary" strokeWidth={3} />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {eventsToDelete && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
                onClick={() => setEventsToDelete(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-surface border-[4px] border-ink rounded-3xl p-6 lg:p-8 max-w-sm w-full text-center shadow-[8px_8px_0px_#1A1A1A]"
              >
                <div className="w-16 h-16 bg-[#F4A7BB] rounded-full border-[3px] border-ink flex items-center justify-center mx-auto mb-4 shadow-neo">
                  <AlertCircle className="w-8 h-8 text-ink" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-2">{eventsToDelete.length > 1 ? t('app.deleteEventsTitle') : t('app.deleteEventTitle')}</h2>
                <p className="text-ink/70 font-bold mb-6">{eventsToDelete.length > 1 ? t('app.deleteEventsConfirm', { count: eventsToDelete.length }) : t('app.deleteEventConfirm')}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setEventsToDelete(null)}
                    className="flex-1 h-12 bg-gray-200 rounded-full border-[3px] border-ink font-bold hover:-translate-y-1 hover:shadow-neo transition-all"
                  >
                    {t('app.cancel')}
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 h-12 bg-[#FF5722] text-white rounded-full border-[3px] border-ink font-bold shadow-neo hover:-translate-y-1 hover:shadow-neo-hover active:translate-y-1 active:shadow-none transition-all"
                  >
                    {t('app.delete')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isSyncModalOpen && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
                onClick={() => !isSyncing && setIsSyncModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-surface border-[4px] border-ink rounded-3xl p-6 lg:p-8 max-w-sm w-full text-center shadow-[8px_8px_0px_#1A1A1A]"
              >
                <div className="w-16 h-16 bg-[#F4A7BB] rounded-full border-[3px] border-ink flex items-center justify-center mx-auto mb-4 shadow-neo">
                  <RefreshCw className={cn("w-8 h-8 text-ink", isSyncing && "animate-spin")} />
                </div>
                <h2 className="text-2xl font-display font-bold mb-2">{t('app.syncConfirmTitle')}</h2>
                <p className="text-ink/70 font-bold mb-6">{t('app.syncConfirmMessage', { count: events.length })}</p>
                <div className="flex gap-4">
                  <button 
                    disabled={isSyncing}
                    onClick={() => setIsSyncModalOpen(false)}
                    className="flex-1 h-12 bg-gray-200 rounded-full border-[3px] border-ink font-bold hover:-translate-y-1 hover:shadow-neo transition-all disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-none"
                  >
                    {t('app.cancel')}
                  </button>
                  <button 
                    disabled={isSyncing}
                    onClick={triggerGoogleSync}
                    className="flex-1 h-12 bg-primary text-white rounded-full border-[3px] border-ink font-bold shadow-neo hover:-translate-y-1 hover:shadow-neo-hover active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-neo"
                  >
                    {isSyncing ? t('app.syncing') : t('app.confirm')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </EventsContext.Provider>
  );
}
