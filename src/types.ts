export type FamilyMember = {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  icon: string;
  currentLocation?: { text: string; icon: string; updatedAt?: string };
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
};

export type Reminder = '15m' | '1h' | '1d';

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  endDate?: string; // ISO date string YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  memberIds: string[];
  thumbnailUrl?: string;
  location?: string;
  recurrence?: Recurrence;
  reminders?: Reminder[];
  isBirthday?: boolean;
};

export type MemberLocation = {
  memberId: string;
  locationName: string;
  icon: string;
};

export type AppSettings = {
  startOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
};
