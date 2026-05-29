import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as webpush from 'https://esm.sh/web-push@3.6.7';

serve(async (req) => {
  const { record } = await req.json();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

  webpush.setVapidDetails(
    'mailto:admin@example.com',
    vapidPublicKey,
    vapidPrivateKey
  );

  const res = await fetch(`${supabaseUrl}/rest/v1/user_subscriptions?select=*`, {
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`
    }
  });

  const subscriptions = await res.json();

  const payload = JSON.stringify({
    title: 'Family Calendar Update',
    body: `${record.title} has been added to the calendar!`
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub: any) =>
      webpush.sendNotification(sub.subscription_payload, payload)
    )
  );

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
