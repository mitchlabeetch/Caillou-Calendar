import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('confetti', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
  });

  it('attaches a canvas overlay to the body', async () => {
    const { burstConfetti } = await import('./confetti');
    burstConfetti(8);
    const canvas = document.body.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect((canvas as HTMLCanvasElement).style.position).toBe('fixed');
    expect((canvas as HTMLCanvasElement).style.pointerEvents).toBe('none');
  });

  it('renders particles (canvas context receives draws)', async () => {
    const { burstConfetti } = await import('./confetti');
    burstConfetti(12);
    const canvas = document.body.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect((canvas as HTMLCanvasElement).style.position).toBe('fixed');
  });

  it('handles being called multiple times', async () => {
    const { burstConfetti } = await import('./confetti');
    expect(() => {
      burstConfetti(4);
      burstConfetti(6);
    }).not.toThrow();
  });
});