# Post 02 — r/coolguides: driving side of the road

## Meta

| Field        | Value                                                |
| ------------ | ---------------------------------------------------- |
| Subreddit    | [r/coolguides](https://www.reddit.com/r/coolguides/) |
| Day          | Week 1, Wednesday                                    |
| Time slot    | 5-7 PM local (9-11 AM ET)                            |
| Post type    | Image post                                           |
| Tags         | None required                                        |
| UTM campaign | `coolguides-02`                                      |

Rationale: r/coolguides rewards evergreen, self-contained infographics. "Which side of the road does each country drive on" is one of the most consistently upvoted map topics on Reddit historically — factual, universal, zero controversy. It sneaks Regionify's global map into a huge audience.

---

## Title

**Primary:**

```
A cool guide to which side of the road every country drives on
```

**Backup 1:**

```
Left-hand vs right-hand traffic — a cool guide to every country in the world
```

**Backup 2:**

```
Cool guide: the 76 countries and territories that still drive on the left
```

Primary is best — it matches the sub's convention exactly ("A cool guide to X").

---

## Body

_r/coolguides prefers image posts without body text — the image should stand alone. Submit as an image post; the guide itself is the entire content._

<!-- ASSET: docs/marketing/reddit/week-01/coolguide-driving-side.png (2160×1350)
     Generated via: pnpm --filter @regionify/marketing generate-reddit-coolguide-driving-side
     Colors: right-hand traffic = warm blue (#2C6BE5), left-hand traffic = warm coral (#E57C4A).
     Neutral gray for territories with no vehicle traffic (Antarctica, some islands).
     Legend top-left: two color swatches with labels "Drives on the RIGHT (...)" and
     "Drives on the LEFT (...)" (counts computed from Wikipedia driving-side data).
     Title bar top: "Which side of the road does each country drive on?"
     Footer bottom-right: "Made with Regionify · regionify.pro" watermark, small.
     Source line bottom-left: "Source: Wikipedia · Left- and right-hand traffic (accessed 2026)". -->

---

## First comment (post immediately)

```
Made this in an afternoon using Regionify (a tool I built for choropleth maps) after realizing every existing "driving side" map on the internet is either an ugly Wikipedia SVG or paywalled behind Datawrapper.

Two things I found interesting while compiling it:

- Left-hand-traffic countries account for ~34% of the world's population, mostly because India, Pakistan, Bangladesh, Indonesia, UK, Japan, Australia, and South Africa are all on the left.
- Countries that switched sides: Sweden switched from left to right in 1967 ("Dagen H"). Myanmar switched from left to right in 1970. Samoa switched from right to left in 2009 (last country to switch).

Source: Wikipedia — Left- and right-hand traffic (cross-referenced with each country's road authority where possible).
Tool: https://regionify.pro/?utm_source=reddit&utm_medium=organic&utm_campaign=coolguides-02
```

---

## Prepared replies

**Q: "What about country X (Cyprus / Guyana / East Timor)?"**

> Good catch — Cyprus drives on the left (British influence), Guyana on the left, East Timor on the left after switching from right in 1976. If any specific country in the guide looks miscolored, tell me the country and I'll fix and repost the corrected version next week.

**Q: "Why do some countries drive on the left?"**

> Short version: pre-mechanical horse-and-carriage traffic mostly kept left worldwide (mounted rider's sword arm on the right side, facing oncoming traffic). Napoleon standardized right-side traffic in continental Europe. Britain and its empire (India, Australia, etc.) kept left. Japan kept left independently (samurai swords, same logic). The US went right partly because postal delivery wagons had the driver sitting on the left rear horse.

**Q: "What tool did you use?"**

> Regionify — it's a browser-based choropleth map maker I built. Free tier is enough for something like this. Link in my top comment.

**Q: "Can I download a high-res version?"**

> Yeah, DM me — happy to share the SVG. If you want to make your own variant with different colors or data, the country list + fill controls are on regionify.pro.

**Q: (criticism) "Wikipedia has this already."**

> Wikipedia's version is a functional SVG but it's rough (pixelated projections, inconsistent labels, no legend). This is the same data, rendered cleanly with a real color palette. Same reason people make cool-guide versions of temperature-conversion charts even though a formula already exists.

---

## Compliance checklist

- [ ] Image is self-contained — no external context needed to understand it
- [ ] Legend + title + source are on the image itself
- [ ] Data is factual, non-controversial, evergreen (no politics, no personal data)
- [ ] Not a reposted popular image — this is a fresh render of the data
- [ ] Tool disclosure is in the first comment, not the title or image
- [ ] UTM link only in the first comment
