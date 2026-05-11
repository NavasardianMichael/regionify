# SEO Indexing & Sitemap Strategy — Regionify

This document describes how Google (and other crawlers) discover, verify, and index every public page across Regionify's three content layers: the main web app, the marketing site, and public embed pages.

---

## Architecture overview

Regionify is a monorepo with three distinct content surfaces, each with its own rendering strategy:

| Layer           | Tech        | Rendering                                | Base path       |
| --------------- | ----------- | ---------------------------------------- | --------------- |
| **Main app**    | React SPA   | Server-rendered HTML shells (Express)    | `/`             |
| **Marketing**   | Astro (SSG) | Static HTML built at deploy time         | `/marketing/`   |
| **Embed pages** | React SPA   | Server-rendered per-token HTML (Express) | `/embed/:token` |

All three are served from the same domain (`regionify.pro`) by the Express server, which proxies or statically serves each layer depending on the request path (see `server/src/web/setupWebClient.ts`).

---

## Google Search Console verification

### How it works

Google verifies site ownership by looking for a specific `<meta>` tag in the `<head>` of any page on the domain:

```html
<meta name="google-site-verification" content="<verification-token>" />
```

Because Regionify serves HTML from two different rendering pipelines (Express SSR and Astro SSG), the token must be injected into both.

### Main app and embed pages (Express SSR)

The server reads `GOOGLE_SITE_VERIFICATION` from the environment and passes it to `renderHtmlDocument` (`server/src/web/renderHtmlDocument.ts`). When set, the tag is rendered in the `<head>` of **every** Express-generated HTML document — the home page, all SPA route shells, and all `/embed/:token` pages.

```
GOOGLE_SITE_VERIFICATION=<your-token>   # server environment variable
```

