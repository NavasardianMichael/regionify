# Regionify — Medium Introduction Article

One ready-to-paste Medium article introducing [regionify.pro](https://regionify.pro). This folder contains a single article — not a series — so this README is the tactical checklist to publish that one article correctly.

```
docs/marketing/medium/
├── README.md         ← publish checklist (you are here)
└── article.md        ← the article itself
```

---

## Publish checklist (in order)

- [ ] **Prepare the media**: hero image + 4-5 inline screenshots + 1 demo video (uploaded to YouTube first — Medium embeds YouTube URLs natively). See asset briefs in `article.md`.
- [ ] **Pick a title + subtitle** from the variants in `article.md`.
- [ ] **Apply as a Writer** to one of the recommended publications (see below) — do this a few days in advance if you haven't already, editorial takes 1-3 days.
- [ ] **Paste the article body** into Medium's editor (it accepts Markdown).
- [ ] **Insert media** at each `<!-- ASSET: ... -->` placeholder.
- [ ] **Add all 5 tags** (see recommended list below).
- [ ] **Add to publication** via the … menu → "Add to publication" before hitting Publish.
- [ ] **Publish** — Tuesday, 8-10 AM US Eastern (4-6 PM UTC+4) — best window for both search indexing and first-day reader traffic.
- [ ] **Announce** the article same day: LinkedIn native post referring to it (link in first comment), Twitter/X thread with 3-4 pull quotes.
- [ ] **3-5 days after publishing**, cross-post to dev.to and Hashnode with `canonical_url` set to the Medium URL.

---

## Publications to submit to (pick ONE)

Medium's algorithm distributes articles inside curated Publications 3-5× more than standalone posts. Being accepted takes 1-3 days for the fast pubs.

| Publication                     | Fit                      | Turnaround | Notes                                          |
| ------------------------------- | ------------------------ | ---------- | ---------------------------------------------- |
| **JavaScript in Plain English** | Frontend/dev audience    | 1-3 days   | Fastest to publish, less selective (best pick) |
| **Better Programming**          | Broad dev-SaaS           | 3-7 days   | Higher-quality bar; they may edit copy         |
| **ITNEXT**                      | Backend / architecture   | 3-7 days   | Best if you lean into the AI parser / stack    |
| **Level Up Coding**             | Broad dev                | 2-5 days   | Good general fit                               |
| **The Startup**                 | Founder / business angle | 5-10 days  | Big reach but slow; leans business over tech   |

**Recommended for this article: JavaScript in Plain English.** The article is a product introduction with technical texture — that pub's audience is a good match and turnaround is fastest.

**How to submit:** Apply as a Writer via the publication's homepage (usually a Google Form or dedicated page). Once accepted, publish through Medium's editor → … menu → "Add to publication".

---

## Tags (max 5, Medium hard-caps at 5)

Primary tag first — it becomes the article's main topic in Medium's discovery.

1. `Data Visualization`
2. `SaaS`
3. `Startup`
4. `JavaScript`
5. `Indie Hacker`

---

## Cross-posting

Publish on Medium **first**. Wait 3-5 days for Medium's initial indexing push. Then:

| Platform                                     | Canonical URL   | Notes                                                                                                              |
| -------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| **dev.to**                                   | Medium article  | Use "Import from Medium" or manual paste; set `canonical_url:` in front-matter                                     |
| **Hashnode**                                 | Medium article  | Configure canonical in the SEO panel                                                                               |
| **Your blog** (if regionify.pro/blog exists) | The blog itself | Publish natively there and reverse: point Medium's canonical to the blog. Whichever you want as the SEO authority. |

**Do NOT cross-post to LinkedIn Articles.** LinkedIn hides articles from the feed; a native LinkedIn post referencing the Medium URL (link in first comment) gets 10-50× more reach. See `../linkedin/` for the companion LinkedIn post.

---

## UTM link

Use this URL wherever you link from the article body:

```
https://regionify.pro/?utm_source=medium&utm_medium=article&utm_campaign=intro-article
```

---

## What NOT to do on Medium

- No pure sales pitch — every paragraph must give the reader something (insight, code, honest opinion, screenshot).
- No aggressive CTA above the fold — the "sign up" ask goes at the end, softly.
- No linkless article — Medium expects hyperlinks to citations, previous work, competitor products. Zero outbound links looks suspicious to the algorithm.
- No AI-tone giveaways: "delve", "in the realm of", "furthermore", "it is important to note", "landscape of". Rewrite if any of these appear.
- No image without alt text.
- No `<h1>` inside the body — Medium reserves that for the article title. Use `<h2>` (Big Title) and `<h3>` (Subtitle) for sections.
- No screenshot without a watermark on it (the watermark is free marketing on every share).
