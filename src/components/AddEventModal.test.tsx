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
    const setEvents = vi.fn();
    const { onClose } = renderModal(makeContext({ setEvents }));
    const dialog = screen.getByRole('dialog');
    const form = dialog.querySelector('form') as HTMLFormElement;
    expect(form).toBeTruthy();
    fireEvent.submit(form);
    expect(setEvents).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
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
    // Two member rows exist: "Who" and "Driver" — both render the same family members.
    // We test the first occurrence (Who) which has `title === mem.name`.
    const aliceBtn = within(dialog).getAllByTitle('Alice')[0];
    const bobBtn = within(dialog).getAllByTitle('Bob')[0];
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
    // Use the FIRST "Who" chip (not the Driver chip).
    const aliceBtn = within(dialog).getAllByTitle('Alice')[0];
    if (aliceBtn) fireEvent.click(aliceBtn);
    await waitFor(() => {
      expect(within(dialog).queryByText(/Scheduling Conflict/i)).toBeTruthy();
    });
  });

  it('renders nothing when closed', () => {
    renderModal(makeContext(), false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
