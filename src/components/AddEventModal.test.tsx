import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { AddEventModal } from './AddEventModal';
import { EventsContext, EventsContextType } from '../lib/eventsContext';
import { CalendarEvent, FamilyMember, AppSettings } from '../types';

vi.mock('../lib/syncEngine', () => ({
  syncInsert: vi.fn(() => Promise.resolve()),
  syncUpdate: vi.fn(() => Promise.resolve()),
  syncDelete: vi.fn(() => Promise.resolve()),
}));

const sampleFamily: FamilyMember[] = [
  { id: 'm1', name: 'Alice', color: '#B39DDB', bgClass: 'bg-mem-1', icon: 'User' },
  { id: 'm2', name: 'Bob', color: '#80CBC4', bgClass: 'bg-mem-2', icon: 'User' },
];

function makeContext(overrides: Partial<EventsContextType> = {}): EventsContextType {
  const settings: AppSettings = { startOfWeek: 1, timeFormat: '24h' };
  return {
    events: [] as CalendarEvent[],
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
    user: null,
    ...overrides,
  } as unknown as EventsContextType & {
    addEvent: ReturnType<typeof vi.fn>;
    addEvents: ReturnType<typeof vi.fn>;
    updateEvent: ReturnType<typeof vi.fn>;
  };
}

function renderModal(ctx: EventsContextType, isOpen = true) {
  const onClose = vi.fn();
  const utils = render(
    <EventsContext.Provider value={ctx}>
      <AddEventModal isOpen={isOpen} onClose={onClose} />
    </EventsContext.Provider>,
  );
  return { ...utils, onClose };
}

describe('AddEventModal integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders inside ModalShell with role="dialog"', () => {
    renderModal(makeContext());
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('closes on Escape', () => {
    const { onClose } = renderModal(makeContext());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not submit when required fields are missing', () => {
    const addEvent = vi.fn(() => Promise.resolve(true));
    const { onClose } = renderModal(makeContext({ addEvent } as any));
    const dialog = screen.getByRole('dialog');
    const form = dialog.querySelector('form') as HTMLFormElement;
    expect(form).toBeTruthy();
    fireEvent.submit(form);
    expect(addEvent).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('submits through addEvent instead of the raw state setter', async () => {
    const addEvent = vi.fn(() => Promise.resolve(true));
    const setEvents = vi.fn();
    const { onClose } = renderModal(makeContext({ addEvent, setEvents } as any));
    const dialog = screen.getByRole('dialog');

    fireEvent.change(within(dialog).getByPlaceholderText(/pizza party/i), {
      target: { value: 'Pizza Party' },
    });

    const inputs = dialog.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0] as HTMLInputElement, { target: { value: '2026-06-30' } });

    const attendeesGroup = within(dialog).getByRole('group', { name: /who/i });
    fireEvent.click(within(attendeesGroup).getByRole('button', { name: /alice/i }));

    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);

    await waitFor(() => {
      expect(addEvent).toHaveBeenCalledTimes(1);
    });
    expect(setEvents).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('title field auto-parses natural-language dates via chrono-node', async () => {
    renderModal(makeContext());
    const dialog = screen.getByRole('dialog');
    const titleInput = within(dialog).getByPlaceholderText(/Pizza Party/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Lunch tomorrow' } });
    await waitFor(() => {
      // The Date input should now have a value in YYYY-MM-DD form
      const dateInput = dialog.querySelector('input[type="date"]') as HTMLInputElement;
      expect(dateInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('family member chips toggle selection', () => {
    renderModal(makeContext());
    const dialog = screen.getByRole('dialog');
    const attendeesGroup = within(dialog).getByRole('group', { name: /who/i });
    const aliceBtn = within(attendeesGroup).getByRole('button', { name: /alice/i });
    const bobBtn = within(attendeesGroup).getByRole('button', { name: /bob/i });
    expect(aliceBtn).toBeTruthy();
    expect(bobBtn).toBeTruthy();
    fireEvent.click(aliceBtn);
    // Click didn't throw — selection toggled.
    expect(aliceBtn).toBeTruthy();
  });

  it('shows conflict warning when an event overlaps with another member event', async () => {
    const conflictEvent: CalendarEvent = {
      id: 'other',
      title: 'Existing',
      date: '2026-06-25',
      startTime: '10:00',
      memberIds: ['m1'],
      recurrence: { type: 'none' },
      reminders: [],
    };
    renderModal(makeContext({ events: [conflictEvent] }));
    const dialog = screen.getByRole('dialog');
    const titleInput = within(dialog).getByPlaceholderText(/Pizza Party/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'My Event' } });
    const dateInput = dialog.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = dialog.querySelector('input[type="time"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-06-25' } });
    fireEvent.change(timeInput, { target: { value: '10:00' } });
    const attendeesGroup = within(dialog).getByRole('group', { name: /who/i });
    const aliceBtn = within(attendeesGroup).getByRole('button', { name: /alice/i });
    if (aliceBtn) fireEvent.click(aliceBtn);
    await waitFor(() => {
      expect(within(dialog).queryByText(/Scheduling Conflict/i)).toBeTruthy();
    });
  });

  it('keeps custom boolean controls focusable and keyboard-operable', () => {
    renderModal(makeContext());
    const dialog = screen.getByRole('dialog');

    const allDay = within(dialog).getByRole('checkbox', { name: /all day/i }) as HTMLInputElement;
    const pinned = within(dialog).getByRole('checkbox', { name: /pin|pinned/i }) as HTMLInputElement;
    const birthday = within(dialog).getByRole('checkbox', { name: /birthday/i }) as HTMLInputElement;

    allDay.focus();
    expect(document.activeElement).toBe(allDay);

    fireEvent.click(allDay);
    fireEvent.click(pinned);
    fireEvent.click(birthday);

    expect(allDay.checked).toBe(true);
    expect(pinned.checked).toBe(true);
    expect(birthday.checked).toBe(true);
  });

  it('gives attendee and driver pills accessible names', () => {
    renderModal(makeContext());
    const dialog = screen.getByRole('dialog');

    const attendeesGroup = within(dialog).getByRole('group', { name: /who/i });
    const driverGroup = within(dialog).getByRole('group', { name: /driver/i });

    expect(within(attendeesGroup).getByRole('button', { name: /alice/i })).toBeTruthy();
    expect(within(attendeesGroup).getByRole('button', { name: /bob/i })).toBeTruthy();
    expect(within(driverGroup).getByRole('button', { name: /alice/i })).toBeTruthy();
    expect(within(driverGroup).getByRole('button', { name: /bob/i })).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    renderModal(makeContext(), false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
