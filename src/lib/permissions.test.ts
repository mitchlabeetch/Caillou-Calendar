import { describe, it, expect } from 'vitest';
import {
  canCreateEvent,
  canEditEvent,
  canDeleteEvent,
  canManageFamily,
  canManageSettings,
  canManagePlaces,
  canBulkDelete,
} from './permissions';
import { CalendarEvent } from '../types';

const ev = (memberIds: string[]): CalendarEvent => ({
  id: 'e',
  title: 't',
  date: '2026-06-25',
  memberIds,
});

describe('permissions', () => {
  describe('canCreateEvent', () => {
    it('allows admin', () => expect(canCreateEvent('admin')).toBe(true));
    it('allows member', () => expect(canCreateEvent('member')).toBe(true));
    it('forbids child', () => expect(canCreateEvent('child')).toBe(false));
  });

  describe('canEditEvent', () => {
    it('admin can edit any event', () => {
      expect(canEditEvent('admin', ev(['x']))).toBe(true);
    });
    it('member can edit any event', () => {
      expect(canEditEvent('member', ev(['x']))).toBe(true);
    });
    it('child can edit their own event', () => {
      expect(canEditEvent('child', ev(['m1']), 'm1')).toBe(true);
    });
    it('child cannot edit someone else\'s event', () => {
      expect(canEditEvent('child', ev(['m1']), 'm2')).toBe(false);
    });
    it('child without userId is denied', () => {
      expect(canEditEvent('child', ev(['m1']))).toBe(false);
    });
  });

  describe('canDeleteEvent mirrors canEditEvent', () => {
    it('admin can delete', () => expect(canDeleteEvent('admin', ev(['x']))).toBe(true));
    it('child can delete their own', () => expect(canDeleteEvent('child', ev(['m1']), 'm1')).toBe(true));
    it('child cannot delete others\'', () => expect(canDeleteEvent('child', ev(['m1']), 'm2')).toBe(false));
  });

  describe('canManageFamily', () => {
    it('only admin', () => {
      expect(canManageFamily('admin')).toBe(true);
      expect(canManageFamily('member')).toBe(false);
      expect(canManageFamily('child')).toBe(false);
    });
  });

  describe('canManageSettings', () => {
    it('only admin', () => {
      expect(canManageSettings('admin')).toBe(true);
      expect(canManageSettings('member')).toBe(false);
      expect(canManageSettings('child')).toBe(false);
    });
  });

  describe('canManagePlaces', () => {
    it('admin and member, not child', () => {
      expect(canManagePlaces('admin')).toBe(true);
      expect(canManagePlaces('member')).toBe(true);
      expect(canManagePlaces('child')).toBe(false);
    });
  });

  describe('canBulkDelete', () => {
    it('only admin', () => {
      expect(canBulkDelete('admin')).toBe(true);
      expect(canBulkDelete('member')).toBe(false);
      expect(canBulkDelete('child')).toBe(false);
    });
  });
});