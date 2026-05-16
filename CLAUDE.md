# TRACEOPT — Product Landing Page

**TRACEOPT** is a software system for automated optimal routing of heat tracers along process piping networks. Target audience: engineering design institutes and EPC companies.

## Product

### What it does
TRACEOPT automatically finds the optimal tracer routing along process piping systems. Given a 3D piping model (PCF/Isogen), the system computes near-optimal tracer paths that minimize total tracer length while satisfying full coverage and capacity constraints.

### Problem it solves
Heat tracing requires continuous tracer pipes routed alongside process piping. Engineers currently design these routes manually — a time-consuming process prone to suboptimal results. With hundreds of pipe segments and multiple possible bridge connections between pipelines, the number of routing combinations grows exponentially. This is a classic NP-hard arc routing problem (CARP variant).

Existing tools (Thermon CompuTrace, nVent TracerLynx) handle thermal calculations and material selection — but none automate the routing itself. TRACEOPT closes this gap.

### How it works
1. Parses piping geometry from PCF files (standard format from SmartPlant, AutoCAD Plant 3D, CADWorx)
2. Generates candidate bridge connections between pipe segments
3. Constructs a weighted graph of the piping network
4. Solves routing via two-stage optimization:
   - **Reactive Path-Scanning** — constructive heuristic producing an initial feasible solution
   - **ALNS (Adaptive Large Neighborhood Search)** — iteratively destroys and repairs solution segments to improve total length

### Results (real-world benchmark)
- 270 required pipe edges, 212 bridge candidates
- ALNS achieves **9.7% reduction** in total tracer length vs. initial heuristic
- All coverage constraints satisfied with **6 tracer circuits**

### Value proposition
1. **Engineering time** — hours/days of manual routing replaced by automated computation
2. **Material savings** — minimal tracer length means less pipe, fittings, and insulation

### Industry context (source: Kokhov et al., 2015)
- Heat tracing design accounts for **10–15% of total piping project design effort**
- **40–50% of process pipes** in oil & gas / petrochemical plants require heat tracing
- **~80% of heat tracing labor** is spent on tracer route elaboration in the 3D model
- Existing tools (CompuTrace, TracerLynx, TraceCalc Pro) reduce labor by **1.2–1.5×** — but none automate routing
- Use these numbers to justify "why this problem matters" in copy — they are published and citable

## Terminology

| English (site) | Notes |
|---|---|
| Tracer / heat tracer | The companion pipe carrying heating fluid |
| Heat tracing | The overall system of pipe heating |
| Hot-water tracer | Tracer using hot water as heating medium |
| Piping heat tracing | Heating of process piping |
| Process piping system | The main piping network being traced |
| Optimal tracer routing | The core output of TRACEOPT |
| PCF (Piping Component File) | Input format from 3D plant design software |
| CARP | Capacitated Arc Routing Problem — problem class |
| ALNS | Adaptive Large Neighborhood Search — optimization algorithm |
| Supply connection (запитка) | Point where tracer connects to the heating supply header |
| Return connection (распитка) | Point where tracer connects to the return header |
| Bridge / crossover (перекидка) | Virtual connection between adjacent pipeline segments |
| Distribution manifold (гребенка) | Header that distributes heating fluid to multiple tracers |

## Site goals

- **Language:** English
- **Primary CTA:** Contact by email
- **Stage:** Market launch (product not yet publicly available)
- **Tone:** Technical credibility + clear engineering ROI. Audience are process/project engineers — they value precision, benchmarks, and concrete numbers over marketing language.

## Layout reference

Structure reference (layout only, no content copying):
https://www.rebelway.net/sci-fi-visualizations-houdini

## Stack

- **Framework:** Astro 6 (static output, islands для JS)
- **3D / canvas:** Three.js 0.170 — Hero particle canvas (~22k points)
- **Language:** TypeScript `strict: true` (через `astro/tsconfigs/strict`)
- **CSS:** нативный, **один файл** `src/styles/global.css` (~1240 строк), при необходимости scoped `<style>` в `.astro`
- **Fonts:** Archivo Narrow (display, 400–700) + Inter (sans, 400/450/500/600) + JetBrains Mono (mono, 400/500), Google Fonts с `display=swap`
- **Visual assets:** Hero particle dataset и планируемый process clip — рендерятся в Houdini (VFX pipeline)
- **Build output:** статический HTML (`astro build` → `dist/`)

## Design tokens

Светлая paper-style тема. Источник правды — `src/styles/global.css:1-25`.

