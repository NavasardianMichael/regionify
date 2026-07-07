# Post 03 — r/dataisbeautiful [OC]: Spain population density by province

## Meta

| Field        | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| Subreddit    | [r/dataisbeautiful](https://www.reddit.com/r/dataisbeautiful/) |
| Day          | Week 1, Thursday                                               |
| Time slot    | 5-7 PM local (9-11 AM ET)                                      |
| Post type    | Image post                                                     |
| Tags         | `[OC]` (mandatory)                                             |
| UTM campaign | `dataisbeautiful-03`                                           |

Rationale: Population density in Spain is one of Europe's most visually dramatic datasets — "empty Spain" (La España vacía) is a well-known phenomenon, with 50%+ of the population squeezed into ~10% of provinces. It reliably hits front-of-sub in r/dataisbeautiful. INE data is public, free, current.

---

## Title

Follow r/dataisbeautiful Rule 7: plain, descriptive, no sensationalism.

**Primary:**

```
[OC] Population density of Spain by province, 2024 (people per km²)
```

**Backup 1:**

```
[OC] Spain's population density by province — half the country lives on 10% of the land
```

**Backup 2:**

```
[OC] Population density by province in Spain, 2024
```

Rule 7 favors Primary/Backup 2 (pure description). Backup 1 could be flagged as clickbait by some mods — use only if the sub feels forgiving that day.

---

## Body

_r/dataisbeautiful is image-first. Submit as an image post. No body text needed — the image and the first comment carry the post._

<!-- ASSET: 1600x1600 PNG (square works better in the Reddit feed for country-shaped
     maps like Spain), Spain provincial choropleth.
     Data: population density (people per km²) by provincia, 2024 — 50 provinces + 2 autonomous cities (Ceuta, Melilla).
     Palette: sequential single-hue (recommended: viridis-like or Regionify's default sequential blue).
     Breakpoints: quantile bins, 6 bins. Consider showing Madrid (~830), Barcelona (~730), and rural provinces (Soria ~9, Teruel ~9) with clear contrast.
     Legend: bottom-right, horizontal, with density units "people / km²".
     Title on image: "Spain — Population density by province, 2024".
     Source line bottom-left: "Data: INE (Instituto Nacional de Estadística) · Padrón 2024".
     Watermark bottom-right: "Made with Regionify · regionify.pro" (small, unobtrusive). -->

---

## First comment (mandatory — Rule 3 of r/dataisbeautiful)

```
Data source: Instituto Nacional de Estadística (INE), Padrón continuo 2024.
  https://www.ine.es/dyngs/INEbase/en/operacion.htm?c=Estadistica_C&cid=1254736177012

Tool used: Regionify (regionify.pro) — a choropleth map builder I built.

Method: pulled the INE 2024 provincial population and area figures, computed density (population ÷ area in km²), imported the CSV into Regionify, applied a 6-bin quantile palette.

Observations:

- Madrid: ~830 people/km²
- Barcelona province: ~730
- Ceuta / Melilla: >4,000 (city-provinces skew the top)
- Soria and Teruel: ~9 people/km² — some of the lowest densities in the entire EU
- The interior "empty diagonal" from Cuenca to Zamora has a lower density than Lapland

Happy to share the CSV if anyone wants it. Full disclosure — I'm the founder of Regionify.
```

---

## Prepared replies

**Q: "This is why La España vacía is a real thing."**

> Exactly. There's a growing academic literature on "empty Spain" — you can see it clearly on the map: an interior diagonal running from Cuenca up through Soria to Zamora where density drops below 15/km². Lapland and Siberia levels, in the middle of Western Europe.

**Q: "Can you do the same for [Italy / Germany / France]?"**

> Yeah, Italy is next on my list — same INE-equivalent (ISTAT) data is public. If you want it faster, all 200+ country maps are on regionify.pro and the data flow is the same (paste CSV → export image). DM if you want a walkthrough.

**Q: "Why quantile bins instead of natural breaks?"**

> Quantile keeps roughly equal counts of provinces per color band, which reads more legibly on a map with wide variance like this (Madrid at 830 vs Soria at 9). Natural breaks (Jenks) would cluster most provinces into one bin and put Madrid/Barcelona in a class of their own — better for statistical accuracy, worse for visual balance. Both are available in the tool.

**Q: "What about the Balearic and Canary Islands?"**

> Both are shown at scale on the map (Baleares off Valencia coast, Canarias inset bottom-left). Baleares: 246/km². Canarias: 305/km². Both middle-tier.

**Q: "Can I get the CSV?"**

> Yep — https://regionify.pro/?utm_source=reddit&utm_medium=organic&utm_campaign=dataisbeautiful-03 has a public showcase project with this exact dataset attached, downloadable as CSV.

---

## Compliance checklist (r/dataisbeautiful rules)

- [ ] `[OC]` tag in title
- [ ] Title is plain and descriptive (Rule 7 — no sensationalism)
- [ ] First top-level comment states **data source** AND **tool used** (Rule 3)
- [ ] Contains a computer-generated element (Rule 5 — the choropleth itself)
- [ ] Not a repost of a popular map from last month (Rule 6)
- [ ] No US politics content (Rule 8 — non-issue, this is EU data)
- [ ] No personal data (Rule 9 — non-issue, aggregate stats)
- [ ] Data source link is stable and publicly accessible
- [ ] Tool disclosure is transparent (I built Regionify)
- [ ] Ready to respond in comments for the first 3 hours
