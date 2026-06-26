export type PushAudienceRow = {
  owner_id: string;
  family_id?: string | null;
};

export type PushInvocationSecrets = {
  serviceRoleKey?: string | null;
  webhookSecret?: string | null;
};

export function isTrustedPushInvocation(
  headers: Headers,
  secrets: PushInvocationSecrets,
) {
  const authorization = headers.get('authorization') ?? '';
  const bearerToken = authorization.replace(/^Bearer\s+/i, '').trim();
  const webhookSecret = headers.get('x-push-webhook-secret')?.trim() ?? '';

  if (secrets.serviceRoleKey && bearerToken === secrets.serviceRoleKey) {
    return true;
  }

  if (secrets.webhookSecret && webhookSecret === secrets.webhookSecret) {
    return true;
  }

  return false;
}

export function resolvePushAudienceUserIds(input: {
  ownerId: string;
  ownerFamilyId?: string | null;
  familySettingsRows: PushAudienceRow[];
}) {
  if (!input.ownerFamilyId) {
    return [input.ownerId];
  }

  const audience = new Set<string>([input.ownerId]);

  for (const row of input.familySettingsRows) {
    if (row.family_id === input.ownerFamilyId) {
      audience.add(row.owner_id);
    }
  }

  return Array.from(audience);
}
