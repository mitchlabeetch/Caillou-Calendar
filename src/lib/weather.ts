/**
 * Weather forecast stub.
 *
 * If VITE_OPENWEATHER_KEY is set, fetches the One Call API for the
 * browser geolocation. Otherwise returns a deterministic mock keyed
 * off the date so the UI always has something to render.
 *
 * The mock intentionally returns small temperature ranges that vary
 * by month so the UI looks alive without making the page flaky in
 * CI / air-gapped environments.
 */

export interface WeatherDay {
  date: string; // YYYY-MM-DD
  tempMinC: number;
  tempMaxC: number;
  icon: string; // emoji / icon code
  summary: string;
}

const MONTH_BANDS: { min: number; max: number; icon: string; summary: string }[] = [
  { min: -2, max: 6, icon: '❄️', summary: 'Cold' },     // Jan
  { min: 0, max: 8, icon: '🌧️', summary: 'Rain' },    // Feb
  { min: 4, max: 13, icon: '🌤️', summary: 'Mild' },   // Mar
  { min: 8, max: 17, icon: '🌦️', summary: 'Showers' }, // Apr
  { min: 12, max: 22, icon: '☀️', summary: 'Sunny' },   // May
  { min: 16, max: 26, icon: '🌞', summary: 'Hot' },    // Jun
  { min: 18, max: 29, icon: '🌞', summary: 'Hot' },    // Jul
  { min: 18, max: 29, icon: '⛅', summary: 'Warm' },   // Aug
  { min: 14, max: 24, icon: '🌤️', summary: 'Mild' },   // Sep
  { min: 9, max: 17, icon: '🍂', summary: 'Cool' },    // Oct
  { min: 4, max: 11, icon: '🌫️', summary: 'Fog' },     // Nov
  { min: -1, max: 7, icon: '❄️', summary: 'Cold' },    // Dec
];

export async function fetchWeatherForRange(
  startIso: string,
  endIso: string,
): Promise<WeatherDay[]> {
  const key = import.meta.env.VITE_OPENWEATHER_KEY as string | undefined;
  if (!key) return mockForecast(startIso, endIso);

  try {
    if (!navigator.geolocation) return mockForecast(startIso, endIso);
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }),
    );
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&exclude=minutely,hourly,alerts&units=metric&appid=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('weather http ' + res.status);
    const data = await res.json();
    const days: WeatherDay[] = [];
    for (const d of (data.daily ?? []) as Array<Record<string, unknown>>) {
      const dt = new Date((d.dt as number) * 1000);
      days.push({
        date: dt.toISOString().slice(0, 10),
        tempMinC: Math.round((d.temp as Record<string, number>).min),
        tempMaxC: Math.round((d.temp as Record<string, number>).max),
        icon: weatherIcon(d.weather as Array<{ icon: string }>),
        summary: ((d.weather as Array<{ description: string }>)[0]?.description) ?? '',
      });
    }
    return days;
  } catch {
    return mockForecast(startIso, endIso);
  }
}

function weatherIcon(w: Array<{ icon: string }> | undefined): string {
  const id = w?.[0]?.icon ?? '01d';
  if (id.startsWith('01')) return '☀️';
  if (id.startsWith('02')) return '🌤️';
  if (id.startsWith('03') || id.startsWith('04')) return '☁️';
  if (id.startsWith('09') || id.startsWith('10')) return '🌧️';
  if (id.startsWith('11')) return '⛈️';
  if (id.startsWith('13')) return '❄️';
  return '🌤️';
}

function mockForecast(startIso: string, endIso: string): WeatherDay[] {
  const start = new Date(startIso + 'T12:00:00Z');
  const end = new Date(endIso + 'T12:00:00Z');
  const out: WeatherDay[] = [];
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return out;
  const day = new Date(start);
  while (day <= end) {
    const band = MONTH_BANDS[day.getUTCMonth()];
    out.push({
      date: day.toISOString().slice(0, 10),
      tempMinC: band.min,
      tempMaxC: band.max,
      icon: band.icon,
      summary: band.summary,
    });
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return out;
}