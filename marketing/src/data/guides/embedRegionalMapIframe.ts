import { buildIframeSnippet } from '@regionify/shared';
import { type GuideMeta } from '@/data/guides/types';
import { embedBadgeLabel } from '@/helpers/tiers';
import showcaseEmbedUrls from '../../../data/showcase-embed-urls.json';

/** A real, live demo embed — a reader who copies this snippet gets a working map. */
const ARMENIA_EMBED_URL = showcaseEmbedUrls.armenia;

const PLACEHOLDER_EMBED_URL = 'https://regionify.pro/embed/YOUR_TOKEN';

const IN_CONTEXT_EXAMPLE = `<article>
  <h2>Unemployment by province, 2024</h2>

${buildIframeSnippet(PLACEHOLDER_EMBED_URL)
  .split('\n')
  .map((line) => `  ${line}`)
  .join('\n')}

  <p>Source: national statistics office.</p>
</article>`;

const CUSTOM_TITLE_EXAMPLE = `<iframe
  src="${PLACEHOLDER_EMBED_URL}"
  width="100%"
  height="720"
  style="border:0"
  title="Unemployment rate by province, Armenia, 2024"
  loading="lazy"
></iframe>`;

export const embedRegionalMapIframeGuide: GuideMeta = {
  slug: 'embed-regional-map-iframe',
  kind: 'howTo',
  navLabel: 'Embed a regional map',
  h1: 'How to embed a live regional map on your website',
  summary:
    'To embed a regional map, publish your Regionify project as a public embed, copy the generated iframe snippet, and paste it into your page. The embed stays live: it reflects the current data, so updating your dataset updates every site showing the map, with no need to re-publish or re-paste anything.',
  seoTitle: 'How to Embed a Live Regional Map (iframe Guide) | Regionify',
  seoDescription:
    'Step-by-step: publish a regional map as a public embed, copy the iframe code, and paste it into any site. The embed stays live and shows your current data.',
  seoKeywords:
    'embed regional map, regional map iframe, iframe map embed, embed choropleth map, map iframe code, embed a live map, embedded regional map, how to embed a map on a website',
  datePublished: '2026-09-24',
  dateModified: '2026-09-24',
  totalTime: 'PT5M',
  exampleCountrySlugs: ['armenia', 'france', 'germany', 'india', 'brazil', 'spain', 'japan', 'usa'],
  steps: [
    {
      id: 'build-the-map',
      name: 'Build the map you want to embed',
      text: 'Create a project, pick the region set you need — a country and its provinces, states, counties or districts — and import your values from CSV, Excel, JSON or a Google Sheet. Region names are matched to the map automatically using fuzzy text matching, so near-misses in spelling still land on the right region. Style the colour scale and legend until the map reads the way you want it to.',
    },
    {
      id: 'enable-public-embed',
      name: 'Enable the public embed',
      text: `Open the project's embed settings and switch the public embed on. This is where you set the embed page's own SEO title and description, and optionally restrict which domains are allowed to frame it. Public embed is available on ${embedBadgeLabel()} — there is no recurring charge.`,
    },
    {
      id: 'copy-the-iframe-code',
      name: 'Copy the iframe code',
      text: 'Regionify generates the complete iframe snippet for you. It is responsive by width, has no border, and carries a title attribute for screen readers. Copy it as-is — the snippet below is the live demo map of Armenia and will render if you paste it into a page right now.',
      code: {
        code: buildIframeSnippet(ARMENIA_EMBED_URL),
        language: 'html',
        label: 'the Armenia iframe embed snippet',
      },
    },
    {
      id: 'paste-into-your-page',
      name: 'Paste it into your page',
      text: "Drop the snippet anywhere in your HTML that accepts markup: a blog post, a CMS rich-text block, a docs page, or a site builder's embed/HTML widget. It needs no script tag, no API key and no build step. Nothing is injected into the surrounding page — the iframe is self-contained.",
      code: {
        code: IN_CONTEXT_EXAMPLE,
        language: 'html',
        label: 'the iframe snippet shown in context',
      },
    },
    {
      id: 'set-size-and-title',
      name: 'Adjust the height and write a real title',
      text: 'Width is already fluid at 100%, so the map fits its container. Height is a fixed pixel value you should tune to your layout — taller for a detailed map with many regions, shorter for a compact one. Replace the default title with a description of what the map actually shows: it is what screen-reader users hear, and it is a genuine accessibility and SEO improvement. Adding loading="lazy" keeps an embed far down the page from competing with content above it.',
      code: {
        code: CUSTOM_TITLE_EXAMPLE,
        language: 'html',
        label: 'the iframe snippet with a custom height and title',
      },
    },
  ],
  faq: [
    {
      question: 'Which plan do I need to embed a map?',
      answer: `Public embed — both the iframe and the standalone public page — is available on ${embedBadgeLabel()}. Like every paid Regionify tier it is a one-time payment, not a subscription.`,
    },
    {
      question: 'Does the embedded map update when my data changes?',
      answer:
        'Yes. The iframe points at a live page rather than a static image, so the map your visitors see always reflects the project as it currently stands. Change the data or the styling and every site embedding that map shows the update — you do not re-copy the snippet.',
    },
    {
      question: 'Can I control which sites are allowed to embed my map?',
      answer:
        'Yes. The embed settings include an allowed-origins list. Leave it open to let any site frame the map, or restrict it to specific domains so the embed only renders where you intend.',
    },
    {
      question: 'Will this work in WordPress, Notion, Webflow or Ghost?',
      answer:
        'Anywhere that accepts an HTML embed block, yes — the snippet is a plain iframe with no dependencies. In editors that offer a dedicated "embed" or "custom HTML" block, paste it there rather than into a plain-text paragraph, which may escape the markup.',
    },
  ],
};
