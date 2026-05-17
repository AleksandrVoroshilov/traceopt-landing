# DESIGNER → ALL · Hero video v2 — CAD-aesthetic pivot + Frame A locked

**Документ:** обновляет `DESIGNER_video_decisions_v1.md`. Где v2 противоречит v1 — действует v2.
**Статус:** Phase 1 (Frame A) доведён до приемлемого состояния через итерации в Houdini (рендеры 01_render_0025 → 0030). Визуальное направление пересмотрено и зафиксировано ниже.
**Аудитория:** пользователь (Houdini), `/frontend`, `/seo`, `/lead`.

---

## 1 · Главное изменение — pivot визуального направления

v1 был написан в логике **cinematic engineering object**: warm ink фон, rim-only освещение 5500K/7800K, volumetric depth fog, bloom, vignette, film grain, physical DOF. Это голливудский продакт-шот промышленного завода.

**v2 направление — CAD-model aesthetic.** Видео показывает 3D-модель «исходных данных» как **чистый технический рендер**, не как атмосферный кинокадр.

**Почему:**
- TRACEOPT — software для работы с CAD-данными (PCF/Isogen). Аудитория — инженеры, которые каждый день смотрят на 3D-модели в SmartPlant / AutoCAD Plant 3D / NavisWorks. CAD-aesthetic — их родной язык, он сигнализирует «эти ребята понимают мой workflow».
- Сайт уже построен на technical-document эстетике (paper-фон `#f4f1ea`, Archivo Narrow + JetBrains Mono, blueprint-grid через `--gx`). Cinematic-видео диссонировало бы; CAD-видео на blueprint-grid — усиливает единый язык.
- B2B-tech аудитория ценит точность над атмосферой. Brutally clean render = доверие. Cinematic = «маркетинг».
- Solo-production: CAD-style рендер дешевле (прозрачный alpha, минимум пост-обработки, без volumetrics).

**Допустимая «чуть киношность»:** low hero angle камеры оставлен сознательно — это видеоролик, не CAD-захват экрана. Лёгкая героика завода уместна. Но это единственная cinematic-уступка; всё остальное — чистый технический рендер.

---

## 2 · Что устарело из v1 (явная отмена)

| v1 пункт | Статус в v2 |
|---|---|
| §6 Rim-only lighting 5500K + 7800K dome fill 12% | **Отменено.** Нейтральное white-освещение, CAD-balanced (см. 3.3) |
| §6 Master palette «warm ink BG» | **Отменено как фон.** Фон — blueprint-grid (см. 3.5). Warm-ink swatches остаются только если понадобятся для тёмных контекстов Frame B |
| §4.3 «Rim-only setup is correct» | **Отменено** |
| §4.1 Frame B two variants (B-dark warm ink / B-light paper) | **Пересмотр.** Warm ink убран; Frame B рендерится на прозрачном alpha, фон-grid в Fusion. Один вариант, не два |
| §4.2 Frame A safe-area top-left | **Отменено.** Plant центрирован; overlay-текст в зонах breathing room (см. 4) |
| §2 closed answer #5 — focal 35mm | **Изменено на 55mm** (см. 3.2) |
| Style frame v0.1 материалы (steel metalness 0.85 bare, pipe metalness 0.65 + clearcoat) | **Отменено.** Painted steel + plastic pipes (см. 3.1) |
| Volumetric depth fog (storyboard + Frame A spec) | **Отменено.** Атмосферы в Karma нет; при необходимости — лёгкая дымка в Fusion через Depth AOV |
| Bloom / vignette / film grain в спеке Frame A | **Только Fusion**, и по минимуму. Не в Karma render |
| Physical DOF f/2.0 (Frame C) | **Пересмотр** — лёгкий DOF (f/5.6–f/8) либо его отсутствие; решим на Phase 4 |

---

## 3 · Frame A — достигнутая спецификация (Phase 1)

Эталонный рендер: `tasks/SF1_render/01_render_0030.png`.

### 3.1 · Материалы (MaterialX standard_surface, Karma)

**`orange_pipes`** — окрашенный пластик/эмаль, не металл:
- `base_color` = (0.783, 0.202, 0.039) Linear Rec.709 — это `#f0833a` (Style frames «process pipe base») × 90%, под-exposed для Fusion gain
- `metalness` = 0 · `specular` weight = 0.8 · `specular_color` = (1.0, 0.96, 0.92) · `specular_roughness` = 0.5 · `specular_anisotropy` = 0 · `diffuse_roughness` = 0.5

**`gray_metal`** — окрашенная сталь:
- `base_color` = (0.058, 0.052, 0.045) Linear ≈ `#3c3a35` (Style frames «steel mid»)
- `metalness` = 0.1 (painted, не bare steel) · `specular` weight = 0.6 · `specular_color` = (0.85, 0.70, 0.54) warm tint под Style frames highlight `#8a8073` · `specular_roughness` = 0.6 · `specular_anisotropy` = 0.2
- procedural bump: `mtlxfractal3d` → `mtlxheighttonormal` (микро-вариация поверхности)

