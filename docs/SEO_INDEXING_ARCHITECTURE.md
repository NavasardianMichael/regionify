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
  /marketing/sitemap-0.xml         ← Astro-generated; all 190+ country pages
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

The SPA `location /` in nginx uses `try_files` which intercepts `/robots.txt`, `/sitemap.xml`, and `/app-sitemap.xml` before they reach Node. Three exact-match `location` blocks must appear **before** `location /` in the nginx config to proxy these to Node:

```nginx
location = /robots.txt    { proxy_pass http://127.0.0.1:9002; ... }
location = /sitemap.xml   { proxy_pass http://127.0.0.1:9002; ... }
location = /app-sitemap.xml { proxy_pass http://127.0.0.1:9002; ... }
```

The example config at `deployment/nginx-spa-and-api.example.conf` already includes these blocks.

---

## Main app — per-route SSR meta

The Express catch-all in `server/src/web/setupWebClient.ts` renders unique `<title>`, `<meta name="description">`, and `<link rel="canonical">` for each public route by looking up `server/src/web/pageMeta.ts`.

**Covered routes:** `/`, `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/refund`

Routes not in the map fall back to `HOME_PAGE_DEFAULT` from `server/src/web/homeCopy.ts`.

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

## Marketing layer — country page JSON-LD

`marketing/src/layouts/MarketingLayout.astro` emits two JSON-LD blocks on every country page:

- `SoftwareApplication` — describes Regionify, with `Offer` entries sourced from `BADGE_DETAILS` in `@regionify/shared`
- `Country` — `name`, `alternateName` (local name), `numberOfPeople`, `area (QuantitativeValue, unitCode KMQ)`, `containsPlace` (division names)

Population and area data live in `marketing/data/countries.json`.

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

| File                                          | Role                                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| `server/src/web/sitemap.ts`                   | Sitemap and robots.txt builders                             |
| `server/src/web/setupWebClient.ts`            | Route registration, noindex logic, catch-all SSR            |
| `server/src/web/pageMeta.ts`                  | Per-route title / description / keywords                    |
| `server/src/web/homeCopy.ts`                  | Home page SEO copy and fallback defaults                    |
| `server/src/web/renderHtmlDocument.ts`        | HTML shell renderer; injects all meta tags                  |
| `server/src/config/env.ts`                    | `GOOGLE_SITE_VERIFICATION` Zod field                        |
| `marketing/src/layouts/MarketingLayout.astro` | Head tags, OG, JSON-LD for all marketing pages              |
| `marketing/src/pages/[country].astro`         | Country page template                                       |
| `marketing/src/pages/index.astro`             | Marketing hub page                                          |
| `marketing/data/countries.json`               | Country data including population and area                  |
| `deployment/nginx-spa-and-api.example.conf`   | nginx config with SEO proxy blocks                          |
| `.github/workflows/deploy.yml`                | CI/CD; passes `GOOGLE_SITE_VERIFICATION` to marketing build |