| Token | Value | Purpose |
|---|---|---|
| `--bg` | `#f4f1ea` | main background (paper) |
| `--bg-2` | `#ede9df` | alternate section bg |
| `--paper` | `#faf7f0` | cards / surfaces |
| `--ink` | `#14120f` | primary text |
| `--ink-2` | `#2b2824` | secondary text |
| `--muted` | `#6f6a62` | muted text |
| `--muted-2` | `#a09a90` | very muted |
| `--rule` | `#d9d3c4` | borders |
| `--rule-strong` | `#bfb8a6` | strong borders |
| `--accent` | `#d85a1b` | orange accent |
| `--accent-ink` | `#8b3a10` | accent on text |
| `--ok` | `#3e7e4e` | success state |
| `--dark-bg` / `--dark-ink` / `--dark-muted` / `--dark-rule` | inverted | used spot-wise for dark blocks |
| `--gx` | `32px` | background grid step |

## Agents

- `/lead` — Tech Lead + UI/UX, architecture decisions, reviews other agents
- `/frontend` — Astro components, CSS, TypeScript, Three.js islands
- `/designer` — Content strategy, copy, section structure
- `/backend` — Fastify API for the contact form
- `/seo` — Core Web Vitals, meta tags, Schema.org
- `/qa` — Pre-release checklist (build, anchors, breakpoints, a11y, form path)

## CSS conventions

- Single global file: `src/styles/global.css` (no separate `tokens.css` / `reset.css`)
- Scoped `<style>` blocks inside `.astro` only when a rule belongs to one section
- Full readable class names (`.hero-left`, `.nav-inner` — not `.hl`, `.ni`)
- `clamp()` for typography; `px` and `rem` are both used (match the surrounding style)
- No `!important`
- Body background grid driven by `--gx`; hero grid syncs via `tweaks.ts:syncHeroGrid`

## Page sections (actual — see `src/pages/index.astro`)

1. `Nav.astro` — sticky header, brand mark, 4 anchor links, scroll-progress bar, Send brief CTA
2. `Hero.astro` — split layout: meta line, h1 with em + ping-dot, lede, 2 CTAs, 3 stat cells; right column hosts `#hero-canvas` (Three.js)
3. `Marquee.astro` — horizontal colophon strip ("Data in / coordinates out / …")
4. `Process.astro` — § 01 — four-step horizontal "how it works" line + clip-slot for upcoming Houdini-rendered process video
5. `Result.astro` — § 02 — large −9.7% number, side metrics, baseline comparison
6. `Contact.astro` — § 03 — copy column + brief form (name, role, company, email, message)
7. `Footer.astro` — FAQ as `<details>` appendix (7 entries), brand column, links, attribution
8. `TweaksPanel.astro` — dev-only: grid / hero / H1 / accent toggles (do not ship to prod)

Decisions on additional sections (Stats, Why, Bonus, Perks as standalone) are deferred — current scaffold is intentionally minimalist 7-section.

## Inter-agent coordination

- `tasks/` — coordination channel for agent handoffs. `/lead` writes briefs as `tasks/<agent>-<short-name>.md`; agents pick up tasks and leave responses there.

## Houdini MCP — read-only policy

The `fxhoudini` MCP server (`.mcp.json`) exposes 168+ tools against the user's running Houdini session. **Claude uses it for reading scene state ONLY** — inspect nodes, parameters, lights, render settings, geometry info, viewport snapshots. Houdini is the user's hands-on workspace; he learns by doing the edits himself.

**Forbidden — never call without explicit per-action approval:**
- Any `create_*`, `set_*`, `connect_*`, `disconnect_*`, `assign_*`, `delete_*`, `copy_*`, `rename_*`, `move_*`, `reorder_*` tool
- `build_sop_chain`, `setup_render`, `setup_*_sim`, `create_light_rig`, `create_material*`
- `execute_python`, `execute_hscript`, `set_wrangle_code`, `create_wrangle`, `create_vex_expression`
- `save_scene`, `new_scene`, `load_scene`, `import_file`, `export_file`, `write_cache`, `clear_cache`
- `start_render`, `render_node_network`, `cook_top_node`, `step_simulation`
- `install_hda`, `update_hda`, `uninstall_hda`, `reload_hda`
- `set_viewport_*`, `set_frame*`, `playbar_control`, `set_selection`

**Allowed without approval:**
- All `get_*`, `list_*`, `find_*`, `inspect_*`, `explain_*`, `sample_*`, `evaluate_expression`
- `capture_screenshot`, `capture_network_editor`, `render_viewport`, `render_quad_view` (read viewport pixels, no scene change)
- `log_status` — status-bar messages as progress feedback per MCP server's own instructions

If an edit is needed, Claude **describes the change in text** (which node, which parameter, target value) and the user applies it in Houdini himself. This is mentorship, not auto-pilot.

- `960px` — hide nav links, show hamburger
- `768px` — stack flex layouts vertically
- `600px` — stats grid 2-column
