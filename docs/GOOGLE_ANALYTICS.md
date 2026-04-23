# Google Analytics (GA4) — Regionify client

This project uses **Google Analytics 4** with the official **`gtag.js`** snippet pattern, loaded only in the **main web app**. **Public embed pages** (`/embed/:token`) do not initialize or send analytics.

The implementation follows current SPA guidance: disable the automatic first page view, then send a **`page_view`** event on each client-side route change (React Router).

---

## What you need from Google

1. A **Google Analytics 4** property (not Universal Analytics; UA is retired).
2. A **web data stream** for your site.
3. The **Measurement ID**, which looks like **`G-XXXXXXXXXX`** (copy it from **Admin → Data streams → your stream → Measurement ID**).

You do **not** need to paste the full HTML snippet from Google into `index.html`; the app injects the script when the Measurement ID is configured.

Optional but useful:

- **DebugView** (see below) to verify events in real time.
- For sites with EU/EEA traffic, review **Consent Mode** and privacy requirements (Google’s documentation and your legal counsel); this doc does not configure consent banners.

---

## Environment variable (client)

| Variable                 | Required | Description                                                                           |
| ------------------------ | -------- | ------------------------------------------------------------------------------------- |
| `VITE_GA_MEASUREMENT_ID` | No       | GA4 Measurement ID (`G-XXXXXXXXXX`). If unset or empty, analytics stays **disabled**. |

Vite only exposes variables prefixed with `VITE_` to the browser. Values are **embedded at build time** for production builds—set them in your hosting/CI environment when you run `pnpm build`, not only on the server runtime.

### Production

Configure `VITE_GA_MEASUREMENT_ID` in your deployment platform (e.g. Vercel, Netlify, Cloudflare Pages, GitHub Actions `env:`) for the **client build** step.

If the variable is missing in production, the app simply skips loading GA—no error.

---

## Code reference (what was added)

| Piece                                              | Role                                                                                                                                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/src/helpers/analytics.ts`                  | Defines `getGaMeasurementId`, `initGa4`, `trackGa4PageView`. Loads `https://www.googletagmanager.com/gtag/js?id=…`, queues `config` with `send_page_view: false`, sends manual `page_view` events. |
| `client/src/components/shared/GoogleAnalytics.tsx` | Subscribes to the router location; skips `/embed/:token`; initializes GA once and tracks each non-embed navigation.                                                                                |
| `client/src/components/router/AppRouter.tsx`       | Renders `<GoogleAnalytics />` inside `<BrowserRouter>` (required for `useLocation`).                                                                                                               |
| `client/src/constants/routes.ts`                   | Exports `isEmbedPathname()` so embed detection stays consistent.                                                                                                                                   |
| `client/src/vite-env.d.ts`                         | Types `import.meta.env.VITE_GA_MEASUREMENT_ID`.                                                                                                                                                    |

No extra npm package is required; using native `gtag.js` avoids outdated wrappers and matches Google’s current integration path.

---

## Verifying that it works

1. **Browser DevTools → Network**  
   Filter for `google-analytics` or `collect`. After navigation you should see requests (often `204` responses) to Google’s endpoints.

2. **GA4 DebugView**  
   With `pnpm dev`, the code sets GA’s **`debug_mode`** when `import.meta.env.DEV` is true so streams can appear in **Admin → DebugView** (you may still need a debug-enabled device/session per Google’s current UI).

3. **Realtime**  
   In GA4 **Reports → Realtime**, open your site in another tab and navigate; you should see activity (can take a short delay).

---

## Embed exclusion behavior

- **Direct open** of `/embed/<token>`: Measurement ID is ignored for that session’s router subtree—no script load, no `page_view`.
- **Navigate from the main app to an embed URL**: Analytics may already be loaded from earlier pages; the app **stops sending** `page_view` on embed routes. It does not unload the script (not required for “no embed analytics” in practice).

If you later need a **separate** GA property for embeds, that would be a deliberate product change (different Measurement ID and different mounting rules).

---

## Optional next steps

