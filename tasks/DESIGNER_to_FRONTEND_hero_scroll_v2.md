# Hero scroll v2 — addendum to v1 review

**From:** `/designer`
**To:** `/frontend`
**Status:** Apply on top of current implementation. User reviewed v1 in person and revised intent.

## Summary

User accepts most of v1 with **revisions**: bright-orange neighbors stay (just dimmed vs Group 2), hover stays (softer), highlight layer stays (recolored + pulse). The Group-2-in-base bug is confirmed for fix. Plus one **new critical bug** I diagnosed independently: first scroll causes a 60px jump because sticky `top: 0` collides with the sticky 60px nav.

## P0 — critical

### A. Filter Group 2 out of `.layer-base`

Unchanged from v1 review. User: *"1 исправлять"*.

```astro
<g class="layer-base">
    {
        groups
            .filter((grp) => grp.g !== "2")
            .map((grp) => (
                <g data-group={grp.g}>
                    {grp.paths.map((d) => <path d={d} />)}
                </g>
            ))
    }
</g>
```

### B. **NEW BUG** — first scroll lowers the page by 60px

**Cause:** [global.css:272-280](src/styles/global.css#L272-L280) has `section.hero { position: sticky; top: 0; height: 100vh; }`. The header `header.nav` is sticky at `top: 0` with `height: 60px` ([global.css:96-110](src/styles/global.css#L96-L110)).

At scrollY=0, section.hero is in normal flow at viewport y=60 (below nav). As scrollY increases, section moves up with the page until it would cross the sticky threshold at top:0 — then it **snaps** to viewport y=0, **behind** the nav. The 60px jump is what the user is reading as "page lowers."

**Fix:** stick section *below* the nav. Define a nav-height variable, use it everywhere:

```css
:root {
    /* …existing tokens… */
    --nav-h: 60px;
}

.nav-inner {
    height: var(--nav-h);
    /* …rest unchanged… */
}

section.hero {
    position: sticky;
    top: var(--nav-h);
    height: calc(100vh - var(--nav-h));
    /* …rest unchanged… */
}
```

With this, sticky engages from scrollY=0 onward at the same visual position (below nav). No snap, no jump. First scroll triggers the animation cleanly with no layout shift.

## P1 — revised design decisions (user overrode v1)

### C. Keep all groups in `.layer-main` at FULL equal strength

**Updated rationale (user clarified product semantics):** The N routes in `.layer-main` are NOT "one optimal vs candidate alternatives" — they are all part of the SAME multi-circuit solution. Traceopt produces a *set* of routes because length/capacity constraints split the model into N circuits; every route is an equal sibling in the final answer. Group 2 is just "the one we animate to demonstrate construction"; it has no semantic dominance over the others.

**Therefore:** all routes in `.layer-main` render with identical styling. Group 2's distinction during scroll is purely the draw-on animation (`stroke-dashoffset`). After the animation completes, Group 2 settles into the same visual weight as its siblings.

Keep [global.css:446-455](src/styles/global.css#L446-L455) essentially as-is (v1 styling — no dim layer). Reproduced for clarity:

```css
#hero-svg-overlay .layer-main path {
    stroke: var(--accent);
    stroke-width: 6.2;
    stroke-linejoin: round;
    stroke-linecap: round;
    fill: none;
    filter: drop-shadow(0 0 6px var(--accent));
    vector-effect: non-scaling-stroke;
    transition: stroke-width 0.09s ease, filter 0.12s ease;
}
```

**Keep** the `.boosted` end-flourish on Group 2 (already in [global.css:456-458](src/styles/global.css#L456-L458)) as a brief "computation complete" beat — but trigger it later (progress > 0.92) and make it a shallower bump so it doesn't leave Group 2 permanently brighter than siblings.

Replace the boost rule:

```css
#hero-svg-overlay .layer-main path.boosted {
    stroke-width: 7.0;                            /* was 7.5 — subtler */
    filter: drop-shadow(0 0 9px var(--accent));   /* small glow kick */
}
```

And update JS threshold from `0.85` to `0.92` ([hero-scroll.ts:41](src/scripts/hero-scroll.ts#L41)):

```ts
animatedPath.classList.toggle("boosted", progress > 0.92);
```

This gives a half-second "click" at the tail of the draw, then on progress=1 the boost stays (Group 2 ends slightly brighter than its siblings — acceptable as a satisfying punctuation; we can remove it entirely later if it bugs you).

### D. Keep hover-highlight, but soften the `.active` boost

User: *"добавляет взаимодействия, можно приглушить"*.

Currently [global.css:459-462](src/styles/global.css#L459-L462) bumps active to `stroke-width: 8.1` and `drop-shadow(0 0 16px)`. Too aggressive.

Since (per §C revised) all groups in `.layer-main` now render at equal strength (no more dimmed neighbors), hover only needs to add a moderate lift on top of the already-bright baseline.

Replace with:

```css
#hero-svg-overlay .layer-main g.active path {
    stroke-width: 7.2;
    filter: drop-shadow(0 0 10px var(--accent));
}
```

Subtle but clear feedback (base 6.2 → 7.2 stroke, base 6px → 10px glow). Doesn't overshadow Group 2's draw animation; doesn't dwarf the end-boost flourish.

### E. Keep `.layer-highlight`, recolor, and gate the pulse to "computing" state

User: *"толщину нужно оставить чтобы был единый стиль, можно сделать темнее и можно добавить эффект подсветки или пульсации при движении"* — and gave me discretion on the pulse (*"сделай как считаешь нужным"*).

Current ([global.css:463-471](src/styles/global.css#L463-L471)) uses `stroke: #fff; opacity: 0.48` — invisible against the paper bg.

**Design decision:** recolor to `--ink` for the engraved/etched edge effect (this is unconditional, always on). **Gate the pulse to scroll-progress state** — pulse only animates while `0 < progress < 1` (system actively computing in the demo). At progress=0 (idle, not started) and progress=1 (computation complete) the highlight is static.

Rationale: three persistent pulses on a single hero (ping-square at 2.6s, brand-pulse at 2.6s, highlight at any period) is motion noise for a technical B2B audience. By tying the highlight pulse to *meaningful state* ("computing now") rather than running it ambiently, we keep the visual language honest — pulse = "live work happening" — and drop the noise when no work is happening.

CSS:

```css
#hero-svg-overlay .layer-highlight path {
    stroke: var(--ink);                       /* was: #fff — invisible on paper */
    stroke-width: 0.5;                         /* keep — uniform layer style */
    stroke-linejoin: round;
    stroke-linecap: round;
    fill: none;
    opacity: 0.35;
    vector-effect: non-scaling-stroke;
    will-change: opacity;
}
/* Pulse only while the scroll-driven animation is mid-flight */
#hero-svg-overlay.computing .layer-highlight path {
    animation: highlight-pulse 1.4s ease-in-out infinite;
}
@keyframes highlight-pulse {
    0%, 100% { opacity: 0.25; }
    50%       { opacity: 0.6; }
}
@media (prefers-reduced-motion: reduce) {
    #hero-svg-overlay .layer-highlight path {
        animation: none;
        opacity: 0.35;
    }
}
```

JS — extend `updateScroll()` in [hero-scroll.ts:28-42](src/scripts/hero-scroll.ts#L28-L42) to toggle `.computing` class on the SVG:

```ts
const updateScroll = () => {
    const rect = wrap.getBoundingClientRect();
    const scrollable = wrap.offsetHeight - window.innerHeight;
    let progress = scrollable > 0 ? -rect.top / scrollable : 0;
    progress = Math.max(0, Math.min(1, progress));

    if (stub) stub.style.setProperty("--stub-progress", String(1 - progress));
    animatedPath.setAttribute("stroke-dashoffset", String(1000 * (1 - progress)));
    animatedPath.classList.toggle("boosted", progress > 0.92);

    // NEW — pulse highlight only during active draw
    if (svg) svg.classList.toggle("computing", progress > 0 && progress < 1);
};
```

Effect: at scroll=0, highlight is a static thin dark engraved edge (just the recolor, no motion). As soon as user starts scrolling, `.computing` engages and the highlight begins a brisk 1.4s pulse — visually says "the system is building this circuit now". When scroll completes (progress=1) or returns to idle (progress=0), pulse stops. Motion is **bound to meaningful state**, not ambient noise.

Period 1.4s is chosen tight (faster than ping-square 2.6s) because it's an *active-state* signal: the system is "working hard" right now, fast pulse fits. When not computing, no pulse at all — preserves the calm, paper-like idle state.

### F. Stub right edge migrates from 48px gutter → 0 during scroll

User: *"для начальной позиции обязателен, потом можно смещать линию в ноль к правой границе"*.

Replace [global.css:415-426](src/styles/global.css#L415-L426) with:

```css
.hero-stub {
    position: absolute;
    left: 48px;
    right: calc(48px * var(--stub-progress, 1)); /* gutter 48 → 0 as progress 0 → 1 */
    top: calc(var(--stub-y, 42.97%) - 2px);
    height: 1px;
    background: var(--rule);
    transform-origin: right center;
    transform: scaleX(var(--stub-progress, 1));
    pointer-events: none;
    z-index: 2;
}
```

The single CSS variable `--stub-progress` (already wired in JS) now drives **two** properties: `right` (gutter migration) and `scaleX` (length shrink). Both go 1 → 0 with scroll progress.

**Perf note:** animating `right` triggers layout per frame, but the stub is a single 1px element with no children — layout cost is microscopic. If profiling later shows hot frames here, switch to `translateX` based migration (more complex math, only needed under pressure).

Visual result:
- progress=0: stub spans `left:48px` → `right:48px` (full breathing gutter, scale 1)
- progress=0.5: stub spans `left:48px` → `right:24px`, scaleX 0.5 → visual right edge halfway between original gutter and divider, visual length halved
- progress=1: stub spans `left:48px` → `right:0`, scaleX 0 → vertical line at divider, invisible

## What stays from v1 verbatim

- Pin scaffolding, scroll-progress driver, rAF throttling.
- `pathLength="1000"` normalization on Group 2.
- Hover sample-point precomputation in JS.
- 1000px mobile breakpoint + hidden stub.
- `prefers-reduced-motion` early return.
- 24px margin-top on `<em>computed</em>` for H1 gap.
- Stub color (`var(--rule)`), height 1px, `top` math at 42.97%.

## Acceptance check (after v2)

1. **Scroll=0:** nav at top (60px), section.hero immediately below (no overlap, no jump). Faint gray base graph visible (groups 1, 3-6 only — NOT Group 2). All `.layer-main` routes (groups 1, 3-6) visible at full strength orange. Group 2 NOT visible (`stroke-dashoffset=1000`). Stub line at full width across H1 area with 48px gutters left/right. Highlight layer present but static (no pulse).

2. **First scroll wheel-tick:** no 60px jump. Hero stays anchored below nav. `.computing` class engages on SVG → highlight pulse starts. Stub starts retracting + gutter starts closing, Group 2 starts drawing.

3. **Scroll≈0.5:** stub at ~50% scale with right-gutter at ~24px. Group 2 ~50% drawn. All routes at equal full-strength orange. Highlight pulsing.

4. **Scroll=1:** stub invisible. Group 2 fully drawn with end-flourish (subtle stroke bump, settles). `.computing` class drops → highlight pulse stops, static at opacity 0.35. Hero unpins, page continues to Marquee.

5. **Hover on any path in `.layer-main`:** moderate boost (7.2 stroke, 10px glow). All groups equally hoverable.

6. **Highlight layer:** static at idle states (scroll=0, scroll=1), pulses during active scroll only.

7. **Mobile <1000px:** no pin, no animation, no jump, no pulse. Section displays at original min-height: 92vh.

## File-by-file checklist

| File | Lines | Action |
|---|---|---|
| `src/styles/global.css` | `:root` block | Add `--nav-h: 60px` |
| `src/styles/global.css` | 108 | `height: 60px` → `height: var(--nav-h)` |
| `src/styles/global.css` | 273-275 | Add `top: var(--nav-h); height: calc(100vh - var(--nav-h));` to section.hero sticky |
| `src/styles/global.css` | 415-426 | Replace `.hero-stub` — animate `right: calc(48px * var(--stub-progress, 1))` alongside scaleX |
| `src/styles/global.css` | 446-455 | **Keep v1** styling on `.layer-main path` (full equal strength — no dim treatment) |
| `src/styles/global.css` | 456-458 | Soften `.boosted` flourish — stroke 7.5 → 7.0, glow 9px |
| `src/styles/global.css` | 459-462 | Soften `.active` hover — stroke 8.1 → 7.2, glow 16px → 10px |
| `src/styles/global.css` | 463-471 | Recolor highlight to `var(--ink)`. **Remove** `animation` declaration from base rule (it shouldn't run unconditionally). Add separate `#hero-svg-overlay.computing .layer-highlight path { animation: ... }` block + pulse keyframes + reduce-motion override |
| `src/scripts/hero-scroll.ts` | 41 | Boost threshold 0.85 → 0.92 |
| `src/scripts/hero-scroll.ts` | (in `updateScroll`) | Add `svg.classList.toggle("computing", progress > 0 && progress < 1)` |
| `src/components/Hero.astro` | 200-210 | Filter `grp.g !== "2"` in layer-base map |

Roughly ~15 minutes. Bounce back with `tasks/FRONTEND_to_DESIGNER_hero_scroll_v2_response.md` when done — I'll do final acceptance pass.
