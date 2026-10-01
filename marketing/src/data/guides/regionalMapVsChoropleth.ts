import { type GuideMeta } from '@/data/guides/types';

export const regionalMapVsChoroplethGuide: GuideMeta = {
  slug: 'regional-map-vs-choropleth-map',
  kind: 'explainer',
  navLabel: 'Regional map vs choropleth',
  h1: 'Regional map vs choropleth map: what is the difference?',
  summary:
    'There is no difference — they are two names for the same thing. A choropleth map shades predefined areas, such as provinces or states, according to a value for each area. "Regional map" is the everyday name for it; "choropleth" is the cartographic term. What genuinely differs is the choropleth versus the heat map.',
  seoTitle: 'Regional Map vs Choropleth Map: The Difference | Regionify',
  seoDescription:
    'A regional map and a choropleth map are the same thing under two names. Here is what the terms mean, how they differ from heat maps, and when to use each.',
  seoKeywords:
    'regional map vs choropleth map, what is a choropleth map, what is a regional map, choropleth vs heat map, thematic map types, map shaded by region, area map definition',
  datePublished: '2026-09-24',
  dateModified: '2026-09-24',
  exampleCountrySlugs: ['armenia', 'france', 'usa', 'germany', 'india', 'brazil', 'italy', 'spain'],
  sections: [
    { id: 'same-thing-two-names', title: 'They are the same thing' },
    { id: 'what-a-choropleth-is', title: 'What a choropleth map actually is' },
    { id: 'choropleth-vs-heat-map', title: 'Choropleth vs heat map: a real difference' },
    { id: 'other-thematic-maps', title: 'Other thematic map types, briefly' },
    { id: 'normalise-your-data', title: 'The mistake that ruins most choropleths' },
    { id: 'which-term-to-use', title: 'Which term should you use?' },
  ],
  faq: [
    {
      question: 'Is a regional map the same as a choropleth map?',
      answer:
        'Yes. "Regional map" is an informal name for what cartographers call a choropleth map: a map that shades predefined areas according to a data value for each area. The terms are used interchangeably and describe the same visualisation.',
    },
    {
      question: 'What is the difference between a choropleth map and a heat map?',
      answer:
        'In a choropleth map the shapes are fixed administrative boundaries — provinces, states, counties — and colour encodes a value for each one. In a heat map the shapes come from the data itself: it renders a continuous density surface that ignores administrative borders. If your data arrives as one number per region, you want a choropleth.',
    },
    {
      question: 'Why should I map rates instead of raw totals?',
      answer:
        'Because a choropleth colours whole areas, and larger or more populous areas will almost always carry larger raw totals. Mapping counts produces a map of where the people are rather than a map of your variable. Dividing by population, area or another sensible denominator is what makes regions comparable.',
    },
    {
      question: 'Do I need GIS software to make one?',
      answer:
        'No. A choropleth needs boundary shapes plus one value per region. Regionify supplies the boundaries for 190 countries and their administrative divisions, so you provide only the values — from a spreadsheet — and no GIS software or coordinate handling is involved.',
    },
  ],
};
