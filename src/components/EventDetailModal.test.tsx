import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventDetailModal } from './EventDetailModal';
import { EventsContext, EventsContextType } from '../lib/eventsContext';
import { CalendarEvent, FamilyMember, AppSettings } from '../types';

vi.mock('../lib/syncEngine', () => ({
  syncInsert: vi.fn(() => Promise.resolve()),
  syncUpdate: vi.fn(() => Promise.resolve()),
  syncDelete: vi.fn(() => Promise.resolve()),
}));

vi.mock('./WeatherChip', () => ({
  WeatherChip: () => <div data-testid="weather-chip" />,
}));

vi.mock('./MapPreviewCard', () => ({
  MapPreviewCard: () => <div data-testid="map-preview-card" />,
}));

const sampleFamily: FamilyMember[] = [
  { id: 'm1', name: 'Alice', color: '#B39DDB', bgClass: 'bg-mem-1', icon: 'User' },
  { id: 'm2', name: 'Bob', color: '#80CBC4', bgClass: 'bg-mem-2', icon: 'User' },
];

const baseEvent: CalendarEvent = {
  id: 'evt-1',
  title: 'Soccer Practice',
  date: '2026-06-25',
  startTime: '10:00',
  memberIds: ['m1', 'm2'],
  recurrence: { type: 'none' },
  reminders: [],
};

function makeContext(overrides: Partial<EventsContextType> = {}): EventsContextType {
  const settings: AppSettings = { startOfWeek: 1, timeFormat: '24h' };
  return {
    events: [baseEvent],
    setEvents: vi.fn(),
    addEvent: vi.fn(() => Promise.resolve(true)),
    addEvents: vi.fn(() => Promise.resolve(true)),
    updateEvent: vi.fn(() => Promise.resolve(true)),
    deleteEvent: vi.fn(),
    moveEvent: vi.fn(),
    swapEvents: vi.fn(),
    familyMembers: sampleFamily,
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
    selectedMembers: sampleFamily.map(m => m.id),
    toggleMember: vi.fn(),
    setSelectedEventId: vi.fn(),
    isMultiSelectMode: false,
    selectedEventIdsForDelete: [],
    toggleEventSelectionForDelete: vi.fn(),
    droppedEventId: null,
    triggerDropAnimation: vi.fn(),
    userRole: 'admin',
    user: { uid: 'u-admin', email: 'admin@example.com' },
    ...overrides,
  } as unknown as EventsContextType & {
    addEvent: ReturnType<typeof vi.fn>;
    addEvents: ReturnType<typeof vi.fn>;
    updateEvent: ReturnType<typeof vi.fn>;
  };
}

function renderModal(ctx: EventsContextType, props: { isOpen?: boolean; eventId?: string } = {}) {
  const onClose = vi.fn();
  const utils = render(
    <EventsContext.Provider value={ctx}>
      <EventDetailModal isOpen={props.isOpen ?? true} onClose={onClose} eventId={props.eventId ?? 'evt-1'} />
    </EventsContext.Provider>,
  );
  return { ...utils, onClose };
}

describe('EventDetailModal integration + RBAC', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders inside ModalShell with role="dialog"', () => {
    renderModal(makeContext());
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('shows edit/delete buttons for admin role', () => {
    renderModal(makeContext());
    expect(screen.getByRole('button', { name: /delete/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeTruthy();
  });

  it('hides edit/delete buttons for child role when user is not a member of the event', () => {
    renderModal(makeContext({
      userRole: 'child',
      user: { uid: 'm3-uid', email: 'someone-else@example.com' },
    }));
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^edit$/i })).toBeNull();
  });

  it('allows child to delete their own event (matched by memberId)', () => {
    // Family member id "m1" matches one of the event's memberIds.
    renderModal(makeContext({
      userRole: 'child',
      user: { uid: 'm1', email: 'alice@example.com' },
    }));
    expect(screen.getByRole('button', { name: /delete/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeTruthy();
  });

  it('delete button calls deleteEvent and closes', () => {
    const deleteEvent = vi.fn();
    const { onClose } = renderModal(makeContext({ deleteEvent }));
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);
    expect(deleteEvent).toHaveBeenCalledWith('evt-1');
    expect(onClose).toHaveBeenCalled();
  });

  it('saves edits through updateEvent instead of the raw state setter', async () => {
    const updateEvent = vi.fn(() => Promise.resolve(true));
    const setEvents = vi.fn();
    renderModal(makeContext({ updateEvent, setEvents } as any));

    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    fireEvent.change(screen.getByDisplayValue('Soccer Practice'), {
      target: { value: 'Updated Practice' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledWith('evt-1', {
        title: 'Updated Practice',
        date: '2026-06-25',
        startTime: '10:00',
        memberIds: ['m1', 'm2'],
      });
    });
    expect(setEvents).not.toHaveBeenCalled();
  });

  it('does not render when eventId is unknown', () => {
    renderModal(makeContext(), { eventId: 'nope' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
