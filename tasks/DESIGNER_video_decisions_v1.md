# DESIGNER → ALL · Hero video v0.3 — locked decisions

**Audience:** Houdini-художник, `/frontend`, `/seo`, `/lead`.
**Status:** Final for pre-production. Storyboard переходит в v0.3, style frames — в v0.2 на основании этих правок. Без явного re-open всех вопросов ниже — это закрытые решения.

---

## 1 · Pipeline status

| Step | Status | Owner |
|---|---|---|
| 1 — Storyboard | **v0.3 (this doc)** | `/designer` |
| 2 — Style frames | **v0.2 (this doc)** | `/designer` → Houdini-художник |
| 3 — Animatic (low-fi) | next | Houdini-художник |
| 4 — Final render (Karma XPU) | pending | Houdini-художник |
| 5 — Composite (Fusion) | pending | Houdini-художник |
| 6 — Integration (Process.astro) | pending | `/frontend` + `/seo` |

---

## 2 · Closed answers to storyboard v0.2 open questions

| # | Question | **Decision** | Why |
|---|---|---|---|
| 1 | 6 circuit hues vs 1 orange dashed | **6 hues, brand-anchor #d85a1b on C6.** Desktop full palette. Mobile <768px viewport — 2 dominant hues + ghost rest (handled in composite Fusion pass, not separate render). | Hue separation reads as natural grouping; 6 identical dashes read as noise. Brand anchor gives optical hierarchy. |
| 2 | Junction in Act 4 push-in | **Art-directed, single junction.** Y-tee preferred over inline elbow for frame composition. | Random per-loop = 6× render cost and storage; gain is artisanal not technical. |
| 3 | F-10 background content | **Hint of distribution manifold (гребёнка) in far blur.** Heavily out of focus, recognisable as «a header is back there». | Без него кадр читается «трубка в вакууме» — слабее технически. С ним — engineering context остаётся даже на close-up. |
| 4 | Loop seam | **Cross-dissolve over final 0.5s (12 frames @ 24fps).** No snap-cut. | Autoplay-muted hero on a site = viewer joins loop at random point. Snap-cut reads as glitch in ~60% of cases. Cross-dissolve is invisible. |
| 5 | Camera push: dolly vs zoom | **True dolly.** Camera physically translates, focal stays at 35mm until Act 4, then steps to 85mm only on the final close-up frame (single hard cut at start of F-10). | Zoom 35→85 across a continuous shot deforms piping geometry — reads as «editorial filter» on a technical product. |
| 6 | Frame rate | **24 fps.** | Cinematic, smaller web payload, turntable speed is slow enough that 30 fps gives no visible smoothness gain. |
| 7 | Aspect ratio | **16:9 master (1920×1080).** Square 1:1 crop of Frame B is derived in composite for OG meta image. No portrait master. | Hero card on site is landscape across all breakpoints. |
| 8 | Numbers ticker | **Deferred until real benchmark pair exists.** Out of scope for v1. | Honest call — same logic as removing −9.7%. |

---

## 3 · Critical edits to storyboard v0.2 → v0.3

### 3.1 · Act 1 opening — 0.4s still hold
**Old:** «Camera is already rotating slowly clockwise (turntable started before frame 0). Viewer enters mid-rotation.»
**New:** First **0.4s = still frame**. Plant is static. Camera rotation starts at 0.4s with an ease-in (cubic), reaches steady 1.7°/sec by 1.0s. From 1.0s — uniform continuous arc until end of loop.

**Why:** Autoplay-from-zero is the actual context. The viewer needs ~0.4s to register «I'm looking at a plant» before motion begins. Mid-rotation start is disorienting at the literal first frame of a hero loop.

### 3.2 · Act 1 duration — no change, but redistribute within
- 0.0 – 0.4s: still frame (F-01 frozen)
- 0.4 – 1.25s: F-01 with rotation ease-in
- 1.25 – 2.5s: F-02, PCF stamp fade-in at 1.5s

