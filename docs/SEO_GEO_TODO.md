# SEO / GEO — Remaining Work

Action items to finish Google indexation readiness for the client app and marketing (GEO) pages. The core infrastructure exists in code; the gaps below are deployment wiring, per-route meta, content depth, and operational steps.

**Related:** [SEO_INDEXING_AND_SITEMAPS.md](./SEO_INDEXING_AND_SITEMAPS.md) — architecture and env var reference.

---

## Priority 1 — Production nginx routing (critical)

The example nginx config (`deployment/nginx-spa-and-api.example.conf`) proxies only `/embed/*` to Node. Everything else is served as static files or SPA `index.html`. That breaks crawlers even though Express implements the SEO routes correctly.

| URL                                | Current behavior (nginx)                           | Expected                         |
| ---------------------------------- | -------------------------------------------------- | -------------------------------- |
| `/sitemap.xml`                     | SPA `index.html`                                   | XML sitemap index                |
| `/app-sitemap.xml`                 | SPA `index.html`                                   | XML urlset                       |
| `/robots.txt`                      | Static file from client build (no `Sitemap:` line) | Dynamic robots.txt from Node     |
| `/about`, `/contact`, `/faq`, etc. | Same `index.html` with home meta and canonical `/` | Per-route SSR shell from Express |

### Tasks

- [ ] Add nginx `location` blocks to proxy these paths to Node (`127.0.0.1:9002`):
  - `/sitemap.xml`
  - `/app-sitemap.xml`
  - `/robots.txt`
- [ ] Proxy HTML document routes to Express SSR (minimum: public pages in the app sitemap). Options:
  - Proxy all non-asset, non-API GET requests that would otherwise fall through to `index.html`
  - Or proxy a fixed list: `/`, `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/refund`
- [ ] Remove or stop relying on `client/public/robots.txt` in production (Node serves the canonical version with the sitemap URL).
- [ ] Reload nginx and verify:
  - `curl -I https://regionify.pro/sitemap.xml` → `Content-Type: application/xml`
  - `curl https://regionify.pro/robots.txt` → contains `Sitemap: https://regionify.pro/sitemap.xml`
  - `curl https://regionify.pro/about` → page-specific `<title>` (after Priority 2 is done)

---

## Priority 2 — Per-route SSR meta (client app)

Express catch-all in `server/src/web/setupWebClient.ts` reuses `HOME_PAGE_DEFAULT` for every SPA route. Canonical path is correct, but title and description are wrong for public pages listed in `/app-sitemap.xml`.

### Affected routes

| Path       | In sitemap |
| ---------- | ---------- |
| `/`        | Yes        |
| `/about`   | Yes        |
| `/contact` | Yes        |
| `/faq`     | Yes        |
| `/terms`   | Yes        |
| `/privacy` | Yes        |
| `/refund`  | Yes        |

### Tasks

- [ ] Add route-specific SEO copy (extend `server/src/web/homeCopy.ts` or a dedicated `pageMeta.ts` map keyed by path).
- [ ] Wire the catch-all handler and dedicated `/` handler to look up meta by `req.path`.
- [ ] Align home copy between `client/index.html`, `homeCopy.ts`, and `client/src/locales/en.ts` (titles/descriptions currently differ).
- [ ] Verify each public route returns unique `<title>`, `<meta name="description">`, and matching `<link rel="canonical">`.

---

## Priority 3 — `noindex` for auth and private routes

Auth and account routes are excluded from the sitemap but still render with `<meta name="robots" content="index, follow">` if crawled via links.

### Routes to mark `noindex, nofollow`

