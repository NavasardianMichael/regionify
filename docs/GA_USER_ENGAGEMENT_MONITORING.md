# GA4 User Engagement Monitoring — Regionify

Assumes GA4 is active (see [GOOGLE_ANALYTICS.md](./GOOGLE_ANALYTICS.md)). This guide covers what to monitor, where to find it, and how to interpret it for a SaaS web app like Regionify.

---

## Monitoring cadence

| Frequency             | What to review                                               |
| --------------------- | ------------------------------------------------------------ |
| After every deploy    | Realtime — confirm tracking is live, no drop in active users |
| Daily (first 2 weeks) | Realtime + Users + top pages — establish baselines           |
| Weekly                | Acquisition, Engagement, Geography, Retention                |
| Monthly               | Funnel explorations, cohort retention, long-term trends      |

---

## Geography

**Where:** Reports → User → User Attributes → **Demographic details**.

Also available as a secondary dimension in most reports: open the dimension picker above the table and add **Country** or **City**.

| Signal                        | What to watch                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Top countries by active users | Are your highest-traffic regions the ones you're targeting?                                    |
| Country vs. engagement rate   | A country with high sessions but low engagement may indicate bot traffic or a localization gap |
| City breakdown                | Useful once you run geo-targeted campaigns or want to prioritize support coverage              |
| Language                      | Cross-check with country; a mismatch may reveal untranslated content for a large segment       |

**Quick filter:** In any report, click **Add filter** at the top → select Dimension: Country → include or exclude specific regions to isolate a cohort.

---

## User counts

**Where:** Reports → **Acquisition overview** (summary cards at top) and Reports → Acquisition → **Traffic acquisition**.

| Metric               | Definition                                            | Why it matters                                                   |
| -------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| **Active users**     | Users with at least one engaged session in the period | Primary health metric — more reliable than raw sessions          |
| **New users**        | First-time visitors                                   | Growth indicator; compare to prior period weekly                 |
| **Returning users**  | Visited before                                        | Retention proxy before you set up formal key events              |
| **Sessions**         | Total visits (one user can have many)                 | Volume metric; compare to active users for visit-frequency ratio |
| **Engaged sessions** | Sessions ≥ 10 s, ≥ 1 key event, or ≥ 2 page views     | Filters out bounces; a healthier signal than raw sessions        |

**How to compare periods:**

1. Open any report.
2. Click the date range (top right).
3. Enable **Compare** → choose **Previous period** or **Same period last year**.
4. Columns will show the delta and % change alongside current values.

---

## Engagement

**Where:** Reports → Engagement → **Overview** and **Pages and screens**.

| Metric                              | Healthy baseline (early-stage SaaS) | Notes                                                                  |
| ----------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| Engagement rate                     | > 50 %                              | Percentage of sessions that are "engaged"; replaces bounce rate in GA4 |
| Average engagement time per session | > 1 min                             | Time users actively have the tab in focus                              |
| Views per session                   | > 2                                 | Low value means users land and leave without exploring                 |
| Events per session                  | —                                   | Depends on what custom events you add; track trend, not absolute value |

**Pages and screens report tips:**

- Sort by **Views** to find the most-visited routes.
- Sort by **Engagement time** to see where users spend real time vs. where they land and leave.
- Add secondary dimension **Session default channel group** to see which acquisition source drives traffic to a specific route.
- Watch `/` (home), auth routes (`/login`, `/register`), and the core editor/map route — these are the critical funnel steps.

---

## Retention

**Where:** Reports → Life cycle → **Retention**.

| View                  | What it shows                                            |
| --------------------- | -------------------------------------------------------- |
| User retention chart  | % of new users who return on day 1, 7, 14, 30            |
| User engagement chart | Average engagement time by days-since-first-visit cohort |

Early signals:

- **Day-1 retention < 20 %** — most new users don't come back the next day; common early on, but track the trend.
- **Week-1 retention** — if users don't return within 7 days they rarely do; a rising trend here is a strong product health signal.

For deeper cohort analysis: **Explore** (left nav) → **Cohort exploration** template — drag **Week** as the cohort granularity and **Active users** as the return criterion.

---

## Traffic acquisition

**Where:** Reports → Acquisition → **Traffic acquisition**.

Default channel groups to watch:

| Channel        | What a spike means                                                               |
| -------------- | -------------------------------------------------------------------------------- |
| Organic Search | SEO gaining traction; cross-check with Google Search Console                     |
| Direct         | Users typing your URL or returning from bookmarks — good loyalty signal          |
| Referral       | Backlinks or embedding activity; drill into Source/medium to identify the domain |
| Organic Social | Social shares; correlates with content or launch posts                           |
| Unassigned     | Usually direct traffic that lost its referrer; not a concern if small            |

**Add secondary dimension:** Inside the Traffic acquisition report → use the dimension picker at the top of the table → select **Landing page + query string** — this shows which page each channel drives users to first.

---

## Device and platform

**Where:** Reports → User → Tech → **Tech overview**.

| Dimension                               | Useful for                                                  |
| --------------------------------------- | ----------------------------------------------------------- |
| Device category (desktop/mobile/tablet) | Prioritizing responsive fixes; most SaaS tools skew desktop |
| Browser                                 | Debugging rendering or JS issues for a specific browser     |
| OS                                      | Relevant if you get platform-specific bug reports           |
| Screen resolution                       | Helps set breakpoints and test coverage priorities          |

---

## Custom explorations (Explore tab)

Use **Explore** (left nav) → **Blank** to build ad-hoc reports when standard reports aren't specific enough.

### Example: geography + engagement combined

1. Open **Explore** → **Blank**.
2. **Dimensions:** Country, Page path.
3. **Metrics:** Active users, Engagement rate, Average engagement time.
4. Drag Country to Rows, Page path to Columns (or keep flat in a free-form table).
5. Filter: exclude internal traffic if you've set that up.

### Example: new-user funnel

1. **Explore** → **Funnel exploration** template.
2. Steps: `page_view` on `/` → `page_view` on `/register` → `page_view` on `/login` (or a custom sign-up key event once added).
3. Enable **Trended** view to see if conversion rates improve over time.
4. Break down by **Country** or **Device category** to spot where users drop off by segment.

---

## Setting up alerts (anomaly detection)

GA4 has built-in anomaly detection on standard reports (look for the ⚠ icon on charts). For custom alerts:

1. **Admin → Data display → Custom insights**.
2. Create an insight for: metric = Active users, condition = decreases by > 30 % compared to same day last week.
3. Enable email notifications — useful to catch tracking breaks or sudden traffic drops after a deploy. Each property supports up to 50 custom insights.

---

## Internal traffic exclusion

If your team's own visits inflate the numbers:

1. **Admin → Data collection and modification → Data streams → your stream → Configure tag settings → Define internal traffic**.
2. Add your office/VPN IP range.
3. **Admin → Data filters** → create a filter of type **Internal traffic** → set to **Active** when ready.

Do this early; once data is collected it cannot be retroactively filtered in standard reports.

---

## What not to over-index on early

- **Session count** — a single user with many short sessions inflates this; prefer active users and engagement rate.
- **Page views alone** — a high view count on an error or redirect page is a bug signal, not a success signal.
- **Day-0 geography data** — the first few days have noise from bots, crawlers, and your own team; wait a week before drawing conclusions.
