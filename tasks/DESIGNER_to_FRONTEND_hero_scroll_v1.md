# Hero scroll-tied animation — implementation brief (v1)

**From:** `/designer`
**To:** `/frontend`
**Status:** Ready to implement
**References (all in `tasks/`):**
- `USER_to_DESIGNER_hero_lines_v1.txt` — original idea
- `traceopt-hero-svg-demo_v2.html` — reference for scroll-progress curve, pin scaffolding, dashoffset math
- `hero-svg-test.html` — **source of truth for SVG paths** (6 groups, viewBox 1024×1024, layer styles)
- `hero_lines.png` — visual reference

## Goal

When the user scrolls, transform the hero from "headline + cloud" → "headline + computed routing graph".

A thin **gray** stub sits between H1 lines "TRACER ROUTING," and "COMPUTED." inside `.hero-left`. On scroll it shrinks toward the column divider (right-anchored `scaleX`). Simultaneously, an **orange** tracer (Group 2 from the prepared SVG) draws itself left-to-right inside the right column via `stroke-dashoffset`. The two elements share the same Y and the same scroll-progress driver — visually they read as **one** continuous line that changes color (gray → orange) when crossing the divider.

The point cloud (Three.js, `.hero-right`) stays unchanged underneath as the substrate / search-space layer. SVG overlays on top.

## Files to touch

- `src/components/Hero.astro` — DOM additions (wrap section in pin-wrapper, add stub element, add SVG overlay with the 6 groups inlined)
- `src/styles/global.css` — pin layout, stub styles, SVG layer styles, animation states, mobile/reduced-motion handling
- `src/scripts/hero-scroll.ts` — **new file** — scroll-progress driver
- `src/layouts/Base.astro` (or wherever `particle-canvas.ts` is registered) — register the new script

## DOM structure

Wrap `section.hero` with a pin wrapper. Add the stub element as a direct child of `.hero-left` (sibling of `.headline` / `.stats`, not nested inside). Add the SVG overlay as a child of `.hero-right` (sibling of the existing `<canvas>`).

```astro
<div class="hero-pin-wrap">
  <section class="hero" data-screen-label="01 hero">
    <div class="hero-left">
      <div class="meta">…</div>
      <div class="headline">
        <h1 class="display">
          Optimal<br />tracer routing,<br /><em>computed<span class="ping-dot"></span></em>
        </h1>
        …lede, CTAs, note…
      </div>
      <div class="stats">…</div>
      <span class="hero-stub" aria-hidden="true"></span>
    </div>

    <div class="hero-right" id="hero-canvas-wrap">
      <canvas id="hero-canvas" …></canvas>
      <svg id="hero-svg-overlay" viewBox="0 0 1024 1024"
           preserveAspectRatio="xMidYMid meet"
           aria-hidden="true">
        <!-- Base layer: ALL groups EXCEPT Group 2 -->
        <g class="layer-base">
          <g id="g1">…Group 1 paths…</g>
          <g id="g3">…Group 3 paths…</g>
          <g id="g4">…Group 4 paths…</g>
          <g id="g5">…Group 5 paths…</g>
          <g id="g6">…Group 6 paths…</g>
        </g>
        <!-- Main layer: ONLY Group 2, merged into one continuous path -->
        <g class="layer-main">
          <path class="animated"
                d="M8 440H360V496H288V520H488V816H560V936"
                pathLength="1000"
                stroke-dasharray="1000 1000"
                stroke-dashoffset="1000" />
        </g>
      </svg>
    </div>

    …existing 8 corner spans…
  </section>
</div>
```

**Notes:**
- Copy the actual path-`d` strings for groups 1, 3, 4, 5, 6 from `tasks/hero-svg-test.html` (lines 97-197). Skip Group 2 in `.layer-base`.
- Group 2 is **merged into one continuous path** above using H/V shorthand commands so a single `stroke-dasharray`/`-dashoffset` controls the whole drawing. Verified — the 8 source segments are chained end-to-end.
- `pathLength="1000"` normalizes the path so we don't need `getTotalLength()` at runtime. JS just does `dashoffset = 1000 * (1 - progress)`.

## CSS

### Pin scaffolding

```css
.hero-pin-wrap {
    position: relative;
    height: 150vh; /* TUNING: bump to 180/220vh if anim feels rushed */
}
section.hero {
    position: sticky;
    top: 0;
    height: 100vh; /* was: min-height: 92vh — replace */
    /* keep existing grid/border/overflow rules */
}
```

