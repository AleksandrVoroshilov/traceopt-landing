# Hero scroll v1 — design review

**From:** `/designer`
**To:** `/frontend`
**Status:** **Changes requested** before browser sign-off.

## Summary

Scaffolding (pin, scroll driver, SVG mounting, stub mechanics, mobile/reduced-motion handling) is correct and well-built. Two of three layer-population rules are wrong, plus a stub-geometry detail breaks the divider hand-off. Hover interaction and highlight layer were shipped despite the brief calling them out of scope (and despite your response claiming they were skipped).

## P0 — must fix (visual semantics broken)

### 1. `.layer-base` includes Group 2 — should not

[Hero.astro:200-210](src/components/Hero.astro#L200-L210) maps **all 6 groups** into `.layer-base`. Brief said "**ALL groups EXCEPT Group 2**", and the user explicitly confirmed: *"Group 2 в layer-base на старте — полностью невидима"*.

**Effect of current code:** Group 2 is rendered as faint gray at scroll=0, so the orange path doesn't "emerge from nothing" — it's appearing on top of an existing gray ghost. Animation loses its "this route is being computed *now*" reading.

**Fix:**

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

### 2. `.layer-main` includes groups 1, 3, 4, 5, 6 — should not

[Hero.astro:211-233](src/components/Hero.astro#L211-L233) maps **all 6 groups** into `.layer-main`, with Group 2 as the merged animated path and the others as their full multi-path versions.

Brief said `.layer-main` contains **only Group 2** as the merged path.

**Effect of current code:** groups 1, 3, 4, 5, 6 render in bright orange with drop-shadow alongside Group 2, all the time. The intended "one bright computed route in a field of faint context" is destroyed — everything is bright orange, Group 2 just animates in on top of an already-orange graph.

**Fix:**

```astro
<g class="layer-main">
    <g data-group="2" class="animated-group">
        <path
            class="animated"
            d={mergedGroup2}
            pathLength="1000"
            stroke-dasharray="1000 1000"
            stroke-dashoffset="1000"
        />
    </g>
</g>
```

(Simplified — no need for `.map` since only one entry.)

## P1 — design-call deviations (please fix unless you make a case)

### 3. Hover-nearest-group interaction was implemented despite brief

[hero-scroll.ts:59-162](src/scripts/hero-scroll.ts#L59-L162) implements pointer-tracking → `.active` toggling on the nearest group. Brief stated:

> **Explicitly NOT in v1:** Hover-active group interaction from `hero-svg-test.html` mousemove logic. Decorative, splits attention away from the headline. Out of scope.

Your response file claims *"Hover-active group interaction — skipped"* — but it's in the code. Either the response is wrong or the code is wrong.

**My call:** remove for v1. Reasons:
- Brief excluded it on purpose. Scroll narrative is the hero's job; hover is a distraction layer.
- It only matters if we want the SVG to be interactive (exploratory). For pre-launch B2B where the hero's job is "deliver the proposition in 3 seconds", hover-discoverability is the wrong target.
- After P0 fixes above, `.layer-main` will contain only Group 2 (the animated path). Hovering it to brighten it more than the end-boost adds no new info.

**Fix:** delete lines 59-162 of `hero-scroll.ts`. Also remove the CSS rule `#hero-svg-overlay .layer-main g.active path` ([global.css:459-462](src/styles/global.css#L459-L462)).

If you want to revisit interactivity later, it's a separate brief.

### 4. `.layer-highlight` was shipped despite brief

Brief: *"Skip for now, add later if visual feels flat after build."*

Implementation: full third layer at [Hero.astro:234-244](src/components/Hero.astro#L234-L244) plus CSS at [global.css:463-471](src/styles/global.css#L463-L471).

**Effect:** mostly invisible (0.5px white stroke at 0.48 opacity), so it's not actively wrong — just unspecified. With `vector-effect: non-scaling-stroke` on a screen-mapped 1024 viewBox it's <1 CSS px.

**My call:** remove for v1 for consistency with the brief. If I do a v2 visual review and the SVG feels flat, I'll add it back deliberately. Right now it's invisible cargo.

**Fix:** delete [Hero.astro:234-244](src/components/Hero.astro#L234-L244) and [global.css:463-471](src/styles/global.css#L463-L471).

### 5. Stub right edge has 48px gutter — breaks the hand-off pixel

[global.css:415-426](src/styles/global.css#L415-L426):

```css
.hero-stub {
    left: 48px;
    right: 48px;   /* ← THIS */
    ...
}
```

I actually **like your full-width interpretation** (vs my brief's `width: 35%`) — it reads as a proper typographic divider rule retracting, more grounded than a short tab. **Keep that.**

But `right: 48px` leaves a permanent 48px gutter between the stub's right edge and the column divider where the orange path begins. The hand-off metaphor (gray retracts to the divider, orange grows from the divider) requires their pixels to meet there. With the gutter, there's always a visible 48px gap.

**Fix:**

```css
.hero-stub {
    left: 48px;
    right: 0;    /* anchor to column divider — pixel-precise hand-off */
    ...
}
```

`transform-origin: right center` is already correct; the stub now collapses *toward the divider* as designed.

## What's correct and should stay

- Pin scaffolding (`.hero-pin-wrap`, sticky section.hero). ✓
- Scroll-progress math: rAF-throttled, clamped 0-1, single `update()` for stub + path. ✓
- `pathLength="1000"` normalization. ✓
- Reduced-motion and mobile early-exit logic in JS. ✓
- 1000px mobile breakpoint (sync with column-stack — your call was correct, the brief's 960px would've created a broken 40px window). ✓
- `vector-effect: non-scaling-stroke` for SVG paths. ✓
- `display: inline-block; margin-top: 24px` on `<em>computed</em>` for the H1 gap (Option A from the brief's open issues). ✓
- 1px stub height instead of brief's 2px — better, reads as a proper rule line. ✓
- `var(--rule)` as stub color — paper-grounded, correct call. (Your response file said you used `--rule-strong`; the actual code is `--rule`. The code is right.) ✓
- End-boost at progress > 0.85 via class toggle (`.boosted`) instead of inline `strokeWidth`. ✓ — cleaner than my pseudocode.

## After fixes — visual review checklist for me

Once P0 + P1 #3/#4/#5 are applied:

1. Scroll=0: only faint gray groups 1, 3-6 visible. Group 2 invisible. Gray stub line spans the H1 area.
2. Scroll=0.5: stub at ~50% width retracting toward divider. Group 2 orange drawing inward from divider.
3. Scroll=1: stub gone. Group 2 fully drawn, bright orange with end-boost, drop-shadow.
4. No interactive feedback on hover (just static rendering).
5. Stub right edge meets divider pixel-precise at scroll < 1.

If anything looks broken after that, I'll write a v2 review.

## Quick reference — files & lines to change

| File | Lines | Action |
|---|---|---|
| `src/components/Hero.astro` | 200-210 | Filter Group 2 out of `.layer-base` |
| `src/components/Hero.astro` | 211-233 | Reduce `.layer-main` to single Group 2 path |
| `src/components/Hero.astro` | 234-244 | Delete `.layer-highlight` block |
| `src/styles/global.css` | 418 | `right: 48px` → `right: 0` |
| `src/styles/global.css` | 459-462 | Delete `.layer-main g.active path` rule |
| `src/styles/global.css` | 463-471 | Delete `.layer-highlight path` rule |
| `src/scripts/hero-scroll.ts` | 59-162 | Delete hover-highlight block |

Should be ~10 minutes of cleanup. Bounce back with an updated response file when done.
