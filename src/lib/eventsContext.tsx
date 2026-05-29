import React, { createContext, useContext } from 'react';
import { CalendarEvent, FamilyMember, Place, AppSettings, UserRole } from '../types';

export interface EventsContextType {
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newDate: string, newTime?: string) => void;
  swapEvents: (idA: string, idB: string) => void;

  familyMembers: FamilyMember[];
  addFamilyMember: (member: FamilyMember) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteFamilyMember: (id: string) => void;
  reorderFamilyMembers: (members: FamilyMember[]) => void;

  places: Place[];
  addPlace: (place: Place) => void;
  updatePlace: (id: string, updates: Partial<Place>) => void;
  deletePlace: (id: string) => void;

  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  showToast: (msg: string) => void;
  selectedMembers: string[];
  toggleMember: (id: string) => void;
  setSelectedEventId: (id: string | null) => void;
  isMultiSelectMode: boolean;
  selectedEventIdsForDelete: string[];
  toggleEventSelectionForDelete: (id: string) => void;
  droppedEventId: string | null;
  triggerDropAnimation: (id: string) => void;

  userRole: UserRole;
}

export const EventsContext = createContext<EventsContextType | null>(null);

export const useEvents = () => {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
};
