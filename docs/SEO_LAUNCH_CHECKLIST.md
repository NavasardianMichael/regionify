# SEO Launch Checklist — Manual Steps

Everything in code is done. These are the remaining operational and manual steps required before Regionify is fully indexed.

---

## 1. Apply nginx changes on the live server

The example config (`deployment/nginx-spa-and-api.example.conf`) already has the correct `location` blocks proxying `/robots.txt`, `/sitemap.xml`, and `/app-sitemap.xml` to Node. Apply the same blocks to the live server's nginx config and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Verify after reload:

```bash
curl -I https://regionify.pro/sitemap.xml        # Content-Type: application/xml
curl https://regionify.pro/robots.txt            # must contain: Sitemap: https://regionify.pro/sitemap.xml
```

---

## 2. Set `GOOGLE_SITE_VERIFICATION` secret

The same token is needed in two places:

**GitHub Actions secret** (used by the marketing build step in `deploy.yml`):

- Go to GitHub → repository → Settings → Secrets and variables → Actions
- Add secret: `GOOGLE_SITE_VERIFICATION` = `<token from GSC>`

**Server production environment** (`server/.env` or platform secrets):

```
GOOGLE_SITE_VERIFICATION=<token from GSC>
```

Both use the same token — it's one Google property, one domain.

---

## 3. Add `og-image.jpg`

The file `client/public/og-image.jpg` is referenced in the HTML renderer and `MarketingLayout.astro` but does not exist in the repo. Create a **1200 × 630 px** image (PNG or JPG) representing Regionify and commit it to `client/public/og-image.jpg`.

Verify it is reachable at: `https://regionify.pro/og-image.jpg`

---

## 4. Google Search Console — add property and verify

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://regionify.pro`
3. Choose **HTML tag** verification method — Google will show you the token
4. Set that token as `GOOGLE_SITE_VERIFICATION` (step 2 above) and deploy
5. Once the meta tag is live, click **Verify** in GSC

---

## 5. Submit sitemaps to GSC

After the domain is verified:

1. Go to **GSC → Sitemaps**
2. Submit: `https://regionify.pro/sitemap.xml`

Google will follow the sitemap index and discover both `/app-sitemap.xml` and `/marketing/sitemap-index.xml` automatically. No need to submit them individually.

---

## 6. Post-deploy verification

Run these after nginx, env vars, and og-image are in place:

```bash
# Sitemaps return XML, not HTML
curl -s -o /dev/null -w "%{content_type}" https://regionify.pro/sitemap.xml
# → application/xml

# robots.txt includes sitemap URL
curl https://regionify.pro/robots.txt

# Public pages have unique titles (not the home page default)
curl -s https://regionify.pro/about | grep '<title>'
curl -s https://regionify.pro/faq  | grep '<title>'

# Auth routes have noindex
curl -s https://regionify.pro/login | grep 'robots'
# → <meta name="robots" content="noindex, nofollow">

# OG image reachable
curl -I https://regionify.pro/og-image.jpg   # → 200 OK
```

Additional tools:

- [Google Rich Results Test](https://search.google.com/test/rich-results) — test `https://regionify.pro/` for `SoftwareApplication` JSON-LD
- [OpenGraph preview](https://www.opengraph.xyz) — spot-check a country page OG image
- GSC URL Inspection — check `https://regionify.pro/marketing/france/` once indexed

---

## 7. Analytics (optional)

If GA4 reporting is wanted, set `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` in the client build environment (GitHub secret + `deploy.yml` client build step). The tracking code is already wired in `client/src/helpers/analytics.ts`. Embed routes are intentionally excluded from GA4 page views.