### 3.3 · F-08 circuit legend — make labels mock-explicit
**Old labels in style frames v0.1:**
```
C1 · 198 m
C2 · 142 m
C3 · 218 m
C4 · 165 m
C5 · 240 m
C6 · 312 m
```
**New labels for v0.2:**
```
C1 · ___ m
C2 · ___ m
C3 · ___ m
C4 · ___ m
C5 · ___ m
C6 · ___ m

sample project · pilot data pending
```

**Why:** Если −9.7% удалили из-за того, что это fictional metric без baseline, то и эти шесть длин нельзя оставить. Mock-data в видеоролике, где зритель не видит этой плашки на сайте, разрушает trust ровно в той аудитории, под которую сайт сделан. Когда первый pilot project запустится — заменим на real numbers, оставив структуру.

Subhead under «SOLVED» остаётся:
```
6 CIRCUITS · CONSTRAINTS ✓
```
Это правда (модель действительно выдаёт 6 contours на этом тестовом проекте) и не зависит от ещё-не-собранного benchmark.

### 3.4 · F-10 tracer label
**Old:** `DN20 · TRACER · C3` / `hot-water · 142 m · drawing…`
**New:** `DN20 · TRACER · C3` / `hot-water · drawing…`

Длину убираем по той же причине.

### 3.5 · Background hint in F-10
Add в far defocus: silhouette of a distribution manifold (8–12 tracer take-offs from a horizontal header). Render as pure blur, max 6% contrast against ink. Reads as «context exists», не как distinct object.

### 3.6 · Geometry reference brief for F-10
Houdini-художник должен свериться с **реальным reference DN20 hot-water tracer на DN200 process pipe**, не с general piping ref. Critical:
- Clamps step (typical 0.5–1.0 m for hot-water tracer)
- Supply termination type (compression fitting, не welded)
- Tracer hugs the «6 o'clock» bottom of DN200, not the top
- Flanged tee in foreground = standard ANSI B16.5 raised face, 5 bolts visible

Если reference photo нет на руках — взять из Thermon / nVent installation guides (публичные PDF).

---

## 4 · Critical edits to style frames v0.1 → v0.2

### 4.1 · Frame B — render in TWO variants

| Variant | BG | Use |
|---|---|---|
| **B-dark** | warm ink `#14120f` | Live video frame · LinkedIn / press kit / dark-context decks |
| **B-light** | paper `#f4f1ea` | Static poster crop on the site if Frame B ends up as fallback · light-context decks |

В B-light:
- Circuits stay in same warm palette but emissive intensity drops to ×2.0 (vs ×6.0 on dark), with darker ink stroke for contrast against light bg
- Grid overlay flips to 4% dark line on light (mirror of dark variant)
- Subhead/legend type stays the same — site already uses Archivo Narrow + JetBrains Mono on light bg

**Single Houdini render** — palette and emissive pass run twice with material switch. Не два независимых сетапа.

### 4.2 · Frame A — designate as poster frame
Frame A @ 0.5s is **the** poster frame for `<video poster=…>`. This requires:
- Frame A must be production-quality on its own (not «just first frame») — already planned, just confirm
- Frame A composition must leave a safe area for **CTA-overlay** if `/frontend` decides to overlay section heading on top of the video on the site. Safe area: top-left quadrant (cols 1–6, rows 1–4 on a 12×6 grid).
- Hero plant should sit in cols 5–12, lower 2/3 of frame, leaving the top-left clear.

### 4.3 · Lighting — confirm
No changes to lighting brief. Rim-only setup is correct. Frame C practical (tracer self-emission) — confirmed.

### 4.4 · Add: poster export specs
From the master Frame A render export:
- `process-poster.avif` — 1920×1080, AVIF q60
- `process-poster.jpg` — 1920×1080, JPEG q85 fallback
- `process-poster-mobile.avif` — 960×540, AVIF q55
- `og-image.jpg` — 1200×630 (square-ish crop from Frame B-light), JPEG q88

---

## 5 · Items added to brief (were missing)

