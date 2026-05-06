// In-page tweaks panel: adjusts grid density, H1 wording, and accent colour.

interface Tweaks {
  heroGrid: string;
  hero: string;
  h1: string;
  accent: string;
  grid: string;
}

const DEFAULTS: Tweaks = {
  heroGrid: '4',
  hero: 'dark',
  h1: 'a',
  accent: '#D85A1B',
  grid: 'visible',
};

let tweaks: Tweaks = { ...DEFAULTS };

function syncHeroGrid() {
  const hr = document.querySelector<HTMLElement>('.hero-right');
  if (!hr) return;
  const left = hr.getBoundingClientRect().left;
  const gx = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gx')) || 32;
  const offsetX = ((-left) % gx + gx) % gx;
  hr.style.setProperty('--hero-grid-x', offsetX + 'px');
  const top = hr.getBoundingClientRect().top + window.scrollY;
  const offsetY = ((-top) % gx + gx) % gx;
  hr.style.setProperty('--hero-grid-y', offsetY + 'px');
}

function applyTweaks(t: Tweaks) {
  const root = document.documentElement.style;

  if (t.grid === 'off') {
    document.body.style.backgroundImage = 'none';
  } else if (t.grid === 'subtle') {
    document.body.style.backgroundImage =
      'linear-gradient(to right, rgba(20,18,15,.025) 1px, transparent 1px),linear-gradient(to bottom, rgba(20,18,15,.025) 1px, transparent 1px)';
  } else {
    document.body.style.backgroundImage =
      'linear-gradient(to right, rgba(20,18,15,.055) 1px, transparent 1px),linear-gradient(to bottom, rgba(20,18,15,.055) 1px, transparent 1px)';
  }

  document.documentElement.style.setProperty('--hero-gx', t.heroGrid + 'px');
  syncHeroGrid();

  const h1 = document.querySelector<HTMLElement>('.hero-left h1');
  if (h1) {
    if (t.h1 === 'a') h1.innerHTML = 'Optimal<br>tracer routing,<br><em>computed.</em>';
    else h1.innerHTML = 'Heat tracer<br>routing,<br><em>delivered.</em>';
  }

  root.setProperty('--accent', t.accent);

  document.querySelectorAll<HTMLElement>('#tweaks-panel [data-k]').forEach(btn => {
    const k = btn.dataset.k as keyof Tweaks;
    btn.classList.toggle('active', String(tweaks[k]) === String(btn.dataset.v));
  });
}

export function initTweaks() {
  document.querySelectorAll<HTMLElement>('#tweaks-panel [data-k]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.k as keyof Tweaks;
      const v = btn.dataset.v as string;
      (tweaks as Record<string, string>)[k] = v;
      applyTweaks(tweaks);
    });
  });

  const toggle = document.getElementById('tweaks-toggle');
  const panel  = document.getElementById('tweaks-panel');
  toggle?.addEventListener('click', () => {
    panel?.classList.toggle('visible');
    if (toggle && panel?.classList.contains('visible')) toggle.style.display = 'none';
  });
  document.querySelectorAll<HTMLElement>('#tweaks-panel .close').forEach(b => {
    b.addEventListener('click', () => {
      panel?.classList.remove('visible');
      if (toggle) toggle.style.display = '';
    });
  });

  applyTweaks(tweaks);

  syncHeroGrid();
  window.addEventListener('resize', syncHeroGrid);

  document.querySelectorAll<HTMLElement>('section').forEach((s, i) => {
    if (!s.hasAttribute('data-screen-label')) {
      s.setAttribute('data-screen-label', `${String(i + 1).padStart(2, '0')} ${s.id || 'section'}`);
    }
  });
}
