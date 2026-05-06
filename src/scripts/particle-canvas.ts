// Hero particle canvas — fetches points-data.json and runs an interactive
// spring-damper simulation that nudges particles away from the cursor.

interface PointDatum { x: number; y: number; i: number; s: number; }
interface PointsData {
  version: number;
  aspect: number;
  particleCount: number;
  intensityRange: { originalMin: number; originalMax: number };
  points: PointDatum[];
}

const COLOR_LOW   = '#1a1a1a';
const COLOR_HIGH  = '#D85A1B';
const GAMMA       = 1;
const BASE_RADIUS = 3.5;
const MOUSE_RADIUS = 140;
const MOUSE_FORCE  = 0.55;
const SPRING_K     = 0.06;
const DAMPING      = 0.86;
const ALPHA        = 1.0;
const RAMP_STOPS   = 32;

export async function initParticleCanvas(): Promise<void> {
  const wrap   = document.getElementById('hero-canvas-wrap');
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  if (!canvas || !wrap) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const res = await fetch('/points-data.json');
  const data: PointsData = await res.json();

  const parseColor = (h: string) => {
    h = h.replace('#', '').trim();
    if (h.length === 3) return { r: parseInt(h[0]+h[0],16), g: parseInt(h[1]+h[1],16), b: parseInt(h[2]+h[2],16) };
    return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
  };
  const lo = parseColor(COLOR_LOW), hi = parseColor(COLOR_HIGH);

  const rampStyles: string[] = new Array(RAMP_STOPS);
  for (let s = 0; s < RAMP_STOPS; s++) {
    const t = s / (RAMP_STOPS - 1);
    rampStyles[s] = `rgba(${Math.round(lo.r+(hi.r-lo.r)*t)},${Math.round(lo.g+(hi.g-lo.g)*t)},${Math.round(lo.b+(hi.b-lo.b)*t)},${ALPHA})`;
  }
  const lastStop = RAMP_STOPS - 1;
  const styleForI = (i: number) =>
    rampStyles[Math.min(lastStop, Math.max(0, Math.round((GAMMA === 1 ? i : Math.pow(i, GAMMA)) * lastStop)))];

  type Particle = { homeX: number; homeY: number; x: number; y: number; vx: number; vy: number; i: number; s: number };
  const particles: Particle[] = data.points.map(() => ({ homeX:0, homeY:0, x:0, y:0, vx:0, vy:0, i:0, s:0 }));
  const homesNorm = data.points.map(p => ({ nx: p.x, ny: p.y }));
  for (let i = 0; i < data.points.length; i++) {
    particles[i].i = data.points[i].i;
    particles[i].s = data.points[i].s;
  }

  let cssW = 0, cssH = 0, mouseX = -9999, mouseY = -9999;

  const fit = () => {
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    cssW = rect.width; cssH = rect.height;
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const remap = () => {
    const aspect  = data.aspect;
    const cAspect = cssW / cssH;
    let scale: number, ox: number, oy: number;
    if (aspect > cAspect) { scale = cssW; ox = 0; oy = (cssH - scale / aspect) / 2; }
    else                  { scale = cssH * aspect; ox = (cssW - scale) / 2; oy = 0; }
    for (let i = 0; i < particles.length; i++) {
      particles[i].homeX = ox + homesNorm[i].nx * scale;
      particles[i].homeY = oy + homesNorm[i].ny * scale;
    }
  };

  fit(); remap();
  for (const p of particles) { p.x = p.homeX; p.y = p.homeY; }

  const draw = () => {
    ctx.clearRect(0, 0, cssW, cssH);
    for (const p of particles) {
      const r = Math.max(0.5, p.s * BASE_RADIUS);
      ctx.fillStyle = styleForI(p.i);
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.5, 0, Math.PI * 2); ctx.fill();
    }
  };

  const tick = () => {
    ctx.clearRect(0, 0, cssW, cssH);
    const radSq = MOUSE_RADIUS * MOUSE_RADIUS;
    for (const p of particles) {
      const dxm = p.x - mouseX, dym = p.y - mouseY;
      const dSq = dxm * dxm + dym * dym;
      if (dSq < radSq && dSq > 0.01) {
        const d = Math.sqrt(dSq), fall = 1 - d / MOUSE_RADIUS, f = MOUSE_FORCE * fall * fall;
        p.vx += (dxm / d) * f; p.vy += (dym / d) * f;
      }
      p.vx += (p.homeX - p.x) * SPRING_K; p.vy += (p.homeY - p.y) * SPRING_K;
      p.vx *= DAMPING; p.vy *= DAMPING;
      p.x += p.vx; p.y += p.vy;
      const r = Math.max(0.5, p.s * BASE_RADIUS);
      ctx.fillStyle = styleForI(p.i);
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(tick);
  };

  const ro = new ResizeObserver(() => { fit(); remap(); if (reduceMotion) draw(); });
  ro.observe(wrap);

  if (reduceMotion) {
    draw();
  } else {
    canvas.addEventListener('pointermove', e => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left; mouseY = e.clientY - rect.top;
    }, { passive: true });
    canvas.addEventListener('pointerleave', () => { mouseX = -9999; mouseY = -9999; }, { passive: true });
    requestAnimationFrame(tick);
  }
}