### 5.1 · First-second rule
The first second of the loop **must not carry unique information**. Why: hero video is autoplay-muted, often scrolled past in the first few hundred ms. The PCF stamp (F-02) appears at **1.5s** (already in storyboard), which is correct. Confirm Houdini-художник не вводит ничего критичного раньше 1.0s. The 0.0–1.0s window is pure «atmosphere».

### 5.2 · Intersection-based start
`/frontend` integration step (Step 6): video **starts on IntersectionObserver entering viewport with threshold 0.4**, not on DOM-ready. Когда секция Process выходит из viewport — pause (`video.pause()`), не unload. Preserves animation continuity if user scrolls back.

`loop`, `muted`, `playsinline`, `preload="none"` (poster covers до first intersection), no `autoplay` at video tag level — JS-driven only.

### 5.3 · Output codec matrix
| Codec | Container | Target bitrate | Browser fallback order |
|---|---|---|---|
| AV1 | `.webm` | ~1.4 Mbps | 1st choice |
| VP9 | `.webm` | ~2.0 Mbps | 2nd |
| H.264 high | `.mp4` | ~2.6 Mbps | universal fallback |

All 8-bit, sRGB, 24fps, no audio track. Loop is silent — strip audio entirely (saves ~30 KB).

### 5.4 · Mobile fallback
On viewports <768px: **do not load video at all**. Show `process-poster-mobile.avif` as `<img>`. Reasons:
- LCP hit on cellular
- Mobile users on data plan don't need a 1.5 MB autoplay loop
- The narrative payoff of the loop (DECONSTRUCT → SOLVE) requires visual fidelity that's lost at mobile sizes anyway

`/frontend` implements via `<picture>` + media query OR JS-driven `if (window.innerWidth < 768) return;` before attaching the video element. Either is fine.

### 5.5 · Performance budget
- Combined video assets: **≤ 2.5 MB total** for the largest codec variant
- Poster AVIF: **≤ 80 KB**
- Mobile poster AVIF: **≤ 40 KB**
- LCP impact: poster must be in initial HTML or preloaded. Video element creates no LCP penalty if `preload="none"` until intersection.

This is a `/seo` deliverable for Step 6 verification — Core Web Vitals must not regress.

---

## 6 · What stays unchanged from v0.2

- 4 acts × 14s seamless loop
- Master palette (warm ink BG · steel grays · warm orange · circuit warm spectrum · brand C6 #d85a1b)
- Rim-only lighting (5500K upper-right + 7800K dome fill 12%)
- Volumetric surface scatter (Acts 2–3), NOT centerline scatter
- ALNS exploration visualised as bridge flicker (Acts 3)
- No numeric comparison (−9.7%) anywhere
- EN-only, silent
- Continuous single-direction arc, ~24°/14s (~1.7°/sec) — except 0.4s still hold at very start (3.1 above)
- Camera Variant B (continuous, no pendulum, no full 360°)
- Three style frames: A (F-01 @ 0.5s) · B (F-08 @ 9.5s) · C (F-10 @ 13.0s)

---

## 7 · Hand-off

**To Houdini-художник (next action):**
1. Apply edits 3.1–3.6 to working storyboard reference
2. Render 3 style frames per v0.2 spec (4.1–4.4): Frame A (poster-grade), Frame B-dark + B-light, Frame C
3. Deliver as PNG 1920×1080, sRGB, lossless. EXR optional if you want to keep grade flexibility for review.
4. Animatic (Step 3) only starts after style frames are signed off.

**To `/frontend` (heads-up, action at Step 6):**
- Codec matrix, intersection-start, mobile fallback, poster handling per section 5
- Safe area for potential CTA overlay on Frame A (4.2) — coordinate if section heading goes on top of video
- LCP impact verified by `/seo`

**To `/seo`:**
- Performance budget per 5.5 — verify at Step 6
- OG image: 1200×630 crop from Frame B-light

**To `/lead`:**
- Review and sign-off on this doc OR push back on any specific decision
- After sign-off this becomes the v1.0 contract for the video deliverable

— `/designer`, 2026-05-15
