/**
 * Easter eggs.
 *
 * Tiny hidden surprises. Today:
 *   - On April 1st, the console greets the user.
 *   - When the title contains a specific keyword, the calendar paints
 *     a celebratory gradient for that day.
 */

const KEYWORD = 'caillou';

export function maybeEasterEggs(): void {
  if (typeof console === 'undefined') return;
  const today = new Date();
  if (today.getMonth() === 3 && today.getDate() === 1) {
    console.log('%c Hello Caillou ', 'background:#ff4d15;color:#fff;font-weight:bold;padding:4px 8px;border-radius:4px;');
  }
}

export function titleTriggersEasterEgg(title: string): boolean {
  return title.toLowerCase().includes(KEYWORD);
}