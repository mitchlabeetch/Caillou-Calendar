import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, MapPin, Home, GraduationCap, Briefcase, Dumbbell, Car, Plane, Coffee, Users, Shield, Building, Heart, Star, Cloud, Sun, Moon } from 'lucide-react';
import { useEvents } from '../lib/eventsContext';

const STATIC_ICONS: Record<string, any> = { Home, GraduationCap, Briefcase, Dumbbell, Car, Plane, MapPin, Coffee, Users, Shield, Building, Heart, Star, Cloud, Sun, Moon };
const validIconKeys = Object.keys(STATIC_ICONS);

export function PlacesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { places, addPlace, updatePlace, deletePlace } = useEvents();
  const [editingIconId, setEditingIconId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-surface border-[3px] border-ink sm:rounded-3xl rounded-none sm:shadow-[8px_8px_0px_#1A1A1A] w-full sm:max-w-md h-[100dvh] sm:h-auto p-6 sm:max-h-[90vh] flex flex-col pt-12 sm:pt-6 overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-ink" />
          </button>
          
          <h2 className="text-2xl font-display font-bold mb-6">{t('app.manageLocations')}</h2>

          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {places.map((place) => {
                const IconComponent = place.icon && STATIC_ICONS[place.icon] ? STATIC_ICONS[place.icon] : MapPin;
                return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95, height: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  key={place.id} 
                  className="flex flex-col border-[2px] border-ink/20 focus-within:border-ink rounded-xl bg-surface focus-within:shadow-[4px_4px_0px_#1A1A1A] transition-all group"
                >
                  <div className="flex items-center gap-3 p-2">
                    <button 
                      onClick={() => setEditingIconId(editingIconId === place.id ? null : place.id)}
                      className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center shrink-0 hover:bg-black/10 transition-colors"
                    >
                      <IconComponent className="w-5 h-5 text-ink/70" strokeWidth={2.5} />
                    </button>
                    <input 
                      type="text" 
                      defaultValue={place.name} 
                      onBlur={(e) => updatePlace(place.id, { name: e.target.value })}
                      placeholder="Location"
                      className="flex-1 min-w-0 bg-transparent font-bold text-lg text-ink outline-none px-1 transition-colors"
                    />
                    <button 
                      onClick={() => deletePlace(place.id)} 
                      className="p-3 text-ink/30 hover:text-red-500 hover:bg-red-50 focus:text-red-500 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title={t('app.delete', 'Delete')}
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {editingIconId === place.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-2 pb-3 overflow-hidden"
                      >
                        <div className="grid grid-cols-8 sm:grid-cols-8 gap-2 bg-black/5 p-2 rounded-lg">
                          {validIconKeys.map(k => {
                            const Ico = STATIC_ICONS[k];
                            const isSelected = place.icon === k || (!place.icon && k === 'MapPin');
                            return (
                              <button
                                key={k}
                                onClick={() => {
                                  updatePlace(place.id, { icon: k });
                                  setEditingIconId(null);
                                }}
                                className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-white border-[2px] border-ink' : 'hover:bg-black/10 text-ink/60 hover:text-ink'}`}
                              >
                                <Ico className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )})}
            </AnimatePresence>

            <motion.button 
              layout
              onClick={() => {
                const id = 'p' + Date.now();
                addPlace({ id, name: 'New Place' });
              }}
              className="w-full h-12 flex items-center justify-center gap-2 border-[2px] border-dashed border-ink/40 rounded-xl font-bold text-ink/60 hover:bg-ink hover:border-ink hover:text-white transition-all mt-2 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" strokeWidth={3} /> {t('app.addPlace', 'Add Location')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
