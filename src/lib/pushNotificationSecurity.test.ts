import { describe, expect, it } from 'vitest';
import {
  isTrustedPushInvocation,
  resolvePushAudienceUserIds,
} from './pushNotificationSecurity';

describe('push notification security helpers', () => {
  it('accepts service-role bearer invocations', () => {
    const headers = new Headers({
      authorization: 'Bearer service-role-secret',
    });

    expect(isTrustedPushInvocation(headers, {
      serviceRoleKey: 'service-role-secret',
      webhookSecret: 'webhook-secret',
    })).toBe(true);
  });

  it('accepts webhook-secret invocations', () => {
    const headers = new Headers({
      'x-push-webhook-secret': 'webhook-secret',
    });

    expect(isTrustedPushInvocation(headers, {
      serviceRoleKey: 'service-role-secret',
      webhookSecret: 'webhook-secret',
    })).toBe(true);
  });

  it('rejects untrusted invocations', () => {
    const headers = new Headers();

    expect(isTrustedPushInvocation(headers, {
      serviceRoleKey: 'service-role-secret',
      webhookSecret: 'webhook-secret',
    })).toBe(false);
  });

  it('falls back to the owner when no family scope exists', () => {
    expect(resolvePushAudienceUserIds({
      ownerId: 'owner-1',
      ownerFamilyId: null,
      familySettingsRows: [],
    })).toEqual(['owner-1']);
  });

  it('targets every user in the same family scope without duplicates', () => {
    expect(resolvePushAudienceUserIds({
      ownerId: 'owner-1',
      ownerFamilyId: 'family-1',
      familySettingsRows: [
        { owner_id: 'owner-1', family_id: 'family-1' },
        { owner_id: 'owner-2', family_id: 'family-1' },
        { owner_id: 'owner-1', family_id: 'family-1' },
        { owner_id: 'owner-3', family_id: 'family-2' },
      ],
    })).toEqual(['owner-1', 'owner-2']);
  });
});
