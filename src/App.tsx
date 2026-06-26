/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import { Sidebar } from './components/Sidebar';
import { CalendarMonth } from './components/CalendarMonth';
import { CalendarWeek } from './components/CalendarWeek';
import { AddEventModal } from './components/AddEventModal';
import { EventDetailModal } from './components/EventDetailModal';
import { DayEventsModal } from './components/DayEventsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ModalShell } from './components/ModalShell';
import { ReminderSystem } from './components/ReminderSystem';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingSplash, shouldShowOnboarding } from './components/OnboardingSplash';
import { DstBadge } from './components/DstBadge';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { format, addMonths, subMonths, addWeeks, subWeeks, isSameMonth, isSameWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, AlertCircle, BellRing, CheckSquare, Trash2, Download, Printer, Menu, RefreshCw } from 'lucide-react';
import { cn } from './lib/utils';
import { exportEventsToICS } from './lib/exportIcs';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from './lib/dateLocale';
import { CalendarEvent, FamilyMember, AppSettings } from './types';
import { EventsContext } from './lib/eventsContext';
import { clearStorageScope, flushOutboundSyncQueue, getActiveStorageScope, localDb, setActiveStorageScope } from './lib/localDb';
import { syncInsert, syncUpdate, syncDelete } from './lib/syncActions';
import { isMutationAuthorizationError } from './lib/mutationAuthorization';
import { useIsMobile } from './hooks/useIsMobile';
import { useAuth } from './hooks/useAuth';
import { useToasts } from './hooks/useToasts';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePersistedCurrentDate } from './hooks/usePersistedCurrentDate';
import { usePersistedSelectedMembers } from './hooks/usePersistedSelectedMembers';
import { useUserRole } from './hooks/useUserRole';
import { CalendarAgenda } from './components/CalendarAgenda';
import { MemberFilterBar } from './components/MemberFilterBar';

interface AppProps {
  // AppProps.timeZone is reserved for the timezone story tracked in
  // wiki/operations/18-production-audit.md (Phase 3). Unused at the moment.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  timeZone?: string;
}

void ({} as AppProps);

const DEFAULT_SETTINGS: AppSettings = {
  startOfWeek: 1,
  timeFormat: '24h',
};

const SIGNED_OUT_STORAGE_SCOPE = 'signed-out';

function getStorageScope(user: { uid: string; email: string } | null): string {
  if (!user) return SIGNED_OUT_STORAGE_SCOPE;
  return user.uid === 'local-user' ? 'local-user' : `user:${user.uid}`;
}

