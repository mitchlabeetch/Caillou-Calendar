/**
 * Tiny WebAudio sound effects — no asset downloads required.
 *
 * Three short oscillator-driven cues: drop, reminder, birthday.
 * Disabled by default; the user can flip a switch in Settings.
 */

type Cue = 'drop' | 'reminder' | 'birthday' | 'click';

let ctx: AudioContext | null = null;
let enabled = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('synoptic-sound-enabled', value ? '1' : '0');
  }
}

export function isSoundEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem('synoptic-sound-enabled') === '1';
}

export function primeAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => undefined);
}

function tone(freq: number, durationMs: number, type: OscillatorType = 'sine', gainPeak = 0.08): void {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + durationMs / 1000);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + durationMs / 1000);
}

export function playCue(cue: Cue): void {
  if (!enabled) return;
  switch (cue) {
    case 'drop':
      tone(220, 120, 'triangle', 0.1);
      setTimeout(() => tone(180, 90, 'triangle', 0.08), 60);
      break;
    case 'reminder':
      tone(880, 80, 'sine', 0.1);
      setTimeout(() => tone(1100, 80, 'sine', 0.1), 90);
      break;
    case 'birthday':
      tone(523, 100, 'square', 0.06);
      setTimeout(() => tone(659, 100, 'square', 0.06), 120);
      setTimeout(() => tone(784, 200, 'square', 0.06), 240);
      break;
    case 'click':
      tone(440, 30, 'square', 0.04);
      break;
  }
}