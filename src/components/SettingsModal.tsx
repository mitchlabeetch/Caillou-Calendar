import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Sun, Bell, Layout, Clock } from 'lucide-react';
import { useEvents } from '../lib/eventsContext';
import { subscribeToPush, unsubscribeFromPush, getPushSubscription } from '../lib/pushNotifications';
import { useTheme } from '../hooks/useTheme';
import { useUserRole } from '../hooks/useUserRole';
import { ModalShell } from './ModalShell';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useEvents();
  const [theme, setTheme] = useTheme();
  const [userRole, setUserRole] = useUserRole();
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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={t('app.appSettings')}
      titleClassName="text-2xl font-display font-bold mb-6"
      maxWidth="sm:max-w-md"
      panelClassName="w-full h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] rounded-none sm:rounded-3xl p-6 pt-12 sm:pt-6 bg-surface border-[3px] border-ink sm:shadow-neo-xl"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="settings-language" className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Globe className="w-3 h-3"/> {t('app.language')}</label>
          <select
            id="settings-language"
            aria-label={t('app.language')}
            className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="fr">FranÃ§ais</option>
            <option value="es">EspaÃ±ol</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="pt">PortuguÃªs</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="settings-startOfWeek" className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Layout className="w-3 h-3"/> {t('app.startOfWeek', 'Start of Week')}</label>
          <select
            id="settings-startOfWeek"
            aria-label={t('app.startOfWeek', 'Start of Week')}
            className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer"
            value={settings.startOfWeek}
            onChange={(e) => updateSettings({ startOfWeek: parseInt(e.target.value) as any })}
          >
            <option value={0}>{t('app.sunday', 'Sunday')}</option>
            <option value={1}>{t('app.monday', 'Monday')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="settings-timeFormat" className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Clock className="w-3 h-3"/> {t('app.timeFormat', 'Time Format')}</label>
          <select
            id="settings-timeFormat"
            aria-label={t('app.timeFormat', 'Time Format')}
            className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer"
            value={settings.timeFormat}
            onChange={(e) => updateSettings({ timeFormat: e.target.value as '12h' | '24h' })}
          >
            <option value="24h">24h (14:00)</option>
            <option value="12h">12h (2:00 PM)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="settings-theme" className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Sun className="w-3 h-3"/> {t('app.theme')}</label>
          <select
            id="settings-theme"
            aria-label={t('app.theme')}
            className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          >
            <option value="light">{t('app.light')}</option>
            <option value="dark">{t('app.dark')}</option>
            <option value="system">{t('app.systemDefault')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="settings-role" className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1">
            <Layout className="w-3 h-3"/> {t('app.role', 'Role')}
          </label>
          <select
            id="settings-role"
            aria-label={t('app.role', 'Role')}
            className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as 'admin' | 'member' | 'child')}
          >
            <option value="admin">{t('app.admin', 'Admin')}</option>
            <option value="member">{t('app.member', 'Member')}</option>
            <option value="child">{t('app.child', 'Child')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1"><Bell className="w-3 h-3"/> {t('app.notifications')}</label>
          <button
            onClick={togglePush}
            disabled={pushLoading}
            aria-pressed={pushEnabled}
            className="flex items-center justify-between p-3 border-[2px] border-ink rounded-xl bg-bg-light hover:bg-ink/5 transition-colors"
          >
            <span className="font-bold text-sm">{t('app.enablePush')}</span>
            <div className={`w-12 h-6 rounded-full border-2 border-ink relative transition-colors ${pushEnabled ? 'bg-primary' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white border border-ink transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