function getDefaultPlaces(translate: (key: string) => string) {
  return [
    { id: '1', name: translate('app.home'), icon: 'Home' },
    { id: '2', name: translate('app.school'), icon: 'BookOpen' },
    { id: '3', name: translate('app.work'), icon: 'Briefcase' },
    { id: '4', name: translate('app.gym'), icon: 'Dumbbell' },
  ];
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

export default function App(_props: AppProps) {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'month'|'week'|'agenda'>(() => {
    try {
      return (localStorage.getItem('calendarView') as 'month'|'week'|'agenda') || 'month';
    } catch {
      return 'month';
    }
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (shouldShowOnboarding()) {
      // Slight delay so the splash doesn't fight the calendar's first paint.
      const id = window.setTimeout(() => setOnboardingOpen(true), 350);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Cmd/Ctrl + P opens the print-preview modal so users can review before printing.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPrintOpen(true);
      }
      // Undo / redo shortcuts: Cmd+Z / Ctrl+Z, Cmd+Shift+Z / Ctrl+Shift+Z
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        // Lazy-load to avoid pulling the module until needed.
        import('./lib/undoStack').then(({ popUndo, popRedo }) => {
          const op = e.shiftKey ? popRedo() : popUndo();
          if (!op) return;
          if (op.type === 'add') {
            setEvents(prev => prev.filter(ev => ev.id !== op.eventId));
          } else if (op.type === 'delete') {
            const ev = op.snapshot as CalendarEvent;
            setEvents(prev => [...prev, ev]);
          } else if (op.type === 'update') {
            setEvents(prev => prev.map(ev =>
              ev.id === op.eventId ? { ...ev, ...(op.before as Partial<CalendarEvent>) } : ev
            ));
          } else if (op.type === 'swap') {
            const a = op.aBefore as CalendarEvent;
            const b = op.bBefore as CalendarEvent;
            setEvents(prev => prev.map(ev => {
              if (ev.id === a.id) return a;
              if (ev.id === b.id) return b;
              return ev;
            }));
          } else if (op.type === 'multi-delete') {
            const snaps = op.snapshots as CalendarEvent[];
            setEvents(prev => [...prev, ...snaps]);
          }
        });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    // Fire console easter eggs on first paint.
    import('./lib/easterEggs').then(m => m.maybeEasterEggs());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('calendarView', view);
    } catch {}
  }, [view]);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [direction, setDirection] = useState(1);
  const [currentDate, setCurrentDate] = usePersistedCurrentDate();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { user, loading: authLoading, signOut: handleSignOut } = useAuth();
  const storageScope = getStorageScope(user);
  const [userRole] = useUserRole();
  const { toasts, showToast: showToastFromHook, dismissToast } = useToasts();
  const { selectedMembers, setSelectedMembers, toggleMember } = usePersistedSelectedMembers();
  const [storageReady, setStorageReady] = useState(false);

  // Email/password auth form state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const isMobile = useIsMobile();
  const mainContentRef = useRef<HTMLElement | null>(null);
  const previousStorageScopeRef = useRef<string | null>(null);
  const isRemoteUser = !!user && user.uid !== 'local-user';

  const replaceEvents = useCallback((nextEvents: CalendarEvent[]) => {
    setEvents(nextEvents);
  }, []);

  const addEvent = useCallback(async (event: CalendarEvent) => {
    if (!isRemoteUser) {
      setEvents(prev => [...prev, event]);
      return true;
    }

    try {
      await syncInsert('events', event);
      setEvents(prev => [...prev, event]);
      return true;
    } catch (error) {
      console.warn('Event create rejected', error);
      showToastFromHook(
        isMutationAuthorizationError(error)
          ? t('app.permissionDenied', 'You are not allowed to perform this action.')
          : t('app.syncFailed', 'Sync failed — change reverted')
      );
      return false;
    }
  }, [isRemoteUser, showToastFromHook, t]);

  const addEvents = useCallback(async (nextEvents: CalendarEvent[]) => {
    if (nextEvents.length === 0) return true;
    if (!isRemoteUser) {
      setEvents(prev => [...prev, ...nextEvents]);
      return true;
    }

    const acceptedEvents: CalendarEvent[] = [];

    for (const event of nextEvents) {
      try {
        await syncInsert('events', event);
        acceptedEvents.push(event);
      } catch (error) {
        console.warn('Event import rejected', error);
        showToastFromHook(
          isMutationAuthorizationError(error)
            ? t('app.permissionDenied', 'You are not allowed to perform this action.')
            : t('app.syncFailed', 'Sync failed — change reverted')
        );
        if (acceptedEvents.length > 0) {
          setEvents(prev => [...prev, ...acceptedEvents]);
        }
        return false;
      }
    }

    setEvents(prev => [...prev, ...acceptedEvents]);
    return true;
  }, [isRemoteUser, showToastFromHook, t]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    if (!isRemoteUser) {
      setEvents(prev => prev.map(event => event.id === id ? { ...event, ...updates } : event));
      return true;
    }

    try {
      await syncUpdate('events', id, updates);
      setEvents(prev => prev.map(event => event.id === id ? { ...event, ...updates } : event));
      return true;
    } catch (error) {
      console.warn('Event update rejected', error);
      showToastFromHook(
        isMutationAuthorizationError(error)
          ? t('app.permissionDenied', 'You are not allowed to perform this action.')
          : t('app.syncFailed', 'Sync failed — change reverted')
      );
      return false;
    }
  }, [isRemoteUser, showToastFromHook, t]);

  useEffect(() => {
    let cancelled = false;
    const previousScope = previousStorageScopeRef.current;
    const shouldResetPersistedMemberFilter =
      previousScope !== null && previousScope !== storageScope;

    setStorageReady(false);
    replaceEvents([]);
    setFamilyMembersState([]);
    setPlacesState([]);
    setSettingsState(DEFAULT_SETTINGS);
    setSelectedDay(null);
    setSelectedEventId(null);
    setEventsToDelete(null);
    setIsMultiSelectMode(false);
    setSelectedEventIdsForDelete([]);
    setSelectedMembers([]);

    if (shouldResetPersistedMemberFilter) {
      try {
        localStorage.removeItem('synoptic-selected-members-persist');
        localStorage.removeItem('synoptic-selected-members-init');
      } catch {}
    }

    const hydrateScope = async () => {
      const allowLegacyLocalMigration = !user || user.uid === 'local-user';

      const readLegacyJson = async <T,>(key: string, persist: (value: T) => Promise<void>, errorMessage: string) => {
        if (!allowLegacyLocalMigration) return null;
        const saved = localStorage.getItem(key);
        if (!saved) return null;

        try {
          const parsed = JSON.parse(saved) as T;
          await persist(parsed);
          localStorage.removeItem(key);
          return parsed;
        } catch (error) {
          console.error(errorMessage, error);
          return null;
        }
      };

      await setActiveStorageScope(storageScope);
      if (cancelled) return;

      if (storageScope === SIGNED_OUT_STORAGE_SCOPE) {
        await clearStorageScope(storageScope);
      }
      if (cancelled) return;

      let nextEvents = await localDb.getEvents();
      if (nextEvents.length === 0) {
        const migratedEvents = await readLegacyJson<CalendarEvent[]>(
          'synoptic-events',
          (value) => localDb.setEvents(value),
          'Failed to migrate events from localStorage',
        );
        if (migratedEvents) {
          nextEvents = migratedEvents;
        }
      }

      let nextFamilyMembers = await localDb.getFamilyMembers();
      if (nextFamilyMembers.length === 0) {
        const migratedFamily = await readLegacyJson<FamilyMember[]>(
          'synoptic-family',
          (value) => localDb.setFamilyMembers(value),
          'Failed to migrate family members from localStorage',
        );
        if (migratedFamily) {
          nextFamilyMembers = migratedFamily;
        }
      }

      let nextPlaces = await localDb.getPlaces();
      if (nextPlaces.length === 0) {
        const migratedPlaces = await readLegacyJson<{ id: string; name: string; icon?: string }[]>(
          'synoptic-places',
          (value) => localDb.setPlaces(value),
          'Failed to migrate places from localStorage',
        );
        if (migratedPlaces) {
          nextPlaces = migratedPlaces;
        } else {
          nextPlaces = getDefaultPlaces((key) => t(key));
        }
      }

      let nextSettings = await localDb.getSettings();
      if (!nextSettings) {
        const migratedSettings = await readLegacyJson<AppSettings>(
          'synoptic-settings',
          (value) => localDb.setSettings(value),
          'Failed to migrate settings from localStorage',
        );
        nextSettings = migratedSettings ?? DEFAULT_SETTINGS;
      }

      if (cancelled || getActiveStorageScope() !== storageScope) return;

      replaceEvents(nextEvents);
      setFamilyMembersState(nextFamilyMembers);
      setPlacesState(nextPlaces);
      setSettingsState(nextSettings);
      setStorageReady(true);
      previousStorageScopeRef.current = storageScope;
    };

    void hydrateScope();

    return () => {
      cancelled = true;
    };
  }, [replaceEvents, setSelectedMembers, storageScope, t, user]);

  useEffect(() => {
    if (!storageReady) return;
    // Events now live exclusively in IndexedDB. UI preferences
    // (theme, currentDate, etc.) continue to use localStorage because
    // they are tiny scalars and don't need a query layer.
    void localDb.setEvents(events);
  }, [events, storageReady]);

  useEffect(() => {
    if (!user || user.uid === 'local-user') return;
    let isActive = true;
    let removeActiveChannel: (() => void) | null = null;

    const initializeRealtime = async () => {
      const s = await import('./lib/supabase');
      const sb = s.getSupabase();
      if (!sb || !isActive) return;

      const fetchEvents = async () => {
        try {
          const { data, error } = await sb
            .from('events')
            .select('*')
            .eq('owner_id', user.uid);

          if (!isActive || getActiveStorageScope() !== storageScope || error || !data) return;
          replaceEvents(data.map(s.dbRowToEvent));
        } catch (e) {
          if (isActive) {
            console.warn('Failed to fetch events from Supabase', e);
          }
        }
      };

      await fetchEvents();
      if (!isActive) return;

      const subscription = sb
        .channel(`events_changes:${user.uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `owner_id=eq.${user.uid}` }, () => {
          void fetchEvents();
        })
        .subscribe();

      removeActiveChannel = () => {
        void sb.removeChannel(subscription);
        removeActiveChannel = null;
      };

      if (!isActive) {
        removeActiveChannel();
      }
    };

    void initializeRealtime();

    return () => {
      isActive = false;
      removeActiveChannel?.();
    };
  }, [replaceEvents, storageScope, user]);

  // Network state watcher: flush outbound sync queue when coming back online
  useEffect(() => {
    const handleOnline = async () => {
      if (navigator.onLine) await flushOutboundSyncQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (!storageReady || !user || user.uid === 'local-user' || !navigator.onLine) return;
    void flushOutboundSyncQueue();
  }, [storageReady, storageScope, user]);

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedEventIdsForDelete, setSelectedEventIdsForDelete] = useState<string[]>([]);

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
  const [settingsState, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);

  // First-run seed: when the family loads and no persisted filter
  // exists yet, default to all members visible. The `usePersistedSelectedMembers`
  // hook handles subsequent reads/writes.
  useEffect(() => {
    if (!storageReady || familyMembersState.length === 0) return;
    try {
      const hasPersist = localStorage.getItem('synoptic-selected-members-persist');
      const hasLegacy = localStorage.getItem('synoptic-selected-members-init');
      if (!hasPersist && !hasLegacy) {
        setSelectedMembers(familyMembersState.map(m => m.id));
        localStorage.setItem('synoptic-selected-members-init', 'true');
      }
    } catch {}
  }, [familyMembersState, setSelectedMembers, storageReady]);

  // Family, places, and settings all live exclusively in IndexedDB
  // now. UI preferences (selectedMembers, theme, currentDate, …)
  // continue to use localStorage because they are cheap scalars.
  useEffect(() => {
    if (!storageReady) return;
    void localDb.setFamilyMembers(familyMembersState);
  }, [familyMembersState, storageReady]);
  useEffect(() => {
    if (!storageReady) return;
    void localDb.setPlaces(placesState);
  }, [placesState, storageReady]);
  useEffect(() => {
    if (!storageReady) return;
    void localDb.setSettings(settingsState);
  }, [settingsState, storageReady]);

  useEffect(() => {
    if (!user || user.uid === 'local-user') return;
    let cancelled = false;

    void import('./lib/supabase').then(async (s) => {
      const sb = s.getSupabase();
      if (!sb || cancelled) return;

      const fetchFamily = async () => {
        const { data } = await sb.from('family_members').select('*').eq('owner_id', user.uid);
        if (cancelled || getActiveStorageScope() !== storageScope || !data || data.length === 0) return;
        setFamilyMembersState(data.map(s.dbRowToMember));
      };
      const fetchPlaces = async () => {
        const { data } = await sb.from('places').select('*').eq('owner_id', user.uid);
        if (cancelled || getActiveStorageScope() !== storageScope || !data || data.length === 0) return;
        setPlacesState(data);
      };
      const fetchSettings = async () => {
        const { data } = await sb.from('settings').select('*').eq('owner_id', user.uid).single();
        if (cancelled || getActiveStorageScope() !== storageScope || !data) return;
        setSettingsState(prev => ({ ...prev, ...s.dbRowToSettings(data) }));
      };

      await Promise.all([fetchFamily(), fetchPlaces(), fetchSettings()]);
    });

    return () => {
      cancelled = true;
    };
  }, [storageScope, user]);

  const getMutationFailureMessage = useCallback((error: unknown) => (
    isMutationAuthorizationError(error)
      ? t('app.permissionDenied', 'You are not allowed to perform this action.')
      : t('app.syncFailed', 'Sync failed — change reverted')
  ), [t]);

  const reportProtectedMutationFailure = useCallback((error: unknown) => {
    showToastFromHook(getMutationFailureMessage(error));
  }, [getMutationFailureMessage, showToastFromHook]);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const next = { ...settingsState, ...updates };
    if (!user || user.uid === 'local-user') {
      setSettingsState(next);
      return;
    }

    try {
      await syncUpdate('settings', 'app-settings', next);
      setSettingsState(next);
    } catch (error) {
      console.warn('Settings update rejected', error);
      reportProtectedMutationFailure(error);
    }
  };

  const addFamilyMember = async (m: FamilyMember) => {
    if (!user || user.uid === 'local-user') {
      setFamilyMembersState(prev => [...prev, m]);
      return;
    }

    try {
      await syncInsert('family_members', m);
      setFamilyMembersState(prev => [...prev, m]);
    } catch (error) {
      console.warn('Family member insert rejected', error);
      reportProtectedMutationFailure(error);
    }
  };
  const updateFamilyMember = async (id: string, updates: Partial<FamilyMember>) => {
    if (!user || user.uid === 'local-user') {
      setFamilyMembersState(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      return;
    }

    try {
      await syncUpdate('family_members', id, updates);
      setFamilyMembersState(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    } catch (error) {
      console.warn('Family member update rejected', error);
      reportProtectedMutationFailure(error);
    }
  };
  const deleteFamilyMember = async (id: string) => {
    if (!user || user.uid === 'local-user') {
      setFamilyMembersState(prev => prev.filter(m => m.id !== id));
      return;
    }

    try {
      await syncDelete('family_members', id);
      setFamilyMembersState(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.warn('Family member delete rejected', error);
      reportProtectedMutationFailure(error);
    }
  };

  const addPlace = async (p: {id: string, name: string, icon?: string}) => {
    if (!user || user.uid === 'local-user') {
      setPlacesState(prev => [...prev, p]);
      return;
    }

    try {
      await syncInsert('places', p);
      setPlacesState(prev => [...prev, p]);
    } catch (error) {
      console.warn('Place insert rejected', error);
      reportProtectedMutationFailure(error);
    }
  };
  const updatePlace = async (id: string, updates: Partial<{id: string, name: string, icon?: string}>) => {
    if (!user || user.uid === 'local-user') {
      setPlacesState(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      return;
    }

    try {
      await syncUpdate('places', id, updates);
      setPlacesState(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    } catch (error) {
      console.warn('Place update rejected', error);
      reportProtectedMutationFailure(error);
    }
  };
  const deletePlace = async (id: string) => {
    if (!user || user.uid === 'local-user') {
      setPlacesState(prev => prev.filter(p => p.id !== id));
      return;
    }

    try {
      await syncDelete('places', id);
      setPlacesState(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.warn('Place delete rejected', error);
      reportProtectedMutationFailure(error);
    }
  };

  const triggerGoogleSync = async () => {
    try {
      setIsSyncing(true);
      const { syncEventsWithGoogle } = await import('./lib/googleCalendar');
      // Two-way sync: pull the visible month (current month ± 1) so the user
      // gets an immediate view of everything they own upstream without
      // waiting for an out-of-band background pull.
      const center = currentDate;
      const rangeStart = new Date(center.getFullYear(), center.getMonth() - 1, 1);
      const rangeEnd = new Date(center.getFullYear(), center.getMonth() + 2, 0);
      const merged = await syncEventsWithGoogle(
        events,
        { timeMin: rangeStart.toISOString(), timeMax: rangeEnd.toISOString() },
        { strategy: 'last-write-wins' },
        { defaultMemberIds: () => familyMembersState.map(m => m.id) },
      );
      replaceEvents(merged.events);
      showToast(t('app.syncSuccess', { pushed: merged.result.pushed, pulled: merged.result.pulled }));
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
    if (!eventsToDelete) return;
    // Optimistic delete: remove from local state first, then sync.
    // If sync throws, restore the deleted items so the UI stays consistent.
    const removed = events.filter(e => eventsToDelete.includes(e.id));
    setEvents(prev => prev.filter(e => !eventsToDelete.includes(e.id)));
    setEventsToDelete(null);
    if (isMultiSelectMode) {
      setIsMultiSelectMode(false);
      setSelectedEventIdsForDelete([]);
    }
    // Sound + undo-stack hooks for polish (item 🟢3, 🟢4).
    import('./lib/sounds').then(m => m.playCue('drop'));
    import('./lib/undoStack').then(m => {
      if (removed.length === 1) {
        m.pushOp({ type: 'delete', eventId: removed[0].id, snapshot: removed[0] });
      } else if (removed.length > 1) {
        m.pushOp({ type: 'multi-delete', eventIds: removed.map(e => e.id), snapshots: removed });
      }
    });
    try {
      if (eventsToDelete.length === 1) {
        await syncDelete('events', eventsToDelete[0]);
      } else {
        await syncDelete('events', eventsToDelete);
      }
    } catch (err) {
      console.warn('Delete sync failed; rolling back', err);
      setEvents(prev => {
        const restored = new Map(removed.map(e => [e.id, e]));
        const next = [...prev];
        for (let i = 0; i < next.length; i++) {
          if (restored.has(next[i].id)) next[i] = restored.get(next[i].id)!;
        }
        return [...removed.filter(r => !next.some(e => e.id === r.id)), ...next];
      });
      showToast(getMutationFailureMessage(err));
    }
  };

  const moveEvent = (id: string, newDate: string, newTime?: string) => {
    // Optimistic update: capture previous, apply new, sync, rollback on error.
    const previous = events.find(e => e.id === id);
    if (!previous) return;
    const updates = { date: newDate, ...(newTime ? { startTime: newTime } : {}) };
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    // Play "drop" sound on drag-and-drop move.
    import('./lib/sounds').then(m => m.playCue('drop'));
    import('./lib/undoStack').then(m => {
      m.pushOp({
        type: 'update',
        eventId: id,
        before: { date: previous.date, startTime: previous.startTime },
        after: { date: newDate, startTime: newTime ?? previous.startTime },
      });
    });
    void syncUpdate('events', id, updates).catch((err) => {
      console.warn('Move sync failed; rolling back', err);
      setEvents(prev => prev.map(e => e.id === id ? previous : e));
      showToast(getMutationFailureMessage(err));
    });
  };

  const swapEvents = (idA: string, idB: string) => {
    const eventA = events.find(e => e.id === idA);
    const eventB = events.find(e => e.id === idB);
    if (!eventA || !eventB) return;

    // Optimistic swap with rollback on either side failing.
    setEvents(prev => prev.map(e => {
      if (e.id === idA) {
        return { ...e, date: eventB.date, startTime: eventB.startTime, endTime: eventB.endTime };
      }
      if (e.id === idB) {
        return { ...e, date: eventA.date, startTime: eventA.startTime, endTime: eventA.endTime };
      }
      return e;
    }));
    const aUpdates = { date: eventB.date, startTime: eventB.startTime, endTime: eventB.endTime };
    const bUpdates = { date: eventA.date, startTime: eventA.startTime, endTime: eventA.endTime };
    void syncUpdate('events', idA, aUpdates)
      .then(() => syncUpdate('events', idB, bUpdates))
      .catch((err) => {
        console.warn('Swap sync failed; rolling back', err);
        setEvents(prev => prev.map(e => {
          if (e.id === idA) return eventA;
          if (e.id === idB) return eventB;
          return e;
        }));
        showToast(getMutationFailureMessage(err));
      });
  };

  const showToast = useCallback((msg: string) => {
    // Bridge to the multi-toast hook so old call-sites keep working.
    showToastFromHook(msg);
  }, [showToastFromHook]);

  const prev = () => {
    setDirection(-1);
    setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const next = () => {
    setDirection(1);
    setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const handleSkipToMain = useCallback((event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    mainContentRef.current?.focus();
  }, []);

  // Centralised keyboard shortcuts (←/→, Shift+←/→, M, W, T, 1–9).
  useKeyboardShortcuts({
    view,
    setView,
    currentDate,
    setCurrentDate: (d) => {
      // Direction animation: hint the AnimatePresence when the
      // month/week flips, hold steady for ±1 day navigation.
      setDirection(prevDir => (d > currentDate ? 1 : d < currentDate ? -1 : prevDir));
      setCurrentDate(d);
    },
    toggleMember,
    familyMembers: familyMembersState,
  });

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
      events, addEvent, addEvents, updateEvent, deleteEvent, moveEvent, swapEvents, showToast, selectedMembers, toggleMember, setSelectedEventId,
      isMultiSelectMode, selectedEventIdsForDelete, toggleEventSelectionForDelete, droppedEventId, triggerDropAnimation,
      familyMembers: familyMembersState, addFamilyMember, updateFamilyMember, deleteFamilyMember, reorderFamilyMembers: setFamilyMembersState,
      places: placesState, addPlace, updatePlace, deletePlace,
      settings: settingsState, updateSettings,
      userRole,
      user
    }}>
      <div className="font-body bg-bg-app min-h-screen text-ink flex flex-col overflow-x-hidden">
        <a
          href="#main-content"
          onClick={handleSkipToMain}
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
        >
          Skip to main content
        </a>
        <header className="h-[60px] md:h-[90px] bg-surface border-b-[4px] border-ink flex items-center justify-between px-1.5 md:px-8 z-10 shrink-0 gap-2">
          <div className="flex items-center gap-1.5 md:gap-6 flex-1 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label={t('app.openSidebar', 'Open sidebar')}
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full border-[2px] border-ink bg-surface shadow-neo-sm shrink-0"
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
              <div className="relative overflow-hidden flex items-center gap-2 min-w-0">
                <AnimatePresence mode="popLayout" custom={direction}>
                  <motion.div
                    key={formattedTitle}
                    custom={direction}
                    initial={{ opacity: 0, y: direction * 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -direction * 15 }}
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
                <DstBadge referenceDate={format(currentDate, 'yyyy-MM-dd')} />
              </div>
            </div>
          </div>

          <div className="print-hide flex gap-1.5 md:gap-4 items-center shrink-0">
            {/* Desktop View Switcher */}
            <div className="hidden sm:flex items-center bg-surface border-[2px] md:border-thick rounded-full p-1 shadow-neo-sm md:shadow-neo h-[36px] sm:h-[40px] md:h-[52px]">
              <button
                onClick={() => { setDirection(0); setView('month'); }}
                className={cn(
                  "h-full px-3 sm:px-4 lg:px-4 rounded-full font-bold text-xs sm:text-sm tracking-widest transition-all uppercase",
                  view === 'month' ? "bg-primary text-white border-[2px] border-ink shadow-neo-sm" : "text-ink hover:bg-bg-light"
                )}
              >
                {t('app.month')}
              </button>
              <button
                onClick={() => { setDirection(0); setView('week'); }}
                className={cn(
                  "h-full px-3 sm:px-4 lg:px-4 rounded-full font-bold text-xs sm:text-sm tracking-widest transition-all uppercase",
                  view === 'week' ? "bg-primary text-white border-[2px] border-ink shadow-neo-sm" : "text-ink hover:bg-bg-light"
                )}
              >
                {t('app.week')}
              </button>
              <button
                onClick={() => { setDirection(0); setView('agenda'); }}
                className={cn(
                  "h-full px-3 sm:px-4 lg:px-4 rounded-full font-bold text-xs sm:text-sm tracking-widest transition-all uppercase",
                  view === 'agenda' ? "bg-primary text-white border-[2px] border-ink shadow-neo-sm" : "text-ink hover:bg-bg-light"
                )}
              >
                {t('app.agenda', 'Agenda')}
              </button>
            </div>
            
            {/* Mobile View Switcher */}
            <button
              onClick={() => { setDirection(0); setView(view === 'month' ? 'week' : 'month'); }}
              aria-label={view === 'month' ? t('app.week') : t('app.month')}
              className="sm:hidden flex items-center justify-center px-2.5 h-8 rounded-full border-[2px] border-ink bg-surface shadow-neo-sm font-bold text-xs uppercase"
            >
              {view === 'month' ? t('app.m') : t('app.w')}
            </button>

            {userRole !== 'child' && (
              <button
                onClick={() => setIsSyncModalOpen(true)}
                title={t('app.syncGoogleCalendar')}
                aria-label={t('app.syncGoogleCalendar')}
                className="flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink bg-surface shadow-neo-sm md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all hidden sm:flex"
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
                  aria-label={t('app.exportCalendar')}
                  className="print-hide flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink bg-surface shadow-neo-sm md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all hidden sm:flex"
                >
                  <Download className="w-4 h-4 md:w-7 md:h-7 font-bold" strokeWidth={3} />
                </button>
                <button
                  onClick={() => setPrintOpen(true)}
                  title={t('app.printCalendar', 'Print Calendar')}
                  aria-label={t('app.printCalendar', 'Print Calendar')}
                  className="print-hide flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink bg-surface shadow-neo-sm md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all hidden sm:flex"
                >
                  <Printer className="w-4 h-4 md:w-7 md:h-7 font-bold" strokeWidth={3} />
                </button>
                <button
                  onClick={() => {
                    setIsMultiSelectMode(!isMultiSelectMode);
                    if (isMultiSelectMode) setSelectedEventIdsForDelete([]);
                  }}
                  title={isMultiSelectMode ? t('app.cancelMultiSelect') : t('app.startMultiSelect')}
                  aria-label={isMultiSelectMode ? t('app.cancelMultiSelect') : t('app.startMultiSelect')}
                  aria-pressed={isMultiSelectMode}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink shadow-neo-sm md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all",
                    isMultiSelectMode ? "bg-primary text-white" : "bg-surface"
                  )}
                >
                  <CheckSquare className="w-4 h-4 md:w-8 md:h-8 font-bold" strokeWidth={3} />
                </button>
              </>
            )}
            <button
              onClick={prev}
              title={t('app.previous')}
              aria-label={t('app.previous')}
              className="flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink bg-surface shadow-neo-sm md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all"
            >
              <ChevronLeft className="w-4 h-4 md:w-8 md:h-8 font-bold" strokeWidth={3} />
            </button>
            <button
              onClick={next}
              title={t('app.next')}
              aria-label={t('app.next')}
              className="flex items-center justify-center w-8 h-8 md:w-14 md:h-14 rounded-full border-[2px] md:border-[3px] border-ink bg-surface shadow-neo-sm md:shadow-neo hover:-translate-y-1 active:translate-y-1 transition-all"
            >
              <ChevronRight className="w-4 h-4 md:w-8 md:h-8 font-bold" strokeWidth={3} />
            </button>
          </div>
        </header>
        
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar isOpenOnMobile={isMobileSidebarOpen} onCloseMobile={() => setIsMobileSidebarOpen(false)} onSignOut={handleSignOut} />
          
          <main
            id="main-content"
            ref={mainContentRef}
            tabIndex={-1}
            className="flex-1 flex flex-col relative bg-bg-app p-2 overflow-hidden outline-none"
          >
             {authLoading ? (
               <div className="flex-1 flex items-center justify-center">
                 <div className="animate-spin w-12 h-12 border-[4px] border-ink border-t-transparent rounded-full" />
               </div>
             ) : !user ? (
               <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-app/90 backdrop-blur-md">
                  <div className="p-8 bg-surface border-[4px] border-ink shadow-neo-xl rounded-3xl flex flex-col items-center max-w-sm w-full mx-4">
                    <div className="w-20 h-20 bg-mem-2 rounded-full border-[3px] border-ink flex items-center justify-center shadow-neo mb-6">
                      <InteractiveLogo />
                    </div>
                    <h2 className="text-2xl font-black mb-1 text-center">{t('app.synopticFamily')}</h2>
                    <p className="text-ink/60 font-bold mb-6 text-sm text-center">{t('app.signInRequired')}</p>

                    {/* Email / Password form */}
                    <form
                      className="w-full flex flex-col gap-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setAuthError(null);
                        setAuthSubmitting(true);
                        try {
                          const { signInWithEmail, signUpWithEmail } = await import('./lib/supabase');
                          if (authMode === 'signin') {
                            const { error } = await signInWithEmail(authEmail, authPassword);
                            if (error) throw error;
                          } else {
                            const { error } = await signUpWithEmail(authEmail, authPassword);
                            if (error) throw error;
                          }
                        } catch (err: any) {
                          setAuthError(err.message ?? 'Authentication failed');
                        } finally {
                          setAuthSubmitting(false);
                        }
                      }}
                    >
                      <input
                        type="email"
                        placeholder="Email"
                        required
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border-[3px] border-ink font-bold bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary text-ink placeholder:text-ink/40"
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        required
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border-[3px] border-ink font-bold bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary text-ink placeholder:text-ink/40"
                      />
                      {authError && (
                        <p className="text-danger font-bold text-sm text-center">{authError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={authSubmitting}
                        className="bg-primary w-full text-white font-black text-base px-8 py-3.5 rounded-xl border-[3px] border-ink hover:-translate-y-1 hover:shadow-neo transition-all shadow-neo active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {authSubmitting ? '...' : authMode === 'signin' ? t('app.signIn', 'Sign in') : t('app.createAccount', 'Create account')}
                      </button>
                    </form>

                    <button
                      onClick={() => { setAuthMode(m => m === 'signin' ? 'signup' : 'signin'); setAuthError(null); }}
                      className="mt-3 text-sm font-bold text-ink/60 hover:text-ink transition-colors"
                    >
                      {authMode === 'signin' ? t('app.noAccount', "Don't have an account? Sign up") : t('app.hasAccount', 'Already have an account? Sign in')}
                    </button>

                    <div className="w-full flex items-center gap-3 my-4">
                      <div className="flex-1 h-[2px] bg-ink/15 rounded" />
                      <span className="text-xs font-bold text-ink/40 uppercase tracking-wider">or</span>
                      <div className="flex-1 h-[2px] bg-ink/15 rounded" />
                    </div>

                    <button
                      onClick={() => import('./lib/supabase').then(async s => {
                        try {
                          const { error } = await s.signInWithGoogle();
                          if (error) throw error;
                        } catch (err) {
                          console.error("Supabase OAuth failed. Falling back to local mode.", err);
                          // Force local-mode fallback by reloading — the auth
                          // hook will resolve to `local-user` when Supabase
                          // env vars are missing on next mount.
                          showToast(t('app.continueOffline', 'Continuing offline'));
                          window.location.reload();
                        }
                      })}
                      className="w-full h-11 rounded-xl border-[3px] border-ink font-bold text-sm bg-surface hover:-translate-y-0.5 hover:shadow-neo-sm transition-all flex items-center justify-center gap-2 text-ink"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
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
                 initial={{ opacity: 0, x: direction * 30 }}
                 animate={{ opacity: authLoading || !user ? 0 : 1, x: 0 }}
                 exit={{ opacity: 0, x: -direction * 30 }}
                 transition={{ duration: 0.3, ease: 'easeOut' }}
                 className="h-full flex flex-col"
               >
                  {isMobile ? (
                    <CalendarAgenda currentDate={currentDate} onDateClick={setSelectedDay} />
                  ) : view === 'month' ? (
                    <CalendarMonth currentDate={currentDate} onDateClick={setSelectedDay} />
                  ) : view === 'agenda' ? (
                    <CalendarAgenda currentDate={currentDate} onDateClick={setSelectedDay} />
                  ) : (
                    <CalendarWeek currentDate={currentDate} onDateClick={setSelectedDay} />
                  )}
               </motion.div>
             </AnimatePresence>
          
            {userRole !== 'child' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                aria-label={t('app.addEvent', 'Add event')}
                title={t('app.addEvent', 'Add event')}
                className="absolute bottom-6 right-6 w-16 h-16 md:bottom-10 md:right-10 md:w-24 md:h-24 bg-primary rounded-full border-[3px] md:border-[5px] border-ink shadow-neo md:shadow-neo-lg flex items-center justify-center cursor-pointer z-40 group tracking-widest active:translate-y-1"
              >
                <Plus className="w-8 h-8 md:w-14 md:h-14 text-ink font-bold group-hover:rotate-90 transition-transform duration-300" strokeWidth={4} />
              </button>
            )}
          </main>
        </div>
        
        <ErrorBoundary label="AddEvent">
          <AddEventModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </ErrorBoundary>
        <ErrorBoundary label="EventDetail">
          <EventDetailModal
            isOpen={!!selectedEventId}
            onClose={() => setSelectedEventId(null)}
            eventId={selectedEventId!}
          />
        </ErrorBoundary>
        <AnimatePresence>
          {selectedDay && (
            <ErrorBoundary label="DayEvents">
              <DayEventsModal isOpen={!!selectedDay} date={selectedDay} onClose={() => setSelectedDay(null)} />
            </ErrorBoundary>
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
                className="bg-danger text-white px-8 py-4 rounded-full border-[4px] border-ink font-bold shadow-neo-lg hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_var(--color-ink)] active:translate-y-[2px] active:shadow-neo-sm transition-all flex items-center gap-2 text-lg"
              >
                <Trash2 className="w-6 h-6" /> {t('app.deleteSelected', { count: selectedEventIdsForDelete.length })}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reminder Alert System */}
        <ReminderSystem />

        {/* Global Toasts */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                onClick={() => dismissToast(t.id)}
                className="cursor-pointer pointer-events-auto bg-surface border-[3px] border-ink rounded-full px-6 py-3 shadow-neo flex items-center gap-3 font-bold text-ink"
              >
                <BellRing className="w-5 h-5 text-primary" strokeWidth={3} />
                {t.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Delete Confirmation Modal */}
        <ErrorBoundary label="DeleteConfirm">
        <ModalShell
          isOpen={!!eventsToDelete}
          onClose={() => setEventsToDelete(null)}
          maxWidth="max-w-sm"
          className="text-center"
        >
          <div className="w-16 h-16 bg-avatar rounded-full border-[3px] border-ink flex items-center justify-center mx-auto mb-4 shadow-neo">
            <AlertCircle className="w-8 h-8 text-ink" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">
            {(eventsToDelete?.length ?? 0) > 1 ? t('app.deleteEventsTitle') : t('app.deleteEventTitle')}
          </h2>
          <p className="text-ink/70 font-bold mb-6">
            {(eventsToDelete?.length ?? 0) > 1
              ? t('app.deleteEventsConfirm', { count: eventsToDelete!.length })
              : t('app.deleteEventConfirm')}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setEventsToDelete(null)}
              className="flex-1 h-12 bg-gray-200 rounded-full border-[3px] border-ink font-bold hover:-translate-y-1 hover:shadow-neo transition-all"
            >
              {t('app.cancel')}
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 h-12 bg-danger text-white rounded-full border-[3px] border-ink font-bold shadow-neo hover:-translate-y-1 hover:shadow-neo-hover active:translate-y-1 active:shadow-none transition-all"
            >
              {t('app.delete')}
            </button>
          </div>
        </ModalShell>
        </ErrorBoundary>

        {/* Sync Confirmation Modal */}
        <ErrorBoundary label="SyncConfirm">
        <ModalShell
          isOpen={isSyncModalOpen}
          onClose={() => !isSyncing && setIsSyncModalOpen(false)}
          maxWidth="max-w-sm"
          className="text-center"
        >
          <div className="w-16 h-16 bg-avatar rounded-full border-[3px] border-ink flex items-center justify-center mx-auto mb-4 shadow-neo">
            <RefreshCw className={cn('w-8 h-8 text-ink', isSyncing && 'animate-spin')} />
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
        </ModalShell>
        </ErrorBoundary>

        {/* Command palette (cmd/ctrl + K) */}
        <CommandPalette
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          events={events}
          onPickEvent={(id) => setSelectedEventId(id)}
        />

        {/* Onboarding splash — only the first time */}
      <OnboardingSplash
        visible={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

      {/* Print preview — Cmd/Ctrl+P */}
      <PrintPreviewModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
      />
      </div>
    </EventsContext.Provider>
  );
}
