/**
 * Map from IANA timezone → friendly city label. Used in the
 * Settings picker. The list is curated to the timezones that
 * most families actually live in; users on rarer zones can still
 * pick "Auto (browser)" and let date-fns figure it out.
 */

export interface TimezoneOption {
  id: string; // IANA id
  label: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { id: 'auto', label: 'Auto (browser)' },
  { id: 'Europe/Paris', label: 'Paris' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Europe/Berlin', label: 'Berlin' },
  { id: 'Europe/Madrid', label: 'Madrid' },
  { id: 'Europe/Rome', label: 'Rome' },
  { id: 'Europe/Lisbon', label: 'Lisbon' },
  { id: 'Europe/Stockholm', label: 'Stockholm' },
  { id: 'Europe/Athens', label: 'Athens' },
  { id: 'Europe/Moscow', label: 'Moscow' },
  { id: 'America/New_York', label: 'New York' },
  { id: 'America/Chicago', label: 'Chicago' },
  { id: 'America/Denver', label: 'Denver' },
  { id: 'America/Los_Angeles', label: 'Los Angeles' },
  { id: 'America/Toronto', label: 'Toronto' },
  { id: 'America/Mexico_City', label: 'Mexico City' },
  { id: 'America/Sao_Paulo', label: 'São Paulo' },
  { id: 'America/Buenos_Aires', label: 'Buenos Aires' },
  { id: 'Asia/Tokyo', label: 'Tokyo' },
  { id: 'Asia/Shanghai', label: 'Shanghai' },
  { id: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { id: 'Asia/Singapore', label: 'Singapore' },
  { id: 'Asia/Dubai', label: 'Dubai' },
  { id: 'Asia/Kolkata', label: 'Kolkata' },
  { id: 'Australia/Sydney', label: 'Sydney' },
  { id: 'Australia/Perth', label: 'Perth' },
  { id: 'Pacific/Auckland', label: 'Auckland' },
  { id: 'Africa/Johannesburg', label: 'Johannesburg' },
  { id: 'Africa/Cairo', label: 'Cairo' },
];

export function resolveActiveTimezone(setting: string): string {
  if (!setting || setting === 'auto') {
    return typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC';
  }
  return setting;
}