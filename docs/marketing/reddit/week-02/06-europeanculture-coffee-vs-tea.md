# Post 06 — r/EuropeanCulture: coffee vs tea by European country

## Meta

| Field        | Value                                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subreddit    | [r/EuropeanCulture](https://www.reddit.com/r/EuropeanCulture/) (fallback: [r/europe](https://www.reddit.com/r/europe/), [r/AskEurope](https://www.reddit.com/r/AskEurope/)) |
| Day          | Week 2, Thursday                                                                                                                                                            |
| Time slot    | 5-7 PM local (9-11 AM ET; captures both US morning and EU afternoon)                                                                                                        |
| Post type    | Image post                                                                                                                                                                  |
| Tags         | None required                                                                                                                                                               |
| UTM campaign | `europeanculture-06`                                                                                                                                                        |

Rationale: The coffee-vs-tea divide is one of the most recognizable "soft culture" splits in Europe — UK, Ireland, Turkey drink tea; the continent drinks coffee. It's fun, universally recognized, and starts arguments in the comments (which is what the Reddit algorithm loves). r/EuropeanCulture is small (~200k) but very engaged; if it does well, cross-post the following week to r/europe (900k+) with the same content re-titled slightly.

---

## Title

**Primary:**

```
Coffee vs tea: most-consumed hot beverage by European country (per-capita, kg/year)
```

**Backup 1:**

```
The coffee/tea divide of Europe, mapped by per-capita consumption
```

**Backup 2:**

```
Which European countries drink more coffee than tea? A map based on per-capita consumption data
```

Primary is clearest and most descriptive.

---

## Body

_Image-forward sub. Short body — the map does the talking._

Made this after realizing I couldn't find a clean version of the "coffee belt vs tea belt" map for Europe anywhere online.

The methodology is simple: for each country, take per-capita **coffee** consumption (kg/person/year, green coffee equivalent) and per-capita **tea** consumption (kg/person/year), then colour by whichever is higher.

<!-- ASSET: 1600x1600 PNG, Europe choropleth (all European countries incl. UK, Ireland, Turkey,
     Russia west of Urals if the map supports it — otherwise stop at Russia border).
     Two-tone palette: coffee (warm brown #6B4423) vs tea (deep green #2F5D3A). Intensity of the
     colour indicates the *ratio* — countries where coffee dominates 10:1 are darkest brown,
     countries where tea dominates 5:1 are darkest green, neutral zones in between.
     Highlights the story:
       - Nordics (Finland, Norway, Sweden, Denmark, Iceland) darkest brown — Finland is world's #1 coffee drinker.
       - UK, Ireland, Turkey darkest green.
       - Russia mid-green (tea culture).
       - Central Europe (Germany, France, Italy) medium brown.
     Title on image: "Coffee vs Tea — Europe, per-capita consumption (kg/year)".
     Two-column legend: brown scale (coffee-dominant) and green scale (tea-dominant).
     Source: "Data: ICO (International Coffee Organization) & FAO tea statistics, 2022".
     Watermark: "regionify.pro" bottom-right small. -->

The three big surprises for me:

- **Finland is #1 worldwide** on coffee (~12 kg/person/year of green coffee equivalent — Italians are around 5.5). If you've been to Helsinki you know.
- **Turkey and Ireland** are the only two tea-dominant countries in Western Europe. Turkey drinks more tea per capita than the UK by a wide margin.
- **Poland and Russia** flip green (tea) — legacy of the Silk Road trade and Russian samovar culture more than anything else.

Data source in the top comment.

---

## First comment

```
Sources:
- Coffee: International Coffee Organization (ICO) per-capita consumption tables, 2022.
  https://www.ico.org/prices/po-production.pdf
- Tea: FAO STAT (foodbalancesheets) — tea, dry weight per capita, 2022.
  https://www.fao.org/faostat/

Method: for each country, kg/person/year of coffee (green coffee equivalent) and kg/person/year of tea
(dry weight). Colored by whichever is higher, intensity proportional to the ratio.

Caveats:
- "Green coffee equivalent" is roughly 1 kg → 100-120 cups (varies by roast/method), so Finland's
  12 kg/year is ~4 cups/day per person. Sounds absurd, is real.
- Ireland is a much heavier tea drinker than the UK per capita — ~2.2 kg/year vs the UK's ~1.9.
- Turkey is off the charts at ~3.2 kg/year, roughly 1,300 cups/person/year. That's about 3.5 cups/day, every man, woman, and child.

Made this with Regionify (I'm the founder): https://regionify.pro/?utm_source=reddit&utm_medium=organic&utm_campaign=europeanculture-06
```

---

## Prepared replies

**Q: "Poland is tea-dominant? Since when?"**

> Historical trade routes (Polish–Russian tea trade in the 18th–19th century) plus Soviet-era influence. Poland is actually one of the highest-per-capita tea drinkers in the EU — the "coffee culture" is real in urban Warsaw and Kraków, but nationally, tea still wins on volume.

**Q: "What about Portugal? Portugal drinks a lot of coffee."**

> Portugal is dark brown on the map — ~4.5 kg/year, very coffee-dominant. The espresso-culture Southern Europe cluster (Portugal, Spain, Italy, Greece) is all firmly brown.

**Q: "Where's Switzerland / Belgium / Austria?"**

> All coffee-dominant. Switzerland is actually one of the top 5 in Europe per capita — ~7 kg/year. Vienna's coffeehouse culture is UNESCO Intangible Cultural Heritage.

**Q: "This ignores mate / herbal / instant."**

> Correct — this is only true tea (Camellia sinensis) and coffee (Coffea). Mate, rooibos, herbal infusions, and hot chocolate are excluded, which mostly affects countries with strong herbal cultures (Argentina outside the map anyway; Germany's Kräutertee tradition is not counted). Instant coffee is included in the ICO data.

**Q: (contrarian) "The colors are misleading; you should show both values, not just the winner."**

> Fair. A bivariate map (X-axis coffee, Y-axis tea) is a better representation but reads terribly at Reddit thumbnail size. Someone in the comments always argues this and they're not wrong — happy to make a bivariate follow-up if there's demand.

---

## Compliance checklist

- [ ] Cultural angle is front-and-center (r/EuropeanCulture rewards culture-first framing)
- [ ] Not overtly promotional — the map is the content
- [ ] Data sources listed in first comment
- [ ] Tool disclosure is transparent
- [ ] UTM link in first comment only
- [ ] Fallback: if r/EuropeanCulture is dead that week, repost (with a slight re-title) to r/europe or r/geography — but wait a week between subs
