import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Home, GraduationCap, Shield, Briefcase, Dumbbell, Car, Plane, MapPin, Coffee, Users, Building, Heart, Star, Cloud, Sun, Moon, Image as ImageIcon } from 'lucide-react';
import { useEvents } from '../lib/eventsContext';
import { cn } from '../lib/utils';
import { ModalShell } from './ModalShell';

const STATIC_ICONS: Record<string, any> = {
  Home, GraduationCap, Shield, Briefcase, Dumbbell, Car, Plane, MapPin, Coffee, Users, Building, Heart, Star, Cloud, Sun, Moon
};

const COLORS = ['bg-mem-1', 'bg-mem-2', 'bg-mem-3', 'bg-mem-4'];

export function FamilyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useEvents();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={t('app.manageFamily')}
      titleClassName="text-2xl font-display font-bold mb-6 shrink-0"
      maxWidth="sm:max-w-md"
      panelClassName="w-full h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] rounded-none sm:rounded-3xl p-6 pt-12 sm:pt-6 flex flex-col bg-surface border-[3px] border-ink sm:shadow-neo-xl"
    >
      <div className="flex flex-col gap-3 overflow-y-auto pr-2 pb-2 -mr-2 flex-1">
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
                className="flex flex-col p-2 border-[2px] border-ink/20 focus-within:border-ink rounded-xl bg-surface focus-within:shadow-neo transition-all group overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    className={cn("w-10 h-10 rounded-full border-[2px] border-ink flex items-center justify-center shadow-sm shrink-0 text-lg font-black uppercase text-ink cursor-pointer hover:scale-105 transition-transform overflow-hidden", m.bgClass)}
                  >
                     {m.avatarUrl
                       ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                       : (SelectedIcon ? <SelectedIcon className="w-5 h-5" /> : (m.name[0] || '?'))}
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
                        <span className="text-xs font-bold text-ink/50 uppercase tracking-wider">{t('app.avatar', 'Avatar image')}</span>
                        <div className="flex items-center gap-2">
                          <input
                            ref={avatarRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file || !expandedId) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  updateFamilyMember(expandedId, { avatarUrl: reader.result });
                                }
                              };
                              reader.readAsDataURL(file);
                              if (avatarRef.current) avatarRef.current.value = '';
                            }}
                            aria-label={t('app.avatar', 'Avatar image')}
                          />
                          <button
                            type="button"
                            onClick={() => avatarRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 h-9 rounded-lg border-[2px] border-ink/30 text-xs font-bold hover:bg-bg-light transition-colors"
                          >
                            <ImageIcon className="w-4 h-4" />
                            {t('app.uploadAvatar', 'Upload')}
                          </button>
                          {m.avatarUrl && (
                            <button
                              type="button"
                              onClick={() => updateFamilyMember(m.id, { avatarUrl: undefined })}
                              className="px-3 h-9 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                            >
                              {t('app.removeAvatar', 'Remove')}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-ink/10 mt-2 flex flex-col gap-2">
                        <span className="text-xs font-bold text-ink/50 uppercase tracking-wider">{t('app.color')}</span>
                        <div className="flex gap-2">
                          {COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => updateFamilyMember(m.id, { color, bgClass: color })}
                              className={cn("w-8 h-8 rounded-full border-[2px] hover:scale-110 transition-all", color, m.bgClass === color ? "border-ink shadow-neo-sm scale-110" : "border-transparent opacity-50")}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pb-2">
                        <span className="text-xs font-bold text-ink/50 uppercase tracking-wider">{t('app.icon')}</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => updateFamilyMember(m.id, { icon: undefined })}
                            className={cn("w-8 h-8 rounded-full border-[2px] flex items-center justify-center font-bold text-xs hover:scale-110 transition-all", (!m.icon ? "border-ink shadow-neo-sm bg-primary/10 text-primary scale-110" : "border-ink/20 text-ink/50 hover:border-ink/50"))}
                          >
                            {m.name[0] || '?'}
                          </button>
                          {Object.keys(STATIC_ICONS).map(iconName => {
                            const IconComponent = STATIC_ICONS[iconName];
                            return (
                              <button
                                key={iconName}
                                onClick={() => updateFamilyMember(m.id, { icon: iconName })}
                                className={cn("w-8 h-8 rounded-full border-[2px] flex items-center justify-center hover:scale-110 transition-all", m.icon === iconName ? "border-ink shadow-neo-sm bg-primary/10 text-primary scale-110" : "border-ink/20 text-ink/50 hover:border-ink/50")}
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
    </ModalShell>
  );
}