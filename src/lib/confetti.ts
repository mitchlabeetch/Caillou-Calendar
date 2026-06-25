/**
 * Birthday confetti animation.
 *
 * Fires a one-off burst of confetti dots from the centre of the
 * viewport using a small canvas overlay. Pure DOM, no dependency.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hue: number;
  life: number;
  size: number;
}

let raf: number | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];

function ensureCanvas(): void {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize(): void {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function step(): void {
  if (!ctx || !canvas) {
    raf = null;
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18; // gravity
    p.life -= 1;
    ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${Math.max(0, p.life / 80)})`;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  if (particles.length > 0) {
    raf = requestAnimationFrame(step);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    raf = null;
  }
}

export function burstConfetti(count = 120): void {
  ensureCanvas();
  if (!canvas) return;
  const cx = canvas.width / 2;
  const cy = canvas.height / 3;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      hue: Math.floor(Math.random() * 360),
      life: 80,
      size: 4 + Math.random() * 4,
    });
  }
  if (raf == null) raf = requestAnimationFrame(step);
}