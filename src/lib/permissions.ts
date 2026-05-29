import { UserRole, CalendarEvent } from '../types';

export const canCreateEvent = (role: UserRole) => role !== 'child';

export const canEditEvent = (role: UserRole, event: CalendarEvent, userId?: string) => {
  if (role === 'admin') return true;
  if (role === 'member') return true;
  // child can only edit events where they are tagged
  if (role === 'child') return userId ? event.memberIds.includes(userId) : false;
  return false;
};

export const canDeleteEvent = canEditEvent;

export const canManageFamily = (role: UserRole) => role === 'admin';

export const canManageSettings = (role: UserRole) => role === 'admin';

export const canManagePlaces = (role: UserRole) => role === 'admin' || role === 'member';

export const canBulkDelete = (role: UserRole) => role === 'admin';