- **Custom events** (e.g. export completed): call `window.gtag('event', 'event_name', { ... })` from `helpers/analytics.ts` behind small typed helpers; keep PII out of parameters.
- **Consent Mode**: extend `initGa4` / `config` per [Google’s Consent Mode](https://developers.google.com/tag-platform/security/guides/consent) docs if you serve EU users and use a consent banner.
- **CSP**: if you add a strict **Content-Security-Policy**, allow `https://www.googletagmanager.com` and `https://www.google-analytics.com` (exact directives depend on your policy).

---

## Troubleshooting

| Issue                             | Things to check                                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| No network calls to Google        | `VITE_GA_MEASUREMENT_ID` set? Correct `G-` format? Rebuild/restart dev server after env changes?                           |
| ID set but still no tracking      | Ad blockers or browser privacy features often block GA. Try a clean profile or disable extensions.                         |
| Validation warning in dev console | ID must match `G-` + alphanumeric segment(s). Typos or a GTM container ID (`GTM-…`) will not work as a GA4 Measurement ID. |

---

## Using Google Analytics for real analysis

After data has flowed for at least **24–48 hours** (Realtime works immediately; most trend reports need a settled day), open [Google Analytics](https://analytics.google.com/), select your **GA4 property**, and use the left sidebar.

### Reports (day-to-day answers)

These live under **Reports**. Date range is at the top right—always set it to the period you care about (last 7 / 28 / 90 days, or custom).

| What you want                           | Where to go                                         | Why it helps                                                                                                                                                  |
| --------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Are people using the app right now?** | **Reports → Realtime**                              | Live users, top pages/events, traffic sources in the last 30 minutes. Good sanity check after a deploy.                                                       |
| **Which URLs / screens get traffic?**   | **Reports → Engagement → Pages and screens**        | Lists views by **Page path + query string** (matches what the app sends as `page_path`). Use this to see popular routes (`/`, `/projects`, auth flows, etc.). |
| **Where users come from**               | **Reports → Acquisition → Traffic acquisition**     | Default channel group (Organic Search, Direct, Referral, etc.) and source/medium. Tells you if search, referrals, or other sources drive visits.              |
| **New vs returning**                    | **Reports → Retention** (overview and cohort views) | High-level loyalty and repeat use over time.                                                                                                                  |
| **Demographics / tech** (if enabled)    | **Reports → User → User attributes** or **Tech**    | Country, device, OS—useful when debugging “mobile vs desktop” or regional issues.                                                                             |

**Tips**

- Click a row in **Pages and screens** to open a drill-down or add a **secondary dimension** (e.g. source/medium) when the UI offers it—so you see _which marketing source_ views which page.
- Use **comparisons** (top of the report, “Add comparison”) to split e.g. “last 7 days” vs “previous 7 days” or mobile vs desktop.

### Explore (custom analysis and funnels)

**Explore** (sometimes labeled **Explore** or under **Explore / Explorations** in the nav) is where you build **custom tables and funnels** without writing code.

| Technique                 | What it’s for                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free form** exploration | Drag **dimensions** (e.g. **Page path**, **Session source**) and **metrics** (sessions, active users, event count) into a pivot-style table. |
| **Funnel** exploration    | Define steps (e.g. home → sign-up → project editor) using **page_view** or custom events, and see where users drop off.                      |
| **Path** exploration      | See common sequences of pages or events before/after a key screen.                                                                           |
| **Segment overlap**       | Compare behaviors between audiences (e.g. logged-in vs anonymous is easier if you add custom events or user properties later).               |

Create explorations from **Explore → Blank** or a template. If a dimension is missing, GA4 may need **custom definitions** (**Admin → Data display → Custom definitions**) for event parameters you add in code later.

### Conversions and key events

Out of the box, **page_view** is collected automatically as an event; for **product KPIs** (e.g. sign-up completed, export finished), you typically:

1. Send **custom events** from the app (see “Optional next steps” above).
2. In GA4, mark them as **Key events** (historically also referred to as conversions in older docs): **Admin → Data display → Events** → toggle the event as a **Key event**.

Then view them under **Reports → Engagement → Conversions** (and in **Explore** when you build custom reports) to count goal completions over time.

### Data quality and blind spots

- **Thresholding / cardinality**: Very small segments may show as “(other)” or be withheld for privacy—avoid over-interpreting tiny numbers.
- **Sampling**: Huge custom reports in Explore can be sampled; Google shows an indicator when that happens.
- **Retention**: Under **Admin → Data collection and modification → Data retention**, check how long event-level data is kept (affects historical Explorations).

### Making dashboards yours

- **Library / Collections**: GA4 can surface curated report groups; you can also **save** or **share** links to specific Explorations for your team.

For official walkthroughs of each report type, see Google’s [GA4 report documentation](https://support.google.com/analytics/topic/9303474) and [Explore documentation](https://support.google.com/analytics/topic/9266525).
