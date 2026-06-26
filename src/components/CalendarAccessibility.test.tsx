import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { format } from 'date-fns';
import { CalendarMonth } from './CalendarMonth';
import { CalendarWeek } from './CalendarWeek';
import { CalendarAgenda } from './CalendarAgenda';
import { EventsContext, EventsContextType } from '../lib/eventsContext';
import { AppSettings, CalendarEvent, FamilyMember } from '../types';

const familyMembers: FamilyMember[] = [
  { id: 'm1', name: 'Alice', color: '#B39DDB', bgClass: 'bg-mem-1', icon: 'User' },
  { id: 'm2', name: 'Bob', color: '#80CBC4', bgClass: 'bg-mem-2', icon: 'User' },
];

const sampleEvent: CalendarEvent = {
  id: 'evt-1',
  title: 'Piano Lesson',
  date: '2026-06-25',
  startTime: '10:00',
  endTime: '11:00',
  memberIds: ['m1'],
  recurrence: { type: 'none' },
  reminders: [],
};

function makeContext(overrides: Partial<EventsContextType> = {}): EventsContextType {
  const settings: AppSettings = { startOfWeek: 0, timeFormat: '24h' };

  return {
    events: [sampleEvent],
    addEvent: vi.fn(() => Promise.resolve(true)),
    addEvents: vi.fn(() => Promise.resolve(true)),
    updateEvent: vi.fn(() => Promise.resolve(true)),
    deleteEvent: vi.fn(),
    moveEvent: vi.fn(),
    swapEvents: vi.fn(),
    familyMembers,
    addFamilyMember: vi.fn(),
    updateFamilyMember: vi.fn(),
    deleteFamilyMember: vi.fn(),
    reorderFamilyMembers: vi.fn(),
    places: [],
    addPlace: vi.fn(),
    updatePlace: vi.fn(),
    deletePlace: vi.fn(),
    settings,
    updateSettings: vi.fn(),
    showToast: vi.fn(),
    selectedMembers: familyMembers.map(member => member.id),
    toggleMember: vi.fn(),
    setSelectedEventId: vi.fn(),
    isMultiSelectMode: false,
    selectedEventIdsForDelete: [],
    toggleEventSelectionForDelete: vi.fn(),
    droppedEventId: null,
    triggerDropAnimation: vi.fn(),
    userRole: 'admin',
    user: { uid: 'local-user', email: 'local@example.com' },
    ...overrides,
  };
}

function renderWithContext(ui: ReactNode, ctx: EventsContextType) {
  return render(
    <EventsContext.Provider value={ctx}>
      {ui}
    </EventsContext.Provider>,
  );
}

describe('Calendar accessibility', () => {
  it('opens a month day from the keyboard', () => {
    const onDateClick = vi.fn();
    const currentDate = new Date('2026-06-25T12:00:00');

    renderWithContext(
      <CalendarMonth currentDate={currentDate} onDateClick={onDateClick} />,
      makeContext(),
    );

    const dayButton = screen.getByRole('button', { name: format(currentDate, 'PPPP') });
    fireEvent.keyDown(dayButton, { key: 'Enter' });

    expect(onDateClick).toHaveBeenCalledWith(expect.any(Date));
  });

  it('opens a week day from the keyboard', () => {
    const onDateClick = vi.fn();
    const currentDate = new Date('2026-06-25T12:00:00');

    renderWithContext(
      <CalendarWeek currentDate={currentDate} onDateClick={onDateClick} />,
      makeContext(),
    );

    const dayButton = screen.getByRole('button', { name: format(currentDate, 'PPPP') });
    fireEvent.keyDown(dayButton, { key: ' ' });

    expect(onDateClick).toHaveBeenCalledWith(expect.any(Date));
  });

  it('opens month event pills from the keyboard', () => {
    const setSelectedEventId = vi.fn();

    renderWithContext(
      <CalendarMonth currentDate={new Date('2026-06-25T12:00:00')} />,
      makeContext({ setSelectedEventId }),
    );

    const eventButton = screen.getByRole('button', { name: /^piano lesson,/i });
    fireEvent.keyDown(eventButton, { key: 'Enter' });

    expect(setSelectedEventId).toHaveBeenCalledWith('evt-1');
  });

  it('opens week and agenda events from the keyboard', () => {
    const setSelectedEventId = vi.fn();
    const ctx = makeContext({ setSelectedEventId });

    const { rerender } = render(
      <EventsContext.Provider value={ctx}>
        <CalendarWeek currentDate={new Date('2026-06-25T12:00:00')} />
      </EventsContext.Provider>,
    );

    fireEvent.keyDown(screen.getByRole('button', { name: /^piano lesson,/i }), { key: 'Enter' });
    expect(setSelectedEventId).toHaveBeenCalledWith('evt-1');

    rerender(
      <EventsContext.Provider value={ctx}>
        <CalendarAgenda currentDate={new Date('2026-06-25T12:00:00')} />
      </EventsContext.Provider>,
    );

    fireEvent.keyDown(screen.getByRole('button', { name: /^piano lesson,/i }), { key: ' ' });
    expect(setSelectedEventId).toHaveBeenCalledTimes(2);
  });
});
