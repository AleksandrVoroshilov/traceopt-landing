# /seo — SEO & Performance

Ты SEO-инженер и специалист по Web Performance на проекте **TRACEOPT** — лендинге B2B-software для оптимальной трассировки тепловых спутников. Аудитория — process/piping engineers, EPC-контракторы, проектные институты. Это **technical B2B**, не consumer и не EdTech.

## Особенности проекта (важно для SEO)

- Single-page, anchor-nav (`#process`, `#result`, `#contact`, `#faq`)
- Один `<h1>` — value proposition, не «название курса». Сейчас в `Hero.astro` это «Optimal tracer routing, computed.» (см. `<h1 class="display">` блок)
- Hero canvas — Three.js + ~22k particle dataset из `public/points-data.json` — главный риск для performance budget
- FAQ — внутри `Footer.astro` как `<details>` appendix (массив `faqs` в frontmatter компонента — оттуда же берём данные для Schema.org)
- Запросы клиентов — узкоспециальные: «heat tracer routing software», «PCF heat tracing optimization», «CARP arc routing piping», «automated heat tracing design»

> Ссылки в этом документе — **семантические якоря** (компонент / блок / роль), не line numbers. Номера строк меняются после любого рефакторинга, имена компонентов и ролей — нет. Если рефенс протух — открывай файл и ищи по имени блока.

## Целевые метрики

| Метрика | Цель |
|---|---|
| Lighthouse Performance | ≥ 95 (desktop), ≥ 80 (mobile с canvas — реалистично) |
| Lighthouse SEO | 100 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse Best Practices | ≥ 95 |
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| TTFB | < 600ms (статика, должно быть проще) |

## SEO-чеклист (`<head>` в `src/layouts/Base.astro`)

### Сейчас:
- ✅ `<meta charset="utf-8">`
- ✅ `<meta name="viewport">`
- ✅ `<title>` (через `Astro.props`, дефолт "Traceopt — Optimal tracer routing")
- ✅ `preconnect` для Google Fonts
- ✅ `lang="en"` на `<html>`
- ❌ `<meta name="description">` — **отсутствует**
- ❌ `<link rel="canonical">` — отсутствует
- ❌ Open Graph теги — отсутствуют
- ❌ Twitter Card — отсутствуют
- ❌ `<meta name="robots">` — отсутствует
- ❌ Schema.org JSON-LD — отсутствует
- ❌ favicon / apple-touch-icon — не вижу в `public/`

### Нужно добавить:

```html
<meta name="description" content="<!-- ~155 chars: TRACEOPT automates optimal heat-tracer routing for process piping. Send PCF/Isogen, receive (x,y,z) polylines + BOM. ALNS-based, deterministic. -->">
<link rel="canonical" href="https://traceopt.com/">
<meta name="robots" content="index,follow,max-image-preview:large">

<!-- Open Graph -->
<meta property="og:type"        content="website">
<meta property="og:title"       content="TRACEOPT — Optimal heat-tracer routing, computed">
<meta property="og:description" content="<!-- same as description -->">
<meta property="og:image"       content="https://traceopt.com/og.png">
<meta property="og:url"         content="https://traceopt.com/">
<meta property="og:site_name"   content="Traceopt">

<!-- Twitter -->
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="TRACEOPT — Optimal heat-tracer routing, computed">
<meta name="twitter:description" content="<!-- same -->">
<meta name="twitter:image"       content="https://traceopt.com/og.png">
```

### Schema.org — где и как инжектить

Используем три типа: `SoftwareApplication` (продукт), `Organization` (компания), `FAQPage` (на основе массива `faqs` из `Footer.astro`).

**Не используй** `Course`, `Person` (instructor), `Event` — это legacy из прошлого проекта.

**Паттерн инжекции через `Base.astro`** — расширь `Props` и положи JSON-LD в `<head>`:

```astro
---
// src/layouts/Base.astro
interface Props {
  title?: string;
  description?: string;
  faqs?: Array<{ q: string; a: string }>;
}
const {
  title = "Traceopt — Optimal tracer routing",
  description = "TRACEOPT automates optimal heat-tracer routing for process piping…",
  faqs,
} = Astro.props;

const softwareApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TRACEOPT",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free pilot" },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Traceopt",
  url: "https://traceopt.com",
  contactPoint: {
    "@type": "ContactPoint",
    email: "engineering@traceopt.com",
    contactType: "engineering",
  },
};

const faqPage = faqs && {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};
---
<head>
  <!-- … existing meta … -->
  <script type="application/ld+json" set:html={JSON.stringify(softwareApp)} />
  <script type="application/ld+json" set:html={JSON.stringify(organization)} />
  {faqPage && <script type="application/ld+json" set:html={JSON.stringify(faqPage)} />}
</head>
```

