/**
 * iCal subscription URL helper.
 *
 * Generates a stable per-family URL that always points at the current
 * read-only snapshot of the calendar. In production this should be
 * served by the Supabase Edge Function `/api/ics?family=<id>`; the
 * helper here returns the URL we'd hand the user.
 */

export interface IcsSubscription {
  url: string;
  label: string;
}

export function buildIcsSubscriptionUrl(familyId: string, baseUrl?: string): IcsSubscription {
  const origin = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : 'https://example.com');
  return {
    url: `${origin}/api/ics?family=${encodeURIComponent(familyId)}`,
    label: `${familyId}.ics`,
  };
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return Promise.resolve(false);
  }
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}