### Stub

```css
.hero-stub {
    position: absolute;
    right: 0;                /* anchored at divider */
    top: var(--stub-y, 42.97%); /* 440/1024 = 0.4297 — TUNE if H1 gap doesn't align */
    width: var(--stub-w, 35%);  /* TUNING: 25-50% range */
    height: 2px;
    background: var(--rule);
    transform-origin: right center;
    transform: scaleX(var(--stub-progress, 1));
    pointer-events: none;
    z-index: 2; /* above .hero-left content (z:2) but below corners (z:3) */
}
```

The stub uses `scaleX`, not `width`, for animation — composited on the GPU, no layout/paint cost per frame. This is critical to avoid the "stepped" feel the user noted in v1.

### SVG overlay layers

```css
#hero-svg-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 2; /* above canvas (auto z), below corners (z:3) */
    pointer-events: none;
}
#hero-svg-overlay .layer-base path {
    stroke: var(--ink);
    stroke-width: 4.2;
    stroke-linejoin: round;
    stroke-linecap: round;
    fill: none;
    opacity: 0.19;
    vector-effect: non-scaling-stroke;
}
#hero-svg-overlay .layer-main path {
    stroke: var(--accent);
    stroke-width: 6.2;
    stroke-linejoin: round;
    stroke-linecap: round;
    fill: none;
    filter: drop-shadow(0 0 6px var(--accent));
    vector-effect: non-scaling-stroke;
}
```

### Mobile / reduced-motion overrides

```css
@media (max-width: 960px) {
    .hero-pin-wrap { height: auto; }
    section.hero {
        position: static;
        height: auto;
        min-height: 92vh; /* restore original */
    }
    .hero-stub { display: none; }
    /* Group 2 forced to final state via JS */
}

@media (prefers-reduced-motion: reduce) {
    /* JS sets final state on init and exits — no CSS-level changes needed */
}
```

## JS — `src/scripts/hero-scroll.ts`

```ts
export function initHeroScroll(): void {
    const wrap = document.querySelector<HTMLElement>('.hero-pin-wrap');
    const stub = document.querySelector<HTMLElement>('.hero-stub');
    const animatedPath = document.querySelector<SVGPathElement>(
        '#hero-svg-overlay .layer-main path.animated'
    );
    if (!wrap || !stub || !animatedPath) return;

    const isMobile = window.matchMedia('(max-width: 960px)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mobile and reduced-motion → final state, no scroll listener
    if (isMobile || reduceMotion) {
        stub.style.setProperty('--stub-progress', '0');
        animatedPath.setAttribute('stroke-dashoffset', '0');
        return;
    }

    const update = () => {
        const rect = wrap.getBoundingClientRect();
        const scrollable = wrap.offsetHeight - window.innerHeight;
        let progress = scrollable > 0 ? -rect.top / scrollable : 0;
        progress = Math.max(0, Math.min(1, progress));

        stub.style.setProperty('--stub-progress', String(1 - progress));
        animatedPath.setAttribute('stroke-dashoffset', String(1000 * (1 - progress)));

        // End boost: thicken slightly past progress 0.85 (final highlight kick)
        animatedPath.style.strokeWidth = progress > 0.85 ? '7.5' : '';
    };

    let ticking = false;
    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                update();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
}
```

Register alongside `initParticleCanvas()` wherever it's currently called.

## Animation parameters

| Element | Property | At progress=0 | At progress=1 | Curve |
|---|---|---|---|---|
| `.hero-stub` | `transform: scaleX()` | 1 | 0 | linear |
| Group 2 path | `stroke-dashoffset` | 1000 | 0 | linear |
| Group 2 path | `stroke-width` | 6.2 | 7.5 (past 0.85) | step |

Linear progress mapping — matches the v2 demo. Don't ease the path-drawing curve in v1; we can layer easing later if it feels mechanical.

## Tuning knobs (CSS vars + magic numbers)

| Knob | Default | Range | When to tune |
|---|---|---|---|
| `.hero-pin-wrap height` | `150vh` | 130-220vh | Anim feels rushed → bump; feels stuck → shrink |
| `--stub-w` | `35%` | 25-50% | Visual balance of stub vs H1 |
| `--stub-y` | `42.97%` | iterate | If stub doesn't sit in H1 gap |
| End-boost threshold | `> 0.85` | 0.8-0.92 | Adjust final highlight kick timing |
| SVG vertical alignment | viewBox-native | — | See "Open issues" #1 |

