# Post 08 — r/Maps: interactive public embed showcase

## Meta

| Field        | Value                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------- |
| Subreddit    | [r/Maps](https://www.reddit.com/r/Maps/)                                                  |
| Day          | Week 3, Wednesday                                                                         |
| Time slot    | 5-7 PM local (9-11 AM ET)                                                                 |
| Post type    | Link post (to the public embed URL) with preview image                                    |
| Tags         | None required — r/Maps accepts interactive submissions (unlike r/MapPorn)                 |
| UTM campaign | `maps-08` (on the "make your own" link in the first comment, NOT on the embed URL itself) |

Rationale: r/Maps is the only major map sub that allows interactive submissions, and Regionify's public embed feature is exactly that: an SSR-rendered public page + iframe. Posting the actual live embed URL here is the whole point — one click and users are on a real Regionify-hosted page with SEO metadata, panning/zooming interactivity, and the "Made with Regionify" watermark. This is the single highest-conversion post in the plan.

**Prerequisite before posting:** you need a real, polished Chronographer-tier project with a good dataset that reads well as an interactive map. Suggested content: a rich, browsable dataset with region tooltips — e.g. "GDP per capita by NUTS-2 region across all EU countries" or "population by administrative division for a large country like Brazil or India". Something people will actually want to hover around and explore.

---

## Title

**Primary:**

```
Interactive map: GDP per capita by NUTS-2 region across the EU (hover for details)
```

**Backup 1:**

```
Interactive: population by administrative region for [country] — hover any region for detail
```

**Backup 2:**

```
Explorable map of [topic] — click any region for detail
```

Choose the primary if the demo project is the EU GDP one. If you build a different showcase project first, adapt the title to match the actual data.

**Do not** title it "I made an interactive map with Regionify" — that reads as launch pitch and gets downvoted.

---

## Body

_r/Maps is fine with a short body when the map itself is the content._

```
Full interactive version at the link — pan, zoom, hover any region for name + value.

Data covers all NUTS-2 regions of the EU (roughly 240 regions across 27 countries), GDP per capita in
purchasing-power standard (PPS) as reported by Eurostat for the most recent available year.

Details in the top comment.
```

<!-- ASSET: 1200x800 PNG preview image of the embed page (Reddit will show this as the link preview).
     Content: screenshot of the embed page at regionify.pro/embed/<token>, showing:
       - The full choropleth (EU or whatever dataset the actual embed project uses)
       - Sidebar or header with title, description, source
       - The interactive UI (zoom controls, hover state visible on one region if possible)
       - "Made with Regionify" watermark in-place
     The screenshot's purpose is purely link preview; the actual post link is the embed URL. -->

---

## Submission mechanics

1. Prepare the source project in Regionify:
   - Chronographer-tier account
   - Real dataset loaded, styled, published as public embed
   - Copy the public embed URL (looks like `https://regionify.pro/embed/<token>`)
2. Verify the embed renders correctly for a signed-out user in an incognito window. It must include:
   - SSR HTML with proper `<h1>`, meta description, JSON-LD (per `README.md`)
   - Working pan/zoom/hover
   - "Made with Regionify" watermark visible
3. On Reddit:
   - Choose "Link" post type (not "Image", not "Text")
   - Paste the embed URL directly (no UTM on the embed URL itself — SSR content stays clean)
   - Reddit will fetch the OpenGraph preview automatically; if not, upload the preview PNG manually
   - Add the body text above

---

## First comment

```
Data: Eurostat — Gross domestic product (GDP) at current market prices by NUTS-2 regions (nama_10r_2gdp).
  https://ec.europa.eu/eurostat/databrowser/view/NAMA_10R_2GDP
  PPS per inhabitant, latest available year.

Made with Regionify (I'm the founder). If you want to build your own interactive embed like this, the flow is:
  1. Pick a country or region on regionify.pro
  2. Paste your data (Excel/CSV — the AI parser handles messy region names)
  3. Style it, publish as public embed, share the URL

  https://regionify.pro/?utm_source=reddit&utm_medium=organic&utm_campaign=maps-08

Interactive embeds are on the Chronographer tier — free trial available. Static PNG/PDF export is on the
free (Observer) tier.
```

---

## Prepared replies

**Q: "This is a static image, not really interactive."**

> Click the post link, not the preview image — the preview is just a screenshot for the Reddit feed. The link opens a live embed page with real pan, zoom, and per-region hover. Let me know if the interaction is broken on your device.

**Q: "Is the source open?"**

> The data (Eurostat) is fully open under the EU's open-data license. The Regionify project itself is on my account but the embed URL is public — anyone can view it, anyone can share it. I'll happily send the CSV to anyone who wants it.

**Q: "Can I embed this in my blog?"**

> Yeah — the embed page is designed to be iframed. Copy the URL, drop it into an `<iframe>` on your blog with `width="100%"` and a reasonable `height`. The page is server-side-rendered so it plays nice with SEO on your side too.

**Q: "Why is [country / region] missing?"**

> Two likely reasons: (a) Eurostat hasn't published a value for that region for the year I used — some newer NUTS revisions have gaps; (b) some overseas regions of France/Portugal/Spain are excluded from the display for space reasons. If you want a specific region included, DM me and I'll update the source project.

**Q: "Is there a way to hover multiple regions at once / compare?"**

> Not yet — hover is single-region for now. Multi-select + compare panel is on the roadmap for the next 2 months.

**Q: "Does the embed work on mobile?"**

> Yes — touch drag to pan, pinch to zoom, tap a region to select. If anything is broken on your specific device, screenshot it and DM me — I'm actively testing mobile flows.

---

## Compliance checklist

- [ ] Submitted to r/Maps (interactive OK), NOT r/MapPorn (interactive prohibited)
- [ ] Link post type used; URL is the raw embed URL, no UTM appended
- [ ] Preview image loads correctly in Reddit feed (test with old-reddit + new-reddit)
- [ ] Body text is short, information-dense, not promotional
- [ ] Tool disclosure is in the first comment, not the title
- [ ] UTM is only on the "make your own" link in the first comment, not the embed URL
- [ ] Live embed renders correctly for signed-out incognito users before posting
- [ ] Data source is credible and linked in the first comment
- [ ] Ready to reply to comments for 3+ hours
