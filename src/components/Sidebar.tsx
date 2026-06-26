import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { Settings, LogOut, CheckCircle2, ChevronRight, Home, GraduationCap, Shield, MapPin, Menu, Edit2, X, Briefcase, Dumbbell, Car, Plane, Coffee, Users, Building, Heart, Star, Cloud, Sun, Moon, Trash, Image as ImageIcon, Cake, BarChart3 } from 'lucide-react';
import { useEvents } from '../lib/eventsContext';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { SetStatusModal } from './SetStatusModal';
import { SettingsModal } from './SettingsModal';
import { FamilyModal } from './FamilyModal';
import { PlacesModal } from './PlacesModal';
import { ErrorBoundary } from './ErrorBoundary';
import { isToday, isValid, parseISO, formatDistanceToNow, addDays } from 'date-fns';
import { eventsThisWeekByMember, nextBirthdayFor } from '../lib/birthdays';

const STATIC_ICONS: Record<string, any> = {
  Home, GraduationCap, Shield, Briefcase, Dumbbell, Car, Plane, MapPin, Coffee, Users, Building, Heart, Star, Cloud, Sun, Moon
};

function SidebarTooltip({ children, text, disabled }: { children: React.ReactNode, text: string, disabled?: boolean, key?: string | number }) {
  return (
    <div className="relative group/tooltip flex items-center justify-center w-full">
      {children}
      {!disabled && (
        <div className="absolute left-full ml-1 sm:ml-2 top-1/2 -translate-y-1/2 bg-ink text-surface text-sm font-bold px-4 py-2 rounded-xl opacity-0 scale-75 -translate-x-4 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 group-hover/tooltip:translate-x-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap z-[100] shadow-neo">
          {text}
          <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 border-[5px] border-transparent border-r-ink w-0 h-0"></div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ isOpenOnMobile, onCloseMobile, onSignOut }: { isOpenOnMobile?: boolean; onCloseMobile?: () => void; onSignOut?: () => void }) {
  const { t } = useTranslation();
  const { events, selectedMembers, toggleMember, familyMembers, updateFamilyMember, reorderFamilyMembers, deleteFamilyMember } = useEvents();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState(false);
  const [isPlacesOpen, setIsPlacesOpen] = useState(false);
  const [deleteConfirmMemberId, setDeleteConfirmMemberId] = useState<string | null>(null);
  
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingFamilyName, setEditingFamilyName] = useState('');
  
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, memberId: string, isIconPickerOpen?: boolean} | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
    };
    if (contextMenu) {
      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('contextmenu', handleGlobalClick);
      return () => {
        document.removeEventListener('click', handleGlobalClick);
        document.removeEventListener('contextmenu', handleGlobalClick);
      };
    }
    return undefined;
  }, [contextMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        const index = num - 1;
        if (index < familyMembers.length) {
          toggleMember(familyMembers[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [familyMembers, toggleMember]);
  
  const [statusModalMemberId, setStatusModalMemberId] = useState<string | null>(null);

  // Derived: events per member this week + upcoming birthday.
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = addDays(weekStart, 7);
  const statsByMember = eventsThisWeekByMember(events, weekStart, weekEnd);
  const nextBirthday = nextBirthdayFor(familyMembers, today);

  return (
    <>
      <ErrorBoundary label="SetStatus">
        <SetStatusModal
          isOpen={!!statusModalMemberId}
          onClose={() => setStatusModalMemberId(null)}
          memberId={statusModalMemberId}
          currentStatus={statusModalMemberId ? familyMembers.find(m => m.id === statusModalMemberId)?.currentLocation : undefined}
          onSave={(id, status) => updateFamilyMember(id, { currentLocation: status })}
        />
      </ErrorBoundary>
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpenOnMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[90] sm:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 90 : 280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          "bg-surface border-[4px] border-ink sm:m-3 sm:rounded-3xl shadow-neo flex flex-col pt-4 pb-6 gap-6 shrink-0 z-[100] sm:z-40",
          isOpenOnMobile ? "fixed left-0 top-0 bottom-0 rounded-r-3xl flex" : "hidden sm:flex sm:relative",
          isCollapsed ? "px-2 items-center" : "px-6"
        )}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? t('app.openSidebar', 'Open sidebar') : t('app.closeSidebar', 'Close sidebar')}
          aria-label={isCollapsed ? t('app.openSidebar', 'Open sidebar') : t('app.closeSidebar', 'Close sidebar')}
          aria-expanded={!isCollapsed}
          className={cn(
            "w-10 h-10 rounded-full border-[3px] border-ink flex items-center justify-center shrink-0 shadow-neo hover:bg-ink hover:text-white transition-all",
            isCollapsed ? "self-center" : "self-end"
          )}
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </motion.button>

        <div className="flex flex-col gap-1 w-full shrink-0">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.h3 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="font-bold text-lg text-muted uppercase tracking-widest opacity-70 mb-2 whitespace-nowrap overflow-hidden"
              >
                {t('app.members')}
              </motion.h3>
            )}
          </AnimatePresence>
          <Reorder.Group axis="y" values={familyMembers} onReorder={reorderFamilyMembers} className="flex flex-col gap-3 w-full">
            {familyMembers.map((member, index) => {
              const isSelected = selectedMembers.includes(member.id);
              const MemberIcon = member.icon && STATIC_ICONS[member.icon] ? STATIC_ICONS[member.icon] : null;
              const shortcutText = index < 9 ? ` (${index + 1})` : '';
              return (
                <Reorder.Item key={member.id} value={member} className="list-none sidebar-member-button">
                  <SidebarTooltip text={`${member.name}${shortcutText}`} disabled={!isCollapsed}>
                    <motion.div
                      layout
                      transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
                      onContextMenu={(e: any) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.clientX, y: e.clientY, memberId: member.id });
                      }}
                      onClick={() => toggleMember(member.id)}
                      className={cn(
                        "flex items-center rounded-full border-[3px] border-ink shadow-neo shrink-0 neo-interactive transition-colors overflow-hidden cursor-grab active:cursor-grabbing active:shadow-none active:translate-y-[2px] active:translate-x-[2px] hover:shadow-neo-hover hover:-translate-y-1 hover:-translate-x-1",
                        isCollapsed ? "w-[50px] h-[50px] justify-center mx-auto" : "w-full justify-between px-5 h-[48px]",
                        isSelected ? cn(member.bgClass, "ring-4 ring-ink/30 ring-offset-2 ring-offset-surface relative z-10") : "bg-surface opacity-60"
                      )}
                    >
                      {!isCollapsed ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex w-full justify-between items-center whitespace-nowrap overflow-hidden pr-2">
                          <div className="flex items-center gap-2 overflow-hidden w-full mr-2">
                             {MemberIcon && <MemberIcon className="w-5 h-5 flex-shrink-0 pointer-events-none" />}
                             {editingMemberId === member.id ? (
                               <input
                                  autoFocus
                                  type="text"
                                  value={editingFamilyName}
                                  onChange={(e) => setEditingFamilyName(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onBlur={() => {
                                    if (editingFamilyName.trim()) {
                                      updateFamilyMember(member.id, { name: editingFamilyName.trim() });
                                    }
                                    setEditingMemberId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (editingFamilyName.trim()) {
                                        updateFamilyMember(member.id, { name: editingFamilyName.trim() });
                                      }
                                      setEditingMemberId(null);
                                    }
                                    if (e.key === 'Escape') setEditingMemberId(null);
                                  }}
                                  className="font-bold text-ink text-base bg-white/50 border-b-2 border-ink outline-none w-full min-w-0 flex-1 px-1 -ml-1 rounded"
                               />
                             ) : (
                               <>
                                 <span 
                                   className="font-bold text-ink text-base cursor-text pointer-events-auto truncate hover:opacity-75 transition-opacity"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setEditingMemberId(member.id);
                                     setEditingFamilyName(member.name);
                                   }}
                                   onPointerDown={(e) => e.stopPropagation()}
                                 >
                                   {member.name}
                                 </span>
                                 {index < 9 && (
                                   <span className="flex-shrink-0 flex items-center justify-center min-w-[20px] h-5 px-1 rounded bg-ink/10 text-[11px] font-bold text-ink/50 pointer-events-none hidden sm:flex" title={`Keyboard shortcut: ${index + 1}`}>
                                     {index + 1}
                                   </span>
                                 )}
                               </>
                             )}
                          </div>
                          {isSelected && editingMemberId !== member.id && <CheckCircle2 className="text-ink w-5 h-5 fill-ink text-white shrink-0 pointer-events-none" />}
                        </motion.div>
                      ) : (
                          MemberIcon ? <MemberIcon className="w-6 h-6 pointer-events-none" /> : <span className="font-bold text-ink text-lg uppercase pointer-events-none">{member.name[0]}</span>
                      )}
                    </motion.div>
                  </SidebarTooltip>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>

        <div className="flex flex-col gap-2 mb-2 w-full relative group shrink-0">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between mb-2 overflow-hidden"
              >
                <h3 className="font-bold text-lg text-ink uppercase tracking-widest opacity-70 whitespace-nowrap">{t('app.lastSeenAt', 'Last seen at')}</h3>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div layout className={cn("grid gap-3 w-full", isCollapsed ? "grid-cols-1" : "grid-cols-2")}>
            {familyMembers.map(member => {
              const loc = member.currentLocation || { text: 'HOME', icon: 'Home' };
              const IconComponent = STATIC_ICONS[loc.icon] || STATIC_ICONS.MapPin;
              
              const colorMaps: Record<string, {text: string, fill: string}> = {
                'bg-mem-1': { text: 'text-mem-1', fill: 'fill-mem-1/20' },
                'bg-mem-2': { text: 'text-mem-2', fill: 'fill-mem-2/20' },
                'bg-mem-3': { text: 'text-mem-3', fill: 'fill-mem-3/20' },
                'bg-mem-4': { text: 'text-mem-4', fill: 'fill-mem-4/20' },
              };
              const colors = colorMaps[member.color] || { text: 'text-ink', fill: 'fill-ink/20' };

              const hasEventToday = events.some(e => 
                e.memberIds.includes(member.id) && 
                e.date && 
                isValid(parseISO(e.date)) && 
                isToday(parseISO(e.date))
              );
              return (
                <SidebarTooltip key={member.id} text={`${member.name} - ${loc.text}`} disabled={!isCollapsed}>
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
                    onClick={() => setStatusModalMemberId(member.id)}
                    onContextMenu={(e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, memberId: member.id });
                    }}
                    className="flex items-center justify-center flex-col py-3 px-2 w-full cursor-pointer hover:bg-black/5 rounded-xl hover:scale-105 active:scale-95 group/loc relative sidebar-member-button"
                  >
                      <motion.div
                        key={`${loc.icon}-${loc.text}`}
                        initial={{ rotateY: 180 }}
                        animate={{ 
                          rotateY: 0,
                          scale: hasEventToday ? [1, 1.15, 1] : 1
                        }}
                        transition={{ 
                          rotateY: { type: "spring", stiffness: 200, damping: 20 },
                          scale: hasEventToday ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" } : { duration: 0.2 }
                        }}
                      >
                        <IconComponent className={cn("w-9 h-9 stroke-2 transition-transform group-hover/loc:scale-110", colors.text, colors.fill)} />
                      </motion.div>
                      {!isCollapsed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full mt-2">
                          <span className="text-[11px] font-medium text-ink/50 uppercase tracking-wide leading-tight">{member.name}</span>
                          <span className="text-[12px] font-bold text-ink uppercase tracking-tighter truncate w-full text-center leading-tight mt-0.5">{loc.text}</span>
                          {loc.updatedAt && (
                            <span className="text-[9px] font-medium text-ink/40 lowercase mt-1 text-center leading-none">
                              {formatDistanceToNow(parseISO(loc.updatedAt), { addSuffix: true })}
                            </span>
                          )}
                        </motion.div>
                      )}
                  </motion.div>
                </SidebarTooltip>
              );
            })}
          </motion.div>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col flex-1 overflow-hidden gap-2 mt-4 mb-[28px] w-full"
            >
              <h3 className="font-bold text-lg text-ink uppercase tracking-widest opacity-70 mb-2 whitespace-nowrap">{t('app.latestNews')}</h3>
              <div className="flex flex-col gap-3 overflow-y-auto pr-[6px] pl-[4px] pt-[4px] pb-[4px] h-[400px] mb-[8px]">
                {events
                  .filter(e => {
                    if (!e.date) return false;
                    const eventDate = parseISO(e.date);
                    return isValid(eventDate) && eventDate >= new Date(new Date().setHours(0,0,0,0));
                  })
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 6)
                  .map((evt, i) => {
                  const mem = familyMembers.find(m => m.id === evt.memberIds[0]);
                  return (
                    <div key={evt.id || i} className={cn("w-full flex items-center gap-3 px-5 h-[48px] rounded-full border-thick shadow-neo shrink-0", mem?.bgClass || "bg-surface")}>
                      <span className="text-xs font-bold text-ink/70 shrink-0">
                        {evt.date.substring(5).replace('-', '/')}
                      </span>
                      <span className="font-bold text-ink text-sm truncate flex-1">{evt.title}</span>
                      <button className="w-7 h-7 rounded-full border-2 border-ink bg-surface flex items-center justify-center hover:bg-ink hover:text-surface transition-colors shrink-0">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn("mt-auto w-full transition-all shrink-0", isCollapsed ? "pt-4" : "pt-0")}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-6 pt-6 border-t-[3px] border-ink">
              <SidebarTooltip text={t('app.parameters')}>
                <button onClick={() => setIsSettingsOpen(true)} className="flex items-center justify-center p-2 text-ink/50 hover:text-ink hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all">
                  <Settings className="w-6 h-6" />
                </button>
              </SidebarTooltip>
              <SidebarTooltip text={t('app.members')}>
                <button onClick={() => setIsFamilyOpen(true)} className="flex items-center justify-center p-2 text-ink/50 hover:text-ink hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all">
                  <Users className="w-6 h-6" />
                </button>
              </SidebarTooltip>
              <SidebarTooltip text={t('app.locations')}>
                <button onClick={() => setIsPlacesOpen(true)} className="flex items-center justify-center p-2 text-ink/50 hover:text-ink hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all">
                  <MapPin className="w-6 h-6" />
                </button>
              </SidebarTooltip>
              <SidebarTooltip text={t('app.logout')}>
                <button onClick={() => onSignOut?.()} className="flex items-center justify-center p-2 text-ink/50 hover:text-ink hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all">
                  <LogOut className="w-6 h-6" />
                </button>
              </SidebarTooltip>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-6 border-t-[3px] border-ink">
              <div className="grid grid-cols-2 gap-2">
                <SidebarTooltip text={t('app.appSettings')} disabled={true}>
                  <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 px-3 py-2.5 bg-surface border-[2px] border-ink rounded-xl shadow-neo-sm hover:bg-primary/10 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all w-full group">
                    <Settings className="w-4 h-4 shrink-0 text-muted group-hover:text-muted transition-colors group-hover:rotate-45" />
                    <span className="text-xs font-bold truncate text-muted">{t('app.settings')}</span>
                  </button>
                </SidebarTooltip>
                <SidebarTooltip text={t('app.manageFamily')} disabled={true}>
                  <button onClick={() => setIsFamilyOpen(true)} className="flex items-center gap-2 px-3 py-2.5 bg-surface border-[2px] border-ink rounded-xl shadow-neo-sm hover:bg-primary/10 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all w-full group">
                    <Users className="w-4 h-4 shrink-0 text-ink/70 group-hover:text-ink transition-colors group-hover:scale-110" />
                    <span className="text-xs font-bold truncate text-muted">{t('app.family')}</span>
                  </button>
                </SidebarTooltip>
                <SidebarTooltip text={t('app.manageLocations')} disabled={true}>
                  <button onClick={() => setIsPlacesOpen(true)} className="flex items-center gap-2 px-3 py-2.5 bg-surface border-[2px] border-ink rounded-xl shadow-neo-sm hover:bg-primary/10 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all w-full group">
                    <MapPin className="w-4 h-4 shrink-0 text-ink/70 group-hover:text-ink transition-colors group-hover:-translate-y-0.5" />
                    <span className="text-xs font-bold truncate border-muted text-muted">{t('app.places')}</span>
                  </button>
                </SidebarTooltip>
                <SidebarTooltip text={t('app.logout')} disabled={true}>
                  <button onClick={() => onSignOut?.()} className="flex items-center gap-2 px-3 py-2.5 bg-surface border-[2px] border-ink rounded-xl shadow-neo-sm hover:bg-red-50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all w-full group">
                    <LogOut className="w-4 h-4 shrink-0 text-red-500/70 group-hover:text-red-600 transition-colors group-hover:-translate-x-1" />
                    <span className="text-xs font-bold truncate text-red-600">{t('app.logout')}</span>
                  </button>
                </SidebarTooltip>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
      <ErrorBoundary label="Settings">
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </ErrorBoundary>
      <ErrorBoundary label="Family">
        <FamilyModal isOpen={isFamilyOpen} onClose={() => setIsFamilyOpen(false)} />
      </ErrorBoundary>
      <ErrorBoundary label="Places">
        <PlacesModal isOpen={isPlacesOpen} onClose={() => setIsPlacesOpen(false)} />
      </ErrorBoundary>
      
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 200 : contextMenu.y), left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - (contextMenu.isIconPickerOpen ? 250 : 200) : contextMenu.x) }}
            className={cn("fixed z-[9999] bg-surface border-[3px] border-ink shadow-neo rounded-xl overflow-hidden py-1", contextMenu.isIconPickerOpen ? "w-[240px]" : "w-48")}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {contextMenu.isIconPickerOpen ? (
              <div className="p-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="font-bold text-xs uppercase tracking-wider text-ink/70">{t('app.pickIcon', 'Pick Icon')}</span>
                  <button onClick={() => setContextMenu({ ...contextMenu, isIconPickerOpen: false })} className="p-1 hover:bg-black/5 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {Object.keys(STATIC_ICONS).map(iconName => {
                    const IconComponent = STATIC_ICONS[iconName];
                    const member = familyMembers.find(m => m.id === contextMenu.memberId);
                    const isSelectedIcon = member?.icon === iconName;
                    
                    return (
                      <button
                        key={iconName}
                        onClick={() => {
                          updateFamilyMember(contextMenu.memberId, { icon: iconName });
                          setContextMenu(null);
                        }}
                        className={cn("flex items-center justify-center p-2 rounded-lg hover:bg-black/5 active:scale-95 transition-all outline-none", isSelectedIcon && "bg-black/10")}
                      >
                        <IconComponent className="w-5 h-5 text-ink" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    const member = familyMembers.find(m => m.id === contextMenu.memberId);
                    if (member) {
                      setEditingMemberId(contextMenu.memberId);
                      setEditingFamilyName(member.name);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-black/5 font-bold flex items-center gap-2 text-sm text-ink"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('app.editName', 'Edit Name')}
                </button>
                <button
                  onClick={() => setContextMenu({ ...contextMenu, isIconPickerOpen: true })}
                  className="w-full text-left px-4 py-2 hover:bg-black/5 font-bold flex items-center gap-2 text-sm text-ink"
                >
                  <ImageIcon className="w-4 h-4" />
                  {t('app.pickIcon', 'Pick Icon')}
                </button>
                <div className="border-t-2 border-ink/10 my-1"></div>
                <button
                  onClick={() => {
                    setDeleteConfirmMemberId(contextMenu.memberId);
                    setContextMenu(null);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-500 font-bold flex items-center gap-2 text-sm"
                >
                  <Trash className="w-4 h-4" />
                  {t('app.removeFromView', 'Remove from view')}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmMemberId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface p-6 rounded-2xl w-full max-w-sm border-[3px] border-ink shadow-neo-xl"
            >
              <h2 className="text-2xl font-display font-bold mb-2">{t('app.removeMember', 'Remove Member?')}</h2>
              <p className="text-ink/70 font-bold mb-6">
                {t('app.removeMemberConfirm', 'Are you sure you want to remove this family member from view?')}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmMemberId(null)}
                  className="flex-1 h-12 bg-gray-200 rounded-full border-[3px] border-ink font-bold hover:-translate-y-1 hover:shadow-neo transition-all"
                >
                  {t('app.cancel', 'Cancel')}
                </button>
                <button 
                  onClick={() => {
                    deleteFamilyMember(deleteConfirmMemberId);
                    setDeleteConfirmMemberId(null);
                  }}
                  className="flex-1 h-12 bg-danger text-white rounded-full border-[3px] border-ink font-bold shadow-neo hover:-translate-y-1 hover:shadow-neo-hover active:translate-y-1 active:shadow-none transition-all"
                >
                  {t('app.remove', 'Remove')}
                </button>
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isCollapsed && familyMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 w-full mb-3"
              data-testid="sidebar-stats"
            >
              <h3 className="font-bold text-sm text-ink uppercase tracking-widest opacity-70 whitespace-nowrap flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {t('app.quickStats', 'This week')}
              </h3>
              <div className="flex flex-col gap-1.5">
                {familyMembers.slice(0, 4).map(mem => {
                  const count = statsByMember[mem.id] ?? 0;
                  return (
                    <div key={mem.id} className="flex items-center gap-2 px-2 py-1 rounded-lg">
                      <div className={cn('w-5 h-5 rounded-full border-[1.5px] border-ink flex items-center justify-center text-[9px] font-black', mem.bgClass)}>
                        {mem.name[0]}
                      </div>
                      <span className="text-[11px] font-bold flex-1 truncate">{mem.name}</span>
                      <span className="text-[11px] font-black opacity-60">{count}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isCollapsed && nextBirthday && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border-[2px] border-ink bg-mem-3/30 shadow-neo-sm mb-2"
              data-testid="sidebar-birthday"
            >
              <Cake className="w-4 h-4 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  {t('app.nextBirthday', 'Next birthday')}
                </span>
                <span className="text-xs font-bold truncate">
                  {nextBirthday.member.name} · {nextBirthday.daysUntil === 0
                    ? t('app.today', 'Today')
                    : t('app.inDaysShort', { defaultValue: `in ${nextBirthday.daysUntil}d` })}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );
}
