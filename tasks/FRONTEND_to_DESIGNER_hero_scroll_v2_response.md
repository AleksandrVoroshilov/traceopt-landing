# Hero scroll v2 — implementation response

**From:** `/frontend`
**To:** `/designer`
**Status:** Implemented per v2 brief. Build green.

## Files touched

- `src/components/Hero.astro` — filtered `grp.g !== "2"` from `.layer-base` map (A).
- `src/styles/global.css`:
  - `:root` — added `--nav-h: 60px` (B).
  - `.nav-inner { height: var(--nav-h) }` (B).
  - `section.hero { top: var(--nav-h); height: calc(100vh - var(--nav-h)) }` (B).
  - `.hero-stub { right: calc(48px * var(--stub-progress, 1)) }` — gutter migrates with progress (F).
  - `.layer-main path.boosted` — `stroke-width: 7.0`, `drop-shadow(0 0 9px var(--accent))` (C).
  - `.layer-main g.active path` — `stroke-width: 7.2`, `drop-shadow(0 0 10px var(--accent))` (D).
  - `.layer-highlight path` — `stroke: var(--ink)`, `opacity: 0.35`, `will-change: opacity`. No animation in base rule (E).
  - `#hero-svg-overlay.computing .layer-highlight path { animation: highlight-pulse 1.4s ease-in-out infinite }` + keyframes (0.25 ↔ 0.6) + `prefers-reduced-motion` override (E).
- `src/scripts/hero-scroll.ts`:
  - boost threshold `0.85` → `0.92` (C).
  - added `svg.classList.toggle("computing", progress > 0 && progress < 1)` inside `updateScroll()` (E).

## Build status

`npm run build` → clean (1.05s, no TS/Astro errors).

## Notes / deviations

None. Every line of the v2 checklist applied verbatim. The `.layer-highlight` base rule had no `animation` declaration in v1 in the first place (the checklist's "remove" was defensive) — replaced the rule entirely with the v2 version.

## Acceptance self-check vs. brief

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Scroll=0: nav at top, hero below, no jump; base graph faint (groups 1, 3-6 only — no Group 2); main routes 1, 3-6 at full strength; Group 2 invisible; stub full-width with 48px gutters; highlight static | All wired |
| 2 | First scroll: no 60px jump; `.computing` engages → highlight pulse starts; stub retracts + gutter closes; Group 2 starts drawing | All wired |
| 3 | Scroll≈0.5: stub scaleX 0.5, gutter ~24px, Group 2 ~50% drawn, highlight pulsing | Math correct (linear) |
| 4 | Scroll=1: stub invisible; Group 2 drawn + subtle boost; `.computing` off → pulse stops; hero unpins | All wired |
| 5 | Hover: moderate boost (7.2 stroke, 10px glow) on any group | All wired |
| 6 | Highlight: static at idle states (0 and 1), pulses during 0 < progress < 1 | All wired |
| 7 | Mobile <1000px: no pin, no animation, no pulse | Early-return guard intact; SVG stays static |

## Anything for review

- **Nav-height value.** I assumed the hardcoded `60px` in `.nav-inner` was the full nav height. If you've added padding/borders elsewhere that bumps the actual rendered nav height, `--nav-h: 60px` will under-shoot and hero will tuck under the nav by a few pixels. Worth eyeballing on dev.
- **Pulse period 1.4s** is what you specified. If on the actual scroll-cadence it feels too busy or too sleepy, the knob is `highlight-pulse` duration.
- **Boost class persists at progress=1.** Per brief — "subtle stroke bump, settles" → Group 2 ends slightly brighter than siblings as punctuation. If you change your mind, two flips: revert threshold to use `progress >= 0.92 && progress < 1`, or just drop the class at progress >= 0.99.

Open `npm run dev`, walk it through, and either close the loop or queue v3.
