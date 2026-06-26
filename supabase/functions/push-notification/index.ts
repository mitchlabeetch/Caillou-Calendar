import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as webpush from 'https://esm.sh/web-push@3.6.7';
import {
  isTrustedPushInvocation,
  resolvePushAudienceUserIds,
} from '../../../src/lib/pushNotificationSecurity.ts';

type PushWebhookPayload = {
  record?: {
    id?: string;
    owner_id?: string;
    title?: string;
  } | null;
  old_record?: {
    id?: string;
    owner_id?: string;
    title?: string;
  } | null;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function restHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
}

async function fetchRestJson<T>(supabaseUrl: string, path: string, serviceRoleKey: string): Promise<T> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: restHeaders(serviceRoleKey),
  });
  if (!response.ok) {
    throw new Error(`Supabase REST request failed (${response.status}) for ${path}`);
  }
  return await response.json() as T;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let payload: PushWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON payload' });
  }

  const record = payload.record ?? payload.old_record;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const pushWebhookSecret = Deno.env.get('PUSH_NOTIFICATION_WEBHOOK_SECRET');
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

  if (!isTrustedPushInvocation(req.headers, {
    serviceRoleKey: supabaseServiceRoleKey,
    webhookSecret: pushWebhookSecret,
  })) {
    return json(401, { error: 'Unauthorized invocation' });
  }

  if (!record?.owner_id) {
    return json(400, { error: 'Missing event owner scope' });
  }

  webpush.setVapidDetails(
    'mailto:admin@example.com',
    vapidPublicKey,
    vapidPrivateKey
  );

  let ownerFamilyId: string | null = null;
  let familySettingsRows: Array<{ owner_id: string; family_id: string | null }> = [];

  try {
    const ownerSettings = await fetchRestJson<Array<{ owner_id: string; family_id: string | null }>>(
      supabaseUrl,
      `settings?select=owner_id,family_id&owner_id=eq.${encodeURIComponent(record.owner_id)}&limit=1`,
      supabaseServiceRoleKey,
    );
    ownerFamilyId = ownerSettings[0]?.family_id ?? null;

    if (ownerFamilyId) {
      familySettingsRows = await fetchRestJson<Array<{ owner_id: string; family_id: string | null }>>(
        supabaseUrl,
        `settings?select=owner_id,family_id&family_id=eq.${encodeURIComponent(ownerFamilyId)}`,
        supabaseServiceRoleKey,
      );
    }
  } catch (error) {
    console.warn('Push audience family lookup failed, falling back to owner-only scope', error);
  }

  const audienceUserIds = resolvePushAudienceUserIds({
    ownerId: record.owner_id,
    ownerFamilyId,
    familySettingsRows,
  });

  const encodedAudience = audienceUserIds.map(encodeURIComponent).join(',');
  const subscriptions = encodedAudience.length > 0
    ? await fetchRestJson<Array<{ user_id: string; subscription_payload: Record<string, unknown> }>>(
        supabaseUrl,
        `user_subscriptions?select=user_id,subscription_payload&user_id=in.(${encodedAudience})`,
        supabaseServiceRoleKey,
      )
    : [];

  const payload = JSON.stringify({
    title: 'Family Calendar Update',
    body: record.title
      ? `${record.title} was updated in the calendar.`
      : 'A calendar event was updated.'
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub: any) =>
      webpush.sendNotification(sub.subscription_payload, payload)
    )
  );

  return json(200, {
    success: true,
    event_id: record.id ?? null,
    audience_user_ids: audienceUserIds,
    delivered_attempts: subscriptions.length,
    results,
  });
});
