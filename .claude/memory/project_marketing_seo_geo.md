---
name: Marketing SEO/GEO Strategy
description: Plan for data-driven Astro marketing site with per-country demo pages for SEO/GEO discoverability
type: project
---

Regionify's acquisition strategy is SEO/GEO-driven public landing pages — one per country — showcasing all asset types the app can generate (choropleth maps, administrative divisions, etc.). Target audience: people Googling specific queries like "Armenia administrative divisions choropleth" or asking AI systems about regional geography.

**Why:** The product solves a niche B2B problem; users don't discover it through ads or word-of-mouth. Long-tail geographic queries have low competition and high intent. Pages also get cited by AI systems (Perplexity, ChatGPT, Claude) if structured correctly.

**Architecture decision:** Separate `packages/marketing/` Astro project within the existing pnpm monorepo. Astro chosen because it ships zero JS by default (fast, crawler-friendly), has excellent SEO primitives (sitemap, structured data, Open Graph), and supports React islands for interactive demo widgets.

**Design system sharing:**

- Tailwind v4 tokens shared via the existing `tailwind.css` `@theme` block
- `@regionify/shared` types/constants work directly (pnpm workspace)
- Ant Design NOT used on marketing pages (CSS-in-JS kills SSR performance) — layout/typography done in Astro/HTML with Tailwind
- Ant Design icons and React components usable inside `client:visible` islands only for interactive elements

**Page structure:** Single Astro layout template, data-driven — country metadata (name, regions, administrative hierarchy, population, GeoJSON) drives all content and SEO tags. All countries at once (not phased) because cost per country is near-zero with a data-driven template.

**What makes pages rank (critical):** Pages must have genuine informational value — region names (local + English), administrative hierarchy, population/area data, data source citations, structured data markup (Schema.org Dataset/Map). A map image + CTA alone will not rank.

**GEO signals:** Structured/scannable content (headings, tables, lists), factually dense, specific topic authority, clear data provenance. These pages are a natural fit for AI citation.

**Open question at end of conversation:** What does the data layer look like? Is country/region metadata already in the database, or does it need to be compiled? This needs to be answered before implementation begins.

**How to apply:** When resuming this work, start by clarifying the data layer question, then scaffold the Astro package structure and the country page template.
