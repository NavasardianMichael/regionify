# SEO Indexing Architecture — Regionify

Describes how Google (and AI crawlers) discover and index every public page across Regionify's content layers.

---

## Content layers

Regionify has three distinct indexable surfaces, all served from the same domain (`regionify.pro`) by the Express server:

| Layer           | Tech      | Rendering                                | Base path       |
| --------------- | --------- | ---------------------------------------- | --------------- |
| **Main app**    | React SPA | Server-rendered HTML shells (Express)    | `/`             |
| **Marketing**   | Astro SSG | Static HTML built at deploy time         | `/marketing/`   |
| **Embed pages** | React SPA | Server-rendered per-token HTML (Express) | `/embed/:token` |

---

## Sitemap structure

A sitemap index at `/sitemap.xml` points to two child sitemaps:

```
/sitemap.xml                       ← index (served by Express)
  /app-sitemap.xml                 ← static public routes + all enabled embeds (live DB query)
  /marketing/sitemap-0.xml         ← Astro-generated; 190 country pages + hub + 4 guides + guide index
```

The index must point at `sitemap-0.xml` (the actual `<urlset>`), not `sitemap-index.xml` —
`@astrojs/sitemap` always wraps its output in its own index file, and a `<sitemapindex>`
referencing another `<sitemapindex>` is invalid ("Nested indexing" in Search Console).

`/robots.txt` (served by Express, not a static file) includes the `Sitemap:` directive pointing at the index.

**Source files:**

- `server/src/web/sitemap.ts` — `buildSitemapIndexXml`, `buildAppSitemapXml`, `buildRobotsTxt`
- `marketing/astro.config.mjs` — configures `@astrojs/sitemap`

**Important:** The marketing sitemap is baked at build time. Adding/removing countries or changing slugs requires a fresh `pnpm --filter @regionify/marketing build` and redeploy.

---

## nginx routing requirement

The SPA `location /` in nginx uses `try_files`, which serves the **static** built `client/index.html` — same `<title>`, same hardcoded canonical (always `/`), empty `<div id="root">` — for every path that isn't explicitly proxied to Node first. Historically only `/robots.txt`, `/sitemap.xml`, `/app-sitemap.xml`, and `/embed/:token` were proxied, which meant `/`, `/about`, `/faq`, `/terms`, `/privacy`, and `/refund` never reached the per-route SSR meta in `server/src/web/setupWebClient.ts` — every public page looked like a duplicate of the homepage to crawlers, and non-JS-executing crawlers (most AI answer-engine bots) saw no real page content anywhere.

**Why not just proxy everything to Node?** `apiRoutes` and `setupWebClient` share one Express process (`server/src/app.ts`), and the API is mounted at bare paths that collide with real SPA page paths — e.g. `GET /projects/:id` (an API route) also matches the literal SPA paths `/projects/new` and `/projects/edit`, and `GET /projects` returns the JSON project list rather than the dashboard page. Proxying `location /` wholesale to Node would make a direct visit or refresh of `/projects`, the project editor, `/auth/callback` (the real post-Google-login redirect target), or `/payments/checkout|return|cancel` return raw API JSON instead of the app shell. Only proxy paths confirmed to have zero overlap with `server/src/routes/*.ts`:

```nginx
location = /                                    { proxy_pass http://127.0.0.1:9002; ... }
location ~ ^/(about|faq|terms|privacy|refund)$  { proxy_pass http://127.0.0.1:9002; ... }
location = /robots.txt                          { proxy_pass http://127.0.0.1:9002; ... }
location = /sitemap.xml                         { proxy_pass http://127.0.0.1:9002; ... }
location = /app-sitemap.xml                     { proxy_pass http://127.0.0.1:9002; ... }
location ~ ^/embed/[^/]+$                       { proxy_pass http://127.0.0.1:9002; ... }
```

`/contact` is deliberately **not** in the proxied set even though it's a public page with its own `PAGE_META_MAP` entry: it collides with `POST /contact` in `server/src/routes/contact.ts`, and `setupWebClient.ts`'s `isApiPath()` guard (checked in the SSR catch-all) currently treats the whole `/contact` prefix as API-only — a proxied `GET /contact` would 404 today. It stays on the static-shell fallback until that guard is revisited to distinguish "has a POST handler" from "GET should render the SPA shell too."

