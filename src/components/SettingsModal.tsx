import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Sun, Bell, Layout, Clock, Palette, Volume2, Link2, Upload } from 'lucide-react';
import { useEvents } from '../lib/eventsContext';
import { useTheme } from '../hooks/useTheme';
import { useUserRole } from '../hooks/useUserRole';
import { ModalShell } from './ModalShell';
import { TIMEZONE_OPTIONS, resolveActiveTimezone } from '../lib/timezoneOptions';
import { COLOR_SCHEMES, setActiveColorScheme, getActiveColorScheme } from '../lib/colorSchemes';
import { buildIcsSubscriptionUrl, copyToClipboard } from '../lib/icsSubscription';
import { parseIcs, icsToEvents } from '../lib/icsImport';
import { isMutationAuthorizationError } from '../lib/mutationAuthorization';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings, addEvents, showToast, user } = useEvents();
  const [theme, setTheme] = useTheme();
  const [userRole, setUserRole] = useUserRole();
  const isTrustedRole = !!user && user.uid !== 'local-user';
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [timezone, setTimezone] = useState<string>(() => {
    if (typeof localStorage === 'undefined') return 'auto';
    return localStorage.getItem('synoptic-timezone') ?? 'auto';
  });
  const [schemeId, setSchemeId] = useState(() => getActiveColorScheme().id);
  const [soundOn, setSoundOn] = useState(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem('synoptic-sound-enabled') === '1'
  );
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [importState, setImportState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    void import('../lib/pushNotifications').then(m => m.getPushSubscription()).then(sub => setPushEnabled(!!sub));
  }, [isOpen]);

  const togglePush = async () => {
    setPushLoading(true);
    try {
      const push = await import('../lib/pushNotifications');
      if (pushEnabled) {
        await push.unsubscribeFromPush();
        setPushEnabled(false);
      } else {
        const sub = await push.subscribeToPush();
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
            disabled={isTrustedRole}
            onChange={(e) => setUserRole(e.target.value as 'admin' | 'member' | 'child')}
          >
            <option value="admin">{t('app.admin', 'Admin')}</option>
            <option value="member">{t('app.member', 'Member')}</option>
            <option value="child">{t('app.child', 'Child')}</option>
          </select>
          {isTrustedRole && (
            <p className="text-[10px] opacity-50">
              {t('app.roleManagedByServer', 'Signed-in account roles are managed by trusted backend rules.')}
            </p>
          )}
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

        <div className="flex flex-col gap-2">
          <label htmlFor="settings-timezone" className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1">
            <Clock className="w-3 h-3"/> {t('app.timezone', 'Timezone')}
          </label>
          <select
            id="settings-timezone"
            aria-label={t('app.timezone', 'Timezone')}
            className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer"
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value);
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('synoptic-timezone', e.target.value);
              }
            }}
          >
            {TIMEZONE_OPTIONS.map(tz => (
              <option key={tz.id} value={tz.id}>{tz.label}</option>
            ))}
          </select>
          <p className="text-[10px] opacity-50">{t('app.activeTz', 'Active')}: {resolveActiveTimezone(timezone)}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="settings-scheme" className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1">
            <Palette className="w-3 h-3"/> {t('app.colorScheme', 'Colour scheme')}
          </label>
          <select
            id="settings-scheme"
            aria-label={t('app.colorScheme', 'Colour scheme')}
            className="h-12 border-[2px] border-ink rounded-xl px-3 font-bold bg-bg-light outline-none cursor-pointer"
            value={schemeId}
            onChange={(e) => {
              setSchemeId(e.target.value as typeof schemeId);
              setActiveColorScheme(e.target.value as typeof schemeId);
            }}
          >
            {Object.values(COLOR_SCHEMES).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1">
            <Volume2 className="w-3 h-3"/> {t('app.soundEffects', 'Sound effects')}
          </label>
          <button
            type="button"
            aria-pressed={soundOn}
            onClick={async () => {
              const next = !soundOn;
              const { setSoundEnabled, playCue } = await import('../lib/sounds');
              setSoundEnabled(next);
              setSoundOn(next);
              if (next) playCue('click');
            }}
            className="flex items-center justify-between p-3 border-[2px] border-ink rounded-xl bg-bg-light hover:bg-ink/5 transition-colors"
          >
            <span className="font-bold text-sm">{soundOn ? t('app.soundOn', 'Sound on') : t('app.soundOff', 'Sound off')}</span>
            <div className={`w-12 h-6 rounded-full border-2 border-ink relative transition-colors ${soundOn ? 'bg-primary' : 'bg-gray-300'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white border border-ink transition-transform ${soundOn ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1">
            <Link2 className="w-3 h-3"/> {t('app.icsSubscription', 'iCal subscription URL')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={buildIcsSubscriptionUrl(settings.familyId ?? 'family-default').url}
              aria-label={t('app.icsSubscription', 'iCal subscription URL')}
              className="flex-1 min-w-0 h-12 border-[2px] border-ink rounded-xl px-3 font-mono text-xs bg-bg-light outline-none"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="px-4 h-12 border-[2px] border-ink rounded-xl bg-primary text-ink font-bold shadow-neo-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform"
              onClick={async () => {
                const ok = await copyToClipboard(buildIcsSubscriptionUrl(settings.familyId ?? 'family-default').url);
                setCopyState(ok ? 'copied' : 'failed');
                setTimeout(() => setCopyState('idle'), 2000);
              }}
            >
              {copyState === 'copied' ? t('app.urlCopied', 'Copied!') : t('app.copyUrl', 'Copy')}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50 flex items-center gap-1">
            <Upload className="w-3 h-3"/> {t('app.importIcs', 'Import .ics file')}
          </label>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const parsed = parseIcs(text);
                  const events = icsToEvents(parsed);
                  const [sync, undo] = await Promise.all([
                    import('../lib/syncEngine'),
                    import('../lib/undoStack'),
                  ]);
                  await Promise.all(events.map((event) => sync.syncInsert('events', event)));
                  const didImportEvents = await addEvents(events);
                  if (!didImportEvents) return;
                  setImportCount(events.length);
                  setImportState('ok');
                  for (const ev of events) {
                    undo.pushOp({ type: 'add', eventId: ev.id, snapshot: ev });
                  }
                } catch (error) {
                  if (isMutationAuthorizationError(error)) {
                    showToast(t('app.permissionDenied', 'You are not allowed to perform this action.'));
                  }
                  setImportState('fail');
                } finally {
                  setTimeout(() => setImportState('idle'), 2500);
                  if (fileRef.current) fileRef.current.value = '';
                }
              }}
              aria-label={t('app.importIcs', 'Import .ics file')}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex-1 h-12 border-[2px] border-ink rounded-xl bg-surface font-bold shadow-neo-sm hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {importState === 'ok'
                ? t('app.importedEvents', { count: importCount })
                : importState === 'fail'
                  ? t('app.importFailed', 'Import failed')
                  : t('app.chooseFile', 'Choose .ics file')}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
