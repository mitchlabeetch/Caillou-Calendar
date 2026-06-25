import { format, addDays } from 'date-fns';
import { CalendarEvent, FamilyMember, MemberLocation } from '../types';

export const familyMembers: FamilyMember[] = [
  { id: 'm1', name: 'Mom', color: 'bg-mem-1', bgClass: 'bg-mem-1', icon: 'face_3' },
  { id: 'm2', name: 'Dad', color: 'bg-mem-2', bgClass: 'bg-mem-2', icon: 'face' },
  { id: 'm3', name: 'Leo', color: 'bg-mem-3', bgClass: 'bg-mem-3', icon: 'boy' },
  { id: 'm4', name: 'Mia', color: 'bg-mem-4', bgClass: 'bg-mem-4', icon: 'girl' },
];

export const todayLocations: MemberLocation[] = [
  { memberId: 'm1', locationName: 'HOME', icon: 'home' },
  { memberId: 'm3', locationName: 'SCHOOL', icon: 'school' },
  { memberId: 'm2', locationName: 'PARIS', icon: 'shield' }, // icon used in mockup
  { memberId: 'm4', locationName: 'MUNICH', icon: 'location_on' },
];

/**
 * Convert a day offset (0 = today, 1 = tomorrow, …) into a stable
 * `YYYY-MM-DD` string in the local timezone.
 */
function dayOffset(offset: number): string {
  return format(addDays(new Date(), offset), 'yyyy-MM-dd');
}

/**
 * Mock events. Dates are computed relative to "today" so the seed
 * calendar is never empty regardless of when the app is opened. The
 * offsets below mirror the original October 2024 seed schedule but
 * with the absolute anchor dropped.
 */
export const mockEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Soccer Prac',
    date: dayOffset(3),
    startTime: '16:30',
    memberIds: ['m4'],
  },
  {
    id: 'e2',
    title: 'Tutor',
    date: dayOffset(3),
    startTime: '18:00',
    memberIds: ['m3'],
  },
  {
    id: 'e3',
    title: 'Dentist',
    date: dayOffset(0),
    startTime: '09:00',
    memberIds: ['m1'],
  },
  {
    id: 'e4',
    title: 'Board Mtg',
    date: dayOffset(8),
    startTime: '19:00',
    memberIds: ['m2'],
  },
  {
    id: 'e5',
    title: 'Game!',
    date: dayOffset(11),
    startTime: '14:00',
    memberIds: ['m4'],
  },
  {
    id: 'e6',
    title: 'Family Yoga',
    date: dayOffset(13),
    startTime: '08:00',
    memberIds: ['m1', 'm2', 'm3', 'm4'],
  },
  {
    id: 'e7',
    title: 'Dentist',
    date: dayOffset(14),
    startTime: '09:00',
    memberIds: ['m1'],
  },
  {
    id: 'e8',
    title: 'Golf',
    date: dayOffset(14),
    memberIds: ['m2'],
  },
  {
    id: 'e9',
    title: 'Tutor',
    date: dayOffset(14),
    memberIds: ['m3'],
  },
  {
    id: 'e10',
    title: 'Pizza Party! 🍕',
    date: dayOffset(18),
    memberIds: ['m4'],
  },
  {
    id: 'e11',
    title: 'Family Photo',
    date: dayOffset(18),
    memberIds: ['m1', 'm2', 'm3', 'm4'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1740815897057-a93a8cf98a70?crop=entropy&cs=srgb&fm=jpg&q=85',
  },
  {
    id: 'e12',
    title: 'Family Camping Trip',
    date: dayOffset(22),
    memberIds: ['m1', 'm2', 'm3', 'm4'],
  },
  {
    id: 'e13',
    title: 'Project Due',
    date: dayOffset(22),
    memberIds: ['m1'],
  },
  {
    id: 'e14',
    title: 'Skate Park',
    date: dayOffset(22),
    memberIds: ['m4'],
  },
  {
    id: 'e15',
    title: 'Grandparents Visit',
    date: dayOffset(23),
    memberIds: ['m1', 'm2'], // using mixed gradient in mockup
  },
  {
    id: 'e16',
    title: 'Park Day Photo',
    date: dayOffset(27),
    memberIds: ['m1', 'm2', 'm3', 'm4'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1740815897090-36484f31a51b?crop=entropy&cs=srgb&fm=jpg&q=85',
  },
];