import { getSupabase } from './supabase';

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToPush = async () => {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.warn('VAPID public key not configured');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  const supabase = getSupabase();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_subscriptions').upsert({
        user_id: user.id,
        subscription_payload: subscription.toJSON()
      });
    }
  }

  return subscription;
};

export const unsubscribeFromPush = async () => {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
    const supabase = getSupabase();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_subscriptions').delete().eq('user_id', user.id);
      }
    }
  }
};

export const getPushSubscription = async () => {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
};