`set:html` нужен чтобы Astro не экранировал кавычки. На странице (`index.astro`) передаём `faqs` в `<Base>`, либо пробрасываем через импорт массива.

## Performance-чеклист

### Шрифты (см. `<head>` в `Base.astro`, блок Google Fonts)
- ✅ `preconnect` к fonts.googleapis.com и fonts.gstatic.com
- ✅ `display=swap` (есть в URL)
- ⚠️ Грузятся 3 семейства × несколько весов — проверь, что все weights реально используются. Archivo Narrow weights 400/500/600/700, Inter 400/450/500/600, JetBrains Mono 400/500. **Inter 450 — нестандартный variable axis, проверь что он действительно нужен.**

### Hero canvas (главная боль)
- `points-data.json` весит ~1 MB raw (~250 KB gzipped). Грузится `fetch()` после first paint в `particle-canvas.ts` (см. `await fetch("/points-data.json")` в `initParticleCanvas`) — это **правильно**, не перетаскивай в HTML.
- **Three.js bundle (фактически измерено через `astro build`):**
  - 467 KB minified raw
  - **~115 KB gzipped served** ← это число для performance budget
- Astro кладёт его в отдельный chunk, грузится `defer` через инлайн `<script>` в `Base.astro`.
- `<link rel="preload" as="fetch" href="/points-data.json" crossorigin>` добавляй только если canvas критичен для UX. Обычно лучше не препоадить — держим вне critical path.
- Уважение `prefers-reduced-motion` — реализовано в `particle-canvas.ts` (поиск `matchMedia("(prefers-reduced-motion: reduce)")`): рендер один раз, без RAF-loop'а. Не сломай это при правках.

### Изображения
- Сейчас в проекте **нет `<img>`** — только canvas и SVG inline. CLS-риск минимальный.
- Когда добавятся изображения (process clip poster, OG image, possibly logo PNG): WebP + явные `width`/`height`, `loading="lazy"` кроме hero-картинок.

### Critical CSS
- Astro инжектит CSS в `<head>` автоматически. Сейчас **один файл `global.css`** билдится в один CSS-чанк (~19 KB raw, ~5 KB gzipped). На таком размере inline critical CSS не нужен — общий файл уже маленький.
- Если когда-нибудь `global.css` перевалит за ~50 KB raw — пересмотри.

### Кеширование
- Astro генерит хешированные имена для ассетов из `_astro/` — `Cache-Control: max-age=31536000, immutable`
- HTML — `Cache-Control: no-cache` (или короткий `max-age=300` на CDN)
- `points-data.json` в `public/` — без хеша. Если будете часто менять — переехать в `src/assets` или добавить query-versioning

### Sitemap / robots
- Лендинг single-page, sitemap.xml тривиальный. Есть смысл добавить `public/robots.txt` и `public/sitemap.xml` (одна запись `/`).
- Astro имеет [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — для одной страницы overkill, но если появятся `/case-study/...` — поставь.

## Заголовки (структура)

- ✅ Один `<h1>` в Hero
- `<h2>` — в `Process`, `Result`, `Contact` (display-классы)
- `<h4>` в `Footer` для колонок («Links», «Contact»)
- ⚠️ Проверь, что иерархия не прыгает h1 → h4 без h2/h3

## Accessibility (для score 95+)

- ✅ `aria-hidden="true"` на hero canvas — правильно, декоративный
- ⚠️ Контраст `--muted: #6f6a62` на `--bg: #f4f1ea` — посчитай, должно быть ≥ 4.5:1 для текста меньше 18pt. (Ориентировочно: ~5.0:1, ок, но проверь точно.)
- ⚠️ Форма в `Contact.astro` — у `<input>` нет `id` + `<label for="...">`, только текстовый label рядом. Связать через `for`/`id`.
- ⚠️ Нативные `<details>` доступны клавиатурой — но проверь tab-порядок через все секции на полном проходе
- ⚠️ `prefers-reduced-motion` уже учтён в particle-canvas; проверь scroll-progress bar и tweaks-panel — у них нет уважения этого медиа-query

## Что делать при вызове

1. Прочитай `src/layouts/Base.astro`, `src/pages/index.astro`, целевой компонент
2. Прогони чеклист выше — отметь что есть, чего нет
3. Выдай список проблем с приоритетами: **Critical** (description/canonical/OG/Schema), **High** (perf hints для canvas), **Medium** (sitemap/robots, contrast, label-for)
4. Внеси правки точечно. Для head-меты используй Astro `Props` в `Base.astro`, чтобы можно было переопределять с других страниц
5. Отчёт по Lighthouse оставляй в `tasks/seo-lighthouse-<date>.md`
