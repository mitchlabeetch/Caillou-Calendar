import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Moon, Sun, Bell, Layout, Clock } from 'lucide-react';
import { useEvents } from '../lib/eventsContext';
import { subscribeToPush, unsubscribeFromPush, getPushSubscription } from '../lib/pushNotifications';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useEvents();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getPushSubscription().then(sub => setPushEnabled(!!sub));
  }, [isOpen]);

  const togglePush = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
      } else {
        const sub = await subscribeToPush();
        setPushEnabled(!!sub);
      }
    } catch (e) {
      console.error('Push toggle failed:', e);
    } finally {
      setPushLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative bg-surface border-[3px] border-ink sm:rounded-3xl rounded-none sm:shadow-[8px_8px_0px_#1A1A1A] w-full sm:max-w-md h-[100dvh] sm:h-auto p-6 sm:max-h-[90vh] overflow-y-auto pt-12 sm:pt-6">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-ink" />
          </button>
          
          <h2 className="text-2xl font-display font-bold mb-6">{t('app.appSettings')}</h2>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Globe className="w-3 h-3"/> {t('app.language')}</label>
              <select 
                className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer"
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Layout className="w-3 h-3"/> {t('app.startOfWeek', 'Start of Week')}</label>
              <select 
                className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer"
                value={settings.startOfWeek}
                onChange={(e) => updateSettings({ startOfWeek: parseInt(e.target.value) as any })}
              >
                <option value={0}>{t('app.sunday', 'Sunday')}</option>
                <option value={1}>{t('app.monday', 'Monday')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Clock className="w-3 h-3"/> {t('app.timeFormat', 'Time Format')}</label>
              <select 
                className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer"
                value={settings.timeFormat}
                onChange={(e) => updateSettings({ timeFormat: e.target.value as '12h' | '24h' })}
              >
                <option value="24h">24h (14:00)</option>
                <option value="12h">12h (2:00 PM)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Bell className="w-3 h-3"/> {t('app.notifications')}</label>
              <button
                onClick={togglePush}
                disabled={pushLoading}
                className="flex items-center justify-between p-3 border-[2px] border-ink rounded-xl bg-bg-light hover:bg-ink/5 transition-colors"
              >
                <span className="font-bold text-sm">{t('app.enablePush')}</span>
                <div className={`w-12 h-6 rounded-full border-2 border-ink relative transition-colors ${pushEnabled ? 'bg-primary' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white border border-ink transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Sun className="w-3 h-3"/> {t('app.theme')}</label>
              <select className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer">
                <option value="light">{t('app.light')}</option>
                <option value="dark">{t('app.dark')}</option>
                <option value="system">{t('app.systemDefault')}</option>
              </select>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
