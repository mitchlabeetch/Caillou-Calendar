import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Home, GraduationCap, Shield, Briefcase, Dumbbell, Car, Plane, MapPin, Coffee, Users, Building, Heart, Star, Cloud, Sun, Moon } from 'lucide-react';
import { useEvents } from '../lib/eventsContext';
import { cn } from '../lib/utils';

const STATIC_ICONS: Record<string, any> = {
  Home, GraduationCap, Shield, Briefcase, Dumbbell, Car, Plane, MapPin, Coffee, Users, Building, Heart, Star, Cloud, Sun, Moon
};

const COLORS = ['bg-mem-1', 'bg-mem-2', 'bg-mem-3', 'bg-mem-4'];

export function FamilyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useEvents();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-surface border-[3px] border-ink sm:rounded-3xl rounded-none sm:shadow-[8px_8px_0px_#1A1A1A] w-full sm:max-w-md h-[100dvh] sm:h-auto p-6 sm:max-h-[90vh] flex flex-col pt-12 sm:pt-6">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-full transition-colors z-10">
            <X className="w-5 h-5 text-ink" />
          </button>
          
          <h2 className="text-2xl font-display font-bold mb-6 shrink-0">{t('app.manageFamily')}</h2>

          <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-2 -mr-2">
            <AnimatePresence initial={false}>
              {familyMembers.map((m) => {
                const SelectedIcon = m.icon && STATIC_ICONS[m.icon] ? STATIC_ICONS[m.icon] : null;
                const isExpanded = expandedId === m.id;
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95, height: 0 }}
                    animate={{ opacity: 1, scale: 1, height: 'auto' }}
                    exit={{ opacity: 0, scale: 0.95, height: 0 }}
                    key={m.id} 
                    className="flex flex-col p-2 border-[2px] border-ink/20 focus-within:border-ink rounded-xl bg-surface focus-within:shadow-[4px_4px_0px_#1A1A1A] transition-all group overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={() => setExpandedId(isExpanded ? null : m.id)}
                        className={cn("w-10 h-10 rounded-full border-[2px] border-ink flex items-center justify-center shadow-sm shrink-0 text-lg font-black uppercase text-ink cursor-pointer hover:scale-105 transition-transform", m.bgClass)}
                      >
                         {SelectedIcon ? <SelectedIcon className="w-5 h-5" /> : (m.name[0] || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input 
                          type="text" 
                          defaultValue={m.name} 
                          onBlur={(e) => updateFamilyMember(m.id, { name: e.target.value })}
                          placeholder="Name"
                          className="w-full bg-transparent font-bold text-lg text-ink outline-none px-1 transition-colors"
                        />
                      </div>
                      <button 
                        onClick={() => deleteFamilyMember(m.id)} 
                        className="p-2 text-ink/30 hover:text-red-500 hover:bg-red-50 focus:text-red-500 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title={t('app.delete', 'Delete')}
                      >
                        <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="flex flex-col gap-4 overflow-hidden"
                        >
                          <div className="pt-4 border-t-2 border-ink/10 mt-2 flex flex-col gap-2">
                            <span className="text-xs font-bold text-ink/50 uppercase tracking-wider">{t('app.color')}</span>
                            <div className="flex gap-2">
                              {COLORS.map(color => (
                                <button
                                  key={color}
                                  onClick={() => updateFamilyMember(m.id, { color, bgClass: color })}
                                  className={cn("w-8 h-8 rounded-full border-[2px] hover:scale-110 transition-all", color, m.bgClass === color ? "border-ink shadow-[2px_2px_0px_#1A1A1A] scale-110" : "border-transparent opacity-50")}
                                />
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 pb-2">
                            <span className="text-xs font-bold text-ink/50 uppercase tracking-wider">{t('app.icon')}</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => updateFamilyMember(m.id, { icon: undefined })}
                                className={cn("w-8 h-8 rounded-full border-[2px] flex items-center justify-center font-bold text-xs hover:scale-110 transition-all", (!m.icon ? "border-ink shadow-[2px_2px_0px_#1A1A1A] bg-primary/10 text-primary scale-110" : "border-ink/20 text-ink/50 hover:border-ink/50"))}
                              >
                                {m.name[0] || '?'}
                              </button>
                              {Object.keys(STATIC_ICONS).map(iconName => {
                                const IconComponent = STATIC_ICONS[iconName];
                                return (
                                  <button
                                    key={iconName}
                                    onClick={() => updateFamilyMember(m.id, { icon: iconName })}
                                    className={cn("w-8 h-8 rounded-full border-[2px] flex items-center justify-center hover:scale-110 transition-all", m.icon === iconName ? "border-ink shadow-[2px_2px_0px_#1A1A1A] bg-primary/10 text-primary scale-110" : "border-ink/20 text-ink/50 hover:border-ink/50")}
                                  >
                                    <IconComponent className="w-4 h-4" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <motion.button 
              layout
              onClick={() => {
                const nextColor = COLORS[familyMembers.length % COLORS.length];
                const id = 'm' + Date.now();
                addFamilyMember({ id, name: 'New Member', color: nextColor, bgClass: nextColor, icon: 'Star' });
                setExpandedId(id);
              }}
              className="w-full h-12 flex shrink-0 items-center justify-center gap-2 border-[2px] border-dashed border-ink/40 rounded-xl font-bold text-ink/60 hover:bg-ink hover:border-ink hover:text-white transition-all mt-2 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" strokeWidth={3} /> {t('app.addMember', 'Add Member')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
