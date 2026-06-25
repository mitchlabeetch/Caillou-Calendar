/**
 * Recurring event template library.
 *
 * A small built-in set of pre-filled templates (kids karate, weekly
 * groceries, school pickup, etc.) the user can clone into the
 * AddEventModal. Templates live in localStorage so they survive
 * reloads.
 */

import type { CalendarEvent } from '../types';

export interface EventTemplate {
  id: string;
  label: string;
  emoji: string;
  event: Omit<CalendarEvent, 'id' | 'date' | 'endDate'>;
}

const KEY = 'synoptic-event-templates';

export const BUILTIN_TEMPLATES: EventTemplate[] = [
  {
    id: 'tpl-karate',
    label: 'Kids karate',
    emoji: '🥋',
    event: {
      title: 'Karate',
      memberIds: [],
      startTime: '17:30',
      endTime: '18:30',
      recurrence: { type: 'weekly' },
      reminders: [{ offsetMinutes: 60, kind: 'notification' }],
      tags: ['kids', 'sport'],
      category: 'sports',
    },
  },
  {
    id: 'tpl-groceries',
    label: 'Weekly groceries',
    emoji: '🛒',
    event: {
      title: 'Groceries',
      memberIds: [],
      startTime: '10:00',
      endTime: '11:00',
      recurrence: { type: 'weekly' },
      tags: ['home'],
      category: 'family',
    },
  },
  {
    id: 'tpl-school-pickup',
    label: 'School pickup',
    emoji: '🏫',
    event: {
      title: 'School pickup',
      memberIds: [],
      startTime: '15:30',
      endTime: '16:00',
      recurrence: { type: 'weekly', count: 40 },
      location: 'School gate',
      tags: ['school'],
      category: 'school',
    },
  },
  {
    id: 'tpl-physio',
    label: 'Physiotherapy',
    emoji: '🧘',
    event: {
      title: 'Physio',
      memberIds: [],
      startTime: '09:00',
      endTime: '10:00',
      recurrence: { type: 'weekly' },
      tags: ['health'],
      category: 'medical',
    },
  },
  {
    id: 'tpl-date-night',
    label: 'Date night',
    emoji: '💖',
    event: {
      title: 'Date night',
      memberIds: [],
      startTime: '19:30',
      endTime: '22:00',
      recurrence: { type: 'monthly' },
      tags: ['us'],
      category: 'social',
    },
  },
  {
    id: 'tpl-birthday',
    label: 'Birthday party',
    emoji: '🎂',
    event: {
      title: 'Birthday party',
      memberIds: [],
      startTime: '15:00',
      endTime: '18:00',
      allDay: false,
      tags: ['party'],
      category: 'family',
    },
  },
];

export function listTemplates(): EventTemplate[] {
  const custom = loadCustom();
  return [...BUILTIN_TEMPLATES, ...custom];
}

export function saveCustomTemplate(template: EventTemplate): void {
  const all = loadCustom();
  if (all.find(t => t.id === template.id)) return;
  all.push(template);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(all));
  }
}

export function deleteCustomTemplate(id: string): void {
  const all = loadCustom().filter(t => t.id !== id);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(all));
  }
}

function loadCustom(): EventTemplate[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EventTemplate[];
  } catch {
    return [];
  }
}