Everything else (`/billing`, `/login`, `/sign-up`, `/projects*`, `/auth/*` besides `/auth/callback`'s exclusion, `/payments/*`, etc.) keeps the static-shell `location /` fallback unchanged — these are either already `noindex` (see below) or behind-auth, so they were never SEO targets.

The real configs live at `deployment/regionify.pro.conf` (SPA host) and `deployment/api.regionify.pro.conf` (API host).

---

## Main app — per-route SSR meta

The Express catch-all in `server/src/web/setupWebClient.ts` renders unique `<title>`, `<meta name="description">`, and `<link rel="canonical">` for each public route by looking up `server/src/web/pageMeta.ts`.

**Covered routes:** `/`, `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/refund`

Routes not in the map fall back to `HOME_PAGE_DEFAULT` from `server/src/web/homeCopy.ts`. Note: this map is Express-level and correct for all seven routes, but nginx currently only proxies `/`, `/about`, `/faq`, `/terms`, `/privacy`, `/refund` to Node (see "nginx routing requirement" above) — `/contact` has a real entry here that isn't reachable in production yet.

`/` and `/faq` also get real server-rendered visible body text (`server/src/web/homeCopy.ts` → `homeRootInnerHtml()`, `server/src/web/faqContent.ts` → `faqRootInnerHtml()`) plus JSON-LD from `server/src/web/coreJsonLd.ts` (SoftwareApplication/WebSite/Organization, offers sourced from `BADGE_DETAILS`) and, on `/faq`, an additional `FAQPage` schema — so crawlers that don't execute JS (most AI answer-engine bots) still see real content and structured data, not just an empty `<div id="root">`.

---

## noindex for private routes

The catch-all passes `robots: 'noindex, nofollow'` to `renderHtmlDocument` for any path matching `NOINDEX_PREFIXES` (defined inline in `setupWebClient.ts`):

```
/login  /sign-up  /forgot-password  /reset-password  /verify-email
/auth/callback  /account-deleted  /profile  /billing
/projects  /payments/checkout  /payments/return  /payments/cancel
```

These routes are also absent from `/app-sitemap.xml`.

---

## Embed pages

When a crawler fetches `/embed/:token`, Express:

1. Queries the DB via `projectEmbedService.getEmbedMetaForHtml(token)`
2. If enabled: renders a full HTML shell with per-project `<title>`, description, canonical, OG tags, and JSON-LD `WebPage` schema
3. If not found or disabled: renders a 404 shell with `noindex, nofollow`

Enabled public embeds appear dynamically in `/app-sitemap.xml` (live DB query on every request, no caching).

---

## Google Search Console verification

Both rendering pipelines inject the same `<meta name="google-site-verification">` tag from the same env var:

| Pipeline                    | How                                                                                 | Variable                   |
| --------------------------- | ----------------------------------------------------------------------------------- | -------------------------- |
| Express (main app + embeds) | `env.GOOGLE_SITE_VERIFICATION` → `renderHtmlDocument`                               | `GOOGLE_SITE_VERIFICATION` |
| Astro SSG (marketing)       | `import.meta.env.GOOGLE_SITE_VERIFICATION` in `MarketingLayout.astro` at build time | `GOOGLE_SITE_VERIFICATION` |

The `PUBLIC_` prefix is not needed for Astro — `.astro` frontmatter runs at build time (server-side), not in the browser.

Both variables hold the **same token** and both must be set before deploying for GSC verification to work.

---

## Marketing layer — JSON-LD

`marketing/src/layouts/MarketingLayout.astro` always emits a `SoftwareApplication` node, plus
whatever a page passes via its `jsonLd` prop:

- `SoftwareApplication` — every marketing page. `@id` is `${CLIENT_URL}#software` and the
  category pair matches `server/src/web/coreJsonLd.ts`, so the app and the marketing site
  describe **one** product entity rather than two anonymous, diverging ones. `Offer` entries come
  from `BADGE_DETAILS` in `@regionify/shared`.
- `Country` — country pages only. `name`, `alternateName` (local name), `numberOfPeople`,
  `area (QuantitativeValue, unitCode KMQ)`, `containsPlace` (division names).
- `BreadcrumbList` + `HowTo` + `FAQPage` — the three how-to guides.
- `BreadcrumbList` + `TechArticle` + `FAQPage` — the `regional-map-vs-choropleth-map` explainer.
- `BreadcrumbList` + `CollectionPage`/`ItemList` — the guide index.

Builders live in `marketing/src/helpers/jsonLd.ts`. All nodes go through `jsonLdScriptText()`,
which escapes `<` as `<` — mirroring `escapeJsonForScript` in
`server/src/web/renderHtmlDocument.ts`. Guide steps embed literal `<iframe …>` markup, so this
matters.

Note Google retired `HowTo` rich results (Sept 2023) and limited `FAQPage` rich results to
authoritative gov/health sites (Aug 2023). Both are emitted for answer-engine ingestion, not for
a SERP rich result.

`HowTo.step[]` and `FAQPage.mainEntity[]` are generated from the same arrays that render the
visible DOM (`marketing/src/data/guides/*.ts`) — structured data that does not mirror visible
content gets ignored.

Population, area and the `continent`/`subregion` grouping used for country-to-country
cross-links all live in `marketing/data/countries.json`.

---

## Marketing layer — guides

Four guides plus an index, at `/marketing/how-to/`:

```
/marketing/how-to/                                   ← index
/marketing/how-to/embed-regional-map-iframe/
/marketing/how-to/regional-map-from-google-sheets/
/marketing/how-to/animated-regional-map-gif-mp4/
/marketing/how-to/regional-map-vs-choropleth-map/
```

They exist to cover query intent the 190 country pages cannot: how-to and definitional searches,
and the "regional map" vocabulary that the country pages (which say "choropleth") do not carry.

`@astrojs/sitemap` has no filter, so new pages enter `sitemap-0.xml` automatically and need no
server change. nginx's `location /marketing` uses `alias` + `try_files $uri $uri/ =404`, which
already serves arbitrary nested paths.

Guide slugs are kebab-case; the 190 country slugs are camelCase. There is no collision, and a
static `src/pages/how-to/*` route outranks the root `[country].astro` dynamic route regardless.

Tier claims in guide copy resolve through `marketing/src/helpers/tiers.ts`
(`lowestBadgeWhere` / `badgeLabel`) over `BADGE_DETAILS` — never hardcoded, so pricing and gating
changes propagate on the next build. The iframe snippet shown on guides and country pages comes
from `buildIframeSnippet()` in `@regionify/shared`, the same function the app uses.

---

## Environment variable reference

| Variable                   | Where needed                     | Purpose                                                 |
| -------------------------- | -------------------------------- | ------------------------------------------------------- |
| `GOOGLE_SITE_VERIFICATION` | Server env + marketing build env | GSC ownership verification meta tag                     |
| `CLIENT_URL`               | Server env + marketing build env | Base URL for canonical URLs and sitemaps                |
| `MARKETING_STATIC_DIR`     | Server env (prod only)           | Path to Astro `dist/`; enables marketing static serving |
| `VITE_GA_MEASUREMENT_ID`   | Client build env (optional)      | Google Analytics 4 tracking                             |

---

## Code reference

| File                                          | Role                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `server/src/web/sitemap.ts`                   | Sitemap and robots.txt builders                                                      |
| `server/src/web/setupWebClient.ts`            | Route registration, noindex logic, catch-all SSR                                     |
| `server/src/web/pageMeta.ts`                  | Per-route title / description / keywords                                             |
| `server/src/web/homeCopy.ts`                  | Home page SEO copy and fallback defaults                                             |
| `server/src/web/faqContent.ts`                | FAQ Q&A body content + `FAQPage` JSON-LD                                             |
| `server/src/web/coreJsonLd.ts`                | `SoftwareApplication`/`WebSite`/`Organization` JSON-LD, sourced from `BADGE_DETAILS` |
| `server/src/web/renderHtmlDocument.ts`        | HTML shell renderer; injects all meta tags and JSON-LD                               |
| `server/src/config/env.ts`                    | `GOOGLE_SITE_VERIFICATION` Zod field                                                 |
| `marketing/src/layouts/MarketingLayout.astro` | Head tags, OG, JSON-LD for all marketing pages                                       |
| `marketing/src/layouts/MarketingPage.astro`   | Nav/main/Footer shell; `scroll="document"` for long-form guides                      |
| `marketing/src/pages/[country].astro`         | Country page template                                                                |
| `marketing/src/pages/index.astro`             | Marketing hub page                                                                   |
| `marketing/src/pages/how-to/*.astro`          | Guide index and the four guide pages                                                 |
| `marketing/src/data/guides/*.ts`              | Guide copy: steps and FAQs, the single source for DOM and JSON-LD                    |
| `marketing/src/helpers/jsonLd.ts`             | JSON-LD builders and `<`-escaping                                                    |
| `marketing/src/helpers/guides.ts`             | Guide URL and canonical-path helpers (`BASE`-aware)                                  |
| `marketing/src/helpers/tiers.ts`              | Tier labels derived from `BADGE_DETAILS`                                             |
| `shared/src/constants/embed.ts`               | `buildIframeSnippet()` — one snippet definition for app and marketing                |
| `client/src/constants/marketingUrls.ts`       | App → marketing links (plain `<a>`; deliberately not in `ROUTES`)                    |
| `marketing/data/countries.json`               | Country data including population and area                                           |
| `deployment/regionify.pro.conf`               | SPA host nginx config with SEO proxy blocks                                          |
| `deployment/api.regionify.pro.conf`           | API host nginx config                                                                |
| `.github/workflows/deploy.yml`                | CI/CD; passes `GOOGLE_SITE_VERIFICATION` to marketing build                          |
