import { type GuideMeta } from '@/data/guides/types';
import { embedBadgeLabel, watermarkFreeBadgeLabel } from '@/helpers/tiers';

const TIDY_CSV_EXAMPLE = `region,unemployment_rate
Aragatsotn,12.4
Ararat,10.1
Armavir,9.8
Gegharkunik,14.2
Kotayk,11.6
Lori,13.0
Shirak,15.1
Syunik,8.7
Tavush,12.9
Vayots Dzor,10.4
Yerevan,7.2`;

const TIME_SERIES_CSV_EXAMPLE = `region,2021,2022,2023,2024
Aragatsotn,14.1,13.5,12.9,12.4
Ararat,12.0,11.4,10.8,10.1
Armavir,11.5,10.9,10.3,9.8
Yerevan,9.4,8.7,7.9,7.2`;

export const regionalMapFromGoogleSheetsGuide: GuideMeta = {
  slug: 'regional-map-from-google-sheets',
  kind: 'howTo',
  navLabel: 'Map a spreadsheet',
  // Excel leads: it is the largest of the three query families, and was previously absent from
  // the title and H1 despite being fully supported. The slug keeps `google-sheets` so the
  // existing URL still matches Sheets queries.
  h1: 'How to make a regional map from Excel, CSV or Google Sheets',
  summary:
    'Put your regions in one column and your numbers in another, pick the matching region set in Regionify, and import the sheet. Region names are matched automatically, so minor differences in spelling still resolve. Importing from Google Sheets, CSV, Excel and JSON works on every tier, including the free one.',
  seoTitle: 'Regional Map from Excel, CSV or Google Sheets | Regionify',
  seoDescription:
    'Turn a spreadsheet into a colour-coded regional map: structure your columns, import from Excel, CSV or Google Sheets, match regions, then export or embed.',
  seoKeywords:
    'map from excel, excel map by region, excel choropleth map, regional map from google sheets, map from spreadsheet, csv to map, google sheets map, colour map by region, spreadsheet to choropleth map, map data by state or province',
  datePublished: '2026-09-24',
  dateModified: '2026-09-24',
  totalTime: 'PT10M',
  exampleCountrySlugs: ['armenia', 'germany', 'italy', 'india', 'usa', 'france', 'spain', 'poland'],
  steps: [
    {
      id: 'pick-the-region-set',
      name: 'Pick the region set that matches your data',
      text: 'Start a project and choose the map whose divisions match the rows in your spreadsheet — a country and its provinces, states, counties, districts or regions. This matters more than it sounds: if your data is by province, pick the province map, not the country map. The division names shown on the country pages tell you exactly which names a given map expects.',
    },
    {
      id: 'structure-your-sheet',
      name: 'Structure the sheet: one column of regions, one of numbers',
      text: 'Regionify expects tidy data. Put the region name in one column and the value you want to colour by in another, with a header row on top. Avoid merged cells, blank spacer rows and totals rows — a "Total" row has no region to land on. Numbers should be plain, without currency symbols or thousands separators.',
      code: {
        code: TIDY_CSV_EXAMPLE,
        language: 'csv',
        label: 'a tidy region-and-value CSV',
      },
    },
    {
      id: 'import-from-google-sheets',
      name: 'Import from Excel, CSV or Google Sheets',
      text: 'For a Google Sheet, share it as "Anyone with the link" and paste the URL. You then choose "Link & sync", which keeps the sheet connected so you can pull changes again later, or "Import once", which takes a one-off snapshot and forgets the source. CSV, Excel and JSON files upload directly instead. None of this is gated: spreadsheet import is available on every tier, including free Observer.',
    },
    {
      id: 'match-the-regions',
      name: 'Check the region matching',
      text: 'Regionify compares your labels to the map\'s region names using text similarity, so "Vayots Dzor", "Vayots-Dzor" and a stray trailing space all resolve to the same province. Review the matches after import and correct any that went astray — this is the step worth two minutes of attention, because an unmatched row silently leaves a region uncoloured rather than throwing an error.',
    },
    {
      id: 'add-a-timeline',
      name: 'Optional: add years for an animated map',
      text: 'If you want a map that moves through time, widen the sheet instead of lengthening it: keep one row per region and add one column per year. Regionify detects the time columns and gives you a timeline scrubber, which is also what the animated GIF and MP4 exports are built from.',
      code: {
        code: TIME_SERIES_CSV_EXAMPLE,
        language: 'csv',
        label: 'a time-series CSV with one column per year',
      },
    },
    {
      id: 'style-and-share',
      name: 'Style it, then export or embed',
      text: `Set the colour scale, legend and labels until the map communicates what you want. Free Observer export covers PNG, JPEG and PDF with a watermark; ${watermarkFreeBadgeLabel()} removes the watermark and adds SVG for print; ${embedBadgeLabel()} adds the live iframe embed and public page.`,
    },
  ],
  faq: [
    {
      question: 'Do I need a paid plan to import from Google Sheets?',
      answer:
        'No. Importing from Google Sheets, CSV, Excel and JSON is available on every tier, including the free Observer tier. The paid tiers differ in what you can export and share, not in how you get data in.',
    },
    {
      question: 'What is the difference between "Link & sync" and "Import once"?',
      answer:
        '"Link & sync" keeps the connection to your Google Sheet so you can pull the latest values again later. "Import once" takes a snapshot of the data as it is now and does not remember where it came from. Choose sync for a figure you expect to revise, snapshot for a one-off.',
    },
    {
      question: 'My sheet imported but some regions are blank. Why?',
      answer:
        'A blank region almost always means that row did not match any region on the map, or there is no row for it at all. The usual causes are a totals row, a region spelled in a different language than the map uses, or data at the wrong administrative level — city-level rows against a province map, for example. Review the matching step and correct the pairs that missed.',
    },
    {
      question: 'Does my Google Sheet have to be public?',
      answer:
        'It has to be shared as "Anyone with the link" so Regionify can read it. If the data is sensitive, export it to CSV and upload the file instead — an uploaded file is not shared with anyone.',
    },
  ],
};