The tag is omitted entirely when the variable is unset (safe for local dev where you don't need verification).

### Marketing site (Astro SSG)

The marketing build reads `PUBLIC_GOOGLE_SITE_VERIFICATION` at build time. `MarketingLayout.astro` (`marketing/src/layouts/MarketingLayout.astro`) conditionally renders the tag on every marketing page if the variable is present.

```
PUBLIC_GOOGLE_SITE_VERIFICATION=<your-token>   # marketing build environment variable
```

Because this is a static build, the token is baked into the HTML at deploy time. If the variable is absent during the build, no tag is rendered — again safe for local dev.

### Where to set these in production

Both variables must hold the **same token** (it's one Google property verifying one domain):

- Set `GOOGLE_SITE_VERIFICATION` in the server environment (Docker / CI env_file / platform secrets).
- Set `PUBLIC_GOOGLE_SITE_VERIFICATION` in the environment used when running `pnpm --filter @regionify/marketing build`.

After deploying, visit **Google Search Console → Settings → Ownership verification → HTML tag** and confirm the page is verified.

---

## Sitemap structure

Regionify uses a **sitemap index** pattern: a single entry-point file (`/sitemap.xml`) that Google follows to find the individual sitemaps for each content layer.

```
/sitemap.xml                      ← sitemap index (references both below)
  /app-sitemap.xml                ← static public routes + all enabled embeds
  /marketing/sitemap-index.xml    ← Astro-generated; all 195+ country pages
```

`robots.txt` points crawlers to the index:

```
Sitemap: https://regionify.pro/sitemap.xml
```

### Why a sitemap index?

The marketing layer is built by Astro as a completely separate static artifact. There is no practical way to merge it with the dynamically-generated app sitemap at request time. A sitemap index is the standard way to tell Google "there are multiple sitemaps; follow them all."

---

## Layer 1 — Main app sitemap (`/app-sitemap.xml`)

**Source:** `server/src/web/sitemap.ts` → `buildAppSitemapXml()`  
**Served by:** `GET /app-sitemap.xml` in `setupWebClient.ts`  
**Regenerated:** on every request (live DB query, no caching)

### Static public routes

The following routes are always included, regardless of database state:

| Path       | Purpose             |
| ---------- | ------------------- |
| `/`        | Home / landing page |
| `/about`   | About page          |
| `/contact` | Contact page        |
| `/faq`     | FAQ page            |

Authenticated or private routes (`/projects`, `/billing`, `/profile`, `/login`, etc.) are intentionally excluded — they either require authentication or have no meaningful content for crawlers.

### Dynamic embed entries

After the static routes, the sitemap queries the database for all **enabled public embeds**:

```typescript
prisma.project.findMany({
  where: {
    embedEnabled: true,
    embedToken: { not: null },
  },
  select: { embedToken: true, updatedAt: true },
});
```

Each result produces one `<url>` entry with:

- `<loc>`: `https://regionify.pro/embed/<url-encoded-token>`
- `<lastmod>`: the `updatedAt` timestamp of the project record (ISO date, `YYYY-MM-DD`)

**This is the dynamically generated part.** As users create, update, or disable their public embeds, the sitemap reflects the current state on the next crawl. No manual sitemap maintenance is needed.

#### Why no badge restriction?

An earlier version restricted sitemap entries to `chronographer`-tier users only. Both `explorer` and `chronographer` users can enable public embeds (enforced in `projectEmbedService.updateEmbedSettings`), so the sitemap now includes all enabled embeds regardless of tier. The controlling signal is `embedEnabled: true` — if a user has enabled a public embed, it is indexable.

---

## Layer 2 — Marketing sitemap (`/marketing/sitemap-index.xml`)

**Source:** Astro's `@astrojs/sitemap` integration  
**Generated:** at build time (`pnpm --filter @regionify/marketing build`)  
**Served by:** Express static middleware for `MARKETING_STATIC_DIR` (the Astro `dist/` output)

The marketing site has 195+ country pages generated from `marketing/data/countries.json` via `getStaticPaths()` in `marketing/src/pages/[country].astro`. Astro's sitemap integration automatically scans all generated pages and produces:

```
/marketing/sitemap-index.xml      ← top-level index (may reference multiple chunks)
/marketing/sitemap-0.xml          ← actual URL entries
```

Each entry covers:

- `/marketing/` — the country browse / home page
- `/marketing/<country-slug>/` — one entry per country (e.g. `/marketing/armenia/`, `/marketing/brazil/`)

The `<loc>` values are built from the `site` config in `astro.config.mjs`, which reads `CLIENT_URL` from the environment. This must match the production domain for canonical URLs to be correct.

### Important: rebuild required for sitemap changes

Because the marketing sitemap is static, it does not automatically update when:

- New countries are added to `countries.json`
- Country slugs change
- Pages are added or removed

A fresh `pnpm --filter @regionify/marketing build` and redeploy is required for sitemap changes to take effect.

---

## Layer 3 — Embed pages (`/embed/:token`)

Embed pages are **not** their own separate sitemap — they are part of `/app-sitemap.xml` (see Layer 1 above). This section describes the full rendering and indexing pipeline for embed pages specifically.

### Server-side rendering for SEO

When Google (or any crawler) fetches `/embed/<token>`, the Express server:

1. Looks up the project by token in the database via `projectEmbedService.getEmbedMetaForHtml()`
2. If found and enabled: renders a full HTML document with per-embed `<title>`, `<meta name="description">`, keywords, canonical URL, Open Graph tags, and a JSON-LD `WebPage` schema
3. If not found or disabled: renders a 404 HTML document with `<meta name="robots" content="noindex, nofollow">` — the page is excluded from indexing

The rendered HTML includes the React bundle, so after the initial server-rendered shell loads, the client-side app takes over for interactivity.

### Embed lifecycle → sitemap impact

| User action               | DB state                                   | Sitemap result                                         |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| Enable embed              | `embedEnabled=true`, `embedToken` set      | Appears in `/app-sitemap.xml` on next crawl            |
| Update embed SEO metadata | `updatedAt` changes                        | `<lastmod>` updates; Google may re-crawl               |
| Disable embed             | `embedEnabled=false`, `embedToken` cleared | Removed from sitemap; page returns `noindex, nofollow` |

---

## `robots.txt`

Served by `GET /robots.txt` (built dynamically by `buildRobotsTxt()` in `server/src/web/sitemap.ts`):

```
User-agent: *
Allow: /

Sitemap: https://regionify.pro/sitemap.xml
```

All paths are allowed by default. The `noindex, nofollow` robots meta tag on disabled embed pages handles exclusion at the page level rather than via `robots.txt` disallow rules.

---

## Submitting to Google Search Console

1. Go to **Google Search Console → Sitemaps**
2. Submit: `https://regionify.pro/sitemap.xml`
3. Google will follow the sitemap index and discover both `/app-sitemap.xml` and `/marketing/sitemap-index.xml` automatically

You do **not** need to submit the individual sitemaps — submitting the index is sufficient.

---

## Environment variable reference

| Variable                          | Where set                        | Required  | Purpose                                                                        |
| --------------------------------- | -------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `GOOGLE_SITE_VERIFICATION`        | Server env                       | No        | Renders verification meta tag on all Express-served pages                      |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Marketing build env              | No        | Renders verification meta tag on all Astro-built marketing pages               |
| `CLIENT_URL`                      | Server env + marketing build env | Yes       | Base URL for sitemap `<loc>` values and canonical URLs                         |
| `MARKETING_STATIC_DIR`            | Server env                       | Prod only | Path to Astro `dist/` output; enables marketing static serving and its sitemap |

---

## Code reference

| File                                          | Role                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| `server/src/web/sitemap.ts`                   | `buildSitemapIndexXml`, `buildAppSitemapXml`, `buildRobotsTxt`                        |
| `server/src/web/setupWebClient.ts`            | Registers `GET /sitemap.xml`, `GET /app-sitemap.xml`, `GET /robots.txt` routes        |
| `server/src/web/renderHtmlDocument.ts`        | Renders `<meta name="google-site-verification">` when `googleSiteVerification` is set |
| `server/src/config/env.ts`                    | `GOOGLE_SITE_VERIFICATION` Zod schema field                                           |
| `marketing/src/layouts/MarketingLayout.astro` | Renders verification tag; provides `<head>` for all marketing pages                   |
| `marketing/astro.config.mjs`                  | Configures `@astrojs/sitemap` integration; sets `site` from `CLIENT_URL`              |
