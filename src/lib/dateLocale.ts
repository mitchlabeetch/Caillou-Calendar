import { enUS, fr, es, de, it, pt } from 'date-fns/locale';

export const getDateLocale = (lang?: string) => {
  const l = lang || 'en';
  if (l.startsWith('fr')) return fr;
  if (l.startsWith('es')) return es;
  if (l.startsWith('de')) return de;
  if (l.startsWith('it')) return it;
  if (l.startsWith('pt')) return pt;
  return enUS;
};
