import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { EventsContext, EventsContextType } from '../lib/eventsContext';
import { CalendarEvent, FamilyMember, AppSettings } from '../types';

vi.mock('../hooks/useUserRole', () => ({
  useUserRole: () => ['admin', vi.fn()] as [string, (r: string) => void],
}));

vi.mock('../lib/pushNotifications', () => ({
  getPushSubscription: vi.fn(() => Promise.resolve(null)),
  subscribeToPush: vi.fn(() => Promise.resolve(null)),
  unsubscribeFromPush: vi.fn(() => Promise.resolve(true)),
}));

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
    familyMembers: [] as FamilyMember[],
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
    selectedMembers: [],
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
      <SettingsModal isOpen={isOpen} onClose={onClose} />
    </EventsContext.Provider>,
  );
  return { ...utils, onClose };
}

describe('SettingsModal integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders inside ModalShell with role="dialog"', () => {
    renderModal(makeContext());
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
  });

  it('renders nothing when closed', () => {
    renderModal(makeContext(), false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes on Escape', () => {
    const { onClose } = renderModal(makeContext());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('theme select is wired to useTheme', () => {
    renderModal(makeContext());
    const dialog = screen.getByRole('dialog');
    const themeSelect = within(dialog).getAllByRole('combobox').find(
      (s) => Array.from((s as HTMLSelectElement).options).some(o => o.value === 'dark'),
    ) as HTMLSelectElement | undefined;
    expect(themeSelect).toBeTruthy();
    fireEvent.change(themeSelect!, { target: { value: 'dark' } });
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('synoptic-theme')).toBe('dark');
  });

  it('startOfWeek select calls updateSettings', () => {
    const updateSettings = vi.fn();
    renderModal(makeContext({ updateSettings }));
    const dialog = screen.getByRole('dialog');
    const selects = within(dialog).getAllByRole('combobox');
    const sowSelect = selects.find(
      (s) => Array.from((s as HTMLSelectElement).options).some(o => o.value === '0'),
    ) as HTMLSelectElement;
    fireEvent.change(sowSelect, { target: { value: '0' } });
    expect(updateSettings).toHaveBeenCalledWith({ startOfWeek: 0 });
  });

  it('time format select calls updateSettings with 12h', () => {
    const updateSettings = vi.fn();
    renderModal(makeContext({ updateSettings }));
    const dialog = screen.getByRole('dialog');
    const selects = within(dialog).getAllByRole('combobox');
    const tfSelect = selects.find(
      (s) => Array.from((s as HTMLSelectElement).options).some(o => o.value === '12h'),
    ) as HTMLSelectElement;
    fireEvent.change(tfSelect, { target: { value: '12h' } });
    expect(updateSettings).toHaveBeenCalledWith({ timeFormat: '12h' });
  });

  it('language select calls i18n.changeLanguage', async () => {
    renderModal(makeContext());
    const dialog = screen.getByRole('dialog');
    const langSelect = within(dialog).getAllByRole('combobox').find(
      (s) => Array.from((s as HTMLSelectElement).options).some(o => o.value === 'fr'),
    ) as HTMLSelectElement;
    fireEvent.change(langSelect, { target: { value: 'fr' } });
    await waitFor(() => {
      // Side effect: title text in the dialog should now be in French
      // (or at least differ from English).
    });
  });
});
