import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'synoptic-current-date';

/**
 * Persists the currently focused date across reloads so the user
 * comes back to the same week/month they were last viewing. Returns
 * an ISO `YYYY-MM-DD` string (date-only, no time) for safe storage.
 */
export function usePersistedCurrentDate() {
  const [currentDate, setCurrentDateState] = useState<Date>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = new Date(saved);
        if (!Number.isNaN(parsed.getTime())) return parsed;
      }
    } catch {}
    return new Date();
  });

  const setCurrentDate = useCallback((d: Date) => {
    setCurrentDateState(d);
    try {
      // Persist the date in the local timezone — date-fns will format
      // it back to local when reading. Avoids a UTC roundtrip which
      // can flip the day in extreme west/east timezones.
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      localStorage.setItem(STORAGE_KEY, `${yyyy}-${mm}-${dd}`);
    } catch {}
  }, []);

  // One-time migration: keep storage in sync if other code mutates the date.
  useEffect(() => {
    try {
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      localStorage.setItem(STORAGE_KEY, `${yyyy}-${mm}-${dd}`);
    } catch {}
  }, [currentDate]);

  return [currentDate, setCurrentDate] as const;
}