- [ ] `/login`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`, `/auth/callback`
- [ ] `/projects`, `/projects/*` (editor routes)
- [ ] `/profile`, `/billing`, `/account-deleted`
- [ ] `/payments/checkout`, `/payments/return`, `/payments/cancel`

### Tasks

- [ ] Add a denylist (or allowlist) in `setupWebClient.ts` and pass `robots: 'noindex, nofollow'` to `renderHtmlDocument` for private paths.
- [ ] Confirm sitemap still excludes these paths (already the case in `server/src/web/sitemap.ts`).

---

## Priority 4 — Google Search Console (operational)

Code supports verification tags; env vars and submission are manual.

### Tasks

- [ ] Set `GOOGLE_SITE_VERIFICATION` in server production env (`server/.env.production` / secrets).
- [ ] Set `PUBLIC_GOOGLE_SITE_VERIFICATION` (same token) in marketing build env.
- [ ] Add `PUBLIC_GOOGLE_SITE_VERIFICATION` to `.github/workflows/deploy.yml` `build-marketing` step (today only `CLIENT_URL` is passed).
- [ ] Deploy server + marketing so verification tags appear in HTML.
- [ ] Confirm ownership in **Google Search Console → Settings → Ownership verification**.
- [ ] Submit sitemap: `https://regionify.pro/sitemap.xml` (GSC discovers `/app-sitemap.xml` and `/marketing/sitemap-index.xml` via the index).

---

## Priority 5 — Marketing hub page SEO

`/marketing/` (`marketing/src/pages/index.astro`) uses a custom `<head>` instead of `MarketingLayout.astro`. Country pages are fine; the hub is missing several tags.

### Tasks

- [ ] Refactor `index.astro` to use `MarketingLayout` (or duplicate its head tags consistently).
- [ ] Add: Google verification meta, OG/Twitter tags, `robots index, follow`, JSON-LD (`SoftwareApplication` at minimum).
- [ ] Rebuild and redeploy marketing.

---

## Priority 6 — Missing / inconsistent assets

### Tasks

- [ ] Add `og-image.jpg` (1200×630) to `client/public/` — referenced in `client/index.html`, `renderHtmlDocument.ts`, and `MarketingLayout.astro` but not present in the repo.
- [ ] Confirm the file is deployed and reachable at `{CLIENT_URL}/og-image.jpg`.
- [ ] Reconcile country count: docs mention "195+"; `marketing/data/countries.json` currently has **190** entries — update docs or add missing countries.

---

## Priority 7 — GEO content depth (ranking, not plumbing)

Per `.claude/memory/project_marketing_seo_geo.md`, pages need genuine informational value to rank and get cited by AI systems. Current country pages have division name lists and showcase assets; deeper facts are still absent.

### Tasks

- [ ] Extend `marketing/data/countries.json` (or a companion dataset) with population, area, and/or hierarchy metadata where available.
- [ ] Surface facts on country pages (tables, structured sections — not just CTAs and images).
- [ ] Add data source citations / provenance (e.g. administrative boundary source, last updated).
- [ ] Consider richer Schema.org markup (e.g. `Dataset` or more detailed `Place` properties) once factual content exists.
- [ ] Optional: internal linking from hub → countries and between related regions.

---

## Priority 8 — i18n vs SEO (decision + optional work)

The app UI supports 7 languages, but all SEO surfaces are English-only with no `hreflang`.

### Decision

- [ ] Confirm intentional strategy: English-only indexation for marketing GEO pages and public app pages.

### If localized SEO is desired later

- [ ] Add `hreflang` alternates for supported locales on public pages.
- [ ] Set `<html lang>` and JSON-LD `inLanguage` per locale where content is translated.

---

## Priority 9 — Analytics (optional)

- [ ] Set `VITE_GA_MEASUREMENT_ID` in client production build secrets if GA4 reporting is wanted (`client/src/helpers/analytics.ts`).
- [ ] Embed routes are intentionally excluded from GA4 page views.

---

## Verification checklist (after all priorities)

Run through before considering indexation "done":

- [ ] `https://regionify.pro/robots.txt` — valid, includes sitemap URL
- [ ] `https://regionify.pro/sitemap.xml` — XML index referencing app + marketing sitemaps
- [ ] `https://regionify.pro/app-sitemap.xml` — static routes + enabled embed URLs
- [ ] `https://regionify.pro/marketing/sitemap-index.xml` — Astro-generated country URLs
- [ ] Sample country page — unique title, description, canonical, OG image, JSON-LD
- [ ] Sample embed page — per-project meta, JSON-LD, optional `geo.placename`
- [ ] Disabled embed — `noindex, nofollow`
- [ ] `/login` (or similar) — `noindex, nofollow`
- [ ] GSC — domain verified, sitemap submitted, no crawl errors on sitemap URLs
- [ ] Rich Results / URL Inspection — spot-check home, one country page, one embed

---

## Code reference (quick links)

| Area                             | File                                               |
| -------------------------------- | -------------------------------------------------- |
| Sitemap / robots                 | `server/src/web/sitemap.ts`                        |
| SSR route registration           | `server/src/web/setupWebClient.ts`                 |
| HTML document renderer           | `server/src/web/renderHtmlDocument.ts`             |
| Home SEO copy                    | `server/src/web/homeCopy.ts`                       |
| Marketing layout (country pages) | `marketing/src/layouts/MarketingLayout.astro`      |
| Marketing hub                    | `marketing/src/pages/index.astro`                  |
| Country page template            | `marketing/src/pages/[country].astro`              |
| Astro sitemap config             | `marketing/astro.config.mjs`                       |
| Example nginx                    | `deployment/nginx-spa-and-api.example.conf`        |
| CI marketing build               | `.github/workflows/deploy.yml` → `build-marketing` |