**Принцип цвета:** в Houdini вводятся Linear Rec.709 значения. Рендер намеренно под-exposed (~87–90% target по brightness/saturation), hue — 100% точный. Финальная доводка яркости/насыщенности — в Fusion grade. Hue в grade не трогать.

### 3.2 · Камера (`camera_plant_ap`)

- Focal **55mm** (не 35mm из v1). Для CAD-направления нейтральная сжатая перспектива без wide-дисторсии — геометрия труб «честная».
- **Low hero angle** — камера ниже центра plant'а, смотрит почти горизонтально с лёгким наклоном вверх. Сознательная cinematic-уступка.
- Plant **центрирован** по горизонтали, заполняет **~68% ширины** кадра. Breathing room по периметру — зона под blueprint-grid и overlay.
- Aspect 16:9, 1920×1080.

### 3.3 · Освещение

Четыре `UsdLuxRectLight`, все **нейтрально-белые** (отмена warm/cool split из v1):
- `key_light` — доминирующий направленный, effective intensity ~19.8 (intensity 15 × exposure +0.4 EV)
- `rim_light` — контур с противоположной стороны, intensity 1.5
- `fill_light` — слабая заливка, intensity 0.2 (почти декоративная; ранее был оранжевый — сброшен на white, т.к. orange material теперь сам несёт цвет)
- `fill_light1` — accent, intensity 0.4

Высокий контраст (key доминирует ×13 над rim), тени глубокие но не «black-crushed». Setup рабочий, recalibration не требуется.

### 3.4 · Render settings (`karmarendersettings`)

- Engine: **Karma XPU**
- Resolution: 1920×1080
- `tonemap` = **off** — Linear EXR на выходе, ACES tone map делается в Fusion
- Color pipeline: ACES 1.3 OCIO config (`houdini-config-v2.1.0_aces-v1.3_ocio-v2.3`), working space ACEScg
- `pathtracedsamples`: 128 для итераций / 1024 для финального production render
- `enabledof` = off (Frame A — всё в фокусе)
- `enablemblur`: off для статичных итераций / on для финального loop-video
- Output: EXR, linear, frame-padding `$F4`

### 3.5 · Фон

Karma рендерит с **прозрачным alpha** (subject + alpha channel, фона нет). **Blueprint-grid 4%** подкладывается в Fusion (Phase 5). Grid — визуальный мост к body-grid сайта (`--gx`). Лёгкий film grain — тоже Fusion, по минимуму.

---

## 4 · Overlay-текст

Текст (заголовок §01, технические callouts из storyboard — PCF stamp, ALNS iter, SOLVED и т.д.) **вшивается в видео через Fusion** (Phase 5), не средствами HTML.

- Plant центрирован → callouts ложатся в поля breathing room по периметру.
- **Bottom-left зарезервирован** под PCF stamp (storyboard F-02: «monospace stamp fades in at bottom-left»).
- Типографика callouts — JetBrains Mono, мелкий кегль, тонкие leader-линии, без боксов (как в storyboard).
- Composition 0030 под это подходит — менять не нужно.

---

## 5 · Что остаётся до полного Frame A sign-off

1. **AOVs** для Fusion-прохода: включить Depth (`hitPz`), настроить Cryptomatte (Object/Material ID — для per-material grade без re-render).
2. **Финальный production-рендер** Frame A: `pathtracedsamples` 1024, в EXR.
3. Тестовый Fusion-проход: blueprint-grid фон + grain + проверка overlay-зон.

После этого Frame A — signed off, переход к Phase 2 (Act 2 DECONSTRUCT).

---

## 6 · Что из v1 остаётся в силе

- §1 Pipeline — 6 шагов (storyboard → style frames → animatic → final render → composite → integration)
- §2 closed answers — все, **кроме #5** (focal изменён 35→55mm): 6 circuit hues с brand-anchor C6, art-directed Y-tee junction, F-10 manifold hint, cross-dissolve loop seam, 24 fps, 16:9 master + 1:1 OG crop, numbers ticker отложен
- §3 storyboard edits (0.4s still hold, mock-explicit labels `C_ · ___ m`, F-10 tracer label без длины, geometry reference brief)
- §5 missing brief items — все: first-second rule, IntersectionObserver-start, codec matrix (AV1/VP9/H.264), mobile fallback (<768px = static poster), performance budget (≤2.5 MB)
- 4 акта × 14s seamless loop, ALNS flicker, no −9.7%, EN-only silent, continuous single-direction arc ~1.7°/sec
- Три style frames: A (F-01 @ 0.5s) · B (F-08 @ 9.5s) · C (F-10 @ 13.0s)

---

## 7 · Pipeline status

| Step | Status |
|---|---|
| 1 — Storyboard | v0.3 (v1 edits) |
| 2 — Style frames | **Frame A ~готов** (Phase 1). Frame B, C — pending |
| 3 — Animatic | pending |
| 4 — Final render (Karma XPU) | pending |
| 5 — Composite (Fusion) | pending — здесь blueprint-grid фон + overlay-текст |
| 6 — Integration (Process.astro) | pending — `/frontend` + `/seo` |

— `/designer`, 2026-05-16
