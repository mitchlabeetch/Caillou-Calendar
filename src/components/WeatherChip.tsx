import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud } from 'lucide-react';
import { fetchWeatherForRange, type WeatherDay } from '../lib/weather';

interface Props {
  /** ISO YYYY-MM-DD for the day to show */
  date: string;
}

/**
 * Compact weather chip for a given day. Uses the OpenWeather API
 * when VITE_OPENWEATHER_KEY is set; otherwise a deterministic mock.
 */
export function WeatherChip({ date }: Props) {
  const { t } = useTranslation();
  const [day, setDay] = useState<WeatherDay | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWeatherForRange(date, date).then((days) => {
      if (!cancelled) setDay(days[0] ?? null);
    });
    return () => { cancelled = true; };
  }, [date]);

  if (!day) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold bg-bg-light border-[2px] border-ink/30 rounded-full px-2 py-0.5"
      title={`${day.summary} · ${t('app.weather', 'Weather')}`}
      aria-label={`${t('app.weather', 'Weather')}: ${day.tempMinC}° / ${day.tempMaxC}° ${day.summary}`}
    >
      <Cloud className="w-3 h-3 opacity-60" />
      <span>{day.icon}</span>
      <span>{day.tempMaxC}°</span>
    </span>
  );
}