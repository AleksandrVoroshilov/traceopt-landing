// Hero particle canvas — migrated to Three.js (GPU-accelerated points)
// Exact 1:1 visual & behavior with original CPU canvas. No new effects.
// Physics on CPU, rendering on GPU via Three.js Points

import * as THREE from 'three';

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
  const wrap = document.getElementById('hero-canvas-wrap') as HTMLElement | null;
  const oldCanvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  if (!wrap || !oldCanvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Load data
  const res = await fetch('/points-data.json');
  const data: PointsData = await res.json();

  const parseColor = (h: string) => {
    h = h.replace('#', '').trim();
    if (h.length === 3) return { r: parseInt(h[0]+h[0],16), g: parseInt(h[1]+h[1],16), b: parseInt(h[2]+h[2],16) };
    return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
  };

  const lo = parseColor(COLOR_LOW), hi = parseColor(COLOR_HIGH);

  const rampColors: THREE.Color[] = new Array(RAMP_STOPS);
  for (let s = 0; s < RAMP_STOPS; s++) {
    const t = s / (RAMP_STOPS - 1);
    const r = lo.r + (hi.r - lo.r) * t;
    const g = lo.g + (hi.g - lo.g) * t;
    const b = lo.b + (hi.b - lo.b) * t;
    rampColors[s] = new THREE.Color(r / 255, g / 255, b / 255);
  }

  const styleForI = (i: number) => {
    const idx = Math.min(RAMP_STOPS - 1, Math.max(0, Math.round((GAMMA === 1 ? i : Math.pow(i, GAMMA)) * (RAMP_STOPS - 1))));
    return rampColors[idx];
  };

  type Particle = { homeX: number; homeY: number; x: number; y: number; vx: number; vy: number; i: number; s: number };
  const particles: Particle[] = data.points.map(() => ({ homeX:0, homeY:0, x:0, y:0, vx:0, vy:0, i:0, s:0 }));
  const homesNorm = data.points.map(p => ({ nx: p.x, ny: p.y }));
  for (let i = 0; i < data.points.length; i++) {
    particles[i].i = data.points[i].i;
    particles[i].s = data.points[i].s;
  }

  // Hide old canvas
  oldCanvas.style.display = 'none';

  // Create canvas for Three.js
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  wrap.appendChild(canvas);

  // Three.js setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xF4F1EA); // --bg color

  let camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 1);

  // Renderer - WebGL for maximum compatibility (Points performance is excellent)
  // WebGPU can be added later if needed, but WebGL is more reliable for this use case in 2026
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

  const particleCount = particles.length;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: BASE_RADIUS,
    vertexColors: true,
    transparent: true,
    opacity: ALPHA,
    depthTest: false,
    sizeAttenuation: false, // use screen pixels
  });

  const pointsMesh = new THREE.Points(geometry, material);
  scene.add(pointsMesh);

  let cssW = 0;
  let cssH = 0;
  let mouseX = -9999;
  let mouseY = -9999;

  const remapHomes = () => {
    const aspect = data.aspect;
    const cAspect = cssW / cssH;
    let scale: number, ox: number, oy: number;
    if (aspect > cAspect) {
      scale = cssW;
      ox = 0;
      oy = (cssH - scale / aspect) / 2;
    } else {
      scale = cssH * aspect;
      ox = (cssW - scale) / 2;
      oy = 0;
    }
    for (let i = 0; i < particles.length; i++) {
      particles[i].homeX = ox + homesNorm[i].nx * scale;
      particles[i].homeY = oy + homesNorm[i].ny * scale;
    }
  };

  const fit = () => {
    const rect = wrap.getBoundingClientRect();
    cssW = rect.width;
    cssH = rect.height;

    renderer.setSize(cssW, cssH, false);

    // Orthographic camera (pixel coordinates, Y down)
    camera.left = 0;
    camera.right = cssW;
    camera.top = 0;
    camera.bottom = cssH;
    camera.near = -1;
    camera.far = 1;
    camera.updateProjectionMatrix();

    remapHomes();

    // Reset particles
    for (const p of particles) {
      p.x = p.homeX;
      p.y = p.homeY;
      p.vx = p.vy = 0;
    }
  };

  const updateBuffers = () => {
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizeAttr = geometry.getAttribute('size') as THREE.BufferAttribute;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const idx = i * 3;
      posAttr.array[idx]     = p.x;
      posAttr.array[idx + 1] = cssH - p.y; // flip Y (Three.js Y+ is up)
      posAttr.array[idx + 2] = 0;

      const col = styleForI(p.i);
      colAttr.array[idx]     = col.r;
      colAttr.array[idx + 1] = col.g;
      colAttr.array[idx + 2] = col.b;

      sizeAttr.array[i] = Math.max(0.5, p.s * BASE_RADIUS) * 1.6;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  };

  fit();
  updateBuffers();

  // Interaction
  const onPointerMove = (e: PointerEvent) => {
    const rect = wrap.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  };
  const onPointerLeave = () => { mouseX = -9999; mouseY = -9999; };

  wrap.addEventListener('pointermove', onPointerMove, { passive: true });
  wrap.addEventListener('pointerleave', onPointerLeave, { passive: true });

  // Resize
  const ro = new ResizeObserver(() => {
    fit();
    if (reduceMotion) {
      updateBuffers();
      renderer.render(scene, camera);
    }
  });
  ro.observe(wrap);

  // Animation loop
  const tick = () => {
    const radSq = MOUSE_RADIUS * MOUSE_RADIUS;

    for (const p of particles) {
      // Mouse repulsion
      const dxm = p.x - mouseX;
      const dym = p.y - mouseY;
      const dSq = dxm * dxm + dym * dym;
      if (dSq < radSq && dSq > 0.01) {
        const d = Math.sqrt(dSq);
        const fall = 1 - d / MOUSE_RADIUS;
        const f = MOUSE_FORCE * fall * fall;
        p.vx += (dxm / d) * f;
        p.vy += (dym / d) * f;
      }

      // Spring to home
      p.vx += (p.homeX - p.x) * SPRING_K;
      p.vy += (p.homeY - p.y) * SPRING_K;
      p.vx *= DAMPING;
      p.vy *= DAMPING;
      p.x += p.vx;
      p.y += p.vy;
    }

    updateBuffers();
    renderer.render(scene, camera);

    if (!reduceMotion) requestAnimationFrame(tick);
  };

  if (reduceMotion) {
    updateBuffers();
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(tick);
  }

  console.log('%c✅ Hero canvas: Three.js Points (22k particles)', 'color:#D85A1B; font-family:monospace; font-size:11px');
}
