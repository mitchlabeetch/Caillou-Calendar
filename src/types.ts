export type FamilyMember = {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  icon: string;
  currentLocation?: { text: string; icon: string; updatedAt?: string };
  /** Optional avatar image (data URL or remote) — takes precedence over icon/initial. */
  avatarUrl?: string;
};

export type Place = {
  id: string;
  name: string;
  icon?: string;
};

export type Recurrence = {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  endDate?: string;
  count?: number;
  /** Repeat every N units of `type` (e.g. every 2 weeks). Defaults to 1. */
  interval?: number;
};

export type Reminder = '15m' | '1h' | '1d';

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  endDate?: string; // ISO date string YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  /** Marks an event that spans one or more full days (no clock times). */
  allDay?: boolean;
  memberIds: string[];
  thumbnailUrl?: string;
  location?: string;
  recurrence?: Recurrence;
  reminders?: Reminder[];
  isBirthday?: boolean;
  driverId?: string;
  /** User-defined category for grouping / colour (e.g. "school", "medical"). */
  category?: string;
  /** Free-form tag list for search / filtering. */
  tags?: string[];
  exceptionDates?: string[]; // Dates to skip in a recurring pattern
  /** Free-form notes / description (round-trips with Google Calendar's `description`). */
  notes?: string;
  /** Google Calendar event ID assigned when this event was pushed upstream. */
  googleEventId?: string;
  /** Last update timestamp (ISO 8601) used by two-way sync conflict resolution. */
  updatedAt?: string;
  /** IANA timezone id (e.g. "Europe/Paris") when the event should be interpreted in a specific zone. */
  timeZone?: string;
  /** Optional override that escapes the family-member colour mapping. */
  colorOverride?: string;
  /** Pinned events are always rendered at the top of the day stack. */
  pinned?: boolean;
  /** Avatar / photo URL when a member uses an image instead of a letter. */
  avatarUrl?: string;
};

export type MemberLocation = {
  memberId: string;
  locationName: string;
  icon: string;
};

export type AppSettings = {
  startOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
  /** Optional family identifier used to mint iCal subscription URLs. */
  familyId?: string;
  /** Active IANA timezone (or 'auto' to use the browser). */
  timezone?: string;
};

export type UserRole = 'admin' | 'member' | 'child';
