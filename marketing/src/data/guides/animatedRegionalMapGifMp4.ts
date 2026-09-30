import { type GuideMeta } from '@/data/guides/types';
import { animationBadgeLabel } from '@/helpers/tiers';

const WIDE_TIME_SERIES_EXAMPLE = `region,2000,2005,2010,2015,2020,2023
Aragatsotn,1.82,1.61,1.55,1.60,1.58,1.51
Ararat,1.94,1.72,1.66,1.71,1.69,1.62
Armavir,1.88,1.67,1.60,1.65,1.63,1.56
Yerevan,1.34,1.28,1.41,1.53,1.49,1.44`;

export const animatedRegionalMapGifMp4Guide: GuideMeta = {
  slug: 'animated-regional-map-gif-mp4',
  kind: 'howTo',
  navLabel: 'Animate a map over time',
  h1: 'How to create an animated regional map (GIF or MP4)',
  summary:
    'Give each region one row and each time period one column, import the sheet, and Regionify turns the time columns into a timeline you can scrub. Export that timeline as a looping GIF for social and embeds, or as an MP4 for slides and video, with the colour scale held steady so the movement means something.',
  seoTitle: 'Animated Regional Map: GIF & MP4 Export | Regionify',
  seoDescription:
    'Turn time-series data into an animated regional map. Structure the years as columns, scrub the timeline, then export a looping GIF or an MP4 video.',
  seoKeywords:
    'animated regional map, animated choropleth map, map animation gif, time series map video, mp4 map export, animated map from data, how to animate a map over time',
  datePublished: '2026-09-24',
  dateModified: '2026-09-24',
  totalTime: 'PT10M',
  exampleCountrySlugs: ['armenia', 'india', 'china', 'germany', 'france', 'usa', 'brazil', 'japan'],
  steps: [
    {
      id: 'shape-the-time-series',
      name: 'Put time in the columns, not the rows',
      text: 'This is the step people most often get backwards. Keep exactly one row per region and add one column per time period — a year, a quarter, a month. A long-format sheet that repeats each region once per year will import as many conflicting rows for the same region rather than as a timeline.',
      code: {
        code: WIDE_TIME_SERIES_EXAMPLE,
        language: 'csv',
        label: 'a wide time-series CSV, one column per year',
      },
    },
    {
      id: 'import-and-verify-timeline',
      name: 'Import and confirm the timeline appeared',
      text: 'Import the sheet as you would any other dataset. Regionify auto-detects the time columns and adds a timeline scrubber to the map. Drag it end to end before going further: if the map does not change, the time columns were not recognised, which usually means the headers are not consistently formatted periods.',
    },
    {
      id: 'lock-the-colour-scale',
      name: 'Fix the colour scale across the whole period',
      text: 'An animation is only readable if a colour means the same thing in every frame. Set the scale from the full range of the data rather than letting each frame rescale to its own minimum and maximum — otherwise regions appear to change dramatically when the underlying numbers barely moved. Keep the legend visible so a viewer can decode any single frame.',
    },
    {
      id: 'export-gif-or-mp4',
      name: 'Export as GIF or MP4',
      text: `Open the export panel and choose an animated format. Both GIF and MP4 are available from ${animationBadgeLabel()} upwards, together with the time-series import that feeds them. High-resolution output is available on every tier, so the animation is not limited to a small preview size.`,
    },
    {
      id: 'pick-the-right-format',
      name: 'Choose the format for where it is going',
      text: 'GIF loops on its own, needs no player, and survives being pasted into Slack, a newsletter, a wiki or a blog post — at the cost of a larger file and a limited colour palette. MP4 is far smaller for the same length and looks cleaner on a gradient colour scale, which makes it the better choice for slides, YouTube and most social platforms. When the map is going on a web page you control, consider a live embed instead: it stays current instead of freezing the data at export time.',
    },
  ],
  faq: [
    {
      question: 'Which plan do I need for animated export?',
      answer: `Time-series import and animated GIF/MP4 export both start at ${animationBadgeLabel()}. As with every paid Regionify tier, that is a single payment rather than a subscription.`,
    },
    {
      question: 'My timeline scrubber never appeared. What went wrong?',
      answer:
        'The time columns were not detected. Check that each period is its own column with a consistent header, that there is exactly one row per region, and that the values are plain numbers. A long-format sheet with a "year" column will not produce a timeline.',
    },
    {
      question: 'Should I use GIF or MP4?',
      answer:
        'Use GIF where autoplay and looping matter more than file size — Slack, newsletters, blog posts, wikis. Use MP4 for presentations, YouTube and most social platforms, where it is much smaller and renders gradients more cleanly.',
    },
    {
      question: 'Can I animate something other than years?',
      answer:
        'Yes. Any ordered sequence of columns works — quarters, months, survey waves, model scenarios. The timeline simply steps through the columns in order, so anything you can lay out left to right as a progression can be animated.',
    },
  ],
};
