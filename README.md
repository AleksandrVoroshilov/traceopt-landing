# Traceopt — Astro

Marketing site for Traceopt: optimal heat-tracer routing for process piping networks.

Ported from the static HTML prototype (`Traceopt Redesign v4.html`) into an Astro project so it can be developed and deployed normally.

## Stack

- **Astro 4** — zero-JS by default, components in `.astro` files.
- **Vanilla CSS** in `src/styles/global.css` (single design system, CSS variables).
- **Vanilla TypeScript** islands in `src/scripts/` for the particle canvas, tweaks panel, and contact form.
- The 22 426-particle dataset lives in `public/points-data.json` and is fetched at runtime (kept out of the HTML payload).

## Getting started

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview
```

## Project structure

```
src/
├── pages/index.astro          ← single landing page
├── layouts/Base.astro         ← <html>, fonts, global CSS, scripts
├── components/
│   ├── Nav.astro
│   ├── Hero.astro             ← split layout, particle canvas mount
│   ├── Marquee.astro
│   ├── Process.astro          ← § 01
│   ├── Result.astro           ← § 02
│   ├── Contact.astro          ← § 03
│   ├── Footer.astro           ← incl. appendix FAQ
│   └── TweaksPanel.astro
├── scripts/
│   ├── particle-canvas.ts     ← hero animation (fetches points-data.json)
│   ├── tweaks.ts              ← grid / hero / H1 / accent toggles
│   └── form.ts                ← contact-form fake submit
└── styles/global.css
public/
└── points-data.json           ← ~1 MB, 22 426 particle home positions
```

## Notes on the port

- The original prototype embedded the points JSON inline as `<script type="application/json">`. In Astro it sits in `public/` and is `fetch()`ed by `particle-canvas.ts` — keeps the HTML small and lets the bundler skip it.
- Tweaks-panel `postMessage` plumbing for the design tool host was removed; the panel still works as a normal in-page control. Wire it back up if you want.
- All copy, colors, type scale, and the grid-overlay system are preserved 1:1.
