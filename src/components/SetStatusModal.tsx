import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { X, Search, ChevronDown, Check } from 'lucide-react';
import { Home, GraduationCap, Briefcase, Dumbbell, Car, Plane, MapPin, Coffee, Users, Shield, Building, Heart, Star, Cloud, Sun, Moon } from 'lucide-react';
import { useEvents } from '../lib/eventsContext';

const STATIC_ICONS: Record<string, any> = {
  Home, GraduationCap, Briefcase, Dumbbell, Car, Plane, MapPin, Coffee, Users, Shield, Building, Heart, Star, Cloud, Sun, Moon
};

const validIconKeys = Object.keys(STATIC_ICONS);

export function SetStatusModal({ 
  isOpen, 
  onClose, 
  memberId,
  currentStatus,
  onSave
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  memberId: string | null;
  currentStatus?: { text: string, icon: string, updatedAt?: string };
  onSave: (memberId: string, status: { text: string, icon: string, updatedAt?: string }) => void;
}) {
  const { t } = useTranslation();
  const { familyMembers, places } = useEvents();

  const PRESETS = useMemo(() => {
    const builtin = [
      { text: t('app.homeCaps', 'HOME'), iconKey: 'Home' },
      { text: t('app.schoolCaps', 'SCHOOL'), iconKey: 'GraduationCap' },
      { text: t('app.workCaps', 'WORK'), iconKey: 'Briefcase' },
      { text: t('app.gymCaps', 'GYM'), iconKey: 'Dumbbell' },
      { text: t('app.commutingCaps', 'COMMUTING'), iconKey: 'Car' },
      { text: t('app.travelingCaps', 'TRAVELING'), iconKey: 'Plane' },
    ];
    const placesPresets = places.map(p => ({ text: p.name.toUpperCase(), iconKey: 'MapPin' }));
    return [...builtin, ...placesPresets.filter(p => !builtin.some(b => b.text === p.text))];
  }, [t, places]);

  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  
  const [customText, setCustomText] = useState('');
  const [customIcon, setCustomIcon] = useState('MapPin');
  const [search, setSearch] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  
  const [isDesktop, setIsDesktop] = useState(true);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(min-width: 640px)');
      setIsDesktop(mql.matches);
      const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, []);
  
  // Update state when custom text is typed
  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomText(e.target.value);
    setUseCustom(true);
  };
  
  // Virtualize or limit icons
  const filteredIcons = useMemo(() => {
    if (!search) return validIconKeys.slice(0, 100);
    const lower = search.toLowerCase();
    return validIconKeys.filter(k => k.toLowerCase().includes(lower)).slice(0, 100);
  }, [search]);

  // Load effect
  React.useEffect(() => {
    if (isOpen && currentStatus) {
      const preset = PRESETS.find(p => p.iconKey === currentStatus.icon && p.text === currentStatus.text);
      if (preset) {
        setSelectedPreset(preset);
        setUseCustom(false);
        setCustomText('');
      } else {
        setCustomText(currentStatus.text);
        setCustomIcon(currentStatus.icon);
        setUseCustom(true);
      }
    }
  }, [isOpen, memberId, currentStatus]);

  if (!isOpen || !memberId) return null;
  const member = familyMembers.find(m => m.id === memberId);
  if (!member) return null;

  const handleSave = () => {
    const updatedAt = new Date().toISOString();
    if (!useCustom) {
      onSave(member.id, { text: selectedPreset.text, icon: selectedPreset.iconKey, updatedAt });
    } else {
      onSave(member.id, { text: customText.trim() || t('app.unknownStatus'), icon: customIcon, updatedAt });
    }
    onClose();
  };

  const SelectedIcon = STATIC_ICONS[selectedPreset.iconKey] || STATIC_ICONS.MapPin;
  const CustomIconComponent = STATIC_ICONS[customIcon] || STATIC_ICONS.MapPin;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
         onClick={onClose}
       />
       <motion.div 
         initial={isDesktop ? { opacity: 0, scale: 0.9, y: 10 } : { opacity: 0, y: "100%" }}
         animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, y: 0 }}
         exit={isDesktop ? { opacity: 0, scale: 0.9, y: 10 } : { opacity: 0, y: "100%" }}
         transition={isDesktop ? { duration: 0.2 } : { type: "spring", bounce: 0, duration: 0.4 }}
         className={cn("relative border-[4px] border-ink sm:rounded-3xl rounded-none sm:shadow-[8px_8px_0px_#1A1A1A] z-10 flex flex-col gap-4 h-[100dvh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-md p-6 pt-12 sm:pt-6 overflow-y-auto mt-auto sm:mt-0", member.bgClass)}
       >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/10 rounded-full transition-colors z-20">
            <X className="w-5 h-5 text-ink" />
          </button>
          
          <h2 className="text-2xl font-display font-bold">{t('app.setMyStatus')}</h2>

          <div className="flex flex-col overflow-y-auto overflow-x-hidden pr-2">
            <div className="flex flex-col gap-2 relative">
                <span className="font-bold text-sm opacity-80 mt-2 flex items-center justify-between">
                  {t('app.selectPreset')}
                  {useCustom && <span className="text-xs text-red-600">{t('app.customStatusActive')}</span>}
                </span>
                
                <div className="relative">
                  <button 
                    onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
                    className={cn("w-full h-14 border-[3px] border-ink rounded-xl px-4 font-bold bg-surface flex items-center justify-between shadow-[3px_3px_0px_#1A1A1A] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all", useCustom ? "opacity-50 grayscale" : "")}
                  >
                    <div className="flex items-center gap-3">
                      <SelectedIcon className="w-5 h-5 text-ink/70" />
                      <span>{selectedPreset.text}</span>
                    </div>
                    <ChevronDown className={cn("w-5 h-5 transition-transform", presetDropdownOpen ? "rotate-180" : "")} />
                  </button>
                  
                  <AnimatePresence>
                    {presetDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-[calc(100%+8px)] left-0 w-full bg-surface border-[3px] border-ink rounded-xl shadow-[4px_4px_0px_#1A1A1A] z-20 overflow-hidden"
                      >
                        {PRESETS.map(p => {
                          const PIcon = STATIC_ICONS[p.iconKey] || STATIC_ICONS.MapPin;
                          const isSelected = p.text === selectedPreset.text;
                          return (
                            <button 
                              key={p.text}
                              onClick={() => {
                                setSelectedPreset(p);
                                setPresetDropdownOpen(false);
                                setUseCustom(false);
                              }}
                              className={cn("w-full h-12 px-4 flex items-center gap-3 hover:bg-black/5 font-bold text-sm transition-colors border-b-2 border-ink/10 last:border-0", isSelected ? "bg-black/5" : "")}
                            >
                              <PIcon className="w-5 h-5 text-ink/70" />
                              <span className="flex-1 text-left">{p.text}</span>
                              {isSelected && <Check className="w-4 h-4 text-ink" />}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            </div>

            <div className="flex items-center gap-4 my-2 opacity-50">
               <div className="h-0.5 bg-ink flex-1" />
               <span className="font-bold text-xs uppercase">{t('app.orDefineCustom')}</span>
               <div className="h-0.5 bg-ink flex-1" />
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex gap-2 relative mt-2">
                  <div className="w-14 h-14 bg-surface border-[3px] border-ink rounded-xl flex items-center justify-center shrink-0 shadow-[3px_3px_0px_#1A1A1A]">
                     <CustomIconComponent className="w-6 h-6" />
                  </div>
                  <input 
                    type="text" 
                    value={customText} 
                    onChange={handleCustomTextChange} 
                    placeholder={t('app.egCafe')} 
                    className="flex-1 h-14 border-[3px] border-ink rounded-xl px-3 font-bold bg-surface outline-none uppercase shadow-[3px_3px_0px_#1A1A1A]" 
                  />
                </div>
                
                <div className="flex flex-col gap-2 relative z-0">
                  <div className="flex items-center gap-2 border-[3px] border-ink rounded-xl px-3 bg-surface h-10 shadow-sm">
                      <Search className="w-4 h-4 opacity-50" />
                      <input 
                        type="text" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        onFocus={() => setUseCustom(true)}
                        placeholder={t('app.searchIcons')} 
                        className="flex-1 bg-transparent outline-none text-sm font-bold"
                      />
                  </div>
                  <div className="grid grid-cols-6 gap-2 overflow-y-auto h-[120px] p-1 bg-surface/50 border-[2px] border-ink/20 rounded-xl">
                      {filteredIcons.map(key => {
                        const Icon = STATIC_ICONS[key];
                        return (
                            <button 
                              key={key} 
                              onClick={() => {
                                setCustomIcon(key);
                                setUseCustom(true);
                              }} 
                              className={cn(
                                "flex items-center justify-center p-2 rounded-xl transition-all", 
                                customIcon === key && useCustom ? "bg-surface border-2 border-ink scale-110 shadow-sm" : "hover:bg-surface/80"
                              )}
                            >
                              <Icon className="w-5 h-5 opacity-70" />
                            </button>
                        )
                      })}
                  </div>
                </div>
            </div>
          </div>

          <button onClick={handleSave} className="w-full shrink-0 h-14 bg-ink text-surface rounded-full border-[3px] border-ink font-bold shadow-neo hover:-translate-y-1 hover:shadow-neo-hover active:translate-y-1 active:shadow-none transition-all mt-2 text-lg">
             {t('app.saveStatus')}
          </button>
       </motion.div>
    </div>
  )
}