## Open issues — expected manual iteration after first build

1. **Stub Y vs H1 gap alignment.** Y=42.97% is the mathematical match for SVG Group 2 first segment Y=440 in viewBox 1024. But the H1 layout (`line-height: 0.92`, flex-centered headline) doesn't naturally put the gap between "tracer routing," and "computed" at that Y. **Two options:**
   - **A.** Insert explicit margin-top on the COMPUTED line of H1 (e.g., 24-32px) so the gap is visually present and place stub at the gap's Y.
   - **B.** Shift the whole SVG vertically via `<g transform="translate(0, N)">` so Group 2 starts at the natural H1 gap Y.

   Decide based on what looks better. **A** keeps SVG composition pure but slightly alters H1 typography. **B** preserves H1 but moves the whole tracer graph down (which may shift everything below the visible canvas area).

   My preference: **A** — small margin-top (24px) on `<em>computed</em>`, then place stub at that gap. The H1 already breathes more between top lines than the demo, so 24px feels coherent.

2. **SVG aspect-ratio with cloud.** Both built against 1024×1024 reference. `preserveAspectRatio="xMidYMid meet"` keeps SVG square inside `.hero-right` (letterboxed top/bottom on wide containers, left/right on narrow). Cloud is also letterboxed via `remapHomes` in `particle-canvas.ts`. They should align by construction. If they don't visually, check that the SVG container respects the same letterbox center as the canvas.

3. **Stub initial width.** 35% is a guess. Tune visually — narrower (~25%) reads as "tiny hint", wider (~50%) reads as "deliberate divider rule". Both are valid; pick what serves the metaphor.

4. **Pin length.** Start at 150vh. If end-state feels rushed → 180vh. If "stuck" feeling at 180 → 165vh. Engineers won't tolerate >220vh.

5. **Color hand-off at divider.** Stub (gray, 2px) ends at `right: 0` of `.hero-left`. Group 2 first segment starts at SVG viewBox X=8 (~0.8% from left edge of `.hero-right`). There's a sub-pixel gap. If visible, nudge `.hero-stub { right: -1px }` or merge into single shared visual via additional element.

## Explicitly NOT in v1

- **Highlight layer** (white stroke). The reference test page has one. Skip in v1; add later if visuals feel flat.
- **Hover-active group** interaction from `hero-svg-test.html` mousemove logic. Decorative, splits attention away from the headline. Out of scope.
- **`LIVE` / `SOLVED` UI badges** from v2 demo. Out of scope — they don't fit our existing UI language.
- **Text-collapse animation** between H1 lines. User explicitly rejected (stuttered when tied to scroll). Headline is static.
- **Easing curves** beyond linear. Add only if v1 feels mechanical.

## Acceptance criteria

After implementation, verify on dev server at 1920×1080:

1. **Initial state (scroll=0):** gray stub visible in `.hero-left` between "tracer routing," and "computed"; no orange tracer visible in canvas; gray base graph (groups 1, 3-6) visible as faint background; cloud unchanged.
2. **Mid-scroll (≈50%):** stub at ~50% original width; orange path drawn ~50%; visible cross-divider continuity (gray ending where orange starts, same Y).
3. **Final (scroll=100%):** stub invisible (scaleX 0); Group 2 fully drawn with end-boost stroke-width; the section unpins and page continues to Marquee.
4. **Cloud:** renders normally throughout; no perf regression on the canvas.
5. **Mobile <960px:** no pin behavior; hero static at original 92vh min-height; stub hidden; Group 2 rendered in final state immediately.
6. **prefers-reduced-motion:** Group 2 in final state on load; stub at progress=0 visible; no scroll listener active.
7. **Browser zoom 100% / 125% / 150%:** stub Y stays aligned with H1 gap; SVG Group 2 alignment stable; no layout jumps.
8. **Performance:** 60fps in DevTools Performance recording during scroll on a 2020-era laptop.

## Handoff back

After implementation, leave a response in `tasks/FRONTEND_to_DESIGNER_hero_scroll_v1_response.md` with:
- Build status (working / what failed)
- What got tuned vs. brief defaults
- Screenshots at progress 0 / 0.5 / 1
- Any visual issues that need a design call before ship

I'll review against acceptance criteria and either close the loop or queue v